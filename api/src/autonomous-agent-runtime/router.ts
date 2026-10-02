/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { nanoid } from 'nanoid'
import mongo from '#mongo'
import { type AccountKeys, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { assertCanOwnAgent } from '../autonomous-agents/service.ts'
import { assertCanInstruct, assertOwnsConversation, requireAutonomousAgent, requireConversation, appendMessage, createRun } from './service.ts'
import { startRun, abortRun } from './executor.ts'
import { getEffectiveRole, assertCanUseModel } from '../auth.ts'
import { isStandardAgentId } from '../agent-session/standard-agents.ts'
import { getSettings } from '../settings/service.ts'
import { hasTraceConsent } from '@agents/shared/trace-consent'

const router = Router()
export default router

/**
 * These routes deliberately do NOT apply `reqWriteSession` (the
 * `autonomousAgentsRequireAdminMode` rollout gate), unlike the configuration routes in
 * ../autonomous-agents/router.ts.
 *
 * The gate exists so the feature is not exposed to org admins before it is ready, and it
 * already achieves that at the only door that matters: while it is on, no org admin can
 * create an autonomous agent, so there is nothing for anyone to run. An agent that does exist
 * was created by a superadmin, who thereby chose both the owning organization and — through
 * `instructors` — who may drive it. Gating the runtime too would make that grant inert until
 * the flag flips, so the instruct path could never be exercised in the configuration it will
 * ship in.
 *
 * What the flag therefore means is "org admins cannot CONFIGURE autonomous agents yet", not
 * "nobody may use one".
 */

/**
 * Runs are read through their own mount (/api/autonomous-agent-runs) rather than nested
 * under a conversation: a caller holds a runId from the message POST and should not have
 * to remember which conversation it came from.
 */
export const runsRouter = Router()

/**
 * Stop a running turn. Guarded by canInstruct, not by who started it: anyone who can send
 * this autonomous agent a message can stop what it is doing.
 */
runsRouter.post('/:type/:id/:runId/abort', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const run = await mongo.autonomousAgentRuns.findOne(
      { id: req.params.runId, 'owner.type': owner.type, 'owner.id': owner.id },
      { projection: { _id: 0 } }
    )
    if (!run) throw httpError(404, 'unknown run')
    await requireAutonomousAgent(owner, run.autonomousAgentId)
    // A run belongs to a conversation, which belongs to ONE person. Guarding this with the agent grant
    // let any instructor of the agent read — or abort — someone else's turn.
    assertOwnsConversation(await requireConversation(owner, run.conversationId), session)

    // `aborted: false` for a run this process is not holding — it may already have finished,
    // or (with several API processes) be held elsewhere. Reported rather than pretended.
    const aborted = abortRun(run.id)
    eventsLog.info('agents.autonomous-agent-run.abort', `abort requested for run ${run.id}`, { req })
    res.json({ aborted })
  } catch (err) { next(err) }
})

runsRouter.get('/:type/:id/:runId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const run = await mongo.autonomousAgentRuns.findOne(
      { id: req.params.runId, 'owner.type': owner.type, 'owner.id': owner.id },
      { projection: { _id: 0 } }
    )
    if (!run) throw httpError(404, 'unknown run')
    await requireAutonomousAgent(owner, run.autonomousAgentId)
    // A run belongs to a conversation, which belongs to ONE person. Guarding this with the agent grant
    // let any instructor of the agent read — or abort — someone else's turn.
    assertOwnsConversation(await requireConversation(owner, run.conversationId), session)
    res.json(run)
  } catch (err) { next(err) }
})

/**
 * The owner named in the path.
 *
 * It does NOT assert an organization any more, because on these runtime routes that depends on which
 * agent is involved: a standard agent runs on a person's own account (see `assertCanOwnAgent`). The
 * invariant has not been dropped — it moved to where the agent id is known:
 *
 *  - the create route calls `assertCanOwnAgent` with the id from the body;
 *  - every conversation-scoped route reaches its data through `requireConversation(owner, id)`, which
 *    scopes by owner, so a user-owned conversation is reachable only if it was created through that
 *    guarded route in the first place;
 *  - a CONFIGURED agent is still refused on a user account, now by `resolveAgent`.
 *
 * The agent CRUD router (../autonomous-agents/router.ts) keeps the blanket assertion in all eight of
 * its routes: configuring agents stays an organization feature.
 */
