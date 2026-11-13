import type { LanguageModel } from 'ai'
import type { LanguageModelV3StreamPart, LanguageModelV3Usage } from '@ai-sdk/provider'
import { OUTCOME_REMINDER } from '../conversations/outcome-reminder.ts'

interface MockPromptResult {
  type: 'text' | 'tool-call' | 'error'
  text?: string
  toolName?: string
  toolArgs?: string
  /** When set, emit several parallel tool calls in a single step (takes precedence over toolName/toolArgs) */
  toolCalls?: Array<{ toolName: string, toolArgs: string }>
  /** When set, wait this long before answering (tests the moderation fail-open path) */
  delayMs?: number
  /** When set, emit these reasoning ("thinking") tokens before the answer */
  reasoning?: string
  /** Characters per text-delta, one delta every 10ms (default STREAM_CHUNK) */
  chunk?: number
}

/**
 * Text streams in deltas of this many characters, one every 10ms. Not one per character: answers
 * echoing a prompt block run to hundreds of characters, and a character every 10ms made every such
 * turn cost seconds across the suite. The seam that needs many deltas ('slow long answer') asks for 1.
 */
const STREAM_CHUNK = 8

/**
 * Minimal stand-in token estimator: ~4 characters per token, rounded up. The
 * mock provider has no real tokenizer, so this gives dev/test traces non-zero,
 * length-proportional token counts (and thus visible cost when prices are
 * configured) instead of always reporting 0.
 */
export function estimateMockTokens (text: string): number {
  return Math.ceil((text?.length ?? 0) / 4)
}

function serializePrompt (prompt: string | Array<any>): string {
  return typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
}

/**
 * `cache <n>` anywhere in the prompt makes the mock report n of its input tokens as
 * cache reads (clamped to the total). The mock is the only way any test can reach the
 * cache-pricing branch of the credit computation — real providers are never called from the suite.
 *
 * Matched against the WHOLE prompt rather than commandLine() on purpose: a caller
 * keeps its real directive on the last line (`cache 100000\nhello` still answers
 * "world"), so a test can price a turn without changing what the turn says.
 *
 * The prompt reaches here JSON-serialised, so a message newline is the two characters
 * \ and n, not a real line break — `^`/`$` with the m flag would never match. Anchor
 * on those escaped boundaries (or a quote) instead, which keeps the directive a whole
 * line of the message rather than any stray "cache 42" inside a sentence.
 */
function cachedTokensDirective (promptText: string): number | undefined {
  const match = promptText.match(/(?:^|\\n|")cache (\d+)(?=\\n|"|$)/i)
  return match ? Number(match[1]) : undefined
}

function buildUsage (promptText: string, outputText: string): LanguageModelV3Usage {
  const total = estimateMockTokens(promptText)
  const cacheRead = Math.min(cachedTokensDirective(promptText) ?? 0, total)
  return {
    inputTokens: {
      total,
      cacheRead: cacheRead || undefined,
      cacheWrite: undefined,
      noCache: cacheRead ? total - cacheRead : undefined
    },
    outputTokens: { total: estimateMockTokens(outputText), text: undefined, reasoning: undefined }
  }
}

function messageText (content: unknown): string {
  return typeof content === 'string'
    ? content
    : Array.isArray(content) ? (content.find((c: any) => c.type === 'text') as any)?.text ?? '' : ''
}

function isLoopGuardNudge (content: unknown): boolean {
  return /with the same arguments \d+ times in a row/i.test(messageText(content))
}

function getLastUserMessage (options: { prompt: string | Array<any> }): string {
  if (typeof options.prompt === 'string') {
    return options.prompt
  }
  if (Array.isArray(options.prompt)) {
    // The client's loop guard injects a per-step "you have called X with the same
    // arguments N times in a row" user message before it stops a runaway. The mock
    // deliberately ignores it (a runaway model would too), so the seams below keep
    // reading the real user message and the guard's stop path is exercised.
    const userMessages = options.prompt.filter((p: any) => p.role === 'user' &&
      !isLoopGuardNudge(p.content))
    const lastUserMsg = userMessages[userMessages.length - 1]
    if (lastUserMsg) {
      const content = lastUserMsg.content
      if (typeof content === 'string') {
        return content
      }
      if (Array.isArray(content)) {
        const textPart = content.find((c: any) => c.type === 'text') as any
        return textPart?.text || ''
      }
    }
  }
  return ''
}

/** Body of a sentinel block (`<tag>\n…\n</tag>`) inside a message, or undefined. */
function sentinelBody (text: string, tag: string): string | undefined {
  return new RegExp(`<${tag}>\\n([\\s\\S]*?)\\n</${tag}>`).exec(text)?.[1]
}

/** Text of the tool result that ended the prompt, when the last message is a tool message. */
function lastToolResultText (prompt: string | Array<any>): string | undefined {
  if (!Array.isArray(prompt) || !prompt.length) return undefined
  const last = prompt[prompt.length - 1]
  if (last.role !== 'tool' || !Array.isArray(last.content)) return undefined
  const part = last.content.find((c: any) => c.type === 'tool-result')
  const output = part?.output
  if (!output) return undefined
  return typeof output.value === 'string' ? output.value : JSON.stringify(output.value)
}

