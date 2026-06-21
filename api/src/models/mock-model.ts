import type { LanguageModel } from 'ai'
import type { LanguageModelV3StreamPart, LanguageModelV3Usage } from '@ai-sdk/provider'

interface MockPromptResult {
  type: 'text' | 'tool-call' | 'error'
  text?: string
  toolName?: string
  toolArgs?: string
  /** When set, emit several parallel tool calls in a single step (takes precedence over toolName/toolArgs) */
  toolCalls?: Array<{ toolName: string, toolArgs: string }>
  /** When set, wait this long before answering (tests the moderation fail-open path) */
  delayMs?: number
}

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

function buildUsage (promptText: string, outputText: string): LanguageModelV3Usage {
  return {
    inputTokens: { total: estimateMockTokens(promptText), cacheRead: undefined, cacheWrite: undefined, noCache: undefined },
    outputTokens: { total: estimateMockTokens(outputText), text: undefined, reasoning: undefined }
  }
}

function getLastUserMessage (options: { prompt: string | Array<any> }): string {
  if (typeof options.prompt === 'string') {
    return options.prompt
  }
  if (Array.isArray(options.prompt)) {
    const userMessages = options.prompt.filter((p: any) => p.role === 'user')
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

function processMockPrompt (lastMessage: string, prompt: string | Array<any>): MockPromptResult {
  if (!lastMessage) {
    return { type: 'text', text: 'what do you mean ?' }
  }

  if (lastMessage.toLowerCase() === 'help' || lastMessage === '?') {
    return { type: 'text', text: 'I respond to:\n- "hello" → returns "world"\n- "call tool <name> <args>" → triggers a tool call\n- Any other text → "what do you mean?"' }
  }

  if (lastMessage.toLowerCase() === 'hello') {
    return { type: 'text', text: 'world' }
  }

  if (lastMessage.toLowerCase() === 'markdown') {
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

  // If the most recent message in the prompt is a tool result, we already called a tool
  // in this step — respond with text instead of calling another tool
  if (Array.isArray(prompt) && prompt.length > 0 && prompt[prompt.length - 1].role === 'tool') {
    return { type: 'text', text: 'done' }
  }

  // "call tools <name> <name> ..." → several parallel tool calls in one step
  const callToolsMatch = lastMessage.match(/^call tools (.+)$/i)
  if (callToolsMatch) {
    return {
      type: 'tool-call',
      toolCalls: callToolsMatch[1].trim().split(/\s+/).map(toolName => ({ toolName, toolArgs: '{}' }))
    }
  }

  const callToolMatch = lastMessage.match(/^call tool (\w+)(.*)$/i)
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
 * mock-tools: context-aware tool chaining for subagent testing.
 * Inspects conversation history to deterministically chain: get_schema → query_data → text summary.
 * Also supports "call tool" syntax and "hello" → "world" as overrides.
 */
function processMockToolsPrompt (lastMessage: string, prompt: string | Array<any>): MockPromptResult {
  // Support explicit overrides first
  if (lastMessage.toLowerCase() === 'hello') {
    return { type: 'text', text: 'world' }
  }

  const callToolMatch = lastMessage.match(/^call tool (\w+)(.*)$/i)
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
 * mock-moderator: returns a deterministic moderation verdict as JSON text
 * (parseable by generateObject). When the gateway wraps conversation context,
 * it judges ONLY the <message_to_moderate> portion — mirroring the real prompt's
 * isolation rule. Messages containing "jailbreak" or an "ignore (all/previous)
 * instructions" phrase are blocked as prompt-injection, "fuck" as profanity;
 * everything else is allowed. "slow moderation" delays the verdict past the gate
 * timeout (fail-open / late-block paths). The "CTXSEEN" sentinel in the context
 * surfaces (as category "ctx-seen" on an allow) that prior turns were forwarded.
 */
function processMockModeratorPrompt (lastMessage: string): MockPromptResult {
  const judged = lastMessage.match(/<message_to_moderate>([\s\S]*?)<\/message_to_moderate>/)?.[1] ?? lastMessage
  const context = lastMessage.match(/<conversation_context>([\s\S]*?)<\/conversation_context>/)?.[1] ?? ''
  const delayMs = /slow moderation/i.test(judged) ? 6000 : undefined
  if (/jailbreak|ignore (all |previous )+instructions/i.test(judged)) {
    return { type: 'text', text: '{"action":"block","category":"prompt-injection","reason":"mock block"}', delayMs }
  }
  if (/\bfuck/i.test(judged)) {
    return { type: 'text', text: '{"action":"block","category":"profanity","reason":"mock profanity"}', delayMs }
  }
  if (/CTXSEEN/.test(context)) {
    return { type: 'text', text: '{"action":"allow","category":"ctx-seen"}', delayMs }
  }
  return { type: 'text', text: '{"action":"allow"}', delayMs }
}

/**
 * Exploration test seam: when the request advertises a `select_tools` tool, emit a
 * deterministic select_tools call choosing every tool named inside the prompt's
 * <candidate-tools> block. Lets the explore_tools flow be tested with the mock.
 */
function processSelectToolsSeam (lastMessage: string, tools: Array<any> | undefined): MockPromptResult | null {
  const offersSelectTools = Array.isArray(tools) &&
    tools.some((t: any) => (t?.name ?? t?.function?.name) === 'select_tools')
  if (!offersSelectTools) return null
  const block = lastMessage.match(/<candidate-tools>([\s\S]*?)<\/candidate-tools>/)
  const names = block
    ? block[1].split('\n').map((l: string) => l.trim()).filter(Boolean).map((l: string) => l.split(':')[0].trim())
    : []
  return {
    type: 'tool-call',
    toolName: 'select_tools',
    toolArgs: JSON.stringify({ summary: 'mock selection', toolNames: names })
  }
}

function processForModel (modelId: string, options: { prompt: string | Array<any>, tools?: Array<any> }): MockPromptResult {
  const lastMessage = getLastUserMessage(options)
  const seam = processSelectToolsSeam(lastMessage, options.tools)
  if (seam) return seam
  // Silent-drop test seams (apply to every model role): "empty" makes the model
  // return an empty completion (no text, no tool call), "stream error" makes the
  // stream fail mid-flight. Both previously ended the conversation silently.
  if (lastMessage.toLowerCase() === 'empty') return { type: 'text', text: '' }
  if (lastMessage.toLowerCase() === 'stream error') return { type: 'error' }
  // Hang seam: "stall" holds the response open far longer than any test idle-watchdog
  // timeout, simulating a provider/gateway that keeps the socket open but emits
  // nothing — the client's watchdog must abort the turn with a recoverable timeout.
  if (lastMessage.toLowerCase() === 'stall') return { type: 'text', text: 'too late', delayMs: 30_000 }
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
      if (result.delayMs) await new Promise(resolve => setTimeout(resolve, result.delayMs))
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
        const stream = new ReadableStream<LanguageModelV3StreamPart>({
          start (controller) {
            calls.forEach((call, idx) => {
              const toolCallId = `mock-tool-call-id-${idx}`
              controller.enqueue({ type: 'tool-input-start', id: toolCallId, toolName: call.toolName })
              controller.enqueue({ type: 'tool-input-delta', id: toolCallId, delta: call.toolArgs || '{}' })
              controller.enqueue({ type: 'tool-input-end', id: toolCallId })
              controller.enqueue({
                type: 'tool-call',
                toolCallId,
                toolName: call.toolName,
                input: call.toolArgs ? JSON.parse(call.toolArgs) : {}
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
      const stream = new ReadableStream<LanguageModelV3StreamPart>({
        start (controller) {
          let i = 0
          const pushChar = () => {
            if (i < result.text!.length) {
              controller.enqueue({ type: 'text-delta', id: 'mock-id', delta: result.text![i] })
              i++
              setTimeout(pushChar, 10)
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
      if (result.delayMs) await new Promise(resolve => setTimeout(resolve, result.delayMs))
      const promptText = serializePrompt(options.prompt)

      if (result.type === 'error') {
        throw new Error('mock stream error')
      }

      if (result.type === 'tool-call') {
        const calls = result.toolCalls ?? [{ toolName: result.toolName!, toolArgs: result.toolArgs || '{}' }]
        return {
          content: calls.map((call, idx) => ({
            type: 'tool-call' as const,
            toolCallId: `mock-tool-call-id-${idx}`,
            toolName: call.toolName,
            input: call.toolArgs ? JSON.parse(call.toolArgs) : {}
          })),
          finishReason: { unified: 'tool-calls' as const, raw: undefined },
          usage: buildUsage(promptText, JSON.stringify(calls)),
          warnings: []
        }
      }

      return {
        content: [{ type: 'text' as const, text: result.text! }],
        finishReason: { unified: 'stop' as const, raw: undefined },
        usage: buildUsage(promptText, result.text ?? ''),
        warnings: []
      }
    }
  }
}
