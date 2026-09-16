/**
 * The simulated user.
 *
 * It is a person with a goal, not a test script: it may be vague, change its
 * mind, or push back, which is what makes this a simulation rather than a
 * fixture. It runs under the same isolation as every other Claude role here —
 * launched from this repo it would inherit the auto-memory index and know the
 * bugs the scenario exists to find (spec §1.2).
 */
import { createNeutralCwd, isolationOptions } from './isolation.ts'
import { MISSING_SDK_MESSAGE, isMissingSdkError } from './missing-sdk.ts'
import type { SimulationCase } from './types.ts'
import type { PagePerception } from './page-perception.ts'
import { MCP_SERVER_NAME } from './page-perception.ts'
import type { McpServerConfig } from '@anthropic-ai/claude-agent-sdk'

export const DONE = 'DONE'
let neutralCwd: string | undefined

// The persona looks and acts before replying, so one turn is not enough:
// look → act → look → reply, with room to spare.
//
// Tuned from real runs, three times, and the number follows the shape of the
// work rather than a guess. It is the budget for ONE message: how many tool
// calls the person may make before answering.
//
// 6 was the cost of look/click/look/click/look — the most ordinary thing a
// person does on a multi-step page — leaving nothing for the reply.
//
// 12 was exactly the length of a guided workflow. In a run of the dataset
// creation case the assistant handed over the whole procedure in one message
// and the person executed it in one turn: click Create, choose the type, skip
// the init step, type a title, tick an option, continue — with a look between
// each, twelve calls of purposeful work and nothing wasted. The reply then had
// no budget left and the run was discarded.
//
// So a guided scenario costs roughly (steps × 2) + 1, and the assistant decides
// how many steps it hands over at once. 25 covers a full wizard driven in a
// single message, with the verification looks and the reply, and still stops a
// genuinely lost persona long before it could wander for minutes.
export const PERSONA_MAX_TURNS = 25

export const PERCEPTION_INSTRUCTIONS = `You can look at the screen yourself with the look tool, and you can click and type
on the page. Before you say anything about what is or is not on the screen, look.
Never claim you cannot see something you have not looked for.`

// Appended only when the caller actually configured createPagePerception's
// offLimits — otherwise nothing refuses the composer and this sentence would be
// a promise the harness does not keep (the persona types its message in itself,
// double-sending). See lib-sim/README.md, "Give the persona eyes".
const COMPOSER_OFF_LIMITS_INSTRUCTIONS = `The message box and its Send button will refuse you if you try to click or type into
them — that part of the page is not yours to operate. To talk to the assistant, just
reply with your message; the runner types and sends it for you.`

export function isDone (message: string): boolean {
  if (!message) return false

  // Normalize the message: trim, strip quotes/backticks, strip trailing punctuation, uppercase
  let normalized = message.trim()

  // Strip surrounding quotes or backticks
  if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")) ||
      (normalized.startsWith('`') && normalized.endsWith('`'))) {
    normalized = normalized.slice(1, -1)
  }

  // Strip trailing punctuation
  normalized = normalized.replace(/[.!,:]+$/, '')

  // Uppercase and check if exactly DONE
  normalized = normalized.toUpperCase().trim()

  // Only true if it is exactly DONE, not a sentence containing the word
  return normalized === DONE
}

export function personaSystemPrompt (c: SimulationCase, perceptionEnabled = false, offLimitsActive = false): string {
  const lines = [
    c.persona,
    '',
    `What you want: ${c.goal}`,
    '',
    'You are talking to an assistant through a chat box on a web page. Behave like a real person:',
    '- Say what you want in your own words. Do not explain how the assistant should do it.',
    '- If a reply is vague, unhelpful, or does not actually show you the result, say so.',
    '- If you are asked a question, answer it.',
    '- Do not be artificially cooperative, and do not thank the assistant for work it has not done.',
    '',
    'Reply with ONLY the message you would type next — no quotes, no narration, no stage directions.',
    `When you have what you wanted, or you are convinced you will not get it, reply with exactly ${DONE} and nothing else.`
  ]
  if (perceptionEnabled) {
    lines.push('', PERCEPTION_INSTRUCTIONS)
    if (offLimitsActive) lines.push('', COMPOSER_OFF_LIMITS_INSTRUCTIONS)
  }
  return lines.join('\n')
}

