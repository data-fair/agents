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
  const asRole = (id: string) => ({
    model: { id, name: id, provider: { type: 'openai-compatible', id: 'bridge', name: 'Claude Code Bridge' } },
    inputPricePerMillion: 0,
    outputPricePerMillion: 0
  })
  const role = asRole(assistantModelId)
  const background = asRole(toolsModelId)
  // Quotas defined inline rather than imported: a static import of test helpers
  // would authenticate at module load, causing unit tests to perform network I/O
  // before any test runs.
  const quotas = {
    global: { unlimited: false, monthlyLimit: 10 },
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 0 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: false, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 },
    untrusted: { unlimited: false, monthlyLimit: 0 }
  }
  return {
    providers: [provider],
    models: { assistant: role, tools: background, summarizer: background, evaluator: role, moderator: background },
    quotas,
    storeTraces: false
  }
}

export async function seedSettings (assistantModelId: string, toolsModelId: string) {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  await admin.put(`/api/settings/${OWNER.type}/${OWNER.id}`, bridgeSettings(assistantModelId, toolsModelId))
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
