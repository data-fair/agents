/**
 * Point a simulation owner's agent settings at the Claude Code bridge, so the
 * assistant under test runs on a real model instead of the dev mock provider.
 */

export const BRIDGE_URL = process.env.BRIDGE_URL ?? `http://localhost:${process.env.BRIDGE_PORT ?? 3194}/v1`

export const MODEL_ROLES = ['assistant', 'tools', 'summarizer', 'moderator'] as const
export type ModelRole = typeof MODEL_ROLES[number]

/**
 * Roles a deployment puts on a small model: memory consolidation, compaction, the
 * moderation guard. Running them on the assistant's model would both cost more
 * per case and flatter the product — a prompt that only a large model
 * can follow reads as working until a real deployment runs it on the cheap tier.
 */
export const BACKGROUND_ROLES: readonly ModelRole[] = ['tools', 'summarizer', 'moderator']

export type SimOwner = { type: string, id: string }

/**
 * The person's consent to having their conversation reviewed, which the export route requires. The
 * runner answers it before the chat loads (the consent sheet is not what a case is about). The same
 * cookie as the chat's own consent sheet (ui/src/review/review-consent.ts; a unit test pins them).
 */
export const REVIEW_CONSENT_COOKIE = 'agent-chat-trace-consent'
export const REVIEW_CONSENT_YES = 'yes'

/** The subset of an axios instance the seeding uses. */
export type HttpClient = {
  put: (url: string, body: unknown) => Promise<unknown>
  post: (url: string, body: unknown) => Promise<unknown>
}

const unlimited = { unlimited: true, monthlyLimit: 0 }
/** Every role unlimited: portal cases are anonymous visitors, back-office cases are admins. */
const quotas = { admin: unlimited, contrib: unlimited, user: unlimited, external: unlimited, anonymous: unlimited, untrusted: unlimited }

/**
 * The two bodies the agents API takes since settings were split by author:
 * `superadmin` (the provider and the model catalog, each model listing the
 * roles it may serve) and `org` (which model each role uses, quotas, review).
 * The org body is validated against the catalog, so it is written second.
 *
 * Review is on: the run is read back through the conversation export, which sits behind
 * it — a simulation is judged on the same file a real session is debugged with.
 */
export function bridgeSettings (assistantModelId: string, toolsModelId: string, bridgeUrl = BRIDGE_URL) {
  const bridge = { type: 'openai-compatible', id: 'bridge', name: 'Claude Code Bridge' }
  const modelFor = (role: ModelRole) => BACKGROUND_ROLES.includes(role) ? toolsModelId : assistantModelId
  const ids = [...new Set(MODEL_ROLES.map(modelFor))]
  return {
    superadmin: {
      providers: [{
        ...bridge,
        enabled: true,
        baseURL: bridgeUrl,
        // MANDATORY: in 'default' mode the provider targets /v1/responses, which the bridge does not implement.
        compatibility: 'compatible'
      }],
      models: ids.map(id => ({
        model: { id, name: id, provider: bridge },
        usage: MODEL_ROLES.filter(role => modelFor(role) === id),
        inputPricePerMillion: 0,
        outputPricePerMillion: 0
      }))
    },
    org: {
      modelMapping: Object.fromEntries(
        MODEL_ROLES.map(role => [role, { provider: bridge.id, id: modelFor(role), name: modelFor(role) }])
      ) as Record<ModelRole, { provider: string, id: string, name: string }>,
      quotas,
      reviewPersonalAssistant: true
    }
  }
}

/**
 * Write the agents settings of `owner` (superadmin body, then org body) and lift
 * its credit cap. `admin` is a superadmin client in admin mode, `agentsUrl` the
 * agents service's base URL (`<origin>/agents` behind the dev nginx). Turning the
 * chat on in the host service stays with the host.
 */
export async function seedAgentsSettings (admin: HttpClient, agentsUrl: string, owner: SimOwner, assistantModelId: string, toolsModelId: string) {
  const { superadmin, org } = bridgeSettings(assistantModelId, toolsModelId)
  await admin.put(`${agentsUrl}/api/settings/${owner.type}/${owner.id}`, superadmin)
  await admin.put(`${agentsUrl}/api/settings/${owner.type}/${owner.id}/org`, org)
  // The agents service caps each account's AI credits before any quota, and a
  // production-mode image defaults that cap to 0: every request is refused with a
  // 429. -1 lifts it; consumption is reset so a run never inherits the last.
  await admin.post(`${agentsUrl}/api/v1/limits/${owner.type}/${owner.id}`, {
    lastUpdate: new Date().toISOString(),
    ai_credits: { limit: -1, consumption: 0 }
  })
}

/** Fail loudly and early: without the bridge every case dies as an opaque timeout. */
export async function assertBridgeUp (bridgeUrl = BRIDGE_URL) {
  const statusUrl = bridgeUrl.replace(/\/v1$/, '') + '/_bridge/status'
  try {
    const res = await fetch(statusUrl, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    throw new Error(
      `The Claude Code bridge is not answering at ${statusUrl} (${err instanceof Error ? err.message : String(err)}).\n` +
      'Ask your user to start it with: npm run dev-bridge'
    )
  }
}