/**
 * Text of the FIRST tool result anywhere in the prompt, not only at its end.
 *
 * `lastToolResultText` reads the answer of the step just taken. This reads what a tool returned on an
 * EARLIER TURN, which is only in the prompt if the stored conversation replayed its tool results — the
 * property the storage model exists for, and one no seam could observe before: the mock answered from
 * the last user message alone, so a history that had silently lost its tool results looked identical.
 */
function priorToolResultText (prompt: string | Array<any>): string | undefined {
  if (!Array.isArray(prompt)) return undefined
  for (const message of prompt) {
    if (message.role !== 'tool' || !Array.isArray(message.content)) continue
    const output = message.content.find((c: any) => c.type === 'tool-result')?.output
    if (!output) continue
    return typeof output.value === 'string' ? output.value : JSON.stringify(output.value)
  }
  return undefined
}

/** The visible prompt ends the user message; hidden context (if any) precedes it. */
function endsWithCommand (lastMessage: string, command: string): boolean {
  return new RegExp(`(^|\\n)${command}\\s*$`, 'i').test(lastMessage.trim())
}

/**
 * The directive the test actually typed, without anything the chat prepended.
 *
 * A page that publishes host state puts a `<host-state>` block ahead of the
 * visible message on the activation turn, so a directive anchored on the whole
 * message stops matching the moment its dev page starts publishing — which is
 * how `hello` came to use endsWithCommand. Adding one `useAgentState` call to
 * a dev page broke its chaining test exactly that way.
 */
export function commandLine (lastMessage: string): string {
  const lines = lastMessage.trim().split('\n').map(l => l.trim()).filter(Boolean)
  return lines[lines.length - 1] ?? ''
}

