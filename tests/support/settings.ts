/**
 * Canonical settings bodies for the tests.
 *
 * The mock provider answers "hello" with "world" and needs no API key, so every
 * suite can configure a working agent with a single PUT. Its credit multiplier
 * defaults to 0 so tests that do not care about accounting never trip a quota.
 *
 * Note the explicit `modelMapping.assistant`: the dev/test global config also
 * ships a mock model (`global-mock/mock-model`, multiplier 0) as the default
 * assistant, so without the mapping the org's own model — and its multiplier —
 * would never be selected.
 */
import type { AxiosInstance } from 'axios'
import { defaultQuotas } from './axios.ts'

export const mockProvider = { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }

export const mockModelRef = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }

/** The org model catalog entry, flagged for every role. Quota suites raise the
 * multiplier so that a handful of mock tokens produces a measurable number of
 * credits: credits = (input + output × outputTokenWeight) / 1e6 × multiplier. */
export const mockModels = (multiplier = 0) => [{
  model: mockModelRef,
  usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'],
  multiplier
}]

export const mockModelMapping = {
  assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
}

/** Full-shape canonical settings fixture, spanning both write-scoped
 * endpoints: `providers`/`models` are superadmin-owned (PUT /api/settings/:type/:id),
 * the rest is org-admin-owned (PUT /api/settings/:type/:id/org). Use `putMockSettings`
 * / `putSettings` to write it — they split it across the two routes. */
export const mockSettings = {
  providers: [mockProvider],
  models: mockModels(),
  modelMapping: mockModelMapping,
  quotas: defaultQuotas,
  storeTraces: false
}

/** Canonical org-admin PUT body (/api/settings/:type/:id/org) — the subset an
 * org admin owns. */
export const mockOrgSettings = {
  modelMapping: mockModelMapping,
  quotas: defaultQuotas,
  moderation: { enabled: false, categories: ['anonymous', 'external'] },
  storeTraces: false
}

const isPlainObject = (v: any): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Recursive merge of plain objects; arrays and scalars replace wholesale. */
export function deepMerge<T extends Record<string, any>> (base: T, overrides: Record<string, any>): T {
  const result: Record<string, any> = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    result[key] = isPlainObject(value) && isPlainObject(result[key]) ? deepMerge(result[key], value) : value
  }
  return result as T
}

/** Fields owned by the org-admin PUT (as opposed to the superadmin PUT, which
 * owns everything else: `providers` and `models`). */
const ORG_OWNED_KEYS = ['modelMapping', 'quotas', 'moderation', 'storeTraces']

/**
 * Splits a full-shape settings body across the two write-scoped endpoints and
 * writes each half through its own PUT. Settings authorship used to be a
 * single PUT before it was split between superadmin (providers/models) and
 * org-admin (modelMapping/quotas/moderation/storeTraces); this keeps specs
 * that still build one full body working unchanged aside from the call site.
 */
export async function putSettings (adminAx: AxiosInstance, owner: string, body: Record<string, any>) {
  const superadminBody: Record<string, any> = {}
  const orgBody: Record<string, any> = {}
  for (const [key, value] of Object.entries(body)) {
    (ORG_OWNED_KEYS.includes(key) ? orgBody : superadminBody)[key] = value
  }
  const superadminRes = await adminAx.put(`/api/settings/${owner}`, superadminBody)
  if (!Object.keys(orgBody).length) return superadminRes
  return adminAx.put(`/api/settings/${owner}/org`, orgBody)
}

export async function putMockSettings (adminAx: AxiosInstance, owner: string, overrides: Record<string, any> = {}) {
  return putSettings(adminAx, owner, deepMerge(structuredClone(mockSettings), overrides))
}

export async function putMockOrgSettings (adminAx: AxiosInstance, owner: string, overrides: Record<string, any> = {}) {
  return adminAx.put(`/api/settings/${owner}/org`, deepMerge(structuredClone(mockOrgSettings), overrides))
}
