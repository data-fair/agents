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
import { createTaskRun, finishTaskRun } from '../conversations/service.ts'
import { driveTurn, isRunLive } from '../conversations/executor.ts'
import { taskTarget } from './task-target.ts'
import { taskEvent, failedInARow } from './operations.ts'
import { pushTaskEvent } from './notifications.ts'
import { maybeReflectTaskRun } from '../memory/reflection.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'

const LOCK_ORIGIN = 'agents-task-run'

export const taskLockId = (taskId: string) => `task:${taskId}`

/** The error a skipped run records. */
export const PREVIOUS_RUN_STILL_RUNNING = 'the previous run of this task was still running'

/** Whether a run of this task is going right now. */
export const isTaskRunning = async (taskId: string) =>
  !!await mongo.runs.findOne({ kind: 'task', taskId, status: 'running' }, { projection: { _id: 0, id: 1 } })

const LOCK_RETRIES = 3
const LOCK_RETRY_MS = 200

/**
 * Take the task's lock. A run that has just closed still holds it for the moment between its close and
 * the release, so a lock held while no run is `running` is retried briefly: a start right after a run
 * ended (run now pressed as the previous run finished) must not be recorded as skipped.
 */
const acquireTaskLock = async (taskId: string) => {
  for (let attempt = 0; ; attempt++) {
    if (await locks.acquire(taskLockId(taskId), LOCK_ORIGIN)) return true
    if (attempt >= LOCK_RETRIES || await isTaskRunning(taskId)) return false
    await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_MS))
  }
}

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
 * Recorded `skipped`, with the reason as its `error`, when the account's credit cap is exhausted or the
 * previous run is still going.
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

  // An exhausted account credit cap is the account's state, not the task failing: the slot is recorded
  // skipped with the reason — no notification, no step toward a pause — and the task runs again once
  // credit returns. Checked before the lock, so a capped account takes no lock at all.
  const accountCap = await checkAccountCreditCap(task.owner)
  if (accountCap) {
    const reason = `${accountCap.reason} (${accountCap.scope}, ${accountCap.period} limit ${accountCap.limit}, used ${accountCap.usage}). Resets at ${accountCap.resetsAt}.`
    return { run: await createTaskRun({ ...base, status: 'skipped', endedAt: now, error: reason }) }
  }

  const lockId = taskLockId(task.id)
  if (!await acquireTaskLock(task.id)) {
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

  // Fire-and-forget: reflection is a model call, and neither the close nor the notifications wait for it.
  // A run that did not complete has nothing worth remembering; maybeReflectTaskRun checks the agent has memory.
  if (run.status === 'done') maybeReflectTaskRun(run.id, run).catch(err => console.error(`task run ${run.id} could not be reflected`, err))

  if (run.outcome?.status === 'needs-attention') pushTaskEvent(taskEvent('needs-attention', current, run))
  // A timeout is an `error`; an abort is an admin's act, not a failure.
  if (run.status !== 'error' && run.status !== 'interrupted') return

  // THE PAUSE FIRST, the notifications after it: a notification is best-effort (pushTaskEvent never
  // throws) and the pause must never depend on one.
  const paused = await pauseAfterFailures(run, current)
  pushTaskEvent(taskEvent('failed', current, run))
  if (paused) pushTaskEvent(taskEvent('paused', current, run, { failures: paused }))
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

/**
 * Close the task runs left `running` by a dead process. Never resumed: a task run that began may have
 * fired its tools, and one that did not is simply the next slot's to run. Ownerless when nobody holds its
 * task's lock and this process is not running it. Closed `interrupted`, which notifies and counts toward
 * the task's pause like any failure. The conversation half is `recoverOwnerlessRuns` (executor.ts).
 */
export const recoverOwnerlessTaskRuns = async (): Promise<{ interrupted: number, skipped: number }> => {
  let interrupted = 0
  let skipped = 0
  const taskCandidates = await mongo.runs.find({ status: 'running', kind: 'task' }, { projection: { _id: 0 } }).toArray()
  const heldTaskLocks = new Set((await mongo.db.collection<{ _id: string }>('locks')
    .find({ _id: { $regex: '^task:' } }, { projection: { _id: 1 } }).toArray()).map(doc => String(doc._id).slice('task:'.length)))
  for (const run of taskCandidates) {
    if (isRunLive(run.id) || (run.taskId && heldTaskLocks.has(run.taskId))) { skipped++; continue }
    const patch = { status: 'interrupted', stopReason: 'error', error: 'interrupted by a restart' } as const
    if (await finishTaskRun(run, patch)) {
      // Caught: one task's notification must not stop the others being recovered.
      await afterTaskRun({ ...run, ...patch }).catch(err => console.error('an interrupted task run could not be followed up', err))
    }
    interrupted++
  }
  if (interrupted) console.log(`[autonomous-agents] interrupted ${interrupted} task run(s) left behind by a dead process`)
  return { interrupted, skipped }
}
