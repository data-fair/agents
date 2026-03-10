import type { Provider } from '#types'
import type { ToolSet, LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOllama } from 'ai-sdk-ollama'
import type { LanguageModelV3, LanguageModelV3TextPart } from '@ai-sdk/provider'
import config from '#config'
import { searchDatasets, describeDataset, searchData, aggregateData } from '../tools/datasets/index.ts'

export interface AgentInfo {
  id: string
  name: string
}

export const listAgents = (): AgentInfo[] => [
  { id: 'back-office-assistant', name: 'Data Fair Assistant' }
]

function createMockLanguageModel (): LanguageModelV3 {
  return {
    specificationVersion: 'v3',
    provider: 'mock',
    modelId: 'mock-model',
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
            const textPart = content.find((c: any) => c.type === 'text') as LanguageModelV3TextPart
            lastMessage = textPart?.text || ''
          }
        }
      }

      if (!lastMessage) {
        return {
          text: 'what do you mean ?',
          finishReason: 'stop',
          usage: { promptTokens: 0, completionTokens: 0, total: 0 }
        }
      }

      if (lastMessage.toLowerCase() === 'hello') {
        return {
          text: 'world',
          finishReason: 'stop',
          usage: { promptTokens: 0, completionTokens: 0, total: 0 }
        }
      }

      const callToolMatch = lastMessage.match(/^call tool (\w+)(.*)$/i)
      if (callToolMatch) {
        const toolName = callToolMatch[1]
        const toolArgs = callToolMatch[2].trim()
        return {
          text: '',
          toolCalls: [{
            toolCallId: 'mock-tool-call-id',
            toolName,
            args: toolArgs ? JSON.parse(toolArgs) : {}
          }],
          finishReason: 'tool-calls',
          usage: { promptTokens: 0, completionTokens: 0, total: 0 }
        }
      }

      return {
        text: 'what do you mean ?',
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0, total: 0 }
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

export function getTools (cookies?: string): ToolSet {
  const dataFairUrl = config.privateDataFairUrl
  return {
    searchDatasets: searchDatasets.createTool(dataFairUrl, cookies),
    describeDataset: describeDataset.createTool(dataFairUrl, cookies),
    searchData: searchData.createTool(dataFairUrl, cookies),
    aggregateData: aggregateData.createTool(dataFairUrl, cookies)
  }
}