function processMockPrompt (lastMessage: string, prompt: string | Array<any>): MockPromptResult {
  // The step a tripwire trip leaves the model (tripExplanationInstruction, api/src/tripwire/operations.ts), read off
  // the system message: an explanation in a chat, the outcome in a task run. Before everything else, since the last
  // message is then the withheld result.
  const system = Array.isArray(prompt) ? JSON.stringify(prompt.filter((m: any) => m?.role === 'system')) : ''
  if (system.includes('The turn ends with your next message: call no other tool.')) {
    if (system.includes('report_outcome, status')) {
      return { type: 'tool-call', toolName: 'report_outcome', toolArgs: JSON.stringify({ status: 'needs-attention', summary: 'TRIP_EXPLAINED: a source was withheld, nothing was done with it.' }) }
    }
    return { type: 'text', text: 'TRIP_EXPLAINED: I could not use one of the results, so I did not act on it.' }
  }
  if (!lastMessage) {
    return { type: 'text', text: 'what do you mean ?' }
  }

  // endsWithCommand, like every other seam: see the note on the `hello` seam below. Exact equality
  // stops matching the moment the caller publishes host state, because the fold prepends a block.
  if (endsWithCommand(lastMessage, 'help') || commandLine(lastMessage) === '?') {
    return { type: 'text', text: 'I respond to:\n- "hello" → returns "world"\n- "call tool <name> <args>" → triggers a tool call\n- Any other text → "what do you mean?"\n- "where am i" / "what happened" → echoes host state/events\n- "select note", "wait for me", "wait briefly" → host-events tool seams' }
  }

  // endsWithCommand, never exact equality. A page that publishes host state has a hidden-context
  // block prepended to the visible message, so an exact match stops working the moment that page
  // reports anything. This bit twice: once when a dev page gained a `useAgentState` call, and again
  // when the server-held loop's host-context fold started working at all — the real chat publishes
  // language and surface facts, so EVERY message on it now arrives with a block in front.
  if (endsWithCommand(lastMessage, 'hello')) {
    return { type: 'text', text: 'world' }
  }

  if (endsWithCommand(lastMessage, 'markdown')) {
    return { type: 'text', text: 'See [the docs](https://example.com/docs) for details.\n\n' }
  }

  // Mermaid bounded auto-fix seam: "broken mermaid" answers with an invalid diagram;
  // once the UI's auto-fix resends (its hidden context says the diagram "failed to
  // render"), answer with a valid one so the loop converges.
  if (/failed to render/i.test(lastMessage)) {
    return { type: 'text', text: '```mermaid\nflowchart TD\n  A[Start] --> B[End]\n```' }
  }
  if (lastMessage.toLowerCase().includes('broken mermaid')) {
    return { type: 'text', text: 'Here is the chart:\n\n```mermaid\nthisisnotavaliddiagram\n```' }
  }

  // Host-events seams (tests/features/host-events). Answers echo the sentinel BODIES,
  // not the tags, so the assertion text survives markdown rendering.
  if (endsWithCommand(lastMessage, 'where am i')) {
    const state = sentinelBody(lastMessage, 'host-state')
    const events = sentinelBody(lastMessage, 'host-events')
    return { type: 'text', text: state ? `state:\n${state}` : events ? `events:\n${events}` : 'nothing' }
  }
  // Cross-TURN recall: answers from a tool result of an earlier turn, so a test can assert that the
  // stored conversation really replayed it rather than trusting that it did.
  if (endsWithCommand(lastMessage, 'recall')) {
    const prior = priorToolResultText(prompt)
    return { type: 'text', text: prior === undefined ? 'nothing earlier' : `Earlier the tool said: ${prior}` }
  }
  if (endsWithCommand(lastMessage, 'what happened')) {
    const events = sentinelBody(lastMessage, 'host-events')
    return { type: 'text', text: events ? `events:\n${events}` : 'nothing' }
  }
  // What the model was SENT, as JSON: the tool calls in its history, how many results they have, the
  // ones that say they were interrupted, and whether the reminder to wait again reached the last user
  // message. The server-side counterpart of reading the browser's /chat/completions request, which
  // is how main tested interrupted turns (#73, #75) and which no longer exists.
  if (endsWithCommand(lastMessage, 'what did you see')) {
    const messages = Array.isArray(prompt) ? prompt : []
    const content = (role: string) => messages
      .filter((m: any) => m.role === role && Array.isArray(m.content))
      .flatMap((m: any) => m.content)
    const calls = content('assistant').filter((c: any) => c.type === 'tool-call').map((c: any) => c.toolName)
    const results = content('tool').filter((c: any) => c.type === 'tool-result')
      .map((c: any) => typeof c.output?.value === 'string' ? c.output.value : JSON.stringify(c.output?.value ?? c.output ?? ''))
    // Images a tool result delivered AS images (content parts), not as base64 inside text. A v3 model, as
    // this one is, receives them from AI SDK 7 as `file-data` with an image media type (6 passed
    // `image-data` through), so both shapes count.
    const images = content('tool').filter((c: any) => c.type === 'tool-result' && c.output?.type === 'content')
      .flatMap((c: any) => c.output.value)
      .filter((item: any) => item?.type === 'image-data' || (item?.type === 'file-data' && String(item.mediaType ?? '').startsWith('image/'))).length
    return {
      type: 'text',
      text: JSON.stringify({
        calls,
        results: results.length,
        images,
        // How many of the person's messages reached the model: a moderation-struck exchange must not.
        userMessages: messages.filter((m: any) => m.role === 'user').length,
        interrupted: results.filter((r: string) => r.startsWith('Interrupted')),
        reminder: /You were waiting for the person/.test(lastMessage)
      })
    }
  }
  const toolResult = lastToolResultText(prompt)
  if (toolResult !== undefined && endsWithCommand(lastMessage, 'select note')) {
    return { type: 'text', text: `Tool said: ${toolResult}` }
  }
  if (toolResult !== undefined && endsWithCommand(lastMessage, 'wait for me')) {
    return { type: 'text', text: `You did: ${toolResult}` }
  }
  if (endsWithCommand(lastMessage, 'select note')) {
    return { type: 'tool-call', toolName: 'select_type', toolArgs: JSON.stringify({ type: 'note' }) }
  }
  // "read page skill <uri>": load a skill the page published, then say what it said — the page-skills path
  // end to end (tests/features/chat-mcp/page-skills.e2e.spec.ts).
  const readPageSkill = commandLine(lastMessage).match(/^read page skill (skill:\/\/\S+)$/i)
  if (readPageSkill) {
    if (toolResult !== undefined) return { type: 'text', text: `Skill said: ${toolResult}` }
    return { type: 'tool-call', toolName: 'read_skill', toolArgs: JSON.stringify({ server: 'the-page', uri: readPageSkill[1] }) }
  }
  // A page tool, THEN a wait: the shape of a turn that opens something and waits on
  // the person. Interrupting it exercises an abort after a completed tool step.
  if (endsWithCommand(lastMessage, 'select then wait')) {
    if (toolResult === undefined) return { type: 'tool-call', toolName: 'select_type', toolArgs: JSON.stringify({ type: 'note' }) }
    const last = Array.isArray(prompt) ? prompt[prompt.length - 1] : undefined
    const waited = last?.content?.some?.((c: any) => c.type === 'tool-result' && c.toolName === 'wait_for_user_action')
    if (waited) return { type: 'text', text: `You did: ${toolResult}` }
    return { type: 'tool-call', toolName: 'wait_for_user_action', toolArgs: JSON.stringify({ message: 'Ready: click Create.', expecting: 'you to click Create' }) }
  }
  if (endsWithCommand(lastMessage, 'wait for me')) {
    return { type: 'tool-call', toolName: 'wait_for_user_action', toolArgs: JSON.stringify({ message: 'Ready: click Create.', expecting: 'you to click Create' }) }
  }

  // "preface and call tool <name>" → a step that reasons, says something, then calls: text before a call,
  // and reasoning in each step — what the activity line and the chat's step-by-step reasoning are tested on.
  const prefaceMatch = commandLine(lastMessage).match(/^preface and call tool (\w+)(.*)$/i)
  if (prefaceMatch) {
    if (toolResult !== undefined) return { type: 'text', text: `Tool said: ${toolResult}`, reasoning: 'Reading the result.' }
    return { type: 'tool-call', text: 'Let me check.', reasoning: 'Planning the call.', toolName: prefaceMatch[1], toolArgs: prefaceMatch[2].trim() || '{}' }
  }

  // If the most recent message in the prompt is a tool result, we already called a tool
  // in this step — respond with text instead of calling another tool
  if (Array.isArray(prompt) && prompt.length > 0 && prompt[prompt.length - 1].role === 'tool') {
    // FAIL_AFTER_RESULT anywhere in the turn: the step after a tool result fails mid-stream, so a turn THROWS
    // after a call (the tripwire's late verdict on a failed turn, tests/features/tripwire).
    if (JSON.stringify(prompt).includes('FAIL_AFTER_RESULT')) return { type: 'error' }
    return { type: 'text', text: 'done' }
  }

  // The reminder a planned task's run gets when it ended without report_outcome (executor.ts performTurn): the
  // mock reports, as a model told to would. After the tool-result guard above, so it answers the call with text.
  // A task prompt saying "ignore the reminder" makes it answer in text instead: a model may, and the run then ends
  // with no outcome.
  if (lastMessage === OUTCOME_REMINDER) {
    if (JSON.stringify(prompt).includes('ignore the reminder')) return { type: 'text', text: 'reminder ignored' }
    return { type: 'tool-call', toolName: 'report_outcome', toolArgs: JSON.stringify({ status: 'done', summary: 'reported when reminded' }) }
  }

  // "wait and call <name>" → a wait AND another call in one step: the handover wins and ends the turn,
  // leaving the other call (a gated one, stopped for approval) beside it.
  const waitAndCallMatch = commandLine(lastMessage).match(/^wait and call (\S+)$/i)
  if (waitAndCallMatch) {
    return {
      type: 'tool-call',
      toolCalls: [
        { toolName: 'wait_for_user_action', toolArgs: JSON.stringify({ message: 'Ready: click Create.', expecting: 'you to click Create' }) },
        { toolName: waitAndCallMatch[1], toolArgs: '{}' }
      ]
    }
  }

  // "call tools <name> <name> ..." → several parallel tool calls in one step. A name may carry its arguments
  // as JSON with no space in it (`echo{"value":"x"}`); otherwise it is called with none.
  const callToolsMatch = commandLine(lastMessage).match(/^call tools (.+)$/i)
  if (callToolsMatch) {
    return {
      type: 'tool-call',
      toolCalls: callToolsMatch[1].trim().split(/\s+/).map(token => {
        const at = token.indexOf('{')
        return at === -1 ? { toolName: token, toolArgs: '{}' } : { toolName: token.slice(0, at), toolArgs: token.slice(at) }
      })
    }
  }

  const callToolMatch = commandLine(lastMessage).match(/^call tool (\w+)(.*)$/i)
  if (callToolMatch) {
    return {
      type: 'tool-call',
      toolName: callToolMatch[1],
      toolArgs: callToolMatch[2].trim()
    }
  }

  return { type: 'text', text: 'what do you mean ?' }
}

