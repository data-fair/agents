/**
 * Point an owner's settings at the Claude Code bridge, so the assistant under
 * test runs on a real model.
 */

// Derived from the SEEDED BRIDGE_PORT, never a fixed default. dev/init-env.sh randomises the port per
// worktree precisely so two checkouts cannot collide; a hardcoded 3194 reintroduced the collision in
// the one place it is least visible — another worktree's bridge answers assertBridgeUp(), the run is
// recorded valid, and the cases are driven against the wrong process. Fail loudly when it is unset
// rather than guessing a port that probably belongs to someone else.
const bridgePort = process.env.BRIDGE_PORT
export const BRIDGE_URL = process.env.BRIDGE_URL ??
  (bridgePort
    ? `http://localhost:${bridgePort}/v1`
    : (() => { throw new Error('BRIDGE_PORT is not set — simulations load .env via playwright.sim.config.ts, so re-run dev/init-env.sh if it predates the seeded bridge port') })())
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

/**
 * Settings authorship is split across two write-scoped endpoints: `providers`/`models`
 * are superadmin-owned, the rest is org-admin-owned. Posting the whole body to the
 * superadmin route 400s on additionalProperties — which is exactly how every case
 * silently died when this fixture still predated the split. Pure, so a unit test can
 * hold the split without any network I/O.
 */
export function splitSettingsBody (body: Record<string, any>): { superadminBody: Record<string, any>, orgBody: Record<string, any> } {
  const superadminBody: Record<string, any> = {}
  const orgBody: Record<string, any> = {}
  for (const [key, value] of Object.entries(body)) {
    (ORG_OWNED_KEYS.includes(key) ? orgBody : superadminBody)[key] = value
  }
  return { superadminBody, orgBody }
}

export async function seedSettings (assistantModelId: string, toolsModelId: string, owner: { type: string, id: string } = OWNER) {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  const { superadminBody, orgBody } = splitSettingsBody(bridgeSettings(assistantModelId, toolsModelId))
  // Owner-parameterised because a case may drive a surface that belongs to a DIFFERENT account than
  // the default one. Seeding only OWNER while driving another account is silent and total: that
  // account keeps whatever mapping it had — for organization/dev1 the dev fixtures' mock model — so
  // assertBridgeUp() still passes, the run is recorded valid, and the judge grades the mock's
  // "what do you mean ?" as if it were the product.
  await admin.put(`/api/settings/${owner.type}/${owner.id}`, superadminBody)
  await admin.put(`/api/settings/${owner.type}/${owner.id}/org`, orgBody)
}

/**
 * The account and autonomous agent a thread-page route addresses, e.g.
 * `/agents/organization/test1/autonomous-agents/test-fixture`.
 *
 * Parsed from the route rather than restated as extra case fields, so the account whose settings get
 * seeded and the page actually opened cannot disagree.
 */
export function parseAutonomousAgentRoute (route: string) {
  const match = route.match(/^\/agents\/(user|organization)\/([^/]+)\/autonomous-agents\/([^/?#]+)/)
  if (!match) throw new Error(`an autonomous-agent case's route must look like /agents/organization/<id>/autonomous-agents/<agentId>, got ${route}`)
  return { owner: { type: match[1], id: match[2] }, autonomousAgentId: match[3] }
}

/**
 * Create the autonomous agent a case drives, enrolled with the fixture NHI and granting `instructor`.
 *
 * The sim seeds its own rather than relying on `npm run dev-fixtures`: that would be an unstated
 * prerequisite, it would point the run at organization/dev1 whose settings are deliberately the mock
 * model, and seeding the bridge over them would break the fixtures a human reviews by hand.
 *
 * The NHI's subject is pinned to `autonomous-agent:<agentId>`, so the agent id is not free — it must
 * be the one the fixture identity names (dev-fixtures.unit.spec.ts pins that pairing).
 */
export async function seedAutonomousAgent (route: string, instructorUserId: string) {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  const { owner, autonomousAgentId } = parseAutonomousAgentRoute(route)
  const siteUrl = `http://localhost:${process.env.NGINX_PORT}`
  await admin.post('/api/test-env/autonomous-agent', {
    id: autonomousAgentId,
    owner,
    clientId: 'test-autonomous-agent-nhi',
    siteUrl,
    issuer: `${siteUrl}/agents/api/nhi`,
    autonomousAgent: {
      title: 'Simulated autonomous agent',
      persona: 'You are a helpful data assistant. You answer briefly and you say plainly when you cannot do something.',
      instructions: 'Prefer calling a tool over guessing. If a tool fails or you have no tool for what is asked, say so rather than inventing a result.',
      // The long-running review server (npm run dev-mcp), not the per-spec fixture: a simulation is
      // not a spec and nothing would be listening on the fixture's port.
      mcpServers: [{ serverId: 'dev-review-session-mcp' }],
      // A listed instructor, so the case can be driven by someone who is NOT an org admin — which is
      // also the only kind of user the login fixture can address here (it derives <id>@test.com).
      instructors: [{ userId: instructorUserId, userName: instructorUserId }],
      enabled: true
    }
  })
  return { owner, autonomousAgentId }
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

/**
 * The tool calls the SERVER recorded for this agent's conversations.
 *
 * An autonomous agent's model calls never touch the browser, so `captureGateway` — which hooks
 * `page.on('request')` — records nothing for this surface: `modelRequests: 0` and an empty tool-call
 * list are structural, not a finding about the product. Read the stored messages instead, which carry
 * `toolName`/`arguments`/`failed` exactly so a run is auditable after the fact.
 *
 * Without this the judge can only take the assistant's prose for which tools it called — the
 * unverifiable claim the harness exists to check.
 */
export async function readAutonomousAgentToolCalls (route: string) {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  const { owner, autonomousAgentId } = parseAutonomousAgentRoute(route)
  const base = `/api/autonomous-agent-conversations/${owner.type}/${owner.id}`
  const conversations = (await admin.get(`${base}?autonomousAgentId=${autonomousAgentId}`)).data.results as any[]
  const calls: Array<{ toolName: string, arguments?: string, serverId?: string, failed?: boolean, error?: string }> = []
  for (const conversation of conversations) {
    const messages = (await admin.get(`${base}/${conversation.id}/messages`)).data.results as any[]
    // Read from the ordered PARTS, joining each call to its result. The failure now lives on the
    // result — the model was handed the error as the tool's answer — so a reader that only looked at
    // calls would report every call as successful. An earlier version of this read `message.toolCalls`,
    // which the storage model replaced, and silently reported zero tool calls for a run that made
    // several: the evidence looked like a finding about the agent when it was a bug here.
    for (const message of messages) {
      const parts = (message.parts ?? []) as any[]
      const resultFor = new Map<string, any>()
      for (const part of parts) {
        if (part.type === 'tool-result' && part.toolCallId) resultFor.set(part.toolCallId, part)
      }
      for (const part of parts) {
        if (part.type !== 'tool-call') continue
        const result = part.toolCallId ? resultFor.get(part.toolCallId) : undefined
        calls.push({
          toolName: part.toolName,
          arguments: part.arguments,
          serverId: part.serverId,
          failed: result?.failed,
          error: result?.error
        })
      }
    }
  }
  return calls
}
