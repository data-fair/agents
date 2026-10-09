/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 *
 * Mounted at /api/autonomous-agents BEFORE the autonomous agents router, though the `/tasks` segment
 * cannot be taken for an agent id by its param routes (they have no such depth) — keeping the order
 * explicit means a later `/:type/:id/:agentId/:something` route cannot shadow it silently.
 */

import { Router, type Request } from 'express'
import { type AccountKeys, assertAccountRole, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import * as writeReqBody from '#doc/autonomous-agents/task-write-req/index.ts'
import { getAutonomousAgent, reqWriteSession, assertOrganizationOwner } from '../autonomous-agents/service.ts'
import { canInstruct } from '../autonomous-agents/operations.ts'
import mongo from '#mongo'
import { listTasks, getTask, listRuns, getRun, type RunFilters, createTask, updateTask, deleteTask } from './service.ts'
import { buildConversationExport } from '../review/operations.ts'
import { runAsMessages } from './run-messages.ts'
import { startTaskRun, isTaskRunning, PREVIOUS_RUN_STILL_RUNNING } from './execution.ts'
import { abortRun } from '../conversations/executor.ts'

const router = Router()
export default router

const actorOf = (req: Request) => {
  const session = reqSessionAuthenticated(req)
  return { userId: session.user.id, userName: session.user.name }
}

const loadAgent = async (owner: AccountKeys, agentId: string) => {
  const agent = await getAutonomousAgent(owner, agentId)
  if (!agent) throw httpError(404, 'unknown autonomous agent')
  return agent
}

// Reads: whoever may instruct the agent may see what it is planned to do on its own.
router.get('/:type/:id/:agentId/tasks', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    const agent = await loadAgent(owner, req.params.agentId)
    if (!canInstruct(agent, session)) throw httpError(403, 'you are not allowed to instruct this autonomous agent')
    const results = await listTasks(owner, agent.id)
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

router.get('/:type/:id/:agentId/tasks/:taskId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    const agent = await loadAgent(owner, req.params.agentId)
    if (!canInstruct(agent, session)) throw httpError(403, 'you are not allowed to instruct this autonomous agent')
    res.json(await getTask(owner, agent.id, req.params.taskId))
  } catch (err) { next(err) }
})

// Runs of an agent, newest first, without their content (prompt, parts, calls): a list to scan, not to read.
router.get('/:type/:id/:agentId/runs', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const agent = await loadAgent(owner, req.params.agentId)
    const q = req.query
    const str = (key: string) => typeof q[key] === 'string' ? q[key] as string : undefined
    const results = await listRuns(owner, agent.id, {
      kind: q.kind as RunFilters['kind'],
      taskId: str('taskId'),
      status: str('status'),
      outcome: str('outcome'),
      since: str('since')
    }, {
      page: Math.max(parseInt(String(q.page ?? '1'), 10) || 1, 1),
      size: parseInt(String(q.size ?? '20'), 10) || 20
    })
    res.json(results)
  } catch (err) { next(err) }
})

// One run WITH its content: a task run's content as the two `messages` the chat components render (and
// only so — its `prompt` and `parts` would carry it twice, as in the export); a conversation run's
// metadata, which points at its `conversationId` for the content.
router.get('/:type/:id/:agentId/runs/:runId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const agent = await loadAgent(owner, req.params.agentId)
    const run = await getRun(owner, agent.id, req.params.runId)
    // A conversation run is metadata only here (its content is the conversation's, read elsewhere): without
    // the telemetry and system prompt, as in the list.
    if (run.kind === 'task') {
      const { prompt, parts, ...runWithoutContent } = run
      res.json({ ...runWithoutContent, messages: runAsMessages(run) })
    } else {
      const { systemPrompt, calls, ...metadata } = run
      res.json(metadata)
    }
  } catch (err) { next(err) }
})