/**
 * Extract tool names that have already returned results in the conversation.
 * Scans the V3 prompt array for tool-result parts in both 'tool' and 'assistant' role messages.
 */
function getCalledToolNames (prompt: string | Array<any>): Set<string> {
  const names = new Set<string>()
  if (!Array.isArray(prompt)) return names
  for (const msg of prompt) {
    if (!Array.isArray(msg.content)) continue
    for (const part of msg.content) {
      if (part.type === 'tool-result' && part.toolName) {
        names.add(part.toolName)
      }
    }
  }
  return names
}

/**
 * mock-tools: a mock for context-aware tool chaining.
 * Inspects conversation history to deterministically chain: get_schema → query_data → text summary.
 * Also supports "call tool" syntax and "hello" → "world" as overrides.
 */
function processMockToolsPrompt (lastMessage: string, prompt: string | Array<any>): MockPromptResult {
  // Support explicit overrides first. endsWithCommand for the same reason the assistant seam uses it.
  if (endsWithCommand(lastMessage, 'hello')) {
    return { type: 'text', text: 'world' }
  }

  const callToolMatch = commandLine(lastMessage).match(/^call tool (\w+)(.*)$/i)
  if (callToolMatch) {
    return {
      type: 'tool-call',
      toolName: callToolMatch[1],
      toolArgs: callToolMatch[2].trim()
    }
  }

  // Context-aware tool chaining
  const calledTools = getCalledToolNames(prompt)

  if (!calledTools.has('get_schema')) {
    return {
      type: 'tool-call',
      toolName: 'get_schema',
      toolArgs: '{"dataset":"test"}'
    }
  }

  if (!calledTools.has('query_data')) {
    return {
      type: 'tool-call',
      toolName: 'query_data',
      toolArgs: '{"dataset":"test"}'
    }
  }

  return { type: 'text', text: 'Analysis complete: found 3 results' }
}

/**
 * mock-summarizer: always returns a fixed summary string.
 */
function processMockSummarizerPrompt (): MockPromptResult {
  return { type: 'text', text: 'Summary: conversation covered the main topics discussed.' }
}

/**
 * The input-moderation classifier (api/src/moderation), for any mock model id. It judges ONLY the text inside the
 * nonce-tagged message wrapper, never the context wrapper before it, mirroring the real prompt's isolation rule,
 * and reads the stage from the instruction after them (a message cannot claim a stage).
 * Stage 1 answers one word: "yes" on a block trigger ("jailbreak" or an "ignore (all/previous) instructions" phrase,
 * "fuck"), on "MOD_FALSE_ALARM" and "MOD_BROKEN_CONFIRM", and on the "CTXSEEN" sentinel in the context; else "no".
 * "slow moderation" delays stage 1 past the gate timeout (fail-open / late-block paths).
 * Stage 2: a block as prompt-injection or profanity, `{"action":"allow"}` for "MOD_FALSE_ALARM", "not json" for
 * "MOD_BROKEN_CONFIRM", and an allow with category "ctx-seen" when the context carried "CTXSEEN" (surfacing that
 * prior turns were forwarded). A bare message, with no wrapper, is answered with the stage-2 verdict directly.
 */
