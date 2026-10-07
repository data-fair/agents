/**
 * A planned task's run as a turn target (see ../conversations/turn-target.ts): the record is the run
 * itself — its `prompt`, its `parts`, its `outcome` — and nobody watches it.
 *
 * Compared with a conversation's target, everything about a person is absent: no history beyond the
 * task's prompt, no frames, no page, no approval to settle. A task run is offered no gated tool and no
 * wait (see withoutGatedTools and the service-tool registry), so a turn that still ends on one is recorded
 * as an error rather than left waiting on someone who will never come.
 */
import mongo from '#mongo'
import type { ConversationRun } from '#types'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'
import { runStopReasonMessage, withAppendedText, partsText, type MessagePart } from '../conversations/operations.ts'
import { settleInterruptedParts } from '../conversations/interrupted-turn.ts'
import { finishTaskRun } from '../conversations/service.ts'
import type { TurnTarget } from '../conversations/turn-target.ts'
import type { TaskOutcome } from '../conversations/service-tools.ts'

/** Why a task run that ended on a wait or an approval request is recorded as failed. */
export const CANNOT_WAIT = 'a task run cannot wait on a person'

/** The text of the turn gate's quota refusal (see checkQuotas' `data-refusal` part), when that is what the turn was. */
const quotaRefusalText = (parts: MessagePart[]): string | undefined => {
  if (!parts.some(part => part.type === 'data-refusal' && (part as { data?: { kind?: string } }).data?.kind === 'quota')) return undefined
  return partsText(parts)
}

/** What happens once a task run's outcome is known: notifications and the pause (./execution.ts). */
export type TaskRunFollowUp = (run: ConversationRun, task: AutonomousAgentTask) => Promise<void>

/**
 * `followUp` is passed in rather than imported, as conversationTarget's wakeIfAnswered is: it lives with
 * the code that starts task runs, which imports this module.
 */
export const taskTarget = (run: ConversationRun, task: AutonomousAgentTask, followUp: TaskRunFollowUp): TurnTarget => {
  let tracked: (() => MessagePart[]) | undefined
  // What report_outcome said last: a second call replaces the first.
  let outcome: TaskOutcome | undefined

  /**
   * Notify and pause BEFORE the run closes, for the reason a conversation's message is finalised before
   * its run: the terminal status is what a reader stops on, and it must already find what followed.
   *
   * INVARIANT: the run always reaches its terminal status. The follow-up can never prevent the close: its
   * failure is caught and logged, and the close runs in the finally whatever happened.
   */
  // Once per run: a close whose write throws is followed by `fail`, which must not notify a second time.
  let followedUp = false
  const closeWith = async (patch: Partial<ConversationRun>) => {
    try {
      if (!followedUp) {
        followedUp = true
        await followUp({ ...run, ...patch }, task)
      }
    } catch (err) {
      console.error(`task run ${run.id} could not be followed up`, err)
    } finally {
      await finishTaskRun(run, patch)
    }
  }

  return {
    surface: 'task',
    history: async () => ({
      messages: [{ role: 'user', content: `Planned task "${task.title}":\n\n${run.prompt}` }],
      credits: 0,
      hostBlockChars: 0
    }),
    // Conditional on the run still running, so a late write from an abandoned turn cannot overwrite the
    // parts its close already wrote.
    persist: async (parts) => { await mongo.runs.updateOne({ id: run.id, status: 'running' }, { $set: { parts } }) },
    frames: { delta: () => {}, activity: () => {}, message: () => {}, subAgent: () => {} },
    settleEarlierCall: async () => {
      // Unreachable: only a replayed approval produces a result for an earlier call, and nothing in a task
      // run asks for approval.
      throw new Error('a task run has no earlier call to settle')
    },
    track: (parts) => { tracked = parts },
    partsSoFar: () => tracked && structuredClone(tracked()),
    reportOutcome: (reported) => { outcome = reported },

    close: async (result) => {
      // A quota refusal at the turn's gate is the account's state, not the task failing: recorded skipped,
      // like a start refused on the account cap (startTaskRun) — no notification, no step toward a pause.
      const quotaRefusal = quotaRefusalText(result.parts)
      if (quotaRefusal !== undefined) {
        await closeWith({ status: 'skipped', parts: result.parts, error: quotaRefusal })
        return
      }
      const cannotWait = !!(result.awaitingApproval || result.handover)
      const stopReason = cannotWait ? 'error' : result.stopReason
      // A turn that stopped for a reason other than finishing explains itself, as a conversation's does.
      const notice = !cannotWait && (stopReason === 'completed' || result.selfExplained)
        ? ''
        : runStopReasonMessage(stopReason, cannotWait ? CANNOT_WAIT : result.stopDetail)
      // Cut short by a guard or a ceiling (step limit, repeated calls, the run's budget or the account cap
      // reached mid-run): in a chat the person reads the notice, but nobody reads a task run — it did not
      // do its task, so it is a failure, notified and counted toward the pause, its stopReason kept.
      const cutShort = stopReason === 'budget' || stopReason === 'step-limit' || stopReason === 'repeated-calls'
      await closeWith({
        status: stopReason === 'error' || cutShort ? 'error' : 'done',
        stopReason,
        parts: notice ? withAppendedText(result.parts, notice) : result.parts,
        ...(cannotWait ? { error: CANNOT_WAIT } : cutShort ? { error: notice } : {}),
        ...(outcome ? { outcome } : {})
      })
    },

    fail: async ({ stopReason, status, error, detail, interrupt }) => {
      // Every call still open gets a result saying why it never completed, and the stop is explained —
      // the same record a conversation's failed turn leaves.
      const settled = settleInterruptedParts(tracked ? structuredClone(tracked()) : [], interrupt)
      await closeWith({
        status,
        stopReason,
        parts: withAppendedText(settled, runStopReasonMessage(stopReason, detail)),
        ...(error !== undefined ? { error } : {}),
        ...(outcome ? { outcome } : {})
      })
    }
  }
}
