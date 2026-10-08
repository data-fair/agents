/**
 * Point an owner's settings at the Claude Code bridge, so the assistant under
 * test runs on a real model.
 */

import type { ConversationExport } from '@data-fair/lib-agents-sim'

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
 * reads as working until a real deployment runs it on the cheap tier.
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
    ? [priced(assistantModelId, ['assistant', 'tools', 'summarizer', 'moderator'])]
    : [
        priced(assistantModelId, ['assistant']),
        priced(toolsModelId, ['tools', 'summarizer', 'moderator'])
      ]
  const ref = (id: string) => ({ provider: 'bridge', id, name: id })
  // Mapped explicitly: the dev/test global config also ships a mock model as the
  // default for every role, so an unmapped role would silently run on the mock
  // instead of the bridge and the case would prove nothing.
  const modelMapping = {
    assistant: ref(assistantModelId),
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
    // ON, so the run can be read back through the conversation export (fetchConversationExports): the
    // review gate is what that route sits behind, and a simulation is judged on the same file a real
    // session is debugged with.
    storeTraces: true
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
 * The account and autonomous agent a chat route addresses, e.g.
 * `/agents/organization/test1/chat?agentId=test-fixture`.
 *
 * Parsed from the route rather than restated as extra case fields, so the account whose settings get
 * seeded and the page actually opened cannot disagree. It points at the chat page the autonomous
 * agent's thread was merged into; the standalone thread page no longer exists.
 */
export function parseAutonomousAgentRoute (route: string) {
  const url = new URL(route, 'http://localhost')
  const match = url.pathname.match(/^\/agents\/(user|organization)\/([^/]+)\/chat\/?$/)
  const agentId = url.searchParams.get('agentId')
  if (!match || !agentId) throw new Error(`an autonomous-agent case's route must look like /agents/organization/<id>/chat?agentId=<agentId>, got ${route}`)
  return { owner: { type: match[1], id: match[2] }, agentId }
}

/** What a case may set about the autonomous agent it drives; anything it leaves out is the default's. */
export interface SimulatedAgentConfig {
  title?: string
  persona?: string
  instructions?: string
  /** Catalog entries from `api/config/development.js`, each optionally narrowed by a toolFilter. */
  mcpServers?: Array<{ serverId: string, toolFilter?: string[] }>
  /** Whether the agent keeps a memory across conversations (off unless a case turns it on). */
  memory?: { enabled: boolean }
}

/** The agent a case gets when it configures nothing. */
export const DEFAULT_SIMULATED_AGENT: Required<SimulatedAgentConfig> = {
  title: 'Simulated autonomous agent',
  persona: 'You are a helpful data assistant. You answer briefly and you say plainly when you cannot do something.',
  instructions: 'Prefer calling a tool over guessing. If a tool fails or you have no tool for what is asked, say so rather than inventing a result.',
  // The long-running review server (npm run dev-mcp), not the per-spec fixture: a simulation is
  // not a spec and nothing would be listening on the fixture's port.
  mcpServers: [{ serverId: 'dev-review-session-mcp' }],
  // Off, as the product's own default: a case not about memory must not have its later conversations
  // shaped by what an earlier one wrote.
  memory: { enabled: false }
}

/**
 * Create the autonomous agent a case drives, enrolled with the fixture NHI and granting `instructor`.
 *
 * Configured per case: what an agent is given — its persona, its instructions, which servers and tools —
 * is what shapes its behaviour, so it is what a case should be able to vary. Each field the case sets
 * replaces the default's; the identity, the instructor grant and `enabled` are the runner's.
 *
 * The sim seeds its own rather than relying on `npm run dev-fixtures`: that would be an unstated
 * prerequisite, it would point the run at organization/dev1 whose settings are deliberately the mock
 * model, and seeding the bridge over them would break the fixtures a human reviews by hand.
 *
 * The NHI's subject is pinned to `autonomous-agent:<agentId>`, so the agent id is not free — it must
 * be the one the fixture identity names (dev-fixtures.unit.spec.ts pins that pairing).
 */
export async function seedAutonomousAgent (route: string, instructorUserId: string, agent: SimulatedAgentConfig = {}) {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  const { owner, agentId } = parseAutonomousAgentRoute(route)
  const siteUrl = `http://localhost:${process.env.NGINX_PORT}`
  await admin.post('/api/test-env/autonomous-agent', {
    id: agentId,
    owner,
    clientId: 'test-autonomous-agent-nhi',
    siteUrl,
    issuer: `${siteUrl}/agents/api/nhi`,
    autonomousAgent: {
      ...DEFAULT_SIMULATED_AGENT,
      ...agent,
      // A listed instructor, so the case can be driven by someone who is NOT an org admin — which is
      // also the only kind of user the login fixture can address here (it derives <id>@test.com).
      instructors: [{ mode: 'member', type: 'user', id: instructorUserId }],
      enabled: true
    }
  })
  return { owner, agentId }
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
 * The conversation exports of everything `userId` said on `owner` during the run.
 *
 * The SAME file a maintainer downloads to debug a real session, through the same route and the same
 * gates: the account must store traces (`bridgeSettings` turns it on) and the person must have
 * consented (the runner sets the consent cookie before the page loads). Every chat surface runs its
 * loop on the server, so this is the only record of what the model was sent and what it called — a
 * capture of the browser's requests sees nothing.
 *
 * `clean()` ran before the case, so every reviewable thread of this person on this account is this
 * run's.
 */
export async function fetchConversationExports (owner: { type: string, id: string }, userId: string): Promise<ConversationExport[]> {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  const base = `/api/review/${owner.type}/${owner.id}`
  const listed = (await admin.get(`${base}?size=200`)).data.results as Array<{ conversationId: string, userId?: string, agentId?: string, startedAt?: string }>
  const exports: ConversationExport[] = []
  // OLDEST FIRST, whatever order review lists them in (latest activity first): a case with several
  // conversations has a premise about which came first — memory written in the first one, read in the
  // next — and that must not hang on a listing order chosen for an admin's screen.
  const mine = listed.filter(c => c.userId === userId).sort((a, b) => (a.startedAt ?? '').localeCompare(b.startedAt ?? ''))
  for (const conversation of mine) {
    // responseType text: the body is JSONL, and axios would otherwise try to parse it as one JSON value.
    const res = await admin.get(`${base}/${conversation.conversationId}/export`, { responseType: 'text', transformResponse: [(data: string) => data] })
    exports.push({ conversationId: conversation.conversationId, agentId: conversation.agentId, jsonl: res.data })
  }
  return exports
}

/** What an unattended case plans: a task as an admin would write it (the task-write-req body). */
export interface SimulatedTask {
  title: string
  prompt: string
  /** data-fair processings' rule array; a rule here must respect the deployment's minimum interval. */
  scheduling: Array<Record<string, unknown>>
}

/** Long enough for a slow multi-step turn; a task run has its own deadline well under this. */
export const TASK_RUN_TIMEOUT_MS = 10 * 60 * 1000

/**
 * Plan the task on the agent a route names, press "run now", and wait for the run to end.
 *
 * Through the product's own routes, as an admin presses the button: the run is the same one a
 * scheduled slot starts (trigger `manual`), so nothing about its content depends on how it was
 * started. Not through the scheduler: in development its poll leaves `test*` accounts alone, and an
 * injected-clock pass would add a seam to a case whose subject is the run, not the schedule.
 *
 * Returns the run as it ended. A `skipped` start (the account's credit cap) is refused by the route
 * with a 409, so it surfaces here as a thrown error and the case is recorded invalid.
 */
export async function runPlannedTask (route: string, task: SimulatedTask, timeoutMs = TASK_RUN_TIMEOUT_MS) {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  const { owner, agentId } = parseAutonomousAgentRoute(route)
  const base = `/api/autonomous-agents/${owner.type}/${owner.id}/${agentId}`
  const created = (await admin.post(`${base}/tasks`, task)).data as { id: string }
  const runId = (await admin.post(`${base}/tasks/${created.id}/run`)).data.runId as string
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const run = (await admin.get(`${base}/runs/${runId}`)).data as { id: string, status: string, error?: string }
    if (run.status !== 'running') return { owner, agentId, taskId: created.id, run }
    if (Date.now() > deadline) throw new Error(`task run ${runId} was still running after ${Math.round(timeoutMs / 1000)}s`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

/**
 * A task run's export: the SAME file format as a conversation's (meta, outline, the prompt and the
 * answer as two messages, the run with its calls), from the route an admin downloads it with. So the
 * judge reads an unattended run exactly as it reads a chat, and the premise and the metrics parse it
 * with the same code. `conversationId` is the run's id: the evidence file is named after it.
 */
export async function fetchTaskRunExport (owner: { type: string, id: string }, agentId: string, runId: string): Promise<ConversationExport> {
  const { superAdmin } = await import('../../tests/support/axios.ts')
  const admin = await superAdmin
  const res = await admin.get(`/api/autonomous-agents/${owner.type}/${owner.id}/${agentId}/runs/${runId}/export`, { responseType: 'text', transformResponse: [(data: string) => data] })
  return { conversationId: runId, agentId, jsonl: res.data }
}
