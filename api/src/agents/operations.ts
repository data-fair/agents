/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import type { Provider } from '#types'
import type { ToolSet, LanguageModel } from 'ai'
import type { LanguageModelV3StreamPart, LanguageModelV3Usage, LanguageModelV3Text } from '@ai-sdk/provider'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOllama } from 'ai-sdk-ollama'
import { searchDatasets, describeDataset, searchData, aggregateData } from '../tools/datasets/index.ts'

export interface AgentInfo {
  id: string
  name: string
}

export const listAgents = (): AgentInfo[] => [
  { id: 'back-office-assistant', name: 'Data Fair Assistant' }
]

export function createMockLanguageModel (): LanguageModel {
  return {
    specificationVersion: 'v3',
    provider: 'mock',
    modelId: 'mock-model',
    supportedUrls: {},
    doStream: async (options) => {
      let lastMessage = ''

      if (typeof options.prompt === 'string') {
        lastMessage = options.prompt
      } else if (Array.isArray(options.prompt)) {
        const userMessages = options.prompt.filter((p: any) => p.role === 'user')
        const lastUserMsg = userMessages[userMessages.length - 1]
        if (lastUserMsg) {
          const content = lastUserMsg.content
          if (typeof content === 'string') {
            lastMessage = content
          } else if (Array.isArray(content)) {
            const textPart = content.find((c: any) => c.type === 'text') as any
            lastMessage = textPart?.text || ''
          }
        }
      }

      let text = ''
      if (!lastMessage) {
        text = 'what do you mean ?'
      } else if (lastMessage.toLowerCase() === 'hello') {
        text = 'world'
      } else {
        const callToolMatch = lastMessage.match(/^call tool (\w+)(.*)$/i)
        if (callToolMatch) {
          const toolName = callToolMatch[1]
          const toolArgs = callToolMatch[2].trim()
          const toolCallId = 'mock-tool-call-id'
          const stream = new ReadableStream<LanguageModelV3StreamPart>({
            start (controller) {
              controller.enqueue({ type: 'tool-input-start', id: toolCallId, toolName })
              controller.enqueue({ type: 'tool-input-delta', id: toolCallId, delta: toolArgs || '{}' })
              controller.enqueue({ type: 'tool-input-end', id: toolCallId })
              controller.enqueue({
                type: 'tool-call',
                toolCallId,
                toolName,
                input: toolArgs ? JSON.parse(toolArgs) : {}
              } as any)
              controller.enqueue({
                type: 'finish',
                usage: { inputTokens: { total: 0, cacheRead: undefined, cacheWrite: undefined, noCache: undefined }, outputTokens: { total: 0, text: undefined, reasoning: undefined } },
                finishReason: { unified: 'tool-calls' as const, raw: undefined }
              })
              controller.close()
            }
          })
          return { stream }
        }
        text = 'what do you mean ?'
      }

      const usage: LanguageModelV3Usage = { inputTokens: { total: 0, cacheRead: undefined, cacheWrite: undefined, noCache: undefined }, outputTokens: { total: 0, text: undefined, reasoning: undefined } }

      const stream = new ReadableStream<LanguageModelV3StreamPart>({
        start (controller) {
          let i = 0
          const pushChar = () => {
            if (i < text.length) {
              controller.enqueue({ type: 'text-delta', id: 'mock-id', delta: text[i] })
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
      console.error('MOCK doGenerate called with options:', JSON.stringify(options, (k, v) => typeof v === 'function' ? '[Function]' : v, 2))
      let lastMessage = ''

      if (typeof options.prompt === 'string') {
        lastMessage = options.prompt
      } else if (Array.isArray(options.prompt)) {
        const userMessages = options.prompt.filter((p: any) => p.role === 'user')
        const lastUserMsg = userMessages[userMessages.length - 1]
        if (lastUserMsg) {
          const content = lastUserMsg.content
          if (typeof content === 'string') {
            lastMessage = content
          } else if (Array.isArray(content)) {
            const textPart = content.find((c: any) => c.type === 'text') as LanguageModelV3Text
            lastMessage = textPart?.text || ''
          }
        }
      }

      if (!lastMessage) {
        return {
          content: [{ type: 'text' as const, text: 'what do you mean ?' }],
          finishReason: { unified: 'stop' as const, raw: undefined },
          usage: { inputTokens: { total: 0, noCache: undefined, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 0, text: undefined, reasoning: undefined } },
          warnings: []
        }
      }

      if (lastMessage.toLowerCase() === 'hello') {
        return {
          content: [{ type: 'text' as const, text: 'world' }],
          finishReason: { unified: 'stop' as const, raw: undefined },
          usage: { inputTokens: { total: 0, noCache: undefined, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 0, text: undefined, reasoning: undefined } },
          warnings: []
        }
      }

      const callToolMatch = lastMessage.match(/^call tool (\w+)(.*)$/i)
      if (callToolMatch) {
        const toolName = callToolMatch[1]
        const toolArgs = callToolMatch[2].trim()
        return {
          content: [{
            type: 'tool-call' as const,
            toolCallId: 'mock-tool-call-id',
            toolName,
            input: toolArgs ? JSON.parse(toolArgs) : {}
          }],
          finishReason: { unified: 'tool-calls' as const, raw: undefined },
          usage: { inputTokens: { total: 0, noCache: undefined, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 0, text: undefined, reasoning: undefined } },
          warnings: []
        }
      }

      return {
        content: [{ type: 'text' as const, text: 'what do you mean ?' }],
        finishReason: { unified: 'stop' as const, raw: undefined },
        usage: { inputTokens: { total: 0, noCache: undefined, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 0, text: undefined, reasoning: undefined } },
        warnings: []
      }
    },
    // doStream: async function * () {
    // Not implemented for mock
    // }
  }
}

export function createModel (provider: Provider, modelId: string): LanguageModel {
  switch (provider.type) {
    case 'openai':
      return createOpenAI({ apiKey: provider.apiKey })(modelId)
    case 'anthropic':
      return createAnthropic({ apiKey: provider.apiKey })(modelId)
    case 'google':
      return createGoogleGenerativeAI({ apiKey: provider.apiKey })(modelId)
    case 'mistral':
      return createMistral({ apiKey: provider.apiKey })(modelId)
    case 'openrouter':
      return createOpenRouter({ apiKey: provider.apiKey })(modelId) as unknown as LanguageModel
    case 'ollama':
      return createOllama({ baseURL: provider.baseURL })(modelId)
    case 'mock':
      return createMockLanguageModel()
    default:
      throw new Error(`Unknown provider type: ${(provider as Provider).type}`)
  }
}

export function getTools (dataFairUrl: string, cookies?: string): ToolSet {
  return {
    searchDatasets: searchDatasets.createTool(dataFairUrl, cookies),
    describeDataset: describeDataset.createTool(dataFairUrl, cookies),
    searchData: searchData.createTool(dataFairUrl, cookies),
    aggregateData: aggregateData.createTool(dataFairUrl, cookies)
  }
}
