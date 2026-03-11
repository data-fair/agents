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

function processEvaluatorMockPrompt (lastMessage: string, system?: string): MockPromptResult {
  const systemLower = (system || '').toLowerCase()
  const promptLower = lastMessage.toLowerCase()

  if (systemLower.includes('evaluating whether a conversation has reached a satisfactory conclusion') ||
      systemLower.includes('check completion') ||
      promptLower.includes('last assistant response')) {
    return {
      type: 'tool-call',
      toolName: 'checkCompletion',
      toolArgs: JSON.stringify({ done: true, reason: 'task complete' })
    }
  }

  if (systemLower.includes('evaluating the quality') || promptLower.includes('ideal result')) {
    const qualityMatch = lastMessage.match(/quality[:\s]*(\d+)/i)
    const quality = qualityMatch ? qualityMatch[1] : '85'
    return {
      type: 'text',
      text: `Quality score: ${quality}. The response adequately addresses the expected outcome with minor areas for improvement.`
    }
  }

  if (systemLower.includes('analyzing the efficiency') || systemLower.includes('efficiency') || promptLower.includes('efficiency')) {
    const efficiencyMatch = lastMessage.match(/efficiency[:\s]*(\d+)/i)
    const efficiency = efficiencyMatch ? efficiencyMatch[1] : '75'
    return {
      type: 'text',
      text: `Efficiency score: ${efficiency}. The conversation completed in reasonable time with appropriate tool usage.`
    }
  }

  if (systemLower.includes('user interacting with an assistant') ||
      systemLower.includes('customer') ||
      systemLower.includes('user simulator')) {
    if (promptLower.includes('hello') || promptLower.includes('initial') || promptLower.length < 50) {
      return { type: 'text', text: 'I need more information about the product.' }
    }
    return { type: 'text', text: 'Thank you for the details. Can you help me with that?' }
  }

  if (systemLower.includes('analyzing an existing conversation trace') ||
      systemLower.includes('existing conversation trace')) {
    return {
      type: 'text',
      text: 'Quality: 80. The response matches the ideal result well.\nEfficiency: 70. The trace shows reasonable tool usage patterns.'
    }
  }

  return { type: 'text', text: 'Evaluated: acceptable' }
}

export function createEvaluatorMockLanguageModel (): LanguageModel {
  return {
    specificationVersion: 'v3',
    provider: 'mock',
    modelId: 'evaluator-mock-model',
    supportedUrls: {},
    doStream: async (options) => {
      const lastMessage = getLastUserMessage(options)
      const system = typeof options.prompt === 'string'
        ? undefined
        : (options.prompt as any[])?.find((p: any) => p.role === 'system')?.content
      const result = processEvaluatorMockPrompt(lastMessage, system)

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
      const system = typeof options.prompt === 'string'
        ? undefined
        : (options.prompt as any[])?.find((p: any) => p.role === 'system')?.content
      const result = processEvaluatorMockPrompt(lastMessage, system)

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
