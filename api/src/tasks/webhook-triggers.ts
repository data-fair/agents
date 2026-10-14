/**
 * Webhook triggers of planned tasks (docs/architecture/planned-tasks.md, "Webhook triggers"): the key of a
 * task's trigger URL, and accepting a call to it. Taken from data-fair processings' `_trigger`.
 *
 * stateful (mongo, config), built on operations.ts.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto'
import mongo from '#mongo'
import { type AccountKeys, httpError } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import config from '#config'
import { addPendingTrigger, triggerDecision } from './operations.ts'
import { startTaskRun, isTaskRunning } from './execution.ts'
import { assertAcceptingTurns } from '../conversations/shutdown.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'
import { createRun } from '../conversations/service.ts'

/** 16 url-safe characters, as processings' webhookKey. */
export const newWebhookKey = () => randomBytes(12).toString('base64url')

/** Constant time over equal lengths; a missing key never matches. */
export const keyMatches = (given: string | undefined, expected: string | undefined): boolean => {
  if (!given || !expected) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

const taskFilter = (owner: AccountKeys, agentId: string, taskId: string) => ({ id: taskId, agentId, 'owner.type': owner.type, 'owner.id': owner.id })

/** The key, generated for a task that has none (tasks written before keys existed, in dev databases). */
export const readWebhookKey = async (owner: AccountKeys, agentId: string, taskId: string): Promise<string> => {
  const task = await mongo.autonomousAgentTasks.findOne(taskFilter(owner, agentId, taskId), { projection: { _id: 0, webhookKey: 1 } })
  if (!task) throw httpError(404, 'unknown task')
  if (task.webhookKey) return task.webhookKey
  const webhookKey = newWebhookKey()
  // Conditional: two first reads racing agree on one key.
  await mongo.autonomousAgentTasks.updateOne({ ...taskFilter(owner, agentId, taskId), webhookKey: { $exists: false } }, { $set: { webhookKey } })
  return (await mongo.autonomousAgentTasks.findOne(taskFilter(owner, agentId, taskId), { projection: { _id: 0, webhookKey: 1 } }))!.webhookKey!
}

/** A new key; the old one stops working at once. */
export const regenerateWebhookKey = async (owner: AccountKeys, agentId: string, taskId: string, log: EventLogContext): Promise<string> => {
  const webhookKey = newWebhookKey()
  const result = await mongo.autonomousAgentTasks.updateOne(taskFilter(owner, agentId, taskId), { $set: { webhookKey } })
  if (!result.matchedCount) throw httpError(404, 'unknown task')
  eventsLog.info('agents.task.webhook-key', `trigger key of planned task ${taskId} of agent ${agentId} of ${owner.type}/${owner.id} regenerated`, log)
  return webhookKey
}

const CAS_RETRIES = 5

/**
 * A call to a task's trigger URL. Refusals as processings' `_trigger` (404, 403, 409 inactive) plus 503 while
 * shutting down and 409 on an exhausted credit cap (recorded skipped, as run now) — all BEFORE the payload is
 * stored, so a sender's retry never duplicates it. Then the payload joins the pending list and a run starts now
 * or waits (triggerDecision).
 */
export const acceptTrigger = async (params: { owner: AccountKeys, agentId: string, taskId: string, key?: string, payload: () => string, log: EventLogContext }):
Promise<{ status: 'started', runId: string } | { status: 'pending' }> => {
  const { owner, agentId, taskId } = params
  const task = await mongo.autonomousAgentTasks.findOne(taskFilter(owner, agentId, taskId), { projection: { _id: 0 } })
  if (!task) throw httpError(404, 'unknown task')
  if (!keyMatches(params.key, task.webhookKey)) throw httpError(403, 'wrong trigger key')
  const agent = await mongo.autonomousAgents.findOne({ id: agentId, 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0, enabled: 1 } })
  if (!agent || agent.enabled === false) throw httpError(409, 'the autonomous agent is disabled')
  if (!task.enabled || task.pausedReason) throw httpError(409, task.pausedReason ? `the task is paused: ${task.pausedReason}` : 'the task is disabled')
  assertAcceptingTurns()
  const cap = await checkAccountCreditCap(owner)
  if (cap) {
    const now = new Date().toISOString()
    const reason = `${cap.reason} (${cap.scope}, ${cap.period} limit ${cap.limit}, used ${cap.usage}). Resets at ${cap.resetsAt}.`
    await createRun({ kind: 'task', taskId, agentId, owner: task.owner, trigger: 'webhook', startedAt: now, status: 'skipped', endedAt: now, error: reason })
    throw httpError(409, reason)
  }

  const entry = { receivedAt: new Date().toISOString(), payload: params.payload() }
  for (let attempt = 0; ; attempt++) {
    const current = (await mongo.autonomousAgentTasks.findOne({ id: taskId }, { projection: { _id: 0, pendingTriggers: 1, droppedTriggers: 1, triggerSeq: 1, nextRunAt: 1 } }))!
    const { pending, dropped } = addPendingTrigger(current.pendingTriggers, current.droppedTriggers, entry)
    const stored = await mongo.autonomousAgentTasks.updateOne(
      { id: taskId, triggerSeq: current.triggerSeq ?? { $exists: false } },
      { $set: { pendingTriggers: pending, droppedTriggers: dropped }, $inc: { triggerSeq: 1 } }
    )
    if (stored.modifiedCount === 1) break
    if (attempt >= CAS_RETRIES) throw httpError(503, 'too many simultaneous triggers, retry')
  }
  eventsLog.info('agents.task.webhook', `planned task ${taskId} of agent ${agentId} of ${owner.type}/${owner.id} triggered by webhook`, params.log)

  const last = await mongo.runs.findOne({ kind: 'task', taskId, status: { $ne: 'skipped' } }, { projection: { _id: 0, startedAt: 1 }, sort: { startedAt: -1 } })
  const fresh = (await mongo.autonomousAgentTasks.findOne({ id: taskId }, { projection: { _id: 0 } }))!
  const decision = triggerDecision({
    running: await isTaskRunning(taskId),
    lastStartedAt: last?.startedAt,
    nextRunAt: fresh.nextRunAt,
    now: new Date(),
    minIntervalSeconds: config.tasks.minIntervalSeconds
  })
  if (!decision.start) {
    if (decision.nextRunAt && decision.nextRunAt !== fresh.nextRunAt) {
      await mongo.autonomousAgentTasks.updateOne({ id: taskId }, { $set: { nextRunAt: decision.nextRunAt } })
    }
    return { status: 'pending' }
  }
  const started = await startTaskRun(fresh, 'webhook')
  // Lost a race to another start (lock held) or refused meanwhile: the payload is still pending, and the run
  // that holds the lock schedules it at its end.
  if ('refused' in started || started.run.status === 'skipped') return { status: 'pending' }
  return { status: 'started', runId: started.run.id }
}