const reqOwner = (req: any): AccountKeys => {
  return { type: req.params.type, id: req.params.id } as AccountKeys
}

/**
 * Whether this person may open a conversation with this agent — and the two kinds of agent ask
 * genuinely different questions.
 *
 * A CONFIGURED agent lends its own identity: instructing it means borrowing an NHI's permissions, so
 * the gate is `canInstruct` — an account admin, or someone explicitly listed as an instructor.
 *
 * A STANDARD agent lends nothing. It acts as the person, through their own session, so the only
 * question is whether that person may use this account's models at all — which is the role-quota
 * gate every model call already answered. Applying `canInstruct` to it was a real regression and the
 * narrowest kind: a plain member of an organization could not use the assistant embedded in their own
 * application, because they are not an admin of the org and nobody had listed them as an instructor
 * of an agent that does not exist as a document.
 */
const assertMayTalkTo = async (
  autonomousAgent: { id: string, owner: AccountKeys, instructors?: { userId: string }[] },
  owner: AccountKeys,
  session: Parameters<typeof assertCanInstruct>[1]
) => {
  if (!isStandardAgentId(autonomousAgent.id)) {
    assertCanInstruct(autonomousAgent as Parameters<typeof assertCanInstruct>[0], session)
    return
  }
  const settings = await getSettings(owner)
  assertCanUseModel(session, owner, settings.quotas ?? {})
}

router.post('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const autonomousAgentId = req.body?.autonomousAgentId
    if (typeof autonomousAgentId !== 'string' || !autonomousAgentId) throw httpError(400, 'autonomousAgentId is required')
    assertCanOwnAgent(owner, autonomousAgentId)
    const autonomousAgent = await requireAutonomousAgent(owner, autonomousAgentId)
    await assertMayTalkTo(autonomousAgent, owner, session)

    const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : 'New conversation'
    const now = new Date().toISOString()
    const conversation = {
      id: nanoid(),
      autonomousAgentId,
      owner: autonomousAgent.owner,
      // The ONE person this thread belongs to. `owner` stays the ACCOUNT, because that is what quotas
      // and credits are charged to; `userId` is who may read it.
      userId: session.user.id,
      ...(session.user.name ? { userName: session.user.name } : {}),
      title,
      createdAt: now,
      // starts at 0: nextMessageSeq hands out 1 for the first message
      messageSeq: 0
    }
    await mongo.autonomousAgentConversations.insertOne({ ...conversation })
    eventsLog.info('agents.autonomous-agent-conversation.create', `conversation created for autonomous agent ${autonomousAgentId}`, { req })
    res.json(conversation)
  } catch (err) { next(err) }
})

router.get('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    // Required, not optional: it is what the instruct check resolves against, so without
    // it there is no autonomous agent whose instructors list can be consulted.
    const autonomousAgentId = req.query.autonomousAgentId
    if (typeof autonomousAgentId !== 'string' || !autonomousAgentId) throw httpError(400, 'autonomousAgentId query parameter is required')
    assertCanOwnAgent(owner, autonomousAgentId)
    const autonomousAgent = await requireAutonomousAgent(owner, autonomousAgentId)
    await assertMayTalkTo(autonomousAgent, owner, session)

    // Your own threads only. A conversation belongs to one person, so listing someone else's would be
    // a disclosure — and an org admin's role no longer grants it.
    const results = await mongo.autonomousAgentConversations
      .find(
        {
          autonomousAgentId,
          'owner.type': owner.type,
          'owner.id': owner.id,
          ...(session.user.adminMode ? {} : { userId: session.user.id })
        },
        { projection: { _id: 0 } }
      )
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .toArray()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

/**
 * Erase one thread: the conversation, its messages, its runs.
 *
 * The means to comply with an erasure request without deleting the whole autonomous agent. Until this
 * existed, a stored conversation — which now holds complete tool results, not just prose — could only
 * be removed by deleting the agent it belonged to, and nothing at all could remove it if the agent was
 * still in use.
 *
 * Deliberately NOT a TTL. The stored conversation is the conversation of record, so a timer that
 * silently destroyed it would take the audit trail with it. Erasure is a decision someone makes, and
 * this is where they make it.
 */
router.delete('/:type/:id/:conversationId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    await requireAutonomousAgent(owner, conversation.autonomousAgentId)
    // Your own thread, and nobody else's. This used to be the agent grant, which made erasure available
    // to every instructor of the agent — defensible when the timeline was shared, wrong now that it is
    // one person's.
    assertOwnsConversation(conversation, session)

    // A live turn is stopped first, or it would keep writing messages into a conversation that is being
    // deleted underneath it — and runTurn's "the conversation was deleted under us" path would then be
    // reached with tool calls already in flight.
    const live = await mongo.autonomousAgentRuns
      .find({ conversationId: conversation.id, status: 'running' }, { projection: { _id: 0, id: 1 } })
      .toArray()
    for (const run of live) abortRun(run.id)

    const messages = await mongo.autonomousAgentMessages.deleteMany({ conversationId: conversation.id })
    const runs = await mongo.autonomousAgentRuns.deleteMany({ conversationId: conversation.id })
    await mongo.autonomousAgentConversations.deleteOne({ id: conversation.id })

    eventsLog.info('agents.autonomous-agent-conversation.delete', `conversation ${conversation.id} deleted with ${messages.deletedCount} message(s) and ${runs.deletedCount} run(s)`, { req })
    res.status(204).send()
  } catch (err) { next(err) }
})