const MODERATION_WRAPPER = /<(user_message_[0-9a-f]{12})>([\s\S]*?)<\/\1>([\s\S]*)$/
const MODERATION_CONTEXT = /<(conversation_context_[0-9a-f]{12})>([\s\S]*?)<\/\1>/
function processMockModeratorPrompt (lastMessage: string): MockPromptResult {
  const wrapped = MODERATION_WRAPPER.exec(lastMessage)
  const judged = wrapped?.[2] ?? lastMessage
  const context = MODERATION_CONTEXT.exec(lastMessage)?.[2] ?? ''
  const blockOf = (): string | undefined => {
    if (/jailbreak|ignore (all |previous )+instructions/i.test(judged)) return '{"action":"block","category":"prompt-injection","reason":"mock block"}'
    if (/\bfuck/i.test(judged)) return '{"action":"block","category":"profanity","reason":"mock profanity"}'
  }
  const slow = /slow moderation/i.test(judged) ? 6000 : undefined
  if (wrapped && !/confirm or clear/i.test(wrapped[3])) {
    const flagged = !!blockOf() || /MOD_FALSE_ALARM|MOD_BROKEN_CONFIRM/.test(judged) || /CTXSEEN/.test(context)
    return { type: 'text', text: flagged ? 'yes' : 'no', delayMs: slow }
  }
  // Stage 2 (or a bare message): only stage 1 is slow, so a late verdict lands soon after the gate opened.
  const delayMs = wrapped ? undefined : slow
  if (judged.includes('MOD_BROKEN_CONFIRM')) return { type: 'text', text: 'not json', delayMs }
  if (judged.includes('MOD_FALSE_ALARM')) return { type: 'text', text: '{"action":"allow"}', delayMs }
  const block = blockOf()
  if (block) return { type: 'text', text: block, delayMs }
  if (/CTXSEEN/.test(context)) return { type: 'text', text: '{"action":"allow","category":"ctx-seen"}', delayMs }
  return { type: 'text', text: '{"action":"allow"}', delayMs }
}

/**
 * The tool-output tripwire's classifier (api/src/tripwire), for any mock model id: it judges only the text inside
 * the nonce-tagged wrapper, and reads the stage from the instruction after it (content cannot claim a stage).
 * Stage 1 answers one word: "yes" on "INJECTION_PROBE", an "ignore (all/previous) instructions" phrase, text
 * addressed to the "classifier:" (the self-incrimination rule), "FALSE_ALARM" or "BROKEN_CONFIRM"; "???" (unparseable: fail open) on "BROKEN_CLASSIFIER"; else "no".
 * "slow tripwire" delays stage 1 past the tripwire timeout (fail open on timeout, then a late verdict). Stage 2
 * confirms a probe with the matched phrase as excerpt, clears "FALSE_ALARM", answers unparseable text on
 * "BROKEN_CONFIRM" (a failed confirmation counts as suspected).
 */
const TRIPWIRE_WRAPPER = /<(tool_result_[0-9a-f]{12})\b[^>]*>([\s\S]*?)<\/\1>([\s\S]*)$/
export function processMockTripwirePrompt (lastMessage: string): MockPromptResult {
  const wrapped = TRIPWIRE_WRAPPER.exec(lastMessage)
  const judged = wrapped?.[2] ?? lastMessage
  const instruction = wrapped?.[3] ?? ''
  if (/confirm or clear/i.test(instruction)) {
    if (judged.includes('BROKEN_CONFIRM')) return { type: 'text', text: 'not json' }
    if (judged.includes('FALSE_ALARM')) return { type: 'text', text: '{"suspected":false}' }
    const matched = judged.match(/ignore (all |previous )+instructions|INJECTION_PROBE|\bclassifier:/i)?.[0]
    if (matched) return { type: 'text', text: JSON.stringify({ suspected: true, excerpt: matched, reason: 'mock trip' }) }
    return { type: 'text', text: '{"suspected":false}' }
  }
  if (judged.includes('BROKEN_CLASSIFIER')) return { type: 'text', text: '???' }
  const delayMs = judged.includes('slow tripwire') ? 6000 : undefined
  const flagged = /ignore (all |previous )+instructions|INJECTION_PROBE|FALSE_ALARM|BROKEN_CONFIRM|\bclassifier:/i.test(judged)
  return { type: 'text', text: flagged ? 'yes' : 'no', delayMs }
}

/**
 * The approval reviewer (api/src/approval-review), for any mock model id: it judges only the text inside the
 * proposed call's nonce-tagged wrapper (the call's arguments, never the intent before it), and reads the stage
 * from the instruction after the wrappers. "REVIEW_DENY": stage 1 yes, stage 2 a deny. "REVIEW_UNSURE": yes, then
 * unsure. "REVIEW_BROKEN": unparseable at both stages (a failed review). "REVIEW_IF_REFUSED_BEFORE": a deny when
 * the earlier calls' wrapper shows one the reviewer refused, an allow otherwise. "REVIEW_UNSURE_UNLESS_UNDECIDED": unsure,
 * but an allow when the earlier calls' wrapper shows a card the person left by writing. "REVIEW_SLOW": stage 1 answers
 * no after 200 ms. Anything else: stage 1 no, and
 * stage 2 (reached directly for a destructive call or a grant) an allow.
 */
