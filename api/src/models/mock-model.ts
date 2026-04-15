import type { LanguageModel } from 'ai'
import type { LanguageModelV3StreamPart, LanguageModelV3Usage } from '@ai-sdk/provider'

interface MockPromptResult {
  type: 'text' | 'tool-call'
  text?: string
  toolName?: string
  toolArgs?: string
}

const defaultUsage: LanguageModelV3Usage = {
  inputTokens: { total: 0, cacheRead: undefined, cacheWrite: undefined, noCache: undefined },
  outputTokens: { total: 0, text: undefined, reasoning: undefined }
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

  // If the most recent message in the prompt is a tool result, we already called a tool
  // in this step — respond with text instead of calling another tool
  if (Array.isArray(prompt) && prompt.length > 0 && prompt[prompt.length - 1].role === 'tool') {
    return { type: 'text', text: 'done' }
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

function processForModel (modelId: string, options: { prompt: string | Array<any> }): MockPromptResult {
  const lastMessage = getLastUserMessage(options)
  switch (modelId) {
    case 'mock-tools':
      return processMockToolsPrompt(lastMessage, options.prompt)
    case 'mock-summarizer':
      return processMockSummarizerPrompt()
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

      if (result.type === 'tool-call') {
        const toolCallId = 'mock-tool-call-id'
        const stream = new ReadableStream<LanguageModelV3StreamPart>({
          start (controller) {
            controller.enqueue({ type: 'tool-input-start', id: toolCallId, toolName: result.toolName! })
            controller.enqueue({ type: 'tool-input-delta', id: toolCallId, delta: result.toolArgs || '{}' })
            controller.enqueue({ type: 'tool-input-end', id: toolCallId })
            controller.enqueue({
              type: 'tool-call',
              toolCallId,
              toolName: result.toolName!,
              input: result.toolArgs ? JSON.parse(result.toolArgs) : {}
            } as any)
            controller.enqueue({
              type: 'finish',
              usage: defaultUsage,
              finishReason: { unified: 'tool-calls' as const, raw: undefined }
            })
            controller.close()
          }
        })
        return { stream }
      }

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
              controller.enqueue({ type: 'finish', usage: defaultUsage, finishReason: { unified: 'stop' as const, raw: undefined } })
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

      if (result.type === 'tool-call') {
        return {
          content: [{
            type: 'tool-call' as const,
            toolCallId: 'mock-tool-call-id',
            toolName: result.toolName!,
            input: result.toolArgs ? JSON.parse(result.toolArgs) : {}
          }],
          finishReason: { unified: 'tool-calls' as const, raw: undefined },
          usage: defaultUsage,
          warnings: []
        }
      }

      return {
        content: [{ type: 'text' as const, text: result.text! }],
        finishReason: { unified: 'stop' as const, raw: undefined },
        usage: defaultUsage,
        warnings: []
      }
    }
  }
}