router.get('/:type/:id/:conversationId/messages', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    // Still resolved, so a thread whose agent was deleted 404s rather than half-working; no longer the
    // thing that authorizes the read or the write.
    await requireAutonomousAgent(owner, conversation.autonomousAgentId)
    assertOwnsConversation(conversation, session)

    const filter: Record<string, any> = { conversationId: conversation.id }
    // sinceVersion is the incremental cursor: it catches a message UPDATED in place — the
    // assistant's answer being filled in keeps its seq — which sinceSeq structurally cannot.
    // sinceSeq is kept for "only messages newer than the one I have", which is a different
    // question and still the cheaper one when that is what a caller means.
    const sinceVersion = Number(req.query.sinceVersion)
    const sinceSeq = Number(req.query.sinceSeq)
    if (Number.isFinite(sinceVersion)) filter.version = { $gt: sinceVersion }
    else if (Number.isFinite(sinceSeq)) filter.seq = { $gt: sinceSeq }
    const results = await mongo.autonomousAgentMessages
      .find(filter, { projection: { _id: 0 } })
      .sort({ seq: 1 })
      .toArray()
    // The conversation's current version travels with the response so a client can store exactly
    // the cursor it has caught up to, rather than inferring it from the messages it happened to
    // receive — which would be wrong whenever the last change was to a run.
    res.json({ results, count: results.length, version: conversation.version ?? 0 })
  } catch (err) { next(err) }
})

router.post('/:type/:id/:conversationId/messages', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    // Still resolved, so a thread whose agent was deleted 404s rather than half-working; no longer the
    // thing that authorizes the read or the write.
    await requireAutonomousAgent(owner, conversation.autonomousAgentId)
    assertOwnsConversation(conversation, session)

    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
    if (!content) throw httpError(400, 'content is required')

    const message = await appendMessage(conversation, {
      role: 'user',
      author: { kind: 'user', userId: session.user.id, userName: session.user.name },
      // A user turn is one text part. Stored the same way as an assistant turn so there is a single
      // shape to read: the conversation of record is the model messages, not two parallel formats.
      parts: [{ type: 'text', text: content }]
    })

    const run = await createRun({
      autonomousAgentId: conversation.autonomousAgentId,
      conversationId: conversation.id,
      owner: conversation.owner,
      trigger: 'user',
      triggeredBy: { userId: session.user.id, userName: session.user.name },
      // See the schema note: only this boundary has the session to derive it from.
      triggeredByRole: getEffectiveRole(session, owner),
      // The same cookie the socket reads off its upgrade, so consent does not depend on transport.
      traceConsent: hasTraceConsent(req.headers.cookie),
      status: 'running',
      startedAt: new Date().toISOString()
    })

    eventsLog.info('agents.autonomous-agent-conversation.message', `message posted to conversation ${conversation.id}`, { req })

    // Not awaited: the caller gets its runId immediately and follows the run document.
    // A rejection here would otherwise become an unhandled rejection — the executor is
    // responsible for turning its own failures into a terminal run and a message, so this
    // catch is a backstop for a throw before it can do that.
    startRun(run).catch(err => console.error('autonomous agent run failed to start', err))

    res.json({ ...message, runId: run.id })
  } catch (err) { next(err) }
})
