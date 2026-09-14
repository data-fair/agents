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

// Shared @ai-sdk/openai-compatible provider name for the scaleway + openai-compatible
// routes. It is the key under which callers pass providerOptions (e.g. reasoningEffort),
// so keep it a single constant rather than per-provider names.
export const OPENAI_COMPATIBLE_PROVIDER_NAME = 'openai-compatible'

export function createModel (provider: Provider, modelId: string): LanguageModel {
  // Wrap the provider's fetch with the provider-scoped debug logger. When the
  // DEBUG namespace is off this returns the global fetch unchanged, so there is
  // no added cost.
  const debugFetch = createDebugFetch(provider)
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
      return createOpenAICompatible({ name: OPENAI_COMPATIBLE_PROVIDER_NAME, apiKey: provider.apiKey, baseURL: scalewayBaseURL(provider.projectId), includeUsage: true, ...f }).chatModel(modelId)
    case 'openai-compatible': {
      // 'compatible' mode targets /v1/chat/completions; route it through
      // @ai-sdk/openai-compatible to capture `reasoning_content` (see scaleway above).
      // 'default' mode keeps @ai-sdk/openai's /v1/responses callable, which already
      // surfaces reasoning natively.
      if (provider.compatibility === 'compatible') {
        return createOpenAICompatible({ name: OPENAI_COMPATIBLE_PROVIDER_NAME, apiKey: provider.apiKey, baseURL: provider.baseURL!, includeUsage: true, ...f }).chatModel(modelId)
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

/**
 * Used when neither the admin nor the provider listing supplies a window.
 * Deliberately conservative: it is the case of a local or self-hosted
 * openai-compatible model that may genuinely be small.
 */
export const UNKNOWN_CONTEXT_WINDOW = 32_000

const DEFAULT_COMPACTION_PERCENT = 70

/**
 * The hand-entered context window, which the schema declares on the assistant role
 * only. Read structurally so the other four role shapes — which legitimately lack
 * the key — do not need a cast at every use.
 */
function roleContextWindow (source: object): number | undefined {
  const value = (source as { contextWindow?: unknown }).contextWindow
  return typeof value === 'number' ? value : undefined
}

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
    outputPricePerMillion: source.outputPricePerMillion ?? 0,
    // Same resolution order as contextWindow: role override, then the snapshot
    // taken from the provider listing when the model was picked, then... NOT 0.
    // An unset cache price means "unknown", not "free": OpenAI, Scaleway, LiteLLM
    // and vLLM report no pricing in their model listings, yet their SDKs still
    // report a cache-read/write split (they cache implicitly above ~1024 prompt
    // tokens). Defaulting to 0 would bill those cache-read tokens for free,
    // under-billing cost and silently loosening every dollar-denominated quota
    // (including the untrusted anonymous+external pool). Fall back to the full
    // input price instead, which is what this codebase billed before the split
    // was introduced.
    cachedInputPricePerMillion: source.cachedInputPricePerMillion ?? source.model.cachedInputPricePerMillion ?? (source.inputPricePerMillion ?? 0),
    // Only the assistant role carries a hand-entered window: it is the sole role
    // whose history is compacted, so contextBudget() is always resolved for
    // 'assistant'. Every other role has just the listing snapshot. A 0 means
    // "unset" (the form emits 0 for an untouched number field), not a zero-token
    // window — fall through.
    contextWindow: roleContextWindow(source) || source.model.contextWindow || UNKNOWN_CONTEXT_WINDOW
  }
}

/**
 * Token budget above which the client compacts history. Always resolved for the
 * role whose history is actually compacted.
 */
export function contextBudget (settings: Settings, modelRole: ModelRole): number {
  const { contextWindow } = getModelConfig(settings, modelRole)
  const percent = settings.compaction?.percent ?? DEFAULT_COMPACTION_PERCENT
  return Math.floor(contextWindow * percent / 100)
}

export function resolveModelForRole (settings: Settings, modelRole: ModelRole): LanguageModel {
  const { modelConfig } = getModelConfig(settings, modelRole)
  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')
  return createModel(provider, modelConfig.id)
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

// Best-effort human-readable message from an arbitrary thrown value. Connection
// failures can surface as an AggregateError (e.g. localhost resolving to both ::1
// and 127.0.0.1, both refused) whose own `.message` is empty — the detail then
// lives in `.code`, `.cause`, or the aggregated `.errors`. Dig those out so the
// admin (and the surfaced error entry) always get a non-empty message.
export function errorMessage (err: unknown): string {
  if (!err) return ''
  if (typeof err === 'string') return err
  if (err instanceof Error) {
    if (err.message) return err.message
    const code = (err as any).code
    if (typeof code === 'string') return code
    const cause = (err as any).cause
    if (cause) return errorMessage(cause)
    const aggregated = (err as any).errors
    if (Array.isArray(aggregated) && aggregated.length) return errorMessage(aggregated[0])
    return err.name || 'Unknown error'
  }
  return String(err)
}

// Turn a thrown fetch error into a compact { status, message } the admin can
// act on (e.g. Scaleway's 403 "insufficient permissions to access the resource").
// The @data-fair/lib-node axios instance rejects HTTP errors as a flattened
// errorContext carrying `status`/`data` directly, while connection failures keep
// the raw AxiosError shape (`response.status`/`response.data`). Read from either.
export function describeFetchError (err: unknown): { status?: number, message: string } {
  const e = err as any
  const status: number | undefined = typeof e?.response?.status === 'number'
    ? e.response.status
    : (typeof e?.status === 'number' ? e.status : undefined)
  const data = e?.response?.data ?? e?.data
  const apiMessage = data && typeof data === 'object' && typeof data.message === 'string'
    ? data.message as string
    : undefined
  return { status, message: apiMessage || errorMessage(err) }
}
