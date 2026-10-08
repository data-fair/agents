/**
 * Where a turn reads its context from and writes its record to: the seam between the model loop and
 * what the turn is a turn OF.
 *
 * The loop (executor.ts, runModelLoop) produces a turn's parts and nothing else, and the driver
 * (executor.ts, driveTurn) runs it to a terminal state. Everything that makes those parts a
 * CONVERSATION's lives here:
 *  - loading and compacting the stored history, and folding the page's context into it;
 *  - persisting the structure mid-turn;
 *  - streaming frames to whoever watches;
 *  - settling a call an earlier turn made;
 *  - exposing the answer so far to a page attaching mid-turn;
 *  - writing the final record and closing the run, on both ends of a turn: `close` when it returned,
 *    `fail` when it threw.
 * A planned task's run is the other implementation (../tasks/task-target.ts): its record is the run
 * itself, and nobody watches it.
 */

import mongo from '#mongo'
import { InvalidToolApprovalSignatureError, type ModelMessage } from 'ai'
import type { Conversation, ConversationMessage } from '#types'
import {
  runStopReasonMessage, partsText, withAppendedText, textPart,
  type MessagePart, type ConversationTurnRun, type RunStopReason
} from './operations.ts'
import type { ChatActivity } from '@agents/shared/agent-activity'
import type { UsageIdentity } from '../usage/enforce.ts'
import type { getSettings } from '../settings/service.ts'
import type { AgentSession } from '../agent-session/session.ts'
import type { TurnSurface, TaskOutcome } from './service-tools.ts'
import { withHostContext, LOCATION_KEY } from '@agents/shared/host-events'
import { MODERATION_REFUSAL } from '../moderation/operations.ts'
import { loadHistory, compactHistory } from './turn-history.ts'
import { pendingWaitReminder, settleInterruptedParts, type InterruptReason } from './interrupted-turn.ts'
import { updateMessage, settleStoredToolPart, finishTurn, conversationCost } from './service.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { maybeReflect } from '../memory/reflection.ts'

/** What a watcher is told while a turn runs. A target nobody watches sends nothing. */
export interface TurnFrames {
  delta: (kind: 'text' | 'reasoning', text: string) => void
  activity: (value: ChatActivity | null, parentToolCallId?: string) => void
  /** This turn's message as it stands; `pending` until the turn is over. */
  message: (parts: MessagePart[], pending: boolean) => void
  subAgent: (frame: { parentToolCallId: string, name: string, parts: MessagePart[], pending: boolean }) => void
}

export interface TurnHistoryRequest {
  identity: UsageIdentity
  budget: number
  settings: Awaited<ReturnType<typeof getSettings>>
  abortSignal: AbortSignal
  agentId: string
}

/** What one turn produced. The model loop replaces the body that fills this in. */
export interface TurnResult {
  /** The turn's ordered parts — the record itself, not a rendering of it. */
  parts: MessagePart[]
  steps: number
  credits: number
  stopReason: RunStopReason
  /** Which ceiling stopped it, when the stop reason alone would be ambiguous. */
  stopDetail?: string
  /** The wait the turn handed over on, left open for the person to answer (stopReason 'waiting'). */
  handover?: { toolCallId: string, expecting?: string }
  /** The turn ended on a call needing the person's approval (stopReason 'awaiting-approval'). */
  awaitingApproval?: true
  /**
   * The idle watchdog aborted the stream. The SDK ends an aborted stream without throwing, so the turn
   * still returns — but approved calls run before any part is emitted, unseen by the watchdog, and one
   * slower than its timeout may have run (or still be running) when it fired.
   */
  idleAborted?: true
  /**
   * Set when the parts ALREADY say what went wrong, so no stop-reason notice is appended.
   *
   * One turn, one explanation. An empty completion is the case: it reports `error` — the run must
   * record a fault, and a test and an admin both read that — while its message already carries the
   * "I was not able to produce a response" fallback. Without this the person got both that sentence
   * and a generic "this turn failed", which reads as two different failures.
   */
  selfExplained?: boolean
  /**
   * Set when the model loop already published the settled message frame.
   *
   * EXACTLY ONE settled frame per turn, which is a contract and not an optimisation: a client reads
   * `pending: false` as "this turn is done", so a second identical frame is an extra end-of-turn
   * signal. A test helper that returns on the first one then reads the duplicate as the NEXT turn's
   * answer — which is how a passing suite turned into a drained-events failure that had nothing to do
   * with draining.
   *
   * The paths that return before any model call (moderation, quotas, a missing identity) leave this
   * unset, and the target's `close` publishes for them.
   */
  published?: boolean
}

