import { resolve } from 'node:path'
import { session, errorHandler, createSiteMiddleware, createSpaMiddleware, httpError } from '@data-fair/lib-express/index.js'
import express from 'express'
import helmet from 'helmet'
import { uiConfig } from './ui-config.ts'
import settingsRouter from './settings/router.ts'
import adminRouter from './admin/router.ts'
import modelsRouter, { getModelsForOwner } from './models/router.ts'
import { clearToolListings } from './mcp-servers/client.ts'
import { nanoid } from 'nanoid'
import { invalidateSettings } from './settings/service.ts'
import catalogRouter from './catalog/router.ts'
import { executeMemoryCommand } from './memory/service.ts'
import { agentStoreId, MemoryCommandError, MemoryConflictError, type MemoryAuthor } from './memory/operations.ts'
import memoryRouter from './memory/router.ts'
import { maybeReflect, sweepIdleReflections } from './memory/reflection.ts'
import tasksRouter from './tasks/router.ts'
import autonomousAgentsRouter from './autonomous-agents/router.ts'
import autonomousAgentRuntimeRouter, { runsRouter } from './conversations/router.ts'
import { recoverOwnerlessRuns } from './conversations/executor.ts'
import { purgeExpiredArchives } from './conversations/service.ts'
import locks from '@data-fair/lib-node/locks.js'
import nhiRouter from './nhi/router.ts'
import { clearAutonomousAgentSession } from './nhi/service.ts'
import { callOnlyLiveAgentSession } from './agent-session/service.ts'
import summaryRouter from './summary/router.ts'
import usageRouter from './usage/router.ts'
import reviewRouter from './review/router.ts'
import moderationRouter from './moderation/router.ts'
import limitsRouter from './limits/router.ts'
import mongo from '#mongo'
import config from '#config'

export const app = express()

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      // very restrictive by default, index.html of the UI will have custom rules defined in createSpaMiddleware
      // https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#security-headers
      'frame-ancestors': ["'none'"],
      'default-src': ["'none'"]
    }
  }
}))

// no fancy embedded arrays, just string and arrays of strings in req.query
app.set('query parser', 'simple')
app.use(createSiteMiddleware('agents'))
app.use(session.middleware())

app.use(express.json({ limit: '1mb' }))

