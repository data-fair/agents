/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { nanoid } from 'nanoid'
import { type AccountKeys, httpError } from '@data-fair/lib-express'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'
import type { PlannedTask as TaskWriteReq } from '#doc/autonomous-agents/task-write-req/index.ts'
import { minGapSeconds, nextRunAfter, type Scheduling } from './operations.ts'

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

const actorOf = (user: TaskActor, now: Date) => ({
  userId: user.userId,
  ...(user.userName ? { userName: user.userName } : {}),
  at: now.toISOString(),
  ...(user.conversationId ? { conversationId: user.conversationId } : {})
})

export const createTask = async (owner: AccountKeys, agent: { id: string }, body: TaskWriteReq, user: TaskActor) => {
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
  return task
}

export const updateTask = async (owner: AccountKeys, agent: { id: string }, taskId: string, body: TaskWriteReq, user: TaskActor) => {
  const existing = await getTask(owner, agent.id, taskId)
  const now = new Date()
  const nextRunAt = assertSchedule(body.scheduling as Scheduling[], now)

  const enabled = body.enabled ?? existing.enabled
  const reEnabled = enabled && (!existing.enabled || !!existing.pausedReason)
  const scheduleChanged = JSON.stringify(existing.scheduling) !== JSON.stringify(body.scheduling)

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
  } else if (reEnabled || scheduleChanged || !existing.nextRunAt) {
    $set.nextRunAt = nextRunAt.toISOString()
  }
  if (reEnabled) $unset.pausedReason = ''

  await mongo.autonomousAgentTasks.updateOne(
    { id: taskId, agentId: agent.id },
    { $set, ...(Object.keys($unset).length ? { $unset } : {}) }
  )
  return await getTask(owner, agent.id, taskId)
}

export const deleteTask = async (owner: AccountKeys, agentId: string, taskId: string) => {
  const result = await mongo.autonomousAgentTasks.deleteOne({ id: taskId, agentId, 'owner.type': owner.type, 'owner.id': owner.id })
  if (!result.deletedCount) throw httpError(404, 'unknown task')
}