/**
 * How a turn that THREW ended, as the driver (executor.ts, driveTurn) classified it: the target settles
 * its record from this and closes the run.
 */
export interface TurnFailure {
  stopReason: RunStopReason
  /** The run's terminal status: a late moderation block is `done`, declining WAS the answer. */
  status: 'error' | 'aborted' | 'done'
  /** The error recorded on the run; absent for a late moderation block. */
  error?: string
  /** What the throw said, for the notice. */
  detail: string
  aborted: boolean
  /** Aborted by a moderation verdict that landed after the gate failed open. */
  lateBlocked: boolean
  /** What the calls still open are settled as having been interrupted by. */
  interrupt: InterruptReason
  /** The throw itself, for a target that must tell one kind of failure from another. */
  cause: unknown
}

export interface TurnTarget {
  /** Which tools the service adds to the turn (see ./service-tools.ts). */
  surface: TurnSurface
  /** The page in front of the person, as the turn started: its tools and host events. Undefined is normal. */
  session?: AgentSession
  /** The history bound recorded on the turn's telemetry; a conversation's is the turn's own message. */
  historyUpToSeq?: number
  /** The model's context for this turn, within budget, as it is sent. */
  history: (request: TurnHistoryRequest) => Promise<{ messages: ModelMessage[], credits: number, hostBlockChars: number }>
  /** Persist the turn's structure as it stands: called when a call opens or settles. */
  persist: (parts: MessagePart[]) => Promise<void>
  frames: TurnFrames
  /** A result for a call an EARLIER turn made: an approved call the SDK executed on replay. */
  settleEarlierCall: (toolCallId: string, settled: Parameters<typeof settleStoredToolPart>[2]) => Promise<void>
  /** Expose the parts being produced to a reader attaching mid-turn (and to the turn's own catch path). */
  track: (parts: () => MessagePart[]) => void
  /** The parts tracked so far, when the turn got as far as producing any: what a failure is settled from. */
  partsSoFar: () => MessagePart[] | undefined
  /** Where `report_outcome` lands: only a task run has an outcome to report (see ./service-tools.ts). */
  reportOutcome?: (outcome: TaskOutcome) => void
  /** The normal end: write the record and close the run. */
  close: (result: TurnResult) => Promise<void>
  /** The end of a turn that threw: settle the record from what it produced, and close the run. */
  fail: (failure: TurnFailure) => Promise<void>
}

/**
 * The answer each live turn is producing, by conversation — what a page attaching mid-turn is shown.
 *
 * The growing answer is NOT written back as it streams: a watching browser receives every token, and
 * the store gets the answer at the end. This registry is what replaces the write for the watcher's side: a
 * page reloaded, or a second tab opened, mid-turn gets the answer so far on attach and the rest live —
 * the turn sends to whoever watches the conversation NOW (`watcher` in conversationTarget), not to the
 * session it started with — and a turn stopped or failing is settled from it. What is given up: a
 * restart mid-answer loses the text of the step in progress. Tool calls and their results are still
 * written as they happen (`persist`), and those are the work worth keeping.
 *
 * In-process, like the sessions themselves: the turn runs in the process holding the socket.
 */
const liveTurns = new Map<string, { messageSeq: number, parts: () => MessagePart[] }>()

/** The answer a live turn of this conversation has produced so far, if one is running here. */
export const liveTurnOf = (conversationId: string) => {
  const live = liveTurns.get(conversationId)
  return live && { messageSeq: live.messageSeq, parts: structuredClone(live.parts()) }
}

/** The parts a live turn of this conversation produced so far, when it is THIS message's turn. */
const liveParts = (conversationId: string, messageSeq: number): MessagePart[] | undefined => {
  const live = liveTurns.get(conversationId)
  return live && live.messageSeq === messageSeq ? structuredClone(live.parts()) : undefined
}

/** Forget a turn once it is settled. Keyed by its message, so a later turn already registered is left alone. */
const releaseLiveTurn = (conversationId: string, messageSeq: number) => {
  if (liveTurns.get(conversationId)?.messageSeq === messageSeq) liveTurns.delete(conversationId)
}

