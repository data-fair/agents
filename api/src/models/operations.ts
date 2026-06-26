/**
 * operations.ts contains pure stateless functions for model creation
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import type { Provider, Settings } from '#types'
import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOllama } from 'ai-sdk-ollama'
import { createMockLanguageModel } from './mock-model.ts'
import { createEvaluatorMockLanguageModel } from './evaluator-mock-model.ts'

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
    case 'scaleway':
      return createOpenAI({ apiKey: provider.apiKey, baseURL: 'https://api.scaleway.ai/v1' })(modelId)
    case 'openai-compatible': {
      const openai = createOpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL
      })
      return provider.compatibility === 'compatible'
        ? openai.chat(modelId)
        : openai(modelId)
    }
    case 'mock':
      if (modelId === 'evaluator-mock-model') return createEvaluatorMockLanguageModel()
      return createMockLanguageModel(modelId)
    default:
      throw new Error(`Unknown provider type: ${(provider as Provider).type}`)
  }
}

export type ModelRole = 'assistant' | 'evaluator' | 'summarizer' | 'tools' | 'moderator'

export function getModelConfig (settings: Settings, modelRole: ModelRole) {
  // moderator prefers a cheap dedicated model, then the summarizer, then the
  // assistant as a guaranteed last resort; every other role falls back straight
  // to the assistant.
  const chain = modelRole === 'moderator'
    ? [settings.models?.moderator, settings.models?.summarizer, settings.models?.assistant]
    : [settings.models?.[modelRole], settings.models?.assistant]
  const source = chain.find(entry => entry?.model)
  if (!source?.model) throw new Error(`No model configured for ${modelRole}`)
  return {
    modelConfig: source.model,
    inputPricePerMillion: source.inputPricePerMillion ?? 0,
    outputPricePerMillion: source.outputPricePerMillion ?? 0
  }
}

export function resolveModelForRole (settings: Settings, modelRole: ModelRole): LanguageModel {
  const { modelConfig } = getModelConfig(settings, modelRole)
  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')
  return createModel(provider, modelConfig.id)
}
