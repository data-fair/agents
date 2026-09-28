/**
 * Maps a stored autonomous agent message onto the ChatMessage shape the in-page chat's transcript
 * component already renders.
 *
 * Shared so the two types meet in one tested place. The transcript is reused unchanged — no prop is
 * added to it for autonomous agents — so anything the ChatMessage shape cannot carry is surfaced
 * around the transcript rather than inside it.
 */

import type { ChatMessage } from './chat-message.ts'

/**
 * The stored message as the UI reads it, described structurally so `shared/` needs no `#types`
 * alias (which resolves only inside the api workspace).
 *
 * Wider than the mapper itself needs: `runId` and a tool call's `serverId`/`arguments`/`error` are
 * not part of a ChatMessage at all, but they travel with the message and the run-status strip reads
 * them — that is where anything the transcript cannot carry is surfaced.
 */
export interface StoredAutonomousAgentMessage {
  seq: number
  role: 'user' | 'assistant'
  content?: string
  reasoning?: string
  pending?: boolean
  runId?: string
  toolCalls?: {
    toolCallId?: string
    toolName: string
    serverId?: string
    arguments?: string
    failed?: boolean
    error?: string
  }[]
}

export function autonomousAgentMessageToChat (message: StoredAutonomousAgentMessage): ChatMessage {
  const chat: ChatMessage = {
    role: message.role,
    // Required by ChatMessage, and a pending assistant message legitimately has none yet — the
    // renderer indexes into this, so it must never be undefined.
    content: message.content ?? ''
  }
  if (message.reasoning) chat.reasoning = message.reasoning
  if (message.toolCalls?.length) {
    chat.toolInvocations = message.toolCalls.map((call, index) => ({
      // A call is only recorded once the model has emitted it, so an id is normally present; fall
      // back to a stable positional one rather than dropping the call from the transcript.
      toolCallId: call.toolCallId ?? `${message.seq}-${index}`,
      toolName: call.toolName,
      // 'pending' tracks the MESSAGE, not the individual call: the runtime records a call when it
      // is emitted and finalises the whole message at the end of the turn, so there is no
      // per-call completion to read.
      //
      // A FAILED call is deliberately 'done'. ChatMessage has no failure state, and reporting
      // 'pending' would leave a spinner turning for a call that will never return — the failure
      // is shown outside the transcript, where its arguments and error can be read too.
      state: (message.pending && !call.failed) ? 'pending' : 'done'
    }))
  }
  return chat
}

/** In seq order, whatever order they arrived in — an incremental fetch does not promise one. */
export function autonomousAgentMessagesToChat (messages: StoredAutonomousAgentMessage[]): ChatMessage[] {
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
