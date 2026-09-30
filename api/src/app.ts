import { resolve } from 'node:path'
import { session, errorHandler, createSiteMiddleware, createSpaMiddleware } from '@data-fair/lib-express/index.js'
import express from 'express'
import helmet from 'helmet'
import { uiConfig } from './ui-config.ts'
import settingsRouter from './settings/router.ts'
import adminRouter from './admin/router.ts'
import modelsRouter, { getModelsForOwner } from './models/router.ts'
import catalogRouter from './catalog/router.ts'
import autonomousAgentsRouter from './autonomous-agents/router.ts'
import autonomousAgentRuntimeRouter, { runsRouter as autonomousAgentRunsRouter } from './autonomous-agent-runtime/router.ts'
import { recoverOwnerlessRuns } from './autonomous-agent-runtime/executor.ts'
import locks from '@data-fair/lib-node/locks.js'
import nhiRouter from './nhi/router.ts'
import { clearAutonomousAgentSession } from './nhi/service.ts'
import summaryRouter from './summary/router.ts'
import gatewayRouter from './gateway/router.ts'
import usageRouter from './usage/router.ts'
import tracesRouter from './traces/router.ts'
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
app.use('/api/autonomous-agents', autonomousAgentsRouter)
app.use('/api/autonomous-agent-conversations', autonomousAgentRuntimeRouter)
app.use('/api/autonomous-agent-runs', autonomousAgentRunsRouter)
app.use('/api/nhi', nhiRouter)
app.use('/api/gateway', gatewayRouter)
app.use('/api/summary', summaryRouter)
app.use('/api/usage', usageRouter)
app.use('/api/traces', tracesRouter)
app.use('/api/moderation', moderationRouter)
app.use('/api/v1/limits', limitsRouter)
app.use('/api/ping', (req, res) => res.send('ok'))

if (process.env.NODE_ENV === 'development') {
  app.delete('/api/test-env', async (req, res) => {
    getModelsForOwner.clear()
    await mongo.db.collection('settings').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('usage').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('trace-requests').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('moderation-events').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('moderation-strikes').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('limits').deleteMany({ id: /^test/ })
    // The NHI session cache is in-process and keyed by AGENT ID alone, so deleting the documents is
    // not enough: a later spec re-creating the same id would be served the cookie obtained for the
    // previous one, silently skipping the exchange it means to test.
    for (const agent of await mongo.db.collection('autonomous-agents').find({ 'owner.id': /^test/ }, { projection: { id: 1 } }).toArray()) {
      clearAutonomousAgentSession(agent.id as string)
    }
    await mongo.db.collection('autonomous-agents').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('autonomous-agent-conversations').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('autonomous-agent-messages').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('autonomous-agent-runs').deleteMany({ 'owner.id': /^test/ })
    res.send()
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
    res.json({ acquired: await locks.acquire(`autonomous-agent-conversation:${req.body.conversationId}`, 'test') })
  })
  app.post('/api/test-env/unlock-conversation', async (req, res) => {
    await locks.release(`autonomous-agent-conversation:${req.body.conversationId}`)
    res.send()
  })
  app.post('/api/test-env/orphan-run', async (req, res) => {
    await mongo.autonomousAgentRuns.updateOne(
      { id: req.body.runId },
      { $set: { status: 'running' }, $unset: { endedAt: '', stopReason: '' } }
    )
    if (req.body.dropMessage) {
      // Reproduces the narrower orphan: a process that died between createRun and
      // appendMessage, so the run has no message at all and the sweep must write one. That is
      // half of the "a run always leaves exactly one assistant message" invariant.
      await mongo.autonomousAgentMessages.deleteMany({ runId: req.body.runId })
    } else {
      await mongo.autonomousAgentMessages.updateMany({ runId: req.body.runId }, { $set: { pending: true } })
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
    await mongo.autonomousAgentMessages.updateOne(
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
    const conversations = await mongo.autonomousAgentConversations
      .find({ autonomousAgentId: req.params.agentId }, { projection: { _id: 0, id: 1 } })
      .toArray()
    const conversationIds = conversations.map(conversation => conversation.id)
    res.json({
      conversations: conversations.length,
      messages: await mongo.autonomousAgentMessages.countDocuments({ conversationId: { $in: conversationIds } }),
      runs: await mongo.autonomousAgentRuns.countDocuments({ conversationId: { $in: conversationIds } })
    })
  })
  app.post('/api/test-env/recover-ownerless-runs', async (req, res) => {
    res.json(await recoverOwnerlessRuns())
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
}

app.use('/api', (req, res) => res.status(404).send('unknown api endpoint'))

app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../../ui/dist'), uiConfig, {
  csp: { nonce: true, header: true },
  privateDirectoryUrl: config.privateDirectoryUrl
}))

app.use(errorHandler)