const REVIEW_WRAPPER = /<(proposed_call_[0-9a-f]{12})>([\s\S]*?)<\/\1>([\s\S]*)$/
const EARLIER_WRAPPER = /<(earlier_calls_[0-9a-f]{12})>([\s\S]*?)<\/\1>/
export function processMockReviewerPrompt (lastMessage: string): MockPromptResult {
  const wrapped = REVIEW_WRAPPER.exec(lastMessage)
  const judged = wrapped?.[2] ?? ''
  const instruction = wrapped?.[3] ?? ''
  if (judged.includes('REVIEW_IF_REFUSED_BEFORE')) {
    const refusedBefore = (EARLIER_WRAPPER.exec(lastMessage)?.[2] ?? '').includes('refused by the reviewer')
    if (!/Answer with JSON only/.test(instruction)) return { type: 'text', text: 'yes' }
    return { type: 'text', text: refusedBefore ? '{"outcome":"deny","reason":"mock deny: refused before"}' : '{"outcome":"allow","reason":"mock allow"}' }
  }
  if (judged.includes('REVIEW_UNSURE_UNLESS_UNDECIDED')) {
    const undecidedBefore = (EARLIER_WRAPPER.exec(lastMessage)?.[2] ?? '').includes('who wrote instead of deciding')
    if (!/Answer with JSON only/.test(instruction)) return { type: 'text', text: 'yes' }
    return { type: 'text', text: undecidedBefore ? '{"outcome":"allow","reason":"mock allow: asked again"}' : '{"outcome":"unsure","reason":"mock unsure"}' }
  }
  if (/Answer with JSON only/.test(instruction)) {
    if (judged.includes('REVIEW_BROKEN')) return { type: 'text', text: 'not json' }
    if (judged.includes('REVIEW_DENY')) return { type: 'text', text: '{"outcome":"deny","reason":"mock deny"}' }
    if (judged.includes('REVIEW_UNSURE')) return { type: 'text', text: '{"outcome":"unsure","reason":"mock unsure","personReason":"mock person reason"}' }
    return { type: 'text', text: '{"outcome":"allow","reason":"mock allow"}' }
  }
  if (judged.includes('REVIEW_BROKEN')) return { type: 'text', text: '???' }
  // Stage 1 only: answers after 200 ms, to measure the stage-1 timeout.
  const delayMs = judged.includes('REVIEW_SLOW') ? 200 : undefined
  return { type: 'text', text: /REVIEW_DENY|REVIEW_UNSURE/.test(judged) ? 'yes' : 'no', ...(delayMs ? { delayMs } : {}) }
}

/**
 * Mid-turn tool refresh seam: "chain <first> <then>" calls <first>, then <then> — but only
 * if <then> was actually advertised on that later step. The point is that <first> is a tool
 * whose execution registers <then> (a page mounting components), so the second call is
 * possible only when the tool set handed to the running stream is live rather than frozen
 * at request time. When <then> is missing the mock says so in plain text, which is exactly
 * what the pre-fix behaviour looks like.
 */
function processChainSeam (lastMessage: string, prompt: string | Array<any>, tools: Array<any> | undefined): MockPromptResult | null {
  // `commandLine`, not the whole message — the THIRD seam to need this. The page under test publishes
  // host state, so the fold prepends a `<host-state>` block to the visible text and an anchored match
  // on the whole message silently stops matching: the mock answered "what do you mean ?" and the test
  // read it as "the live tool set regressed".
  const match = commandLine(lastMessage).match(/^chain (\w+) (\w+)$/i)
  if (!match) return null
  const [, first, then] = match
  const called = getCalledToolNames(prompt)
  if (!called.has(first)) return { type: 'tool-call', toolName: first, toolArgs: '{}' }
  if (called.has(then)) return { type: 'text', text: `chained ${first} then ${then}` }
  const advertised = Array.isArray(tools) &&
    tools.some((t: any) => (t?.name ?? t?.function?.name) === then)
  if (!advertised) return { type: 'text', text: `tool ${then} is not available` }
  return { type: 'tool-call', toolName: then, toolArgs: '{}' }
}

/**
 * The mock's artificial latency, abortable.
 *
 * A bare setTimeout would make the mock the ONE provider that ignores abortSignal, so a
 * test could never observe a caller's abort taking effect — the turn would only end when
 * the delay elapsed. Real fetch-based providers reject on abort; the mock does too.
 */
const mockDelay = async (ms: number, signal?: AbortSignal): Promise<void> => {
  if (signal?.aborted) throw signal.reason ?? new Error('aborted')
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason ?? new Error('aborted'))
    }, { once: true })
  })
}