/**
 * Tell a watching page what its conversation has cost so far (see the `cost` frame). Only when
 * someone is watching: the aggregate is cheap, but there is no reason to run it for nobody.
 */
const sendConversationCost = async (conversationId: string, known?: number) => {
  const session = sessionFor(conversationId)
  if (!session) return
  session.send({ type: 'cost', conversationCost: await conversationCost(conversationId, known === undefined ? undefined : { credits: known }) })
}

/**
 * Settle, as an error, every approved call an approval run leaves without a result.
 *
 * ONE RULE AT THE END OF EVERY `approval` RUN, whatever the path. Only that run could execute those
 * calls (the SDK does it from the last message on replay), so once it is over, a call still
 * `approval-responded` never will be — refused before the model (disabled, no identity, a quota), a
 * run that threw before it (an unreachable MCP server), or a message posted before the run started, so
 * that the replay ended on it instead. Left as it is, every later replay would carry an approved call
 * with no result after it, which providers reject.
 *
 * Bounded to messages BEFORE the run's own (`beforeSeq`): a call this run made and stopped may already
 * have been approved by the person while the run was finishing, and belongs to the next continuation.
 * And settleStoredToolPart matches only `approval-responded`, so a call the run did settle is untouched.
 */
export const settleApprovedWithoutRunning = async (conversationId: string, beforeSeq: number | undefined, errorText: string) => {
  const messages = await mongo.messages
    .find(
      { conversationId, 'parts.state': 'approval-responded', ...(beforeSeq !== undefined ? { seq: { $lt: beforeSeq } } : {}) },
      { projection: { _id: 0, parts: 1 } }
    )
    .toArray()
  for (const message of messages) {
    for (const part of message.parts as MessagePart[]) {
      if (part.type !== 'dynamic-tool' || part.state !== 'approval-responded') continue
      const settled = await settleStoredToolPart(conversationId, part.toolCallId, { state: 'output-error', errorText })
      if (settled) sessionFor(conversationId)?.send({ type: 'message', seq: settled.seq, role: 'assistant', parts: settled.parts as MessagePart[], pending: false })
    }
  }
}

/** The error an approved call is settled with when its run ended normally without executing it. */
const APPROVED_NOT_RUN = 'Approved, but it did not run: the turn continuing from the decision ended without reaching it.'

/** The error an approved call is settled with when its run ended — threw, timed out, died — without it reporting. */
export const unknownApprovedOutcome = (detail: string) => `Approved, but its outcome is unknown: the turn ended before it reported (${detail}).`

/**
 * Close a conversation's run that failed before its target was opened: no assistant message exists
 * (appendMessage itself failed), so the run carries the failure alone. Otherwise the same rules as
 * `fail`: an approval run settles its approved calls, and a watcher is told the turn ended.
 */
export const closeConversationRunBare = async (run: ConversationTurnRun, failure: TurnFailure) => {
  const { status, stopReason, error } = failure
  const detail = error ?? ''
  if (run.trigger === 'approval') {
    await settleApprovedWithoutRunning(run.conversationId, undefined, unknownApprovedOutcome(detail))
      .catch(settleErr => console.error('approved calls could not be settled', settleErr))
  }
  const finished = await finishTurn(run, undefined, { status, stopReason, ...(error !== undefined ? { error } : {}) })
    .catch(finishErr => { console.error('autonomous agent run could not be closed out', finishErr); return undefined })
  await sendConversationCost(run.conversationId, finished?.conversationCredits).catch(() => {})
  sessionFor(run.conversationId)?.send({ type: 'turn-end', stopReason, detail })
}

/**
 * A conversation's turn: history from its messages, the record on its assistant message (`message`,
 * created empty and pending by runTurn), frames to whoever watches it NOW.
 *
 * `wakeIfAnswered` is the executor's, passed in rather than imported (that would be a cycle): a turn
 * that handed over looks, once closed, for an answer the person gave while it was finishing.
 */
