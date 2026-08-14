/**
 * operations.ts contains pure stateless functions for model creation
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import type { Provider } from '#types'
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

export interface GlobalAiProvider {
  type: string
  id: string
  name: string
  enabled?: boolean
  apiKey?: string
  baseURL?: string
  projectId?: string
  compatibility?: 'default' | 'compatible'
}

export interface GlobalAiModel {
  id: string
  name: string
  provider: string
  usage: ModelRole[]
  multiplier?: number
}

export type DefaultModelRefs = Partial<Record<ModelRole, { provider: string, id: string }>>

/**
 * Fail-fast consistency check of the env-var-provided global AI config.
 * Called once at boot from config.ts so a bad deployment config crashes
 * immediately with an actionable message instead of failing at request time.
 */
export function assertGlobalAiConfig (providers: GlobalAiProvider[], models: GlobalAiModel[], defaultModels: DefaultModelRefs): void {
  const providerIds = new Set<string>()
  for (const p of providers) {
    if (providerIds.has(p.id)) throw new Error(`invalid global AI config: duplicate global provider id "${p.id}"`)
    providerIds.add(p.id)
    if ((p.type === 'ollama' || p.type === 'openai-compatible') && !p.baseURL) {
      throw new Error(`invalid global AI config: provider "${p.id}" (${p.type}) requires baseURL`)
    }
  }
  const modelKeys = new Set<string>()
  for (const m of models) {
    const key = `${m.provider}/${m.id}`
    if (modelKeys.has(key)) throw new Error(`invalid global AI config: duplicate global model "${key}"`)
    modelKeys.add(key)
    if (!providerIds.has(m.provider)) throw new Error(`invalid global AI config: model "${key}" references unknown provider "${m.provider}"`)
  }
  for (const [role, ref] of Object.entries(defaultModels)) {
    if (!ref) continue
    const model = models.find(m => m.provider === ref.provider && m.id === ref.id)
    if (!model) throw new Error(`invalid global AI config: defaultModels.${role} references unknown global model "${ref.provider}/${ref.id}"`)
    if (!model.usage.includes(role as ModelRole)) throw new Error(`invalid global AI config: defaultModels.${role} references model "${ref.provider}/${ref.id}" not flagged for usage "${role}"`)
  }
}

export interface CatalogModel {
  id: string
  name: string
  provider: { type: string, name: string, id: string }
  usage: ModelRole[]
  multiplier: number
  source: 'global' | 'org'
}

export interface ModelRef { provider: string, id: string, name?: string }
export type ModelMapping = Partial<Record<ModelRole, ModelRef>>

export interface OrgModelDef {
  model: { id: string, name: string, provider: { type: string, name: string, id: string } }
  usage: string[]
  multiplier?: number
}

/** Merge global config models and per-org model definitions into the single
 * catalog all model consumers resolve against. A model whose provider is
 * missing or disabled is excluded, on BOTH sides: an org model orphaned by a
 * provider deletion (or left behind by unticking `enabled`) must drop out of
 * the catalog here, so that a `modelMapping` still pointing at it is treated as
 * an unresolvable ref by getRoleModel — logged and fallen through — instead of
 * being selected and then throwing in resolveRoleModel, which would take the
 * whole org down (404 "Agent not configured") even though a global default was
 * available one step further down the chain. */
export function getModelCatalog (globalProviders: GlobalAiProvider[], globalModels: GlobalAiModel[], orgProviders: { id: string, enabled?: boolean }[], orgModels: OrgModelDef[]): CatalogModel[] {
  const catalog: CatalogModel[] = []
  for (const m of globalModels) {
    const p = globalProviders.find(gp => gp.id === m.provider)
    if (!p || p.enabled === false) continue
    catalog.push({ id: m.id, name: m.name, provider: { type: p.type, name: p.name, id: p.id }, usage: m.usage, multiplier: m.multiplier ?? 1, source: 'global' })
  }
  for (const om of orgModels) {
    const p = orgProviders.find(op => op.id === om.model.provider.id)
    if (!p || p.enabled === false) continue
    catalog.push({ id: om.model.id, name: om.model.name, provider: om.model.provider, usage: om.usage as ModelRole[], multiplier: om.multiplier ?? 1, source: 'org' })
  }
  return catalog
}

const FALLBACK_CHAINS: Record<ModelRole, ModelRole[]> = {
  assistant: ['assistant'],
  tools: ['tools', 'assistant'],
  summarizer: ['summarizer', 'assistant'],
  evaluator: ['evaluator', 'assistant'],
  moderator: ['moderator', 'summarizer', 'assistant']
}

/** Resolve the catalog entry for a role: org mapping first, then global
 * defaults, walking the role's fallback chain. An unresolvable ref (e.g. its
 * provider was deleted) logs a warning and falls through rather than failing
 * the request. */
export function getRoleModel (catalog: CatalogModel[], mapping: ModelMapping | undefined, defaultModels: DefaultModelRefs, role: ModelRole): CatalogModel {
  for (const r of FALLBACK_CHAINS[role]) {
    for (const ref of [mapping?.[r], defaultModels[r]]) {
      if (!ref) continue
      const entry = catalog.find(c => c.provider.id === ref.provider && c.id === ref.id)
      if (entry) return entry
      console.warn(`model ref for role ${r} (${ref.provider}/${ref.id}) not found in catalog, falling back`)
    }
  }
  throw new Error(`No model configured for ${role}`)
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
