/**
 * Where a turn reads its context from and writes its record to: the seam between the model loop and a
 * conversation.
 *
 * The loop (executor.ts, runModelLoop) produces a turn's parts and nothing else. Everything that makes
 * those parts a CONVERSATION's lives here:
 *  - loading and compacting the stored history, and folding the page's context into it;
 *  - persisting the structure mid-turn;
 *  - streaming frames to whoever watches;
 *  - settling a call an earlier turn made;
 *  - exposing the answer so far to a page attaching mid-turn.
 * One implementation today. A planned task's run is the second (docs/superpowers/specs/
 * 2026-10-07-autonomous-agent-planned-execution-design.md): its record is the run itself, and nobody
 * watches it.
 */

import type { ModelMessage } from 'ai'
import type { Conversation, ConversationRun } from '#types'
import type { MessagePart } from './operations.ts'
import type { ChatActivity } from '@agents/shared/agent-activity'
import type { UsageIdentity } from '../usage/enforce.ts'
import type { getSettings } from '../settings/service.ts'
import type { AgentSession } from '../agent-session/session.ts'
import { withHostContext } from '@agents/shared/host-events'
import { loadHistory, compactHistory } from './turn-history.ts'
import { pendingWaitReminder } from './interrupted-turn.ts'
import { updateMessage, settleStoredToolPart } from './service.ts'
import { sessionFor } from '../agent-session/registry.ts'

/** What a watcher is told while a turn runs. A target nobody watches sends nothing. */
export interface TurnFrames {
  delta: (kind: 'text' | 'reasoning', text: string) => void
  activity: (value: ChatActivity | null, parentToolCallId?: string) => void
  /** This turn's message as it stands; `pending` until the turn is over. */
  message: (parts: MessagePart[], pending: boolean) => void
  subAgent: (frame: { parentToolCallId: string, name: string, parts: MessagePart[], pending: boolean }) => void
}

export interface TurnHistoryRequest {
  run: ConversationRun
  identity: UsageIdentity
  budget: number
  settings: Awaited<ReturnType<typeof getSettings>>
  abortSignal: AbortSignal
  agentId: string
}

export interface TurnTarget {
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
export const liveParts = (conversationId: string, messageSeq: number): MessagePart[] | undefined => {
  const live = liveTurns.get(conversationId)
  return live && live.messageSeq === messageSeq ? structuredClone(live.parts()) : undefined
}

/** Forget a turn once it is settled. Keyed by its message, so a later turn already registered is left alone. */
export const releaseLiveTurn = (conversationId: string, messageSeq: number) => {
  if (liveTurns.get(conversationId)?.messageSeq === messageSeq) liveTurns.delete(conversationId)
}

/**
 * A conversation's turn: history from its messages, the record on its assistant message (`messageSeq`,
 * created empty and pending by runTurn), frames to whoever watches it NOW.
 */
export const conversationTarget = (run: ConversationRun, messageSeq: number, conversation: Conversation): TurnTarget => {
  // WHO SEES THIS TURN: whoever watches the conversation now, read at each send. The session the turn
  // started with is still what its page tools and host events belong to; but a reload or a second tab
  // replaces it mid-turn, and a turn sending to the session it began with went silent for the page
  // actually open — not even its `turn-end` arrived.
  const watcher = () => sessionFor(run.conversationId)
  const session = sessionFor(run.conversationId)
  return {
    session,
    historyUpToSeq: messageSeq,
    history: async ({ run, identity, budget, settings, abortSignal, agentId }) => {
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
      // This closes a gap the prototype had: the socket collected host state and host events into the
      // store, `wait_for_user_action` consumed the events, and the retained state was never told to the
      // model at all — so an assistant asked "what am I looking at?" had the answer in memory beside it
      // and no way to read it.
      //
      // In the last USER message rather than in the system prompt, which is where the browser loop put it
      // and for the same two reasons: the system prompt is the stable, cacheable prefix and page state
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
    track: (parts) => { liveTurns.set(run.conversationId, { messageSeq, parts }) }
  }
}
