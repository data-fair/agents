/**
 * A task run's follow-up, in its own module so that both of its callers — the task target
 * (./task-target.ts) and recovery (./execution.ts) — import it directly.
 */
import mongo from '#mongo'
import config from '#config'
import type { ConversationRun } from '#types'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'
import { taskEvent, failedInARow } from './operations.ts'
import { pushTaskEvent } from './notifications.ts'
import { maybeReflectTaskRun } from '../memory/reflection.ts'

/**
 * What follows a task run's outcome: notifications, and the pause after too many failures in a row.
 *
 * Called by the task target as the run closes, and by recovery for a run it interrupts. `run` carries its
 * terminal status. The task is read afresh — an admin may have resumed or edited it while the run went —
 * and one deleted since is simply not followed up.
 */
export const afterTaskRun = async (run: ConversationRun, task?: Pick<AutonomousAgentTask, 'id'>): Promise<void> => {
  const taskId = task?.id ?? run.taskId
  const current = taskId ? await mongo.autonomousAgentTasks.findOne({ id: taskId }, { projection: { _id: 0 } }) : null
  if (!current) return

  // Fire-and-forget: reflection is a model call, and neither the close nor the notifications wait for it.
  // A run that did not complete has nothing worth remembering; maybeReflectTaskRun checks the agent has memory.
  if (run.status === 'done') maybeReflectTaskRun(run.id, run).catch(err => console.error(`task run ${run.id} could not be reflected`, err))

  // The link in a notification needs the deployment's public URL, which only the agent's enrolment records.
  const agent = await mongo.autonomousAgents.findOne({ id: run.agentId }, { projection: { _id: 0, 'nhi.siteUrl': 1 } })
  const siteUrl = agent?.nhi?.siteUrl

  if (run.outcome?.status === 'needs-attention') pushTaskEvent(taskEvent('needs-attention', current, run, { siteUrl }))
  // A timeout is an `error`; an abort is an admin's act, not a failure.
  if (run.status !== 'error' && run.status !== 'interrupted') return

  // THE PAUSE FIRST, the notifications after it: a notification is best-effort (pushTaskEvent never
  // throws) and the pause must never depend on one.
  const paused = await pauseAfterFailures(run, current)
  pushTaskEvent(taskEvent('failed', current, run, { siteUrl }))
  if (paused) pushTaskEvent(taskEvent('paused', current, run, { failures: paused, siteUrl }))
}

/** Pause the task if this failed run completes a streak; returns the streak length when it paused it. */
const pauseAfterFailures = async (run: ConversationRun, current: AutonomousAgentTask): Promise<number | undefined> => {
  // This run and the ones before it, newest first; skipped runs did nothing, so they neither fail nor
  // succeed. This run may still be `running` in the store (the target follows up before closing it), so
  // it is taken from the argument and left out of the query. Only runs started since the task was last
  // resumed from a pause count: the failures that paused it must not re-pause it on its first new one.
  const max = config.tasks.maxConsecutiveFailures
  const earlier = max > 1
    ? await mongo.runs
      .find({
        kind: 'task',
        taskId: current.id,
        id: { $ne: run.id },
        status: { $nin: ['running', 'skipped'] },
        ...(current.resumedAt ? { startedAt: { $gt: current.resumedAt } } : {})
      }, { projection: { _id: 0, status: 1 } })
      .sort({ startedAt: -1 })
      .limit(max - 1)
      .toArray()
    : []
  if (!failedInARow([run.status, ...earlier.map(earlierRun => earlierRun.status)], max)) return undefined

  // A paused task keeps its schedule but has no slot to claim; an admin resumes it by saving it enabled.
  // Conditional, so two failures closing together pause it, and notify, once.
  const pausedReason = `paused after ${max} consecutive failed runs`
  const paused = await mongo.autonomousAgentTasks.updateOne(
    { id: current.id, pausedReason: { $exists: false } },
    { $set: { pausedReason }, $unset: { nextRunAt: '' } }
  )
  return paused.modifiedCount ? max : undefined
}
