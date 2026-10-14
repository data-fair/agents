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
