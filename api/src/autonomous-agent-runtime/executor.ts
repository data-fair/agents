/**
 * Runs one turn of an autonomous agent, in this process, asynchronously.
 *
 * Deliberately not resumable: a restart marks an in-flight run `interrupted`
 * (sweepInterruptedRuns) rather than trying to continue it. The spec chose this over
 * distributed run leasing until concurrency demands otherwise.
 *
 * Two invariants hold for every path through this module:
 *  - a run always reaches a terminal status, and
 *  - a run always leaves exactly one assistant message.
 * "Failure is a message, not a silence": a conversation that simply stops, or a turn that
 * appears to think forever, is the failure mode the spec forbids.
 */

import mongo from '#mongo'
import locks from '@data-fair/lib-node/locks.js'
import type { AutonomousAgentMessage, AutonomousAgentRun } from '#types'
import { runStopReasonMessage, type RunStopReason } from './operations.ts'
import { appendMessage, updateMessage, finishRun } from './service.ts'

const LOCK_ORIGIN = 'autonomous-agent-executor'

/** One conversation is one serialised timeline, so the lock is keyed on it. */
const conversationLockId = (conversationId: string) => `autonomous-agent-conversation:${conversationId}`

/** What one turn produced. The model loop replaces the body that fills this in. */
interface TurnResult {
  content: string
  reasoning?: string
  toolCalls?: NonNullable<AutonomousAgentMessage['toolCalls']>
  steps: number
  credits: number
  stopReason: RunStopReason
}

/**
 * The oldest run of this conversation that still needs doing.
 *
 * This is what stops a message from being dropped: a post that arrives while another turn
 * holds the lock leaves its run `running`, and the holder comes back for it here.
 */
const nextPendingRun = async (conversationId: string) => {
  return await mongo.autonomousAgentRuns.findOne(
    { conversationId, status: 'running' },
    { projection: { _id: 0 }, sort: { startedAt: 1 } }
  )
}

/**
 * Perform the turn itself.
 *
 * For now this echoes the instruction back: the point of this step is that the lifecycle
 * around it — locking, pickup, terminal status, terminal message, restart sweep — is
 * correct and tested before a model is in the picture. The model loop replaces this body.
 */
const performTurn = async (run: AutonomousAgentRun): Promise<TurnResult> => {
  const lastUserMessage = await mongo.autonomousAgentMessages.findOne(
    { conversationId: run.conversationId, role: 'user' },
    { projection: { _id: 0 }, sort: { seq: -1 } }
  )
  return {
    content: `Received: "${lastUserMessage?.content ?? ''}"`,
    steps: 0,
    credits: 0,
    stopReason: 'completed'
  }
}

/**
 * Run one turn to a terminal state.
 *
 * The assistant message is created BEFORE the turn runs, `pending: true`, for two reasons:
 * a reader sees the turn exists while it is being produced, and a throw still has a message
 * to write the failure into rather than needing to invent one afterwards.
 */
export const runTurn = async (run: AutonomousAgentRun): Promise<void> => {
  const conversation = await mongo.autonomousAgentConversations.findOne(
    { id: run.conversationId },
    { projection: { _id: 0 } }
  )
  if (!conversation) {
    // The conversation was deleted under us; there is nowhere to put a message, so the run
    // is all that can be closed out.
    await finishRun(run.id, { status: 'error', stopReason: 'error', error: 'conversation no longer exists' })
    return
  }

  const message = await appendMessage(conversation, {
    role: 'assistant',
    author: { kind: 'autonomous-agent', userName: conversation.title },
    content: '',
    runId: run.id,
    pending: true
  })

  try {
    const result = await performTurn(run)
    // A turn that stopped for a reason other than finishing explains itself, appended to
    // whatever it did manage to produce.
    const notice = result.stopReason === 'completed' ? '' : runStopReasonMessage(result.stopReason)
    const content = [result.content, notice].filter(Boolean).join('\n\n')
    await updateMessage(message.id, {
      content,
      reasoning: result.reasoning,
      toolCalls: result.toolCalls,
      pending: false
    })
    // A run stopped by a guard, a budget or the clock is still a completed run, not an
    // error: it did work and said so. Only a throw is an error.
    await finishRun(run.id, {
      status: 'done',
      stopReason: result.stopReason,
      steps: result.steps,
      credits: result.credits
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    await updateMessage(message.id, { content: runStopReasonMessage('error'), pending: false })
    await finishRun(run.id, { status: 'error', stopReason: 'error', error: detail })
  }
}

/**
 * Kick a turn. Callers do NOT await this — the message route returns as soon as the user
 * message is persisted, and the run document is how a caller follows along.
 *
 * When the lock is already held, this returns immediately and leaves the run `running`:
 * the holder picks it up through nextPendingRun. Nobody is rejected and no message is
 * dropped. The outer loop exists because a post can land between the holder's last
 * nextPendingRun check and its release, which would otherwise orphan that run forever.
 */
export const startRun = async (run: AutonomousAgentRun): Promise<void> => {
  const lockId = conversationLockId(run.conversationId)
  while (true) {
    if (!await locks.acquire(lockId, LOCK_ORIGIN)) return
    try {
      let current: AutonomousAgentRun | null = await nextPendingRun(run.conversationId)
      while (current) {
        await runTurn(current)
        current = await nextPendingRun(run.conversationId)
      }
    } finally {
      // In a finally so a throw cannot wedge the conversation permanently.
      await locks.release(lockId)
    }
    if (!await nextPendingRun(run.conversationId)) return
  }
}

/**
 * Close out runs orphaned by a restart.
 *
 * The executor is in-process and non-resumable, so any run still marked `running` at boot
 * belongs to a process that is gone. Marking it `interrupted` gives a reader an honest
 * terminal state instead of a turn that appears to be thinking forever.
 *
 * Reuses the assistant message the run already created rather than appending a second one.
 */
export const sweepInterruptedRuns = async (): Promise<number> => {
  const orphaned = await mongo.autonomousAgentRuns
    .find({ status: 'running' }, { projection: { _id: 0 } })
    .toArray()

  for (const run of orphaned) {
    const existing = await mongo.autonomousAgentMessages.findOne(
      { runId: run.id, role: 'assistant' },
      { projection: { _id: 0 } }
    )
    // stopReason has no 'interrupted' member — the status carries that — so the reason is
    // 'error' with the restart named as the detail.
    const notice = runStopReasonMessage('error', 'interrupted by a restart')
    if (existing) {
      await updateMessage(existing.id, {
        content: existing.content ? `${existing.content}\n\n${notice}` : notice,
        pending: false
      })
    } else {
      const conversation = await mongo.autonomousAgentConversations.findOne(
        { id: run.conversationId },
        { projection: { _id: 0 } }
      )
      if (conversation) {
        await appendMessage(conversation, {
          role: 'assistant',
          author: { kind: 'autonomous-agent', userName: conversation.title },
          content: notice,
          runId: run.id,
          pending: false
        })
      }
    }
    await finishRun(run.id, { status: 'interrupted', stopReason: 'error', error: 'interrupted by a restart' })
  }

  if (orphaned.length) {
    console.log(`[autonomous-agents] swept ${orphaned.length} run(s) left running by a previous process`)
  }
  return orphaned.length
}
