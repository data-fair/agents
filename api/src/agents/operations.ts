/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import type { Provider } from '#types'
import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOllama } from 'ai-sdk-ollama'
import { createMockLanguageModel } from './mock-model.ts'
import { createEvaluatorMockLanguageModel } from './evaluator-mock-model.ts'

export interface AgentInfo {
  id: string
  name: string
}

export const listAgents = (): AgentInfo[] => [
  { id: 'back-office-assistant', name: 'Data Fair Assistant' }
]

export { createMockLanguageModel, createEvaluatorMockLanguageModel }

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
