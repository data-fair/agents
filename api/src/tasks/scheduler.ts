/**
 * The scheduler: one polling pass claims the planned tasks that came due and starts a run of each
 * (docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md).
 *
 * THE CLAIM is an atomic advance of `nextRunAt` from the value this pass read: `updateOne({ id, nextRunAt: <read> })`.
 * No lock, and every instance may poll — of two passes reading the same slot only one modifies the
 * document, and that one owns the slot. The loser matches nothing.
 *
 * CATCH-UP: the next slot is computed after NOW, not after the slot that came due. A task overdue by
 * many slots (downtime) therefore runs once and then follows its cadence; it never replays a backlog.
 */
import mongo from '#mongo'
import { nextRunAfter } from './operations.ts'
import { startTaskRun } from './execution.ts'

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
      let next: string
      try {
        next = nextRunAfter(task.scheduling, now).toISOString()
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
      const claim = await mongo.autonomousAgentTasks.updateOne({ id: task.id, nextRunAt: slot }, { $set: { nextRunAt: next } })
      if (claim.modifiedCount !== 1) continue
      const started = await startTaskRun(task, 'schedule', { scheduledFor: slot })
      // The slot is spent either way: a disabled agent's task must not fire for a stale slot on re-enable.
      if ('refused' in started || started.run.status === 'skipped') skipped++
      else fired++
    } catch (err) {
      console.error(`task scheduler: task ${task.id} failed`, err)
    }
  }
  return { fired, skipped }
}
