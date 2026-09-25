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
import { assertOrganizationOwner } from '../autonomous-agents/service.ts'
import { assertCanInstruct, requireAutonomousAgent, requireConversation, appendMessage, createRun } from './service.ts'
import { startRun, abortRun } from './executor.ts'

const router = Router()
export default router

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
    const autonomousAgent = await requireAutonomousAgent(owner, run.autonomousAgentId)
    assertCanInstruct(autonomousAgent, session)

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
    const autonomousAgent = await requireAutonomousAgent(owner, run.autonomousAgentId)
    assertCanInstruct(autonomousAgent, session)
    res.json(run)
  } catch (err) { next(err) }
})

/** The owner named in the path, rejected early when it cannot own an autonomous agent. */
const reqOwner = (req: any): AccountKeys => {
  const owner = { type: req.params.type, id: req.params.id } as AccountKeys
  assertOrganizationOwner(owner)
  return owner
}

router.post('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const autonomousAgentId = req.body?.autonomousAgentId
    if (typeof autonomousAgentId !== 'string' || !autonomousAgentId) throw httpError(400, 'autonomousAgentId is required')
    const autonomousAgent = await requireAutonomousAgent(owner, autonomousAgentId)
    assertCanInstruct(autonomousAgent, session)

    const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : 'New conversation'
    const now = new Date().toISOString()
    const conversation = {
      id: nanoid(),
      autonomousAgentId,
      owner: autonomousAgent.owner,
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
    const autonomousAgent = await requireAutonomousAgent(owner, autonomousAgentId)
    assertCanInstruct(autonomousAgent, session)

    const results = await mongo.autonomousAgentConversations
      .find({ autonomousAgentId, 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0 } })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .toArray()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

router.get('/:type/:id/:conversationId/messages', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    const autonomousAgent = await requireAutonomousAgent(owner, conversation.autonomousAgentId)
    assertCanInstruct(autonomousAgent, session)

    const sinceSeq = Number(req.query.sinceSeq)
    const filter: Record<string, any> = { conversationId: conversation.id }
    if (Number.isFinite(sinceSeq)) filter.seq = { $gt: sinceSeq }
    const results = await mongo.autonomousAgentMessages
      .find(filter, { projection: { _id: 0 } })
      .sort({ seq: 1 })
      .toArray()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

router.post('/:type/:id/:conversationId/messages', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    const autonomousAgent = await requireAutonomousAgent(owner, conversation.autonomousAgentId)
    assertCanInstruct(autonomousAgent, session)

    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
    if (!content) throw httpError(400, 'content is required')

    const message = await appendMessage(conversation, {
      role: 'user',
      author: { kind: 'user', userId: session.user.id, userName: session.user.name },
      content
    })

    const run = await createRun({
      autonomousAgentId: conversation.autonomousAgentId,
      conversationId: conversation.id,
      owner: conversation.owner,
      trigger: 'user',
      triggeredBy: { userId: session.user.id, userName: session.user.name },
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
