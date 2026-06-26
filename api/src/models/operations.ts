/**
 * operations.ts contains pure stateless functions for model creation
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import type { Provider, Settings } from '#types'
import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOllama } from 'ai-sdk-ollama'
import { createDebugFetch } from './debug-fetch.ts'
import { createMockLanguageModel } from './mock-model.ts'
import { createEvaluatorMockLanguageModel } from './evaluator-mock-model.ts'

export { createMockLanguageModel, createEvaluatorMockLanguageModel }

/**
 * Scaleway's Generative APIs are reached at https://api.scaleway.ai/v1, but an
 * API key scoped to a single Project must target the project-scoped URL
 * https://api.scaleway.ai/{projectId}/v1 — otherwise both model listing and
 * inference return 403 "insufficient permissions to access the resource".
 */
export function scalewayBaseURL (projectId?: string): string {
  const trimmed = projectId?.trim()
  return trimmed ? `https://api.scaleway.ai/${trimmed}/v1` : 'https://api.scaleway.ai/v1'
}

export function createModel (provider: Provider, modelId: string, fetchImpl?: typeof fetch): LanguageModel {
  // Wrap the effective fetch (the injected capture fetch when trace storage is on,
  // otherwise the global) with the provider-scoped debug logger. When the DEBUG
  // namespace is off this returns the same reference, so there is no added cost.
  const baseFetch = fetchImpl ?? globalThis.fetch
  const debugFetch = createDebugFetch(provider, baseFetch)
  const f = debugFetch !== globalThis.fetch ? { fetch: debugFetch } : {}
  switch (provider.type) {
    case 'openai':
      return createOpenAI({ apiKey: provider.apiKey, ...f })(modelId)
    case 'anthropic':
      return createAnthropic({ apiKey: provider.apiKey, ...f })(modelId)
    case 'google':
      return createGoogleGenerativeAI({ apiKey: provider.apiKey, ...f })(modelId)
    case 'mistral':
      return createMistral({ apiKey: provider.apiKey, ...f })(modelId)
    case 'openrouter':
      return createOpenRouter({ apiKey: provider.apiKey, ...f })(modelId) as unknown as LanguageModel
    case 'ollama':
      return createOllama({ baseURL: provider.baseURL, ...f })(modelId)
    case 'scaleway':
      // Scaleway does not implement the OpenAI /v1/responses endpoint, so it uses the
      // /v1/chat/completions model. Route it through @ai-sdk/openai-compatible (rather
      // than @ai-sdk/openai's .chat()) so reasoning models' `reasoning_content` is
      // captured as reasoning parts — @ai-sdk/openai silently drops that field.
      return createOpenAICompatible({ name: 'scaleway', apiKey: provider.apiKey, baseURL: scalewayBaseURL(provider.projectId), includeUsage: true, ...f }).chatModel(modelId)
    case 'openai-compatible': {
      // 'compatible' mode targets /v1/chat/completions; route it through
      // @ai-sdk/openai-compatible to capture `reasoning_content` (see scaleway above).
      // 'default' mode keeps @ai-sdk/openai's /v1/responses callable, which already
      // surfaces reasoning natively.
      if (provider.compatibility === 'compatible') {
        return createOpenAICompatible({ name: provider.name || 'openai-compatible', apiKey: provider.apiKey, baseURL: provider.baseURL!, includeUsage: true, ...f }).chatModel(modelId)
      }
      return createOpenAI({ apiKey: provider.apiKey, baseURL: provider.baseURL, ...f })(modelId)
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

export function resolveModelForRole (settings: Settings, modelRole: ModelRole, fetchImpl?: typeof fetch): LanguageModel {
  const { modelConfig } = getModelConfig(settings, modelRole)
  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')
  return createModel(provider, modelConfig.id, fetchImpl)
}

/**
 * Scaleway's glm-5.2 deployment silently drops tool calls in STREAMING mode: a
 * `stream:true` request returns `finish_reason:"stop"` with no tool-call deltas,
 * while the identical `stream:false` request returns the tool call correctly. Every
 * other Scaleway model tested (qwen3.5-397b, qwen3-235b, gpt-oss-120b — itself a
 * reasoning model — and devstral-2-123b) streams tool calls fine, so this is a
 * model-specific serving bug, not a provider-wide one. The gateway works around it by
 * issuing the upstream call non-streaming when tools are present (it still streams SSE
 * to the client). Covers both the direct `scaleway` provider (model id "glm-5.2") and
 * the `openai-compatible` → LiteLLM passthrough (model id "glm-5.2-scw").
 *
 * Re-check whether the upstream is still broken with `dev/scripts/scw-toolcall-probe.mjs`;
 * remove this workaround once Scaleway fixes streamed function-calling for GLM.
 */
export function streamedToolCallsBroken (providerType: string, modelId: string): boolean {
  return (providerType === 'scaleway' || providerType === 'openai-compatible') && /glm/i.test(modelId)
}
