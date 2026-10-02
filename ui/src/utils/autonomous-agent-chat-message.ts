/**
 * Maps a stored autonomous agent message onto the ChatMessage shape the in-page chat's transcript
 * component already renders.
 *
 * Shared so the two types meet in one tested place. The transcript is reused unchanged — no prop is
 * added to it for autonomous agents — so anything the ChatMessage shape cannot carry is surfaced
 * around the transcript rather than inside it.
 */

import { isDynamicToolUIPart } from 'ai'
import type { ChatMessage } from './chat-message.ts'

// Named once in shared/, for both sides of the socket. This file used to declare it, and was the only
// place that had it right — the server used an open bag and the wire used unknown[].
import type { MessagePart } from '@agents/shared/message-parts'

/**
 * The stored message as the UI reads it, described structurally so `shared/` needs no `#types`
 * alias (which resolves only inside the api workspace).
 *
 * Wider than the mapper itself needs: `runId` is not part of a ChatMessage at all, but it travels with
 * the message and the run-status strip reads it — that is where anything the transcript cannot carry
 * is surfaced.
 */
export interface StoredConversationMessage {
  seq: number
  role: 'user' | 'assistant'
  pending?: boolean
  runId?: string
  /**
   * The turn's ordered parts, as stored. This is the conversation of record — the same shape the model
   * is replayed from — so the UI renders the same thing the model saw rather than a parallel summary
   * that can drift from it.
   *
   * The AI SDK's own type. It replaced a hand-written union declared here, which was the third copy of
   * the same shape and had already drifted from the other two.
   */
  parts?: AutonomousAgentPart[]
}
export type AutonomousAgentPart = MessagePart

export function autonomousAgentMessageToChat (message: StoredConversationMessage): ChatMessage {
  const parts = message.parts ?? []
  const chat: ChatMessage = {
    role: message.role,
    // Required by ChatMessage, and a pending assistant message legitimately has none yet — the
    // renderer indexes into this, so it must never be undefined.
    content: parts.filter(p => p.type === 'text').map(p => p.text).join('')
  }
  const reasoning = parts.filter(p => p.type === 'reasoning').map(p => p.text).join('')
  if (reasoning) chat.reasoning = reasoning

  // One part per tool call, carrying its own state — so a call that FAILED is readable directly, where
  // it used to be recovered by joining a call part to a separate result part on their shared id. The
  // results themselves are still not rendered: they are tool payloads, and the transcript shows what
  // the agent did, not what it fetched.
  const calls = parts.filter(isDynamicToolUIPart)
  if (calls.length) {
    chat.toolInvocations = calls.map(call => ({
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      // PER CALL, not per message. The states before an output arrives are exactly the ones still
      // running, so a parallel step now shows each call finishing as it finishes, instead of every
      // chip waiting on the slowest. A failed call is 'done', because ChatMessage has no failure
      // state and a spinner turning for a call that will never return is worse than a plain chip —
      // the failure is shown outside the transcript, with its arguments and error.
      state: (call.state === 'input-streaming' || call.state === 'input-available') ? 'pending' : 'done'
    }))
  }
  return chat
}

/** In seq order, whatever order they arrived in — an incremental fetch does not promise one. */
export function messagesToChat (messages: StoredConversationMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => a.seq - b.seq).map(autonomousAgentMessageToChat)
}

/**
 * Merge an incremental batch into what is already held, keyed on `seq`.
 *
 * Keyed on seq rather than appended, because `?sinceVersion=` returns a message that was UPDATED
 * IN PLACE — the assistant's answer being filled in keeps its seq — so appending would duplicate
 * it on every revision.
 */
export function mergeBySeq<T extends { seq: number }> (existing: T[], incoming: T[]): T[] {
  if (!incoming.length) return existing
  const bySeq = new Map(existing.map(message => [message.seq, message]))
  for (const message of incoming) bySeq.set(message.seq, message)
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq)
}
