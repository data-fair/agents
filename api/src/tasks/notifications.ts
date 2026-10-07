/**
 * Push a planned task's notifications to the events service, as data-fair processings does for its runs.
 */
import config from '#config'
import eventsQueue from '@data-fair/lib-node/events-queue.js'
import type { TaskEvent } from './operations.ts'

/**
 * In development only: the events pushed, newest last, capped. It lets the tests see a notification
 * without the events service's own API — its subscriptions and its storage are not what is tested here.
 */
const DEV_RECORD_CAP = 200
const devRecord: TaskEvent[] = []

export const pushedTaskEvents = (): TaskEvent[] => [...devRecord]
export const clearPushedTaskEvents = () => { devRecord.length = 0 }

/**
 * Never throws: a notification is best-effort, and what follows it (a task's pause) must not depend on
 * it. A failure is logged.
 */
export const pushTaskEvent = (event: TaskEvent) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      devRecord.push(event)
      if (devRecord.length > DEV_RECORD_CAP) devRecord.splice(0, devRecord.length - DEV_RECORD_CAP)
    }
    // The queue is started only when both are configured (server.ts); pushing to a queue that was not
    // started throws.
    if (!config.privateEventsUrl || !config.secretKeys?.events) return
    // A copy: the queue stamps the event's date onto the object it is given.
    eventsQueue.pushEvent({ ...event })
  } catch (err) {
    console.error(`the task notification ${event.topic.key} could not be pushed`, err)
  }
}
