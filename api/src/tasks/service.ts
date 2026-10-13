/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { nanoid } from 'nanoid'
import { type AccountKeys, httpError } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import type { ConversationRun } from '#types'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'
import type { PlannedTask as TaskWriteReq } from '#doc/autonomous-agents/task-write-req/index.ts'
import { minGapSeconds, nextRunAfter, toCron, type Scheduling } from './operations.ts'
import { DEFAULT_TIME_ZONE } from '@agents/shared/task-schedule'

export type TaskActor = { userId: string, userName?: string, conversationId?: string }

const projection = { _id: 0 } as const

export const listTasks = async (owner: AccountKeys, agentId: string) => {
  return await mongo.autonomousAgentTasks
    .find({ agentId, 'owner.type': owner.type, 'owner.id': owner.id }, { projection })
    .sort({ createdAt: 1 })
    .toArray()
}

export const getTask = async (owner: AccountKeys, agentId: string, taskId: string) => {
  const task = await mongo.autonomousAgentTasks.findOne({ id: taskId, agentId, 'owner.type': owner.type, 'owner.id': owner.id }, { projection })
  if (!task) throw httpError(404, 'unknown task')
  return task
}

/**
 * The caps every write is held to: the schedule must have a next slot, and must not fire more often than the
 * deployment's minimum interval (two rules close together count, see minGapSeconds). Returns the next slot.
 */
const assertSchedule = (scheduling: Scheduling[], now: Date): Date => {
  let next: Date
  try {
    next = nextRunAfter(scheduling, now)
  } catch (err: any) {
    throw httpError(400, `invalid schedule: ${err.message}`)
  }
  const minInterval = config.tasks.minIntervalSeconds
  if (minGapSeconds(scheduling, now) < minInterval) {
    throw httpError(400, `the schedule runs more often than the minimum interval of ${Math.ceil(minInterval / 60)} minutes`)
  }
  return next
}

/** A schedule's identity, insensitive to key order: what each rule fires at, in which zone. */
const scheduleKey = (rules: Scheduling[]) => JSON.stringify(rules.map(rule => [toCron(rule), (rule as any).timeZone || DEFAULT_TIME_ZONE]))

const actorOf = (user: TaskActor, now: Date) => ({
  userId: user.userId,
  ...(user.userName ? { userName: user.userName } : {}),
  at: now.toISOString(),
  ...(user.conversationId ? { conversationId: user.conversationId } : {})
})

