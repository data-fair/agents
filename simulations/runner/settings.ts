/**
 * Point an owner's settings at the Claude Code bridge, so the assistant under
 * test runs on a real model.
 */

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

/**
 * Roles a deployment puts on a small model: sub-agents, compaction, the
 * moderation guard. Running them on the assistant's model costs more per case
 * and flatters the product — a sub-agent prompt only a large model can follow
 * reads as working until a real deployment runs it on the cheap tier. The
 * evaluator is a trace-review role no case exercises, so it follows the
 * assistant rather than earning a third setting.
 */
export function bridgeSettings (assistantModelId: string, toolsModelId: string) {
  const modelRef = (id: string) => ({
    id,
    name: id,
    provider: { type: 'openai-compatible', id: 'bridge', name: 'Claude Code Bridge' }
  })
  // Priced at 0: the bridge spends a Claude subscription, not per-token billing, so
  // any number here would be fiction. The fields are mandatory (the settings PUT 400s
  // without them) precisely so a model can never be free by accident — stating 0
  // explicitly is the honest way to say "not metered here".
  const priced = (id: string, usage: string[]) => ({
    model: modelRef(id),
    usage,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0
  })
  // The catalog is keyed by model, not by role, so the two ids collapse to one entry
  // when a run pins the same model to both tiers (SIM_TOOLS_MODEL=sonnet).
  const models = assistantModelId === toolsModelId
    ? [priced(assistantModelId, ['assistant', 'evaluator', 'tools', 'summarizer', 'moderator'])]
    : [
        priced(assistantModelId, ['assistant', 'evaluator']),
        priced(toolsModelId, ['tools', 'summarizer', 'moderator'])
      ]
  const ref = (id: string) => ({ provider: 'bridge', id, name: id })
  // Mapped explicitly: the dev/test global config also ships a mock model as the
  // default for every role, so an unmapped role would silently run on the mock
  // instead of the bridge and the case would prove nothing.
  const modelMapping = {
    assistant: ref(assistantModelId),
    evaluator: ref(assistantModelId),
    tools: ref(toolsModelId),
    summarizer: ref(toolsModelId),
    moderator: ref(toolsModelId)
  }
  // Quotas defined inline rather than imported: a static import of test helpers
  // would authenticate at module load, causing unit tests to perform network I/O
  // before any test runs. No `global` entry — the account-wide cap moved to the
  // limits service, and dev leaves it uncapped.
  const quotas = {
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 0 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: false, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 },
    untrusted: { unlimited: false, monthlyLimit: 0 }
  }
  return {
    providers: [provider],
    models,
    modelMapping,
    quotas,
    storeTraces: false
  }
}

/** Fields the org-admin PUT owns; everything else belongs to the superadmin PUT. */
const ORG_OWNED_KEYS = ['modelMapping', 'quotas', 'moderation', 'storeTraces']

export async function seedSettings (assistantModelId: string, toolsModelId: string) {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  const body = bridgeSettings(assistantModelId, toolsModelId) as Record<string, any>
  // Settings authorship is split across two write-scoped endpoints: providers/models
  // are superadmin-owned, the rest is org-admin-owned. Posting the whole body to the
  // superadmin route 400s on additionalProperties.
  const superadminBody: Record<string, any> = {}
  const orgBody: Record<string, any> = {}
  for (const [key, value] of Object.entries(body)) {
    (ORG_OWNED_KEYS.includes(key) ? orgBody : superadminBody)[key] = value
  }
  await admin.put(`/api/settings/${OWNER.type}/${OWNER.id}`, superadminBody)
  await admin.put(`/api/settings/${OWNER.type}/${OWNER.id}/org`, orgBody)
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