export const conversationTarget = (
  run: ConversationTurnRun,
  message: Pick<ConversationMessage, 'id' | 'seq'>,
  conversation: Conversation,
  wakeIfAnswered: (conversationId: string) => Promise<void>
): TurnTarget => {
  const messageSeq = message.seq
  // WHO SEES THIS TURN: whoever watches the conversation now, read at each send. The session the turn
  // started with is still what its page tools and host events belong to; but a reload or a second tab
  // replaces it mid-turn, and a turn sending to the session it began with went silent for the page
  // actually open — not even its `turn-end` arrived.
  const watcher = () => sessionFor(run.conversationId)
  const session = sessionFor(run.conversationId)
  const partsSoFar = () => liveParts(run.conversationId, messageSeq)
  return {
    surface: 'chat',
    session,
    historyUpToSeq: messageSeq,
    history: async ({ identity, budget, settings, abortSignal, agentId }) => {
      const compacted = await compactHistory(
        run,
        identity,
        await loadHistory(run.conversationId, messageSeq, conversation),
        budget,
        settings,
        abortSignal,
        { agentId }
      )
      // What the page has reported, folded into the last user turn at CALL time.
      //
      // In the last USER message rather than in the system prompt, for two reasons: the system prompt is the stable, cacheable prefix and page state
      // changes every turn, and state presented as a standing instruction reads to the model as a rule
      // rather than as an observation. Not persisted — it decorates this request only, so the stored
      // conversation stays a record of what was said rather than of what was on screen each time.
      //
      // Plus, when the person's latest message interrupted a wait, the reminder that they were waited on
      // (port of main's #75): LAST in the hidden block, so it is the final thing the model reads before
      // their words. In the interrupted wait's own result it sat in history ahead of the new question, and
      // judged runs answered the question and never waited again.
      const reminder = pendingWaitReminder(compacted.messages)
      const hostBlocks = { chars: 0 }
      const history = session || reminder
        ? withHostContext(compacted.messages, session?.hostEvents ?? null, reminder ? [reminder] : [], hostBlocks)
        : compacted.messages
      return { messages: history, credits: compacted.credits, hostBlockChars: hostBlocks.chars }
    },
    persist: async (parts) => { await updateMessage(run.conversationId, messageSeq, { parts, pending: true }) },
    frames: {
      delta: (kind, text) => { watcher()?.send({ type: 'delta', kind, text }) },
      activity: (value, parentToolCallId) => {
        watcher()?.send({ type: 'activity', activity: value, ...(parentToolCallId ? { parentToolCallId } : {}) })
      },
      message: (parts, pending) => { watcher()?.send({ type: 'message', seq: messageSeq, role: 'assistant', parts, pending }) },
      subAgent: (frame) => { watcher()?.send({ type: 'subagent', ...frame }) }
    },
    settleEarlierCall: async (toolCallId, settled) => {
      const message = await settleStoredToolPart(run.conversationId, toolCallId, settled)
      if (message) watcher()?.send({ type: 'message', seq: message.seq, role: 'assistant', parts: message.parts as MessagePart[], pending: false })
    },
    track: (parts) => { liveTurns.set(run.conversationId, { messageSeq, parts }) },
    partsSoFar,

    close: async (result) => {
      // An approval run leaves no approved call without a result (see settleApprovedWithoutRunning).
      // Before the run closes, so a reader stopping on the closed run already finds them settled.
      //
      // Both wordings say "did not run", because on THIS path it is certain: the SDK executes approved
      // calls before the first step and reports every one of them (a result, an error or a denial), so a
      // call still `approval-responded` after a run that RETURNED was never executed — its replay ended
      // on another message (one posted before the run started). Except after an idle abort, which ends
      // the stream without throwing while a slow approved call may still be executing.
      if (run.trigger === 'approval') {
        await settleApprovedWithoutRunning(run.conversationId, messageSeq, !result.published
          // REFUSED before the model was reached.
          ? `Approved, but the turn could not run: ${partsText(result.parts).trim() || 'it was refused'}`
          : result.idleAborted
            ? unknownApprovedOutcome('the model stream went silent')
            : APPROVED_NOT_RUN)
      }
      // A turn that stopped for a reason other than finishing explains itself, appended to
      // whatever it did manage to produce.
      // A handover is not a stop to explain: its own message, already in the parts, says what is next.
      const notice = result.stopReason === 'completed' || result.stopReason === 'waiting' || result.stopReason === 'awaiting-approval' || result.selfExplained
        ? ''
        : runStopReasonMessage(result.stopReason, result.stopDetail)
      const finalParts = notice ? withAppendedText(result.parts, notice) : result.parts
      // The answer and the run's close in one write sequence under one version bump — see finishTurn.
      // A run stopped by a guard or a budget is still a completed run: it did work and said so. But a
      // turn that REFUSED — no enrolled identity, an exhausted credit cap — returns stopReason 'error'
      // without throwing, and must not be reported as done.
      const handoverLocation = result.handover
        ? sessionFor(run.conversationId)?.hostEvents.snapshot().state.find(event => event.key === LOCATION_KEY)?.detail
        : undefined
      const finished = await finishTurn(
        run,
        { seq: messageSeq, patch: { parts: finalParts as any, pending: false } },
        { status: result.stopReason === 'error' ? 'error' : 'done', stopReason: result.stopReason },
        result.handover
          ? {
              pendingWait: {
                messageSeq,
                toolCallId: result.handover.toolCallId,
                ...(result.handover.expecting ? { expecting: result.handover.expecting } : {}),
                since: new Date().toISOString(),
                ...(handoverLocation ? { location: handoverLocation } : {}),
                // The person whose turn handed over: their action starts the next one, billed as theirs.
                ...(run.triggeredBy ? { triggeredBy: run.triggeredBy } : {}),
                ...(run.triggeredByRole ? { triggeredByRole: run.triggeredByRole } : {})
              }
            }
          : {}
      )
      // PUBLISHED FOR THE PATHS THE LOOP NEVER REACHED: a moderation block, a quota refusal and a
      // missing non-human identity all return their refusal before any model call, so the loop's own
      // settled frame never ran — the text was stored and the watching page was told nothing. A blocked
      // message showed the person an empty turn and a stopped spinner, with the refusal they were
      // supposed to read sitting in the database until a reload.
      // An approval request's card becomes decidable here, once the message is closed in the store — not
      // at the loop's last frame, which went out before finishTurn (see decideApproval).
      if (!result.published || result.awaitingApproval) {
        sessionFor(run.conversationId)?.send({
          type: 'message',
          seq: messageSeq,
          role: 'assistant',
          parts: finalParts as any,
          pending: false
        })
      }

      // The conversation's total, now including this turn — returned by the close itself — then the
      // end-of-turn signal, so a page that refreshes on turn-end already holds the new figure.
      // Best-effort: a figure for a display must never turn a finished turn into a failed one.
      await sendConversationCost(run.conversationId, finished.conversationCredits).catch(() => {})
      // A handover's label, BEFORE turn-end: it outlives the turn — it tells the person the next move is
      // theirs, and keeps Stop on screen to decline it — and sent first there is no instant between the
      // turn ending and the wait showing, in which the chat would read as simply done.
      if (result.handover) {
        sessionFor(run.conversationId)?.send({ type: 'activity', activity: { kind: 'waiting', expecting: result.handover.expecting ?? '' } })
      }
      if (result.awaitingApproval) {
        const pending = finalParts.find(p => p.type === 'dynamic-tool' && p.state === 'approval-requested')
        sessionFor(run.conversationId)?.send({ type: 'activity', activity: { kind: 'approval', toolName: pending?.type === 'dynamic-tool' ? pending.toolName : '' } })
      }
      // The end-of-turn signal, so a watching page stops its spinner without polling for it.
      sessionFor(run.conversationId)?.send({
        type: 'turn-end',
        stopReason: result.stopReason,
        ...(result.stopDetail ? { detail: result.stopDetail } : {})
      })
      // MEMORY REFLECTION, off the person's path: a long thread is reflected once it has grown enough;
      // a thread that simply ends is caught by the idle sweep (api/src/memory/reflection.ts). Not on a
      // handover nor on an approval request — the exchange is mid-way, and the next turn comes back here.
      if (!result.handover && !result.awaitingApproval) {
        maybeReflect(run.conversationId, 'turn').catch(err => console.error('memory reflection could not start', err))
      }
      if (result.handover) {
        // The person may have acted while the turn was still finishing: that answer is already buffered.
        await wakeIfAnswered(run.conversationId).catch(err => console.error('could not wake a conversation on its pending wait', err))
      }
      // Only once the close went through: a close that threw is followed by `fail`, which settles the
      // turn FROM the live parts and releases them itself.
      releaseLiveTurn(run.conversationId, messageSeq)
    },

    fail: async ({ stopReason, status, error, detail, lateBlocked, interrupt, cause }) => {
      try {
        // The message is finalised FIRST, and the run closed after, because the terminal run state
        // is the end-of-turn signal a reader stops on: closing the run first
        // would leave every failed, aborted and timed-out turn showing a message stuck `pending`.
        //
        // This does NOT give up the guarantee that sent these two the other way round originally —
        // that whatever brought us here (a mongo blip, a shutdown) is likely to fail the message
        // write too, and a run left `running` is worse than a message left without its notice,
        // since the run is what every reader and the boot sweep key on. That is preserved by
        // CATCHING the message write rather than by ordering it last: finishRun still runs.
        //
        // APPENDED to what was persisted, not replacing it. `message` is the empty document created
        // before the turn, so the partial text and the tool traffic the executor has since written live
        // only in the store — replacing the parts here would delete the record of everything the turn
        // actually did, which is exactly what must survive a failure.
        // From MEMORY when the turn ran here, which is the common case: the answer's text is written
        // only at the end, so the store holds the tool traffic but not what was said around it — a
        // reply stopped mid-sentence would lose its words from the record. The store is the fallback for
        // a turn that never got as far as producing parts.
        const live = partsSoFar()
        const persisted = live
          ? { parts: live }
          : await mongo.messages
            .findOne({ id: message.id }, { projection: { _id: 0, parts: 1 } })
            .catch(() => null)
        // Every call still open gets a result saying why it never completed (port of main's #73): a call
        // with no result is dropped on replay, so the model would never learn what it had been doing —
        // judged runs then denied work they had done and redid it.
        const settled = settleInterruptedParts((persisted?.parts ?? []) as MessagePart[], interrupt)
        // No stop notice when the person SPOKE: their message follows and answers it, and the notice
        // would be replayed to the model as its own words. Stop, the clock and errors keep theirs.
        const finalParts = lateBlocked
          // A LATE moderation block: the reply to a message that should never have been answered is
          // dropped, and the person reads the same refusal as an on-time block. The tool calls already
          // made stay, settled, because they happened — and a call without its result is dropped on
          // replay, which would hide from the model that it had acted.
          ? [...settled.filter(part => part.type === 'dynamic-tool'), { type: 'data-refusal', data: { kind: 'moderation' } } as MessagePart, textPart(MODERATION_REFUSAL)]
          : interrupt === 'message' ? settled : withAppendedText(settled, runStopReasonMessage(stopReason, detail))
        // The same rule as the success path, for a run that threw: whether a call ran before the throw is
        // not known here, so it says so — except for a signature that failed verification, which the SDK
        // checks before executing anything (a secret rotated between the request and the decision): those
        // calls certainly did not run. Caught, like the message write below: the run must still close.
        if (run.trigger === 'approval') {
          await settleApprovedWithoutRunning(run.conversationId, messageSeq, InvalidToolApprovalSignatureError.isInstance(cause)
            ? `Approved, but it did not run: the approval could not be verified (${detail}).`
            : unknownApprovedOutcome(detail))
            .catch(settleErr => console.error('approved calls could not be settled', settleErr))
        }
        // The message, then the run, under one bump (finishTurn) — the message write CAUGHT inside it, so
        // whatever failed it still lets the run close.
        const finished = await finishTurn(
          run,
          { seq: messageSeq, patch: { parts: finalParts as any, pending: false } },
          { status, stopReason, ...(error !== undefined ? { error } : {}) }
        ).catch(finishErr => { console.error('autonomous agent run could not be closed out', finishErr); return undefined })
        // Same reason as the success path: the notice explaining the failure has to reach the page that
        // is watching, not only the store. `turn-end` alone stops the spinner without saying why. From
        // the parts just written, rather than read back.
        sessionFor(run.conversationId)?.send({ type: 'message', seq: messageSeq, role: 'assistant', parts: finalParts as any, pending: false })
        // A failed turn ends the same way for a watcher as a successful one: the page must stop waiting
        // whatever happened. "Failure is a message, not a silence" applies to the socket too.
        //
        // LAST, as on the success path, and that order is the contract: `turn-end` means "the record is
        // final". It used to go out first, before the message was settled — so anything reacting to it,
        // a client refetching or a test reading the record, could see an interrupted turn's calls still
        // open. Found by the interrupted-turn api spec, which passed alone and failed in sequence.
        await sendConversationCost(run.conversationId, finished?.conversationCredits).catch(() => {})
        sessionFor(run.conversationId)?.send({ type: 'turn-end', stopReason, detail })
      } finally {
        // Only now: the settling above reads the live parts. Keyed by the message, so a later turn of the
        // same conversation that already registered is left alone.
        releaseLiveTurn(run.conversationId, messageSeq)
      }
    }
  }
}