/**
 * The SDK's `query`, narrowed to what the persona uses. Injectable (mirrors
 * `BridgeQuery` in bridge/server.ts) so a test can observe the options actually
 * handed over — including the perception wiring — without a network call or a
 * live model.
 */
export type PersonaQuery = (typeof import('@anthropic-ai/claude-agent-sdk'))['query']

export function personaPrompt (conversation: Array<{ role: string, text: string }>, turnsLeft: number): string {
  if (conversation.length === 0) return 'Write your first message to the assistant.'
  const transcript = conversation.map(m => `${m.role === 'user' ? 'you' : 'assistant'}: ${m.text}`).join('\n\n')
  const warning = turnsLeft <= 1
    ? '\n\nThis is your last message. If you already have what you needed, reply ' + DONE + '.'
    : ''
  return [
    'The conversation so far:',
    '',
    transcript,
    '',
    `Write your next message, or ${DONE} if you are finished.${warning}`
  ].join('\n')
}

export async function nextUserMessage (
  c: SimulationCase,
  conversation: Array<{ role: string, text: string }>,
  turnsLeft: number,
  opts?: { perception?: PagePerception, query?: PersonaQuery }
): Promise<string> {
  let runQuery: PersonaQuery
  if (opts?.query) {
    runQuery = opts.query
  } else {
    // Loaded here, not at module top level, so importing the package barrel
    // never requires the Agent SDK — it is an optional peer, and a consumer who
    // only wants the harness primitives must not pay for it. This is the only
    // place in the exported surface that reaches for it at runtime.
    try {
      ({ query: runQuery } = await import('@anthropic-ai/claude-agent-sdk'))
    } catch (err) {
      if (isMissingSdkError(err)) throw new Error(MISSING_SDK_MESSAGE)
      throw err
    }
  }

  neutralCwd ??= createNeutralCwd()
  let text = ''
  for await (const msg of runQuery({
    prompt: personaPrompt(conversation, turnsLeft),
    options: {
      ...isolationOptions(neutralCwd),
      model: process.env.SIM_USER_MODEL ?? 'sonnet',
      systemPrompt: personaSystemPrompt(c, !!opts?.perception, !!opts?.perception?.offLimits.length),
      // Unconditional: a caller with no perception registers no mcpServers, so
      // the persona has no tool to call and the loop still ends after the one
      // assistant turn a blind persona always took — the higher cap only ever
      // matters once look/click/type are actually wired in below.
      maxTurns: PERSONA_MAX_TURNS,
      ...(opts?.perception
        ? {
            // page-perception.ts deliberately builds the LOW-LEVEL MCP `Server`
            // (server/index.js), not the high-level `McpServer` helper the SDK's
            // `McpServerConfig` type expects — the low-level API accepts raw JSON
            // Schema for tool inputs, while `McpServer` demands Zod (the same
            // choice bridge/tool-server.ts makes, cast at the same boundary in
            // bridge/server.ts). The two classes are structurally unrelated, so
            // no tighter typing of `instance` would remove this cast.
            mcpServers: { [MCP_SERVER_NAME]: opts.perception.server as unknown as McpServerConfig },
            allowedTools: opts.perception.toolNames.map(n => `mcp__${MCP_SERVER_NAME}__${n}`)
          }
        : {})
    }
  })) {
    // The LAST assistant message that carried text, not every one of them. With
    // perception wired in the SDK emits an assistant message per reasoning step
    // between tool calls, and appending them all sent the persona's inner
    // monologue to the assistant as the person's own words — in one recorded run
    // naming the tool the assistant should call, in another welding DONE onto the
    // end of a sentence so isDone() missed it and the run ran on for an extra turn.
    if (msg.type === 'assistant') {
      const said = ((msg as any).message?.content ?? [])
        .filter((block: any) => block.type === 'text' && block.text)
        .map((block: any) => block.text)
      if (said.length) text = said.join('')
    }
  }
  return text.trim()
}
