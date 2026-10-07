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
import { listTasks, getTask, createTask, updateTask, deleteTask } from './service.ts'
import { startTaskRun, isTaskRunning, PREVIOUS_RUN_STILL_RUNNING } from './execution.ts'

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
    const filter: Record<string, unknown> = { 'owner.type': owner.type, 'owner.id': owner.id, agentId: agent.id }
    for (const key of ['taskId', 'kind', 'status'] as const) {
      if (typeof req.query[key] === 'string') filter[key] = req.query[key]
    }
    const size = Math.min(Math.max(parseInt(String(req.query.size ?? '20'), 10) || 20, 1), 100)
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
    const [results, count] = await Promise.all([
      mongo.runs
        .find(filter, { projection: { _id: 0, parts: 0, prompt: 0, systemPrompt: 0, calls: 0 } })
        .sort({ startedAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .toArray(),
      mongo.runs.countDocuments(filter)
    ])
    res.json({ results, count })
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
    const task = await createTask(owner, agent, body, actorOf(req))
    eventsLog.info('agents.task.create', `planned task ${task.id} created for agent ${agent.id} of ${owner.type}/${owner.id}`, { req })
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
    const task = await updateTask(owner, agent, req.params.taskId, body, actorOf(req))
    eventsLog.info('agents.task.update', `planned task ${task.id} updated for agent ${agent.id} of ${owner.type}/${owner.id}`, { req })
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
    // Lost the race for the lock to another start: recorded skipped, and refused like the check above.
    if (started.run.status === 'skipped') throw httpError(409, PREVIOUS_RUN_STILL_RUNNING)
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
    await deleteTask(owner, agent.id, req.params.taskId)
    eventsLog.info('agents.task.delete', `planned task ${req.params.taskId} deleted for agent ${agent.id} of ${owner.type}/${owner.id}`, { req })
    res.status(204).send()
  } catch (err) { next(err) }
})