// A task run's JSONL, the same file as a conversation's export: its content presented as two messages.
router.get('/:type/:id/:agentId/runs/:runId/export', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const agent = await loadAgent(owner, req.params.agentId)
    const run = await getRun(owner, agent.id, req.params.runId)
    if (run.kind !== 'task') throw httpError(404, 'only a task run is exported here; a conversation is exported from its review page')
    const task = run.taskId ? await mongo.autonomousAgentTasks.findOne({ id: run.taskId }, { projection: { _id: 0, title: 1 } }) : null
    // The content travels as the two messages: left on the run record it would be written twice.
    const { prompt, parts, ...runWithoutContent } = run
    eventsLog.info('agents.task.run-export', `task run ${run.id} of agent ${agent.id} of ${owner.type}/${owner.id} exported`, { req })
    res.attachment(`task-run-${run.id}.jsonl`)
    res.type('application/jsonl').send(buildConversationExport({
      conversation: { kind: 'task', id: run.id, taskId: run.taskId, agentId: agent.id, ...(task ? { title: task.title } : {}) },
      messages: runAsMessages(run),
      runs: [runWithoutContent]
    }))
  } catch (err) { next(err) }
})

// Stop a running task run. It has no socket, so this is its only stop. Reaches the run wherever it is
// held: aborted at once when this process holds it, and recorded on the run (`abortRequestedAt`) so the
// process that does hold it stops it within a few seconds. A conversation turn is stopped from its chat.
router.post('/:type/:id/:agentId/runs/:runId/abort', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const agent = await loadAgent(owner, req.params.agentId)
    const run = await getRun(owner, agent.id, req.params.runId)
    if (run.kind !== 'task') throw httpError(404, 'a conversation turn is stopped from its chat')
    // `aborted: true` when this process stopped the run or a stop was recorded on a still-running run
    // (another process holds it and stops it at its next poll); false for a run that has already ended.
    const aborted = await abortRun(run.id)
    eventsLog.info('agents.run.abort', `abort requested for task run ${run.id} of agent ${agent.id} of ${owner.type}/${owner.id}`, { req })
    res.json({ aborted })
  } catch (err) { next(err) }
})

// Writes: admin of the owning account, behind the progressive-rollout gate (last, see reqWriteSession).
router.post('/:type/:id/:agentId/tasks', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    reqWriteSession(req)
    const body = writeReqBody.returnValid(req.body, { name: 'body' })
    const agent = await loadAgent(owner, req.params.agentId)
    const task = await createTask(owner, agent, body, actorOf(req), { req })
    res.status(201).json(task)
  } catch (err) { next(err) }
})

router.put('/:type/:id/:agentId/tasks/:taskId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    reqWriteSession(req)
    const body = writeReqBody.returnValid(req.body, { name: 'body' })
    const agent = await loadAgent(owner, req.params.agentId)
    const task = await updateTask(owner, agent, req.params.taskId, body, actorOf(req), { req })
    res.json(task)
  } catch (err) { next(err) }
})

// Run now: the same run a slot starts, triggered `manual`. Refused rather than queued or skipped while one
// is going — an admin pressing the button wants to know it did not run.
router.post('/:type/:id/:agentId/tasks/:taskId/run', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    reqWriteSession(req)
    const agent = await loadAgent(owner, req.params.agentId)
    const task = await getTask(owner, agent.id, req.params.taskId)
    if (await isTaskRunning(task.id)) throw httpError(409, PREVIOUS_RUN_STILL_RUNNING)
    const started = await startTaskRun(task, 'manual', { by: actorOf(req) })
    if ('refused' in started) throw httpError(409, started.refused)
    // Skipped — the account's credit cap is exhausted, or another start won the lock: recorded, and
    // refused with the reason the run carries.
    if (started.run.status === 'skipped') throw httpError(409, started.run.error ?? PREVIOUS_RUN_STILL_RUNNING)
    eventsLog.info('agents.task.run', `planned task ${task.id} of agent ${agent.id} of ${owner.type}/${owner.id} run now as ${started.run.id}`, { req })
    res.status(202).json({ runId: started.run.id })
  } catch (err) { next(err) }
})

router.delete('/:type/:id/:agentId/tasks/:taskId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    reqWriteSession(req)
    const agent = await loadAgent(owner, req.params.agentId)
    await deleteTask(owner, agent.id, req.params.taskId, { req })
    res.status(204).send()
  } catch (err) { next(err) }
})