app.use('/api/admin', adminRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/models', modelsRouter)
app.use('/api/catalog', catalogRouter)
// tasks first: see tasks/router.ts
app.use('/api/autonomous-agents', tasksRouter)
app.use('/api/autonomous-agents', autonomousAgentsRouter)
app.use('/api/conversations', autonomousAgentRuntimeRouter)
app.use('/api/runs', runsRouter)
app.use('/api/nhi', nhiRouter)
app.use('/api/summary', summaryRouter)
app.use('/api/usage', usageRouter)
app.use('/api/review', reviewRouter)
app.use('/api/memory', memoryRouter)
app.use('/api/moderation', moderationRouter)
app.use('/api/v1/limits', limitsRouter)
app.use('/api/ping', (req, res) => res.send('ok'))

if (process.env.NODE_ENV === 'development') {
  app.delete('/api/test-env', async (req, res) => {
    getModelsForOwner.clear()
    clearToolListings()
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
      clearAutonomousAgentSession(agent.id as string)
    }
    await mongo.db.collection('autonomous-agent-tasks').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('autonomous-agents').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('conversations').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('messages').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('runs').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('agent-memories').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('agent-memory-versions').deleteMany({ 'owner.id': /^test/ })
    res.send()
  })
  // Dev-only: run one `memory` tool command as an agent, so the service's agent-side paths (rename,
  // retry) are reachable before the tool itself is wired into a turn.
  app.post('/api/test-env/memory-command/:agentId', async (req, res, next) => {
    try {
      const agent = await mongo.autonomousAgents.findOne({ id: req.params.agentId }, { projection: { _id: 0 } })
      if (!agent) throw httpError(404, 'unknown autonomous agent')
      const author: MemoryAuthor = { kind: 'agent', agentId: agent.id }
      res.json({ result: await executeMemoryCommand(agentStoreId(agent.id), agent.owner, req.body.input, author, { allowDelete: true }) })
    } catch (err) { next(err instanceof MemoryConflictError ? httpError(409, err.message) : err instanceof MemoryCommandError ? httpError(400, err.message) : err) }
  })
  // Dev-only seams for the boot sweep. A restart is not reproducible from a test — dev
  // processes are user-managed — so `orphan-run` manufactures the state a dead process
  // leaves behind and `sweep-interrupted-runs` invokes the same function server.ts calls
  // at boot. Without these the sweep would ship asserted only in prose.
  // Dev-only seams that make the per-conversation serialisation testable deterministically.
  // Without them the "two messages back to back" test is a race: with an in-process
  // executor the first turn often finishes before the second post lands, so the lock is
  // never contended and the pickup path never runs — a test that passes while proving
  // nothing.
  // Dev-only. Enrolment cannot be completed in the dev stack at all: simple-directory's
  // FileStorage cannot create the NHI (`Method not implemented.`), which is why two of
  // Plan B's tests are skipped. The write routes call assertEnrolmentWorks and would
  // therefore reject any nhi a test tried to set, leaving everything downstream of
  // enrolment untestable. This writes the field directly so the runtime can be exercised
  // against MCP servers that need no session (auth: 'none').
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
  app.post('/api/test-env/autonomous-agent', async (req, res) => {
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
    clearAutonomousAgentSession(doc.id)
    res.json(doc)
  })
  /**
   * Attach a PLACEHOLDER enrolment to an existing autonomous agent.
   *
   * Deliberately not a real one: it unblocks the executor's "no enrolled identity" refusal so a test
   * can exercise everything downstream, and that is all. It proves nothing about the token exchange,
   * and it only suffices because the MCP servers those tests use are `auth: 'none'` and need no
   * session. A test that needs a REAL identity uses /api/test-env/autonomous-agent above with a
   * fixture client id.
   */
  app.post('/api/test-env/enrol-autonomous-agent', async (req, res) => {
    await mongo.autonomousAgents.updateOne(
      { id: req.body.agentId },
      { $set: { nhi: { clientId: req.body.clientId ?? 'dev-fixture-nhi', siteUrl: req.body.siteUrl ?? 'http://localhost/agents', issuer: req.body.issuer ?? 'http://localhost/agents/api/nhi' } } }
    )
    res.send()
  })
  app.post('/api/test-env/lock-conversation', async (req, res) => {
    res.json({ acquired: await locks.acquire(`conversation:${req.body.conversationId}`, 'test') })
  })
  app.post('/api/test-env/unlock-conversation', async (req, res) => {
    await locks.release(`conversation:${req.body.conversationId}`)
    res.send()
  })
  app.post('/api/test-env/task-run', async (req, res) => {
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
      version: 1,
      ...rest
    }
    await mongo.runs.insertOne({ ...run })
    res.json(run)
  })
  app.post('/api/test-env/lock-task', async (req, res) => {
    res.json({ acquired: await locks.acquire(`task:${req.body.taskId}`, 'test') })
  })
  app.post('/api/test-env/unlock-task', async (req, res) => {
    await locks.release(`task:${req.body.taskId}`)
    res.send()
  })
  app.post('/api/test-env/orphan-run', async (req, res) => {
    await mongo.runs.updateOne(
      { id: req.body.runId },
      { $set: { status: 'running' }, $unset: { endedAt: '', stopReason: '' } }
    )
    if (req.body.dropMessage) {
      // Reproduces the narrower orphan: a process that died between createRun and
      // appendMessage, so the run has no message at all and the sweep must write one. That is
      // half of the "a run always leaves exactly one assistant message" invariant.
      await mongo.messages.deleteMany({ runId: req.body.runId })
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
  app.post('/api/test-env/corrupt-message', async (req, res) => {
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
  app.get('/api/test-env/autonomous-agent-data/:agentId', async (req, res) => {
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
  app.post('/api/test-env/agent-session-call', async (req, res) => {
    // durationMs is the SERVER-SIDE WAIT — the quantity the design's latency question is about — timed
    // around the call itself so this endpoint's own HTTP overhead is not counted into it.
    const startedAt = performance.now()
    try {
      const result = await callOnlyLiveAgentSession(req.body.name, req.body.input)
      res.json({ ok: true, result, durationMs: performance.now() - startedAt })
    } catch (err: any) {
      res.json({ ok: false, error: err.message, durationMs: performance.now() - startedAt })
    }
  })
  // The sweep seams act on `test*` owners unless a test names another filter, so a run never touches
  // (or bills, with the dev bridge) the real dev accounts' data — the same rule as clean().
  const testOwnerScope = (owner: unknown): Record<string, unknown> =>
    owner && typeof owner === 'object' ? { 'owner.id': (owner as any).id } : { 'owner.id': /^test/ }
  // Dev-only: reflect one conversation now, or run the idle sweep as of a chosen time.
  app.post('/api/test-env/reflect-conversation', async (req, res) => {
    res.json(await maybeReflect(String(req.body.conversationId), req.body.trigger ?? 'manual', req.body.now ? new Date(req.body.now) : undefined))
  })
  app.post('/api/test-env/sweep-reflections', async (req, res) => {
    res.json({ reflected: await sweepIdleReflections(req.body?.now ? new Date(req.body.now) : undefined, req.body?.batch, testOwnerScope(req.body?.owner)) })
  })
  app.post('/api/test-env/recover-ownerless-runs', async (req, res) => {
    res.json(await recoverOwnerlessRuns())
  })
  // Dev-only: run the archive sweep as if it were `now`, so a test can prove what it keeps.
  app.post('/api/test-env/purge-expired-archives', async (req, res) => {
    res.json({ purged: await purgeExpiredArchives(typeof req.body?.now === 'string' ? new Date(req.body.now) : new Date(), testOwnerScope(req.body?.owner)) })
  })
  app.post('/api/test-env/usage', async (req, res) => {
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
  app.post('/api/test-env/cpu-profile', async (req, res) => {
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
  app.get('/api/test-env/heap', async (req, res) => {
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
}

app.use('/api', (req, res) => res.status(404).send('unknown api endpoint'))

app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../../ui/dist'), uiConfig, {
  csp: { nonce: true, header: true },
  privateDirectoryUrl: config.privateDirectoryUrl
}))

app.use(errorHandler)
