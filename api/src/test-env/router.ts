/**
 * Development-only seams the test suites reach through `/api/test-env/*`: reset, state manufacturing
 * (orphaned runs, corrupt messages, held locks), clocks passed in as data, and process profiling.
 *
 * Mounted by app.ts only when NODE_ENV is 'development', and UNAUTHENTICATED like everything under it —
 * unreachable anywhere else (the /api 404 catch-all follows). Product code does not know it exists:
 * what a test needs to observe (the task notifications pushed to the events service) is recorded here
 * by wrapping the product's own outlet, never by a dev branch in the product.
 */

import { Router } from 'express'
import { nanoid } from 'nanoid'
import locks from '@data-fair/lib-node/locks.js'
import eventsQueue from '@data-fair/lib-node/events-queue.js'
import { httpError, reqSessionAuthenticated, type AccountKeys } from '@data-fair/lib-express/index.js'
import mongo from '#mongo'
import { getModelsForOwner } from '../models/router.ts'
import { clearToolListings } from '../mcp-servers/client.ts'
import { clearProfileVocabularies } from '../mcp-servers/profiles.ts'
import { invalidateSettings } from '../settings/service.ts'
import { executeMemoryCommand } from '../memory/service.ts'
import { agentStoreId, MemoryCommandError, MemoryConflictError, type MemoryAuthor } from '../memory/operations.ts'
import { maybeConsolidate, sweepConsolidations } from '../memory/consolidation.ts'
import { runSchedulerPass } from '../tasks/scheduler.ts'
import { recoverOwnerlessRuns } from '../conversations/executor.ts'
import { recoverOwnerlessTaskRuns } from '../tasks/execution.ts'
import { purgeExpiredArchives, requireConversation, assertOwnsConversation } from '../conversations/service.ts'
import { forgetAccountSites } from '../nhi/service.ts'
import { listScopeFiles, signScopeFileUrl, sweepFiles, removeTestOwnersFiles } from '../files/service.ts'
import { isValidScope } from '../files/operations.ts'
import { liveAgentSessions } from '../agent-session/service.ts'

/**
 * The events pushed, newest last, capped. It lets the tests see a notification without the events
 * service's own API — its subscriptions and its storage are not what is tested here. Recorded by
 * wrapping the queue's `pushEvent`, which tasks/notifications.ts calls.
 */
const PUSHED_EVENTS_CAP = 200
const pushedEvents: unknown[] = []

const recordPushedEvents = () => {
  const pushEvent = eventsQueue.pushEvent.bind(eventsQueue)
  eventsQueue.pushEvent = (event: Parameters<typeof pushEvent>[0]) => {
    // A copy: the queue stamps the event's date onto the object it is given.
    pushedEvents.push({ ...event })
    if (pushedEvents.length > PUSHED_EVENTS_CAP) pushedEvents.splice(0, pushedEvents.length - PUSHED_EVENTS_CAP)
    return pushEvent(event)
  }
}