// Each write is logged to the events log HERE, so the two ways to write a task — an admin route, the agent's
// own planning tool once a person approved it — leave the same audit entry. `log` is who it is logged for:
// the route's `{ req }` (ip and host included), or the account and the approver.
export const createTask = async (owner: AccountKeys, agent: { id: string }, body: TaskWriteReq, user: TaskActor, log: EventLogContext) => {
  const now = new Date()
  const nextRunAt = assertSchedule(body.scheduling as Scheduling[], now)
  const count = await mongo.autonomousAgentTasks.countDocuments({ agentId: agent.id })
  if (count >= config.tasks.maxPerAgent) throw httpError(400, `an agent holds at most ${config.tasks.maxPerAgent} planned tasks`)

  const enabled = body.enabled ?? true
  const task: AutonomousAgentTask = {
    id: nanoid(),
    agentId: agent.id,
    owner: owner as AutonomousAgentTask['owner'],
    title: body.title,
    prompt: body.prompt,
    scheduling: body.scheduling,
    enabled,
    ...(enabled ? { nextRunAt: nextRunAt.toISOString() } : {}),
    createdBy: actorOf(user, now),
    updatedBy: actorOf(user, now),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
  await mongo.autonomousAgentTasks.insertOne({ ...task })
  eventsLog.info('agents.task.create', `planned task ${task.id} created for agent ${agent.id} of ${owner.type}/${owner.id}`, log)
  return task
}

export const updateTask = async (owner: AccountKeys, agent: { id: string }, taskId: string, body: TaskWriteReq, user: TaskActor, log: EventLogContext) => {
  const existing = await getTask(owner, agent.id, taskId)
  const now = new Date()
  const enabled = body.enabled ?? existing.enabled
  const reEnabled = enabled && (!existing.enabled || !!existing.pausedReason)
  const scheduleChanged = scheduleKey(existing.scheduling as Scheduling[]) !== scheduleKey(body.scheduling as Scheduling[])
  // Validated only when the schedule itself is being set: raising the minimum interval must not block
  // editing the prompt of a task that already exists.
  const nextRunAt = scheduleChanged || reEnabled || !existing.nextRunAt ? assertSchedule(body.scheduling as Scheduling[], now) : undefined

  const $set: Record<string, unknown> = {
    title: body.title,
    prompt: body.prompt,
    scheduling: body.scheduling,
    enabled,
    updatedBy: actorOf(user, now),
    updatedAt: now.toISOString()
  }
  const $unset: Record<string, ''> = {}
  if (!enabled) {
    // A disabled task has no slot to claim: the scheduler's poll is on nextRunAt.
    $unset.nextRunAt = ''
  } else if (nextRunAt) {
    $set.nextRunAt = nextRunAt.toISOString()
  }
  if (reEnabled) $unset.pausedReason = ''
  // Resumed from a pause: the failures that paused it no longer count toward the next one (afterTaskRun).
  if (reEnabled && existing.pausedReason) $set.resumedAt = now.toISOString()

  await mongo.autonomousAgentTasks.updateOne(
    { id: taskId, agentId: agent.id },
    { $set, ...(Object.keys($unset).length ? { $unset } : {}) }
  )
  eventsLog.info('agents.task.update', `planned task ${taskId} updated for agent ${agent.id} of ${owner.type}/${owner.id}`, log)
  return await getTask(owner, agent.id, taskId)
}

export const deleteTask = async (owner: AccountKeys, agentId: string, taskId: string, log: EventLogContext) => {
  const result = await mongo.autonomousAgentTasks.deleteOne({ id: taskId, agentId, 'owner.type': owner.type, 'owner.id': owner.id })
  if (!result.deletedCount) throw httpError(404, 'unknown task')
  eventsLog.info('agents.task.delete', `planned task ${taskId} deleted for agent ${agentId} of ${owner.type}/${owner.id}`, log)
}

export interface RunFilters { kind?: 'task' | 'conversation', taskId?: string, status?: string, outcome?: string, since?: string }

/** Newest first, without content (parts, prompt, systemPrompt, calls). Throws 400 on an invalid kind or since. */
export const listRuns = async (owner: AccountKeys, agentId: string, filters: RunFilters, page: { page: number, size: number }): Promise<{ results: ConversationRun[], count: number }> => {
  const filter: Record<string, unknown> = { 'owner.type': owner.type, 'owner.id': owner.id, agentId }
  if (filters.taskId !== undefined) filter.taskId = filters.taskId
  if (filters.status !== undefined) filter.status = filters.status
  if (filters.kind !== undefined) {
    if (filters.kind !== 'task' && filters.kind !== 'conversation') throw httpError(400, '"kind" must be "task" or "conversation"')
    filter.kind = filters.kind
  }
  if (filters.outcome !== undefined) filter['outcome.status'] = filters.outcome
  if (filters.since !== undefined) {
    if (Number.isNaN(Date.parse(filters.since))) throw httpError(400, '"since" must be a date')
    filter.startedAt = { $gte: new Date(filters.since).toISOString() }
  }
  const size = Math.min(Math.max(page.size, 1), 100)
  const [results, count] = await Promise.all([
    mongo.runs
      .find(filter, { projection: { _id: 0, parts: 0, prompt: 0, systemPrompt: 0, calls: 0 } })
      .sort({ startedAt: -1 })
      .skip((page.page - 1) * size)
      .limit(size)
      .toArray(),
    mongo.runs.countDocuments(filter)
  ])
  return { results: results as ConversationRun[], count }
}

/** One run of this agent, with content. Throws 404. */
export const getRun = async (owner: AccountKeys, agentId: string, runId: string): Promise<ConversationRun> => {
  const run = await mongo.runs.findOne({ id: runId, agentId, 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0 } })
  if (!run) throw httpError(404, 'unknown run')
  return run as ConversationRun
}
