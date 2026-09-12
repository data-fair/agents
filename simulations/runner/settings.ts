/**
 * Point an owner's settings at the Claude Code bridge, so the assistant under
 * test runs on a real model.
 */
import { superAdmin, defaultQuotas } from '../../tests/support/axios.ts'

export const BRIDGE_URL = process.env.BRIDGE_URL ?? 'http://localhost:3194/v1'
export const OWNER = { type: 'user', id: 'test-standalone1' } as const

const provider = {
  id: 'bridge',
  type: 'openai-compatible',
  name: 'Claude Code Bridge',
  enabled: true,
  baseURL: BRIDGE_URL,
  // MANDATORY. In 'default' mode createModel targets /v1/responses, which the
  // bridge does not implement (api/src/models/operations.ts).
  compatibility: 'compatible'
}

export function bridgeSettings (modelId: string) {
  const model = { id: modelId, name: modelId, provider: { type: 'openai-compatible', id: 'bridge', name: 'Claude Code Bridge' } }
  const role = { model, inputPricePerMillion: 0, outputPricePerMillion: 0 }
  return {
    providers: [provider],
    models: { assistant: role, tools: role, summarizer: role, evaluator: role, moderator: role },
    // The scenario user is an account admin; unlimited keeps a long conversation
    // from being cut short by quota rather than by the product.
    quotas: { ...defaultQuotas, admin: { unlimited: true, monthlyLimit: 0 } },
    storeTraces: false
  }
}

export async function seedSettings (modelId: string) {
  const admin = await superAdmin
  await admin.put(`/api/settings/${OWNER.type}/${OWNER.id}`, bridgeSettings(modelId))
}

/** Fail loudly and early: without the bridge every case dies as an opaque timeout. */
export async function assertBridgeUp () {
  const statusUrl = BRIDGE_URL.replace(/\/v1$/, '') + '/_bridge/status'
  try {
    const res = await fetch(statusUrl, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    throw new Error(
      `The Claude Code bridge is not answering at ${statusUrl} (${err instanceof Error ? err.message : String(err)}).\n` +
      'Start it with: npm run dev-bridge'
    )
  }
}