export const createTestEnvRouter = () => {
  recordPushedEvents()
  const router = Router()

  /**
   * A thread's stored messages, for the person it belongs to.
   *
   * No product surface reads a transcript over HTTP: the chat gets it from the socket's history on
   * attach, and review has its own route. Authorized with the same checks as that attach — the
   * thread exists on this account and is not archived, and it is the caller's — so a spec asserting a
   * refusal here asserts the product's.
   */
  router.get('/conversations/:type/:id/:conversationId/messages', async (req, res, next) => {
    try {
      const session = reqSessionAuthenticated(req)
      const conversation = await requireConversation({ type: req.params.type, id: req.params.id } as AccountKeys, req.params.conversationId)
      assertOwnsConversation(conversation, session)
      const results = await mongo.messages.find({ conversationId: conversation.id }, { projection: { _id: 0 } }).sort({ seq: 1 }).toArray()
      res.json({ results, count: results.length })
    } catch (err) { next(err) }
  })

  router.delete('/', async (req, res) => {
    getModelsForOwner.clear()
    clearToolListings()
    clearProfileVocabularies()
    invalidateSettings()
    await mongo.db.collection('settings').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('usage').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('moderation-events').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('moderation-strikes').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('limits').deleteMany({ id: /^test/ })
    // The NHI session cache is in-process and keyed by AGENT ID alone, so deleting the documents is
    // not enough: a later spec re-creating the same id would be served the cookie obtained for the
    // previous one, silently skipping the exchange it means to test.
    for (const agent of await mongo.db.collection('autonomous-agents').find({ 'owner.id': /^test/ }, { projection: { id: 1 } }).toArray()) {
      forgetAccountSites(agent.id as string)
    }
    await mongo.db.collection('autonomous-agent-tasks').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('autonomous-agents').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('conversations').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('messages').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('runs').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('agent-memories').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('agent-memory-versions').deleteMany({ 'owner.id': /^test/ })
    await removeTestOwnersFiles()
    res.send()
  })
  // Dev-only: a scope's files as the product lists them, so a spec can see deletion and the sweep act.
  router.get('/files/:ownerType/:ownerId/:scopeId', async (req, res) => {
    const scope = { ownerType: req.params.ownerType, ownerId: req.params.ownerId, scopeId: req.params.scopeId }
    if (!isValidScope(scope)) throw httpError(400, 'invalid scope')
    res.json({ results: await listScopeFiles(scope) })
  })
  // Dev-only: sign a file URL as if it were `now` (a clock passed in as data), so a spec can hold an expired one.
  router.post('/sign-file-url', async (req, res) => {
    const { scope, name, now } = req.body ?? {}
    if (!scope || !isValidScope(scope) || typeof name !== 'string') throw httpError(400, 'scope and name are required')
    res.json({ url: signScopeFileUrl(scope, name, new Date(now ?? Date.now())) })
  })
  // Dev-only: run the file sweep as if it were `now`, under a prefix.
  router.post('/sweep-files', async (req, res) => {
    res.json({ removed: await sweepFiles(new Date(req.body?.now ?? Date.now()), req.body?.prefix) })
  })
  // Dev-only: run one `memory` tool command as an agent, without a model turn to issue it.
  router.post('/memory-command/:agentId', async (req, res, next) => {
    try {
      const agent = await mongo.autonomousAgents.findOne({ id: req.params.agentId }, { projection: { _id: 0 } })
      if (!agent) throw httpError(404, 'unknown autonomous agent')
      const author: MemoryAuthor = { kind: 'agent', agentId: agent.id }
      res.json({ result: await executeMemoryCommand(agentStoreId(agent.id), agent.owner, req.body.input, author, { allowDelete: true }) })
    } catch (err) { next(err instanceof MemoryConflictError ? httpError(409, err.message) : err instanceof MemoryCommandError ? httpError(400, err.message) : err) }
  })
  /**
   * Create an autonomous agent with a CHOSEN id, and a real enrolment.
   *
   * The id matters: simple-directory pins an NHI's `subject`, and ours is strictly derived as
   * `autonomous-agent:<id>`, so a fixture NHI can only ever be matched by an agent whose id the
   * caller picked. Making the id choosable in dev keeps that derivation — and therefore one NHI per
   * agent — intact in production, where the alternative (an overridable subject) would have let two
   * agents share one identity.
   *
   * Also sets `nhi` directly, which the real write route cannot do from a test client: it rebuilds
   * that field from the request and needs an x-forwarded-host the direct clients do not send.
   *
   * Pass the FIXTURE client id (see dev/resources/users.template.json) for a real exchange.
   *
   * UNAUTHENTICATED, like every seam in this block, and unreachable outside development (the
   * NODE_ENV guard above, with the /api 404 catch-all after it). Worth stating plainly because this
   * one is a step up from the others: it binds a REAL non-human identity, so any local caller that can
   * reach this port can bind an existing NHI to an agent they then instruct, and so borrow that
   * identity's simple-directory session. The placeholder seam below only ever writes a fake. That is
   * acceptable for a dev stack whose simple-directory holds only fixture identities; it would not be
   * if this block ever ran anywhere else.
   */
  router.post('/autonomous-agent', async (req, res) => {
    const now = new Date().toISOString()
    const doc = {
      title: 'Fixture autonomous agent',
      persona: 'You answer briefly.',
      mcpServers: [],
      enabled: true,
      ...req.body.autonomousAgent,
      id: req.body.id,
      owner: req.body.owner,
      nhi: { clientId: req.body.clientId, siteUrl: req.body.siteUrl, issuer: req.body.issuer },
      createdAt: now,
      updatedAt: now
    }
    await mongo.autonomousAgents.replaceOne({ id: doc.id }, doc, { upsert: true })
    // This can change nhi.clientId/siteUrl/issuer for an id another spec already exchanged for, and
    // the cache keyed on the id alone would then serve that stale cookie for ~240s — so the test
    // whose whole point is to perform a real exchange would silently not perform one, and would keep
    // passing with the issuer or the audience broken. Same reason assertEnrolmentWorks clears first.
    forgetAccountSites(doc.id)
    res.json(doc)
  })
  /**
   * Attach a PLACEHOLDER enrolment to an existing autonomous agent.
   *
   * Enrolment cannot be completed in the dev stack (simple-directory's FileStorage cannot create the
   * NHI), and the write routes call assertEnrolmentWorks, so they reject any nhi a test sets.
   *
   * Deliberately not a real one: it unblocks the executor's "no enrolled identity" refusal so a test
   * can exercise everything downstream, and that is all. It proves nothing about the token exchange,
   * and it only suffices because the MCP servers those tests use are `auth: 'none'` and need no
   * session. A test that needs a REAL identity uses POST /autonomous-agent above with a
   * fixture client id.
   */
  router.post('/enrol-autonomous-agent', async (req, res) => {
    await mongo.autonomousAgents.updateOne(
      { id: req.body.agentId },
      { $set: { nhi: { clientId: req.body.clientId ?? 'dev-fixture-nhi', siteUrl: req.body.siteUrl ?? 'http://localhost/agents', issuer: req.body.issuer ?? 'http://localhost/agents/api/nhi' } } }
    )
    res.send()
  })
  // Make the per-conversation serialisation testable deterministically: with an in-process executor the
  // first of two back-to-back messages often finishes before the second lands, so without a held lock
  // the contended path never runs.
  router.post('/lock-conversation', async (req, res) => {
    res.json({ acquired: await locks.acquire(`conversation:${req.body.conversationId}`, 'test') })
  })
  router.post('/unlock-conversation', async (req, res) => {
    await locks.release(`conversation:${req.body.conversationId}`)
    res.send()
  })
  router.post('/task-run', async (req, res) => {
    const { agentId, taskId, status, ...rest } = req.body
    const run = {
      id: nanoid(),
      kind: 'task' as const,
      agentId,
      taskId,
      owner: { type: 'organization' as const, id: 'test1' },
      trigger: 'manual' as const,
      status,
      startedAt: new Date().toISOString(),
      ...rest
    }
    await mongo.runs.insertOne({ ...run })
    res.json(run)
  })
  // A stop as another API process records it: ONLY the field, never this process's controller, so a
  // test proves the turn's own poll is what stops it.
  router.post('/request-abort', async (req, res) => {
    await mongo.runs.updateOne({ id: req.body.runId }, { $set: { abortRequestedAt: new Date().toISOString() } })
    res.send()
  })
  router.post('/lock-task', async (req, res) => {
    res.json({ acquired: await locks.acquire(`task:${req.body.taskId}`, 'test') })
  })
  router.post('/unlock-task', async (req, res) => {
    await locks.release(`task:${req.body.taskId}`)
    res.send()
  })
  // The notifications pushed by planned tasks (see tasks/notifications.ts): a test reads what was
  // notified here rather than through the events service's own API.
  router.get('/pushed-events', (req, res) => {
    res.json(pushedEvents)
  })
  router.delete('/pushed-events', (req, res) => {
    pushedEvents.length = 0
    res.send()
  })
  // Manufactures the state a dead process leaves behind: a restart is not reproducible from a test.
  router.post('/orphan-run', async (req, res) => {
    await mongo.runs.updateOne(
      { id: req.body.runId },
      { $set: { status: 'running' }, $unset: { endedAt: '', stopReason: '' } }
    )
    if (req.body.dropMessage) {
      // Reproduces the narrower orphan: a process that died between createRun and
      // appendMessage, so the run has no message at all and the sweep must write one. That is
      // half of the "a run always leaves exactly one assistant message" invariant.
      await mongo.messages.deleteMany({ runId: req.body.runId })
    } else if (req.body.messageClosed) {
      // Reproduces the state a run is seen in when it FINISHED between recovery's candidate read and
      // its lock read (or its holder died after closing the message): the message is already final.
    } else {
      await mongo.messages.updateMany({ runId: req.body.runId }, { $set: { pending: true } })
    }
    if (req.body.reopenApproved) {
      // Reproduces an APPROVAL run that died after the decision and before its approved call reported:
      // the conversation's approved calls are put back to `approval-responded`, with no result.
      const run = await mongo.runs.findOne({ id: req.body.runId }, { projection: { _id: 0, conversationId: 1 } })
      const messages = await mongo.messages.find({ conversationId: run?.conversationId, 'parts.approval.approved': true }).toArray()
      for (const message of messages) {
        const parts = (message.parts as any[]).map(part => {
          if (part?.type !== 'dynamic-tool' || part.approval?.approved !== true) return part
          const { output, errorText, ...rest } = part
          return { ...rest, state: 'approval-responded' }
        })
        await mongo.messages.updateOne({ conversationId: message.conversationId, seq: message.seq }, { $set: { parts } })
      }
    }
    res.send()
  })
  /**
   * Corrupt a stored message's parts, to exercise the read-side validation.
   *
   * Only reachable through a deliberate write: the schema's `parts` is loose on purpose, so nothing on
   * the write path would produce this. That is exactly why the check exists, and why it needs a seam to
   * be tested at all.
   */
  router.post('/corrupt-message', async (req, res) => {
    await mongo.messages.updateOne(
      { conversationId: req.body.conversationId, seq: req.body.seq },
      { $set: { parts: req.body.parts } }
    )
    res.send()
  })
  /**
   * What one autonomous agent still has in the store.
   *
   * A seam because the cascade's whole point is that nothing resolves through a DELETED agent any more:
   * asserting on a route would only prove it 404s, which it would whether the data was erased or merely
   * orphaned — the state this exists to rule out.
   */
  router.get('/autonomous-agent-data/:agentId', async (req, res) => {
    const conversations = await mongo.conversations
      .find({ agentId: req.params.agentId }, { projection: { _id: 0, id: 1 } })
      .toArray()
    const conversationIds = conversations.map(conversation => conversation.id)
    res.json({
      conversations: conversations.length,
      messages: await mongo.messages.countDocuments({ conversationId: { $in: conversationIds } }),
      runs: await mongo.runs.countDocuments({ agentId: req.params.agentId }),
      memories: await mongo.agentMemories.countDocuments({ storeId: `agent:${req.params.agentId}` }),
      memoryVersions: await mongo.agentMemoryVersions.countDocuments({ storeId: `agent:${req.params.agentId}` })
    })
  })
  /**
   * Make the server ask the connected browser to run a contextual tool.
   *
   * Exercises the server-to-browser direction over a real socket ON DEMAND: in the product only the
   * model loop asks, and a test of the socket should not depend on a model choosing to call a tool.
   *
   * Answers 200 either way, with the outcome in the body, so a test can assert on a rejection's
   * message without axios turning it into a throw.
   */
  router.post('/agent-session-call', async (req, res) => {
    // durationMs is the SERVER-SIDE WAIT — the quantity the design's latency question is about — timed
    // around the call itself so this endpoint's own HTTP overhead is not counted into it.
    const startedAt = performance.now()
    try {
      // The ONLY live session, deliberately crude: addressing a session properly means binding it to a
      // conversation. Insisting on exactly one makes the ambiguity an error rather than a coin flip — a
      // test that opened two sockets and asserted on "the" session would pass or fail by iteration order.
      const sessions = liveAgentSessions()
      if (sessions.length !== 1) throw new Error(`expected exactly one live agent session, found ${sessions.length}`)
      const result = await sessions[0].callBrowserTool(req.body.name, req.body.input)
      res.json({ ok: true, result, durationMs: performance.now() - startedAt })
    } catch (err: any) {
      res.json({ ok: false, error: err.message, durationMs: performance.now() - startedAt })
    }
  })
  // The sweep seams act on `test*` owners unless a test names another filter, so a run never touches
  // (or bills, with the dev bridge) the real dev accounts' data — the same rule as clean().
  const testOwnerScope = (owner: unknown): Record<string, unknown> =>
    owner && typeof owner === 'object' ? { 'owner.id': (owner as any).id } : { 'owner.id': /^test/ }
  // Dev-only: one agent's pass, or the sweep, as of a chosen time — due by the sweep's own rule either way.
  router.post('/consolidate-memory', async (req, res) => {
    res.json(await maybeConsolidate(String(req.body.agentId), req.body.now ? new Date(req.body.now) : undefined))
  })
  // Dev-only, for simulations of runs a week apart: moves an agent's history back by `days` — its runs,
  // its memory and the consolidation state — and today's date written in them (a run's outcome, memory
  // text) along with it, so the next run starts as if that time had passed. Web pages and other outside
  // content do not move.
  router.post('/age-agent-history', async (req, res) => {
    const agentId = String(req.body.agentId)
    const ms = Number(req.body.days ?? 7) * 86400000
    const shift = <T>(iso: T): T => (typeof iso === 'string' && !Number.isNaN(Date.parse(iso)) ? new Date(Date.parse(iso) - ms).toISOString() : iso) as T
    const today = new Date().toISOString().slice(0, 10)
    const then = new Date(Date.now() - ms).toISOString().slice(0, 10)
    const redate = <T>(text: T): T => (typeof text === 'string' ? text.split(today).join(then) : text) as T
    for (const run of await mongo.runs.find({ agentId }).toArray()) {
      const set: Record<string, unknown> = {}
      for (const key of ['startedAt', 'endedAt', 'scheduledFor'] as const) if ((run as any)[key]) set[key] = shift((run as any)[key])
      if (run.outcome) set['outcome.summary'] = redate(run.outcome.summary)
      if (run.parts) set.parts = JSON.parse(redate(JSON.stringify(run.parts)) as string)
      await mongo.runs.updateOne({ _id: run._id }, { $set: set })
    }
    const storeId = agentStoreId(agentId)
    for (const doc of await mongo.agentMemories.find({ storeId }).toArray()) {
      await mongo.agentMemories.updateOne({ _id: doc._id }, { $set: { createdAt: shift(doc.createdAt), updatedAt: shift(doc.updatedAt), content: redate(doc.content), description: redate(doc.description) } })
    }
    for (const version of await mongo.agentMemoryVersions.find({ storeId }).toArray()) {
      await mongo.agentMemoryVersions.updateOne({ _id: version._id }, { $set: { createdAt: shift(version.createdAt), ...(version.content !== undefined ? { content: redate(version.content) } : {}) } })
    }
    const agent = await mongo.autonomousAgents.findOne({ id: agentId })
    if (agent?.memoryConsolidation) {
      const state = agent.memoryConsolidation
      await mongo.autonomousAgents.updateOne({ id: agentId }, { $set: { memoryConsolidation: { ...state, ...(state.at ? { at: shift(state.at) } : {}), ...(state.until ? { until: shift(state.until) } : {}) } } })
    }
    res.json({ ok: true })
  })
  router.post('/sweep-consolidations', async (req, res) => {
    res.json({ consolidated: await sweepConsolidations(req.body?.now ? new Date(req.body.now) : undefined, testOwnerScope(req.body?.owner)) })
  })
  // Dev-only: one scheduler pass as of a chosen time, and a task's next slot set directly.
  router.post('/scheduler-pass', async (req, res) => {
    res.json(await runSchedulerPass(req.body?.now ? new Date(req.body.now) : new Date(), testOwnerScope(req.body?.owner)))
  })
  router.post('/task-next-run', async (req, res) => {
    await mongo.autonomousAgentTasks.updateOne({ id: req.body.taskId }, { $set: { nextRunAt: req.body.nextRunAt, ...(req.body.scheduling ? { scheduling: req.body.scheduling } : {}) } })
    res.send()
  })
  // Dev-only: a pending trigger stored directly, with the slot a trigger would set.
  router.post('/task-pending-trigger', async (req, res) => {
    await mongo.autonomousAgentTasks.updateOne({ id: req.body.taskId }, {
      $set: { nextRunAt: req.body.nextRunAt, pendingTriggers: [{ receivedAt: new Date().toISOString(), payload: req.body.payload ?? 'seeded' }] }
    })
    res.send()
  })
  router.post('/pause-task', async (req, res) => {
    await mongo.autonomousAgentTasks.updateOne({ id: req.body.taskId }, { $set: { pausedReason: 'paused by a test' }, $unset: { nextRunAt: '' } })
    res.send()
  })
  router.post('/recover-ownerless-runs', async (req, res) => {
    const conversations = await recoverOwnerlessRuns()
    const tasks = await recoverOwnerlessTaskRuns()
    res.json({ ...conversations, interrupted: conversations.interrupted + tasks.interrupted, skipped: conversations.skipped + tasks.skipped })
  })
  // Dev-only: run the archive sweep as if it were `now`, so a test can prove what it keeps.
  router.post('/purge-expired-archives', async (req, res) => {
    res.json({ purged: await purgeExpiredArchives(typeof req.body?.now === 'string' ? new Date(req.body.now) : new Date(), testOwnerScope(req.body?.owner)) })
  })
  router.post('/usage', async (req, res) => {
    const { owner, cost, userId, userName, period: explicitPeriod, breakdown } = req.body
    const now = new Date()
    // Account-level records are the ones without a userId; the filter must say so
    // explicitly, otherwise the upsert matches (and overwrites) a per-user record.
    const userIdField = userId !== undefined ? { userId } : { userId: { $exists: false } }
    const userNameField = userName !== undefined ? { userName } : {}
    const breakdownField = breakdown !== undefined ? { breakdown } : {}
    const doc = { owner, ...(userId !== undefined ? { userId } : {}), ...userNameField, cost, ...breakdownField, updatedAt: now.toISOString() }

    const isoWeek = (d: Date) => {
      const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      const dayNum = t.getUTCDay() || 7
      t.setUTCDate(t.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
      const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
      return `weekly:${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
    }

    if (explicitPeriod) {
      const filter = { 'owner.type': owner.type, 'owner.id': owner.id, ...userIdField, period: explicitPeriod }
      await mongo.db.collection('usage').updateOne(filter, { $set: { ...doc, period: explicitPeriod } }, { upsert: true })
    } else {
      const dailyPeriod = `daily:${now.toISOString().slice(0, 10)}`
      const weeklyPeriod = isoWeek(now)
      const monthlyPeriod = `monthly:${now.toISOString().slice(0, 7)}`
      const filter = { 'owner.type': owner.type, 'owner.id': owner.id, ...userIdField }
      await Promise.all([
        mongo.db.collection('usage').updateOne({ ...filter, period: dailyPeriod }, { $set: { ...doc, period: dailyPeriod } }, { upsert: true }),
        mongo.db.collection('usage').updateOne({ ...filter, period: weeklyPeriod }, { $set: { ...doc, period: weeklyPeriod } }, { upsert: true }),
        mongo.db.collection('usage').updateOne({ ...filter, period: monthlyPeriod }, { $set: { ...doc, period: monthlyPeriod } }, { upsert: true })
      ])
    }
    res.send()
  })
  /**
   * A CPU profile of THIS process, taken while something else loads it (`npm run dev-load-check`).
   *
   * A seam rather than `node --cpu-prof` because dev-api is the user's process to start, and a
   * profile of a second instance would not be the one serving the load. The result is a standard
   * .cpuprofile (open it in Chrome DevTools, or summarise it with dev/load-check.ts --profile).
   */
  router.post('/cpu-profile', async (req, res) => {
    const { Session } = await import('node:inspector/promises')
    const session = new Session()
    session.connect()
    try {
      await session.post('Profiler.enable')
      await session.post('Profiler.setSamplingInterval', { interval: 500 })
      await session.post('Profiler.start')
      await new Promise(resolve => setTimeout(resolve, Math.min(Number(req.query.ms) || 5000, 60_000)))
      const { profile } = await session.post('Profiler.stop')
      res.json(profile)
    } finally {
      session.disconnect()
    }
  })
  router.get('/heap', async (req, res) => {
    const v8 = await import('node:v8')
    if (req.query.gc !== undefined) {
      // A full collection first, so the numbers are what is RETAINED rather than what is merely
      // not yet collected.
      v8.setFlagsFromString('--expose-gc')
      const { runInNewContext } = await import('node:vm')
      runInNewContext('gc')()
    }
    res.json({ ...process.memoryUsage(), heap: v8.getHeapStatistics() })
  })

  return router
}