export function processForModel (modelId: string, options: { prompt: string | Array<any>, tools?: Array<any> }): MockPromptResult {
  // A provider that rejects every call (mock-failing): what an admin probe exists to show, with the provider's message.
  if (modelId === 'mock-failing') return { type: 'error' }
  const lastMessage = getLastUserMessage(options)
  // The approval reviewer runs on the moderator role too, so its seam answers for any mock id, first of all: the
  // call's arguments it judges may quote another seam's directive or wrapper, to be judged, never obeyed.
  if (REVIEW_WRAPPER.test(lastMessage)) return processMockReviewerPrompt(lastMessage)
  // The tripwire classifies with the moderator role, which resolves to whatever mock model the account maps
  // (moderator → summarizer → assistant), so its seam answers for any mock id, before every other seam: a
  // tool result quoting a directive ('stall'…) must be classified, not obeyed.
  if (TRIPWIRE_WRAPPER.test(lastMessage)) return processMockTripwirePrompt(lastMessage)
  // Input moderation likewise: its wrapper is recognised for any mock id (the moderator role falls back too).
  if (MODERATION_WRAPPER.test(lastMessage)) return processMockModeratorPrompt(lastMessage)
  // The classifier only ever JUDGES: its prompt wraps the person's message, so a directive meant for
  // the assistant ('stall', 'stream error'…) would otherwise hit the moderator too — a message ending in
  // 'stall' stalled the classifier itself for 30s, and no late verdict could ever be tested.
  if (modelId === 'mock-moderator') return processMockModeratorPrompt(lastMessage)
  // Memory consolidation seam (tests/features/memory/consolidation.api.spec.ts). A consolidation's user
  // message carries the conversations since the last pass; a line `remember: <fact>` in them makes the
  // model record that fact in MEMORY.md once, with who said it, then finish. Deterministic stand-in for a model that judges
  // what is durable. Before every other seam, so a directive quoted in a transcript (`stall`…) cannot
  // trigger one.
  if (lastMessage.includes('<conversations-since-last-pass>')) {
    const last = Array.isArray(options.prompt) ? options.prompt[options.prompt.length - 1] : undefined
    if (last?.role === 'tool') return { type: 'text', text: 'DONE' }
    // Each fact keeps the speaker its line names, as the prompt asks a real model to.
    const facts = [...lastMessage.matchAll(/\] ([^\n]*?): remember: ([^\n]+)/g)].map(m => `${m[2].trim()} (said by ${m[1]})`)
    if (!facts.length) return { type: 'text', text: 'DONE' }
    return {
      // `consolidate slowly` in a message holds the call back, so a test can act while it is in flight.
      ...(lastMessage.includes('consolidate slowly') ? { delayMs: 1500 } : {}),
      type: 'tool-call',
      toolName: 'memory',
      toolArgs: JSON.stringify({ command: 'create', path: 'MEMORY.md', file_text: facts.map(f => `- ${f}`).join('\n') })
    }
  }
  const chained = processChainSeam(lastMessage, options.prompt, options.tools)
  if (chained) return chained
  // Silent-drop test seams (apply to every model role): "empty" makes the model
  // return an empty completion (no text, no tool call), "stream error" makes the
  // stream fail mid-flight. Both previously ended the conversation silently.
  // commandLine(), not whole-message equality: anything the caller prepends ahead of the
  // visible directive — a <host-state> block, or the autonomous runtime's <message from=...>
  // attribution envelope — would otherwise stop these seams matching. Exactly the failure the
  // comment on commandLine() describes.
  const directive = commandLine(lastMessage).toLowerCase()
  if (directive === 'empty') return { type: 'text', text: '' }
  if (directive === 'stream error') return { type: 'error' }
  // Hang seam: "stall" holds the response open far longer than any test idle-watchdog
  // timeout, simulating a provider that keeps the socket open but emits
  // nothing — the server loop's idle watchdog (createIdleWatchdog) must abort the turn
  // with a recoverable timeout.
  if (directive === 'stall') return { type: 'text', text: 'too late', delayMs: 30_000 }
  // Late-reply seam: "slow hello" answers like "hello", but only after the page has had time to
  // do something first (close the chat drawer, say) — the model loop runs on the server, so a
  // browser-side route can no longer hold the reply back.
  if (directive === 'slow hello') return { type: 'text', text: 'world', delayMs: 2000 }
  // Reasoning seam: emit reasoning tokens before the answer (exercises the loop's
  // reasoning capture and its streaming to the page).
  if (directive === 'reason') return { type: 'text', text: 'world', reasoning: 'Let me think about it.' }
  // Long-text seams: 'long answer' fills a small context window in a turn or two; 'slow long answer'
  // streams the same text one CHARACTER per 10ms delta (~4.5s), long enough for a test to reliably
  // catch the turn mid-stream (attach a second tab, stop it).
  const longText = 'This is a deliberately long answer used to exercise streaming throughput. '.repeat(6)
  if (directive === 'long answer') return { type: 'text', text: longText }
  if (directive === 'slow long answer') return { type: 'text', text: longText, chunk: 1 }
  // Loop-guard seam: a task of exactly "loop forever" makes the model emit the SAME tool call on EVERY
  // step (ignoring prior tool results and the injected nudge), so the loop is stopped by the
  // repeated-call guard and finishes on 'tool-calls'.
  if (directive === 'loop forever') {
    return { type: 'tool-call', toolName: 'get_schema', toolArgs: '{"dataset":"test"}' }
  }
  switch (modelId) {
    case 'mock-tools':
      return processMockToolsPrompt(lastMessage, options.prompt)
    case 'mock-summarizer':
      return processMockSummarizerPrompt()
    case 'mock-moderator':
      return processMockModeratorPrompt(lastMessage)
    default:
      return processMockPrompt(lastMessage, options.prompt)
  }
}

