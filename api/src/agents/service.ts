import type { Provider } from '#types'
import type { ToolSet } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOllama } from 'ai-sdk-ollama'
import config from '#config'
import { searchDatasets, describeDataset, searchData, aggregateData } from '../tools/datasets/index.ts'

export interface AgentInfo {
  id: string
  name: string
}

export const listAgents = (): AgentInfo[] => [
  { id: 'back-office-assistant', name: 'Data Fair Assistant' }
]

export function createModel (provider: Provider, modelId: string): any {
  switch (provider.type) {
    case 'openai':
      return createOpenAI({ apiKey: provider.apiKey, compatibility: 'compatible' })(modelId)
    case 'anthropic':
      return createAnthropic({ apiKey: provider.apiKey })(modelId)
    case 'google':
      return createGoogleGenerativeAI({ apiKey: provider.apiKey })(modelId)
    case 'mistral':
      return createMistral({ apiKey: provider.apiKey })(modelId)
    case 'openrouter':
      return createOpenRouter({ apiKey: provider.apiKey })(modelId)
    case 'ollama':
      return createOllama({ baseURL: provider.baseURL })(modelId)
    case 'mock':
      return createOpenAI({ apiKey: 'mock-key', compatibility: 'compatible' })('gpt-4o')
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
