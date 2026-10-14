/**
 * The scheduler: one polling pass claims the planned tasks that came due and starts a run of each
 * (docs/architecture/planned-tasks.md).
 *
 * THE CLAIM is an atomic advance of `nextRunAt` from the value this pass read: `updateOne({ id, nextRunAt: <read> })`.
 * No lock, and every instance may poll — of two passes reading the same slot only one modifies the
 * document, and that one owns the slot. The loser matches nothing.
 *
 * CATCH-UP: the next slot is computed after NOW, not after the slot that came due. A task overdue by
 * many slots (downtime) therefore runs once and then follows its cadence; it never replays a backlog.
 */
import mongo from '#mongo'
import { nextRunAfter, isScheduleSlot } from './operations.ts'
import { startTaskRun } from './execution.ts'
import { acceptingTurns } from '../conversations/shutdown.ts'

const BATCH = 50

export const runSchedulerPass = async (now: Date = new Date(), scope: Record<string, unknown> = {}): Promise<{ fired: number, skipped: number }> => {
  const due = await mongo.autonomousAgentTasks
    .find({ enabled: true, pausedReason: { $exists: false }, nextRunAt: { $lte: now.toISOString() }, ...scope }, { projection: { _id: 0 } })
    .sort({ nextRunAt: 1 })
    .limit(BATCH)
    .toArray()

  let fired = 0
  let skipped = 0
  for (const task of due) {
    try {
      const slot = task.nextRunAt!
      let next: string | undefined
      try {
        // No schedule: the slot was a trigger's, and the task is left without one.
        next = task.scheduling.length ? nextRunAfter(task.scheduling, now).toISOString() : undefined
      } catch (err: any) {
        // A stored schedule that cannot be computed would be retried and logged every pass: pause the task
        // instead, so it leaves the due set. Conditional on the slot read, so only one instance logs it.
        const paused = await mongo.autonomousAgentTasks.updateOne(
          { id: task.id, nextRunAt: slot },
          { $set: { pausedReason: `its schedule cannot be computed: ${err.message}` }, $unset: { nextRunAt: '' } }
        )
        if (paused.modifiedCount === 1) console.error(`task scheduler: task ${task.id} paused, its schedule cannot be computed`, err)
        continue
      }
      // Shutdown: the slot is left unclaimed for another instance rather than spent on a refused start.
      if (!acceptingTurns()) break
      const claim = await mongo.autonomousAgentTasks.updateOne(
        { id: task.id, nextRunAt: slot },
        next ? { $set: { nextRunAt: next } } : { $unset: { nextRunAt: '' } }
      )
      if (claim.modifiedCount !== 1) continue
      // A slot a trigger set runs as `webhook`; a schedule slot keeps `schedule` and takes pending payloads too.
      const trigger = task.pendingTriggers?.length && !isScheduleSlot(task.scheduling, slot) ? 'webhook' : 'schedule'
      const started = await startTaskRun(task, trigger, trigger === 'schedule' ? { scheduledFor: slot } : {})
      // The slot is spent either way: a disabled agent's task must not fire for a stale slot on re-enable.
      if ('refused' in started || started.run.status === 'skipped') skipped++
      else fired++
    } catch (err) {
      console.error(`task scheduler: task ${task.id} failed`, err)
    }
  }
  return { fired, skipped }
}