export function createMockLanguageModel (modelId: string = 'mock-model'): LanguageModel {
  return {
    specificationVersion: 'v3',
    provider: 'mock',
    modelId,
    supportedUrls: {},
    doStream: async (options) => {
      const result = processForModel(modelId, options)
      if (result.delayMs) await mockDelay(result.delayMs, options.abortSignal)
      const promptText = serializePrompt(options.prompt)

      if (result.type === 'error') {
        // Fail mid-stream: emit a text-start (so the stream has begun) then error it,
        // mirroring a provider that dies partway through a response.
        const stream = new ReadableStream<LanguageModelV3StreamPart>({
          start (controller) {
            controller.enqueue({ type: 'text-start', id: 'mock-id' })
            controller.error(new Error('mock stream error'))
          }
        })
        return { stream }
      }

      if (result.type === 'tool-call') {
        const calls = result.toolCalls ?? [{ toolName: result.toolName!, toolArgs: result.toolArgs || '{}' }]
        const usage = buildUsage(promptText, JSON.stringify(calls))
        // Salt the id with the prompt length so a multi-step loop (same tool every step)
        // gets a distinct id per step instead of reusing one across the accumulated history.
        const callIdSalt = Array.isArray(options.prompt) ? options.prompt.length : 0
        const stream = new ReadableStream<LanguageModelV3StreamPart>({
          start (controller) {
            if (result.reasoning) {
              controller.enqueue({ type: 'reasoning-start', id: 'mock-reason' })
              controller.enqueue({ type: 'reasoning-delta', id: 'mock-reason', delta: result.reasoning })
              controller.enqueue({ type: 'reasoning-end', id: 'mock-reason' })
            }
            if (result.text) {
              controller.enqueue({ type: 'text-start', id: 'mock-id' })
              controller.enqueue({ type: 'text-delta', id: 'mock-id', delta: result.text })
              controller.enqueue({ type: 'text-end', id: 'mock-id' })
            }
            calls.forEach((call, idx) => {
              const toolCallId = `mock-tool-call-id-${callIdSalt}-${idx}`
              controller.enqueue({ type: 'tool-input-start', id: toolCallId, toolName: call.toolName })
              controller.enqueue({ type: 'tool-input-delta', id: toolCallId, delta: call.toolArgs || '{}' })
              controller.enqueue({ type: 'tool-input-end', id: toolCallId })
              controller.enqueue({
                type: 'tool-call',
                toolCallId,
                toolName: call.toolName,
                // A JSON STRING, not a parsed object: LanguageModelV3's tool-call part is the
                // raw provider payload, and the SDK parses and validates it itself (it calls
                // .trim() on this). Emitting an object made every SDK-side tool execution
                // fail with "toolCall.input.trim is not a function".
                input: call.toolArgs || '{}'
              } as any)
            })
            controller.enqueue({
              type: 'finish',
              usage,
              finishReason: { unified: 'tool-calls' as const, raw: undefined }
            })
            controller.close()
          }
        })
        return { stream }
      }

      const usage = buildUsage(promptText, result.text ?? '')
      let timer: ReturnType<typeof setTimeout> | undefined
      const stream = new ReadableStream<LanguageModelV3StreamPart>({
        // A cancelled stream (an aborted turn) must stop its own timer: enqueuing into a closed
        // controller throws from a timeout callback, which is an uncaught exception.
        cancel () { clearTimeout(timer) },
        start (controller) {
          if (result.reasoning) {
            controller.enqueue({ type: 'reasoning-start', id: 'mock-reason' })
            controller.enqueue({ type: 'reasoning-delta', id: 'mock-reason', delta: result.reasoning })
            controller.enqueue({ type: 'reasoning-end', id: 'mock-reason' })
          }
          let i = 0
          const chunk = result.chunk ?? STREAM_CHUNK
          const pushChar = () => {
            if (i < result.text!.length) {
              controller.enqueue({ type: 'text-delta', id: 'mock-id', delta: result.text!.slice(i, i + chunk) })
              i += chunk
              timer = setTimeout(pushChar, 10)
            } else {
              controller.enqueue({ type: 'text-end', id: 'mock-id' })
              controller.enqueue({ type: 'finish', usage, finishReason: { unified: 'stop' as const, raw: undefined } })
              controller.close()
            }
          }
          controller.enqueue({ type: 'text-start', id: 'mock-id' })
          pushChar()
        }
      })

      return { stream }
    },
    doGenerate: async (options) => {
      const result = processForModel(modelId, options)
      if (result.delayMs) await mockDelay(result.delayMs, options.abortSignal)
      const promptText = serializePrompt(options.prompt)

      if (result.type === 'error') {
        throw new Error('mock stream error')
      }

      if (result.type === 'tool-call') {
        const calls = result.toolCalls ?? [{ toolName: result.toolName!, toolArgs: result.toolArgs || '{}' }]
        const callIdSalt = Array.isArray(options.prompt) ? options.prompt.length : 0
        return {
          content: calls.map((call, idx) => ({
            type: 'tool-call' as const,
            toolCallId: `mock-tool-call-id-${callIdSalt}-${idx}`,
            toolName: call.toolName,
            // A JSON STRING, as in doStream above: the SDK parses it itself. A parsed object made every
            // generateText tool call fail as invalid — first exercised by memory reflection (now consolidation).
            input: call.toolArgs || '{}'
          })),
          finishReason: { unified: 'tool-calls' as const, raw: undefined },
          usage: buildUsage(promptText, JSON.stringify(calls)),
          warnings: []
        }
      }

      return {
        content: [
          ...(result.reasoning ? [{ type: 'reasoning' as const, text: result.reasoning }] : []),
          { type: 'text' as const, text: result.text! }
        ],
        finishReason: { unified: 'stop' as const, raw: undefined },
        usage: buildUsage(promptText, result.text ?? ''),
        warnings: []
      }
    }
  }
}
