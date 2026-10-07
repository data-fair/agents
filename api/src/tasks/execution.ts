/**
 * Executing a planned task: one unattended turn of its agent on the task's prompt, recorded on a task run
 * (docs/superpowers/specs/2026-10-07-autonomous-agent-planned-execution-design.md).
 *
 * A task runs at most once at a time, under the lock `task:<taskId>` — taken BEFORE its run is created,
 * because recovery interrupts a running task run whose lock nobody holds. A start that finds it held
 * records a `skipped` run instead, so a slot that did not run is visible rather than silently lost.
 */
import mongo from '#mongo'
import config from '#config'
import locks from '@data-fair/lib-node/locks.js'
import type { ConversationRun } from '#types'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'
import { createTaskRun } from '../conversations/service.ts'
import { driveTurn } from '../conversations/executor.ts'
import { taskTarget } from './task-target.ts'
import { taskEvent, failedInARow } from './operations.ts'
import { pushTaskEvent } from './notifications.ts'

const LOCK_ORIGIN = 'agents-task-run'

export const taskLockId = (taskId: string) => `task:${taskId}`

/** The error a skipped run records. */
export const PREVIOUS_RUN_STILL_RUNNING = 'the previous run of this task was still running'

/** Whether a run of this task is going right now. */
export const isTaskRunning = async (taskId: string) =>
  !!await mongo.runs.findOne({ kind: 'task', taskId, status: 'running' }, { projection: { _id: 0, id: 1 } })

/** Drive one task run to a terminal state. The caller holds the task's lock. */
export const executeTaskRun = async (run: ConversationRun, task: AutonomousAgentTask) => {
  // A task target opens without I/O, so the bare close is only a backstop; it is the target's own `fail`,
  // so a run that failed before its turn is recorded, notified and counted exactly like one that failed in it.
  await driveTurn(
    run,
    async () => taskTarget(run, task, afterTaskRun),
    failure => taskTarget(run, task, afterTaskRun).fail(failure)
  )
}

export type StartedTaskRun = { run: ConversationRun } | { refused: string }

/**
 * Start a run of a task now — its slot came due (`schedule`), or an admin asked (`manual`).
 *
 * Returns the run as soon as it is recorded; the turn itself is not awaited, the run is how a caller
 * follows it. Refused, with the reason, when the agent cannot run at all: nothing is recorded then, as
 * the executor's kill switch would only record the same refusal as a failed run, counted toward a pause.
 */
export const startTaskRun = async (
  task: AutonomousAgentTask,
  trigger: 'schedule' | 'manual',
  opts: { scheduledFor?: string, by?: { userId: string, userName?: string } } = {}
): Promise<StartedTaskRun> => {
  const agent = await mongo.autonomousAgents.findOne(
    { id: task.agentId, 'owner.type': task.owner.type, 'owner.id': task.owner.id },
    { projection: { _id: 0, enabled: 1 } }
  )
  if (!agent) return { refused: 'the autonomous agent no longer exists' }
  if (agent.enabled === false) return { refused: 'the autonomous agent is disabled' }

  const now = new Date().toISOString()
  const base = {
    kind: 'task' as const,
    taskId: task.id,
    agentId: task.agentId,
    owner: task.owner,
    trigger,
    startedAt: now,
    ...(opts.scheduledFor ? { scheduledFor: opts.scheduledFor } : {}),
    ...(opts.by ? { triggeredBy: opts.by } : {})
  }

  const lockId = taskLockId(task.id)
  if (!await locks.acquire(lockId, LOCK_ORIGIN)) {
    return { run: await createTaskRun({ ...base, status: 'skipped', endedAt: now, error: PREVIOUS_RUN_STILL_RUNNING }) }
  }
  let run: ConversationRun
  try {
    run = await createTaskRun({ ...base, status: 'running', prompt: task.prompt })
  } catch (err) {
    await locks.release(lockId)
    throw err
  }
  executeTaskRun(run, task)
    .catch(err => console.error(`task run ${run.id} failed to execute`, err))
    // In a finally so a throw cannot wedge the task: its next slot would be skipped forever.
    .finally(() => locks.release(lockId).catch(err => console.error(`the lock of task ${task.id} could not be released`, err)))
  return { run }
}

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

  if (run.outcome?.status === 'needs-attention') pushTaskEvent(taskEvent('needs-attention', current, run))
  // A timeout is an `error`; an abort is an admin's act, not a failure.
  if (run.status !== 'error' && run.status !== 'interrupted') return
  pushTaskEvent(taskEvent('failed', current, run))

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
  if (!failedInARow([run.status, ...earlier.map(earlierRun => earlierRun.status)], max)) return

  // A paused task keeps its schedule but has no slot to claim; an admin resumes it by saving it enabled.
  // Conditional, so two failures closing together pause it, and notify, once.
  const pausedReason = `paused after ${max} consecutive failed runs`
  const paused = await mongo.autonomousAgentTasks.updateOne(
    { id: current.id, pausedReason: { $exists: false } },
    { $set: { pausedReason }, $unset: { nextRunAt: '' } }
  )
  if (paused.modifiedCount) pushTaskEvent(taskEvent('paused', current, run, { failures: max }))
}
