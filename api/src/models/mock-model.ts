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

function processMockPrompt (lastMessage: string): MockPromptResult {
  if (!lastMessage) {
    return { type: 'text', text: 'what do you mean ?' }
  }

  if (lastMessage.toLowerCase() === 'help' || lastMessage === '?') {
    return { type: 'text', text: 'I respond to:\n- "hello" → returns "world"\n- "call tool <name> <args>" → triggers a tool call\n- Any other text → "what do you mean?"' }
  }

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

  return { type: 'text', text: 'what do you mean ?' }
}

export function createMockLanguageModel (): LanguageModel {
  return {
    specificationVersion: 'v3',
    provider: 'mock',
    modelId: 'mock-model',
    supportedUrls: {},
    doStream: async (options) => {
      const lastMessage = getLastUserMessage(options)
      const result = processMockPrompt(lastMessage)

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
      const lastMessage = getLastUserMessage(options)
      const result = processMockPrompt(lastMessage)

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
