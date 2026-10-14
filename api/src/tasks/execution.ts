/**
 * Executing a planned task: one unattended turn of its agent on the task's prompt, recorded on a task run
 * (docs/architecture/planned-tasks.md).
 *
 * A task runs at most once at a time, under the lock `task:<taskId>` — taken BEFORE its run is created,
 * because recovery interrupts a running task run whose lock nobody holds. A start that finds it held
 * records a `skipped` run instead, so a slot that did not run is visible rather than silently lost.
 */
import mongo from '#mongo'
import locks from '@data-fair/lib-node/locks.js'
import type { ConversationRun } from '#types'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'
import { createRun, finishRun } from '../conversations/service.ts'
import { driveTurn } from '../conversations/executor.ts'
import { isRunLive } from '../conversations/live-runs.ts'
import { acceptingTurns, SHUTTING_DOWN } from '../conversations/shutdown.ts'
import { taskTarget } from './task-target.ts'
import { afterTaskRun } from './follow-up.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'
import { webhookPrompt, type PendingTrigger } from './operations.ts'

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
    async () => taskTarget(run, task),
    failure => taskTarget(run, task).fail(failure)
  )
}

export type StartedTaskRun = { run: ConversationRun } | { refused: string }

/**
 * The task's pending triggers, taken: unset in one atomic step, under the task's lock, so a trigger arriving
 * meanwhile lands either here or in the list the next run takes — never nowhere. `triggerSeq` moves too, so a
 * trigger computed from the list before this take retries (acceptTrigger).
 */
export const takePendingTriggers = async (taskId: string): Promise<{ pending?: PendingTrigger[], dropped?: number }> => {
  const before = await mongo.autonomousAgentTasks.findOneAndUpdate(
    { id: taskId, 'pendingTriggers.0': { $exists: true } },
    { $unset: { pendingTriggers: '', droppedTriggers: '' }, $inc: { triggerSeq: 1 } },
    { projection: { _id: 0, pendingTriggers: 1, droppedTriggers: 1 }, returnDocument: 'before' }
  )
  return { pending: before?.pendingTriggers, dropped: before?.droppedTriggers }
}

/**
 * Start a run of a task now — its slot came due (`schedule`), an admin asked (`manual`), or its trigger URL
 * was called (`webhook`).
 *
 * Returns the run as soon as it is recorded; the turn itself is not awaited, the run is how a caller
 * follows it. Refused, with the reason, when the agent cannot run at all: nothing is recorded then, as
 * the executor's kill switch would only record the same refusal as a failed run, counted toward a pause.
 * Recorded `skipped`, with the reason as its `error`, when the account's credit cap is exhausted or the
 * previous run is still going.
 */
export const startTaskRun = async (
  task: AutonomousAgentTask,
  trigger: 'schedule' | 'manual' | 'webhook',
  opts: { scheduledFor?: string, by?: { userId: string, userName?: string } } = {}
): Promise<StartedTaskRun> => {
  const agent = await mongo.autonomousAgents.findOne(
    { id: task.agentId, 'owner.type': task.owner.type, 'owner.id': task.owner.id },
    { projection: { _id: 0, enabled: 1 } }
  )
  // Nothing recorded: the scheduler stops claiming slots before this, so only a run now lands here.
  if (!acceptingTurns()) return { refused: SHUTTING_DOWN }
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
    return { run: await createRun({ ...base, status: 'skipped', endedAt: now, error: reason }) }
  }

  const lockId = taskLockId(task.id)
  if (!await acquireTaskLock(task.id)) {
    return { run: await createRun({ ...base, status: 'skipped', endedAt: now, error: PREVIOUS_RUN_STILL_RUNNING }) }
  }
  let run: ConversationRun
  try {
    // Every run takes the pending payloads, whatever its trigger: a run of the task is what they waited for.
    const { pending, dropped } = await takePendingTriggers(task.id)
    run = await createRun({ ...base, status: 'running', prompt: webhookPrompt(task.prompt, pending, dropped) })
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
    if ((await finishRun(run, patch)).closed) {
      // Caught: one task's notification must not stop the others being recovered.
      await afterTaskRun({ ...run, ...patch }).catch(err => console.error('an interrupted task run could not be followed up', err))
      interrupted++
    }
  }
  if (interrupted) console.log(`[autonomous-agents] interrupted ${interrupted} task run(s) left behind by a dead process`)
  return { interrupted, skipped }
}
