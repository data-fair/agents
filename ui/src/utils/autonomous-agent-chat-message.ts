/**
 * Maps a stored autonomous agent message onto the ChatMessage shape the in-page chat's transcript
 * component already renders.
 *
 * Shared so the two types meet in one tested place. The transcript is reused nearly unchanged — its
 * one autonomous-agent prop is the agent's API path, where an approval card reads the task a planning
 * call changes — so anything the ChatMessage shape cannot carry is surfaced around the transcript
 * rather than inside it.
 */

import { isDynamicToolUIPart } from 'ai'
import type { ChatMessage, ChatMessageBlock } from './chat-message.ts'

// Named once in shared/, for both sides of the socket. This file used to declare it, and was the only
// place that had it right — the server used an open bag and the wire used unknown[].
import type { MessagePart } from '@agents/shared/message-parts'

/**
 * The stored message as the UI reads it, described structurally so `shared/` needs no `#types`
 * alias (which resolves only inside the api workspace).
 */
export interface StoredConversationMessage {
  seq: number
  role: 'user' | 'assistant'
  pending?: boolean
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

type InvocationReview = NonNullable<NonNullable<ChatMessage['toolInvocations']>[number]['review']>
/** The reviewer's record on a call (ReviewRecord in api/src/approval-review/operations.ts), when it is well formed. */
const reviewOf = (call: unknown): InvocationReview | undefined => {
  const review = (call as any).toolMetadata?.review
  if (!review || typeof review.reason !== 'string' || typeof review.outcome !== 'string' || typeof review.code !== 'string') return undefined
  return review
}

export function autonomousAgentMessageToChat (message: StoredConversationMessage): ChatMessage {
  const parts = message.parts ?? []
  const chat: ChatMessage = {
    role: message.role,
    // Required by ChatMessage, and a pending assistant message legitimately has none yet — the
    // renderer indexes into this, so it must never be undefined.
    //
    // Separate parts are separate paragraphs. The loop merges a step's text into one part, so a new
    // text part means a step or a tool call came between — joined with nothing, the sentences on
    // either side ran together ("…levels.Now let me…").
    content: parts.filter(p => p.type === 'text').map(p => p.text).join('\n\n')
  }

  // One part per tool call, carrying its own state — so a call that FAILED is readable directly, where
  // it used to be recovered by joining a call part to a separate result part on their shared id. The
  // results are carried too, but only a transcript that shows tool details (the review page, a task
  // run) renders them: the chat shows what the agent did, not what it fetched.
  const calls = parts.filter(isDynamicToolUIPart)
  if (calls.length) {
    chat.toolInvocations = calls.map(call => {
      const review = reviewOf(call)
      return {
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        // What the chip is labelled from: a wait's chip names what it waits for. Dropped here, every
        // wait chip read "Waiting for: " with nothing after it.
        input: call.input,
        ...(call.state === 'output-available' ? { output: call.output } : {}),
        ...(call.state === 'output-error' ? { errorText: call.errorText } : {}),
        ...(typeof (call as any).toolMetadata?.tripwire?.excerpt === 'string' && (call as any).toolMetadata.tripwire.source
          ? { tripwire: { excerpt: (call as any).toolMetadata.tripwire.excerpt, source: (call as any).toolMetadata.tripwire.source } }
          : {}),
        // A reviewer's denial (api/src/approval-review) gives the model its own text in approval.reason; the person
        // reads the reviewer's reason, kept in toolMetadata.review. A person's rejection after a review is theirs.
        ...(call.state === 'output-denied' && call.approval.isAutomatic && review
          ? { deniedByReviewer: true as const, ...(review.reason ? { deniedReason: review.reason } : {}) }
          : call.state === 'output-denied' && call.approval.reason ? { deniedReason: call.approval.reason } : {}),
        // What the reviewer made of a call put to a person, for its card.
        ...(call.state === 'approval-requested' && review ? { review: { outcome: review.outcome, reason: review.reason, code: review.code } } : {}),
        // PER CALL, not per message. The states before an output arrives are exactly the ones still
        // running, so a parallel step now shows each call finishing as it finishes, instead of every
        // chip waiting on the slowest. A failed call is 'done', because ChatMessage has no failure
        // state and a spinner turning for a call that will never return is worse than a plain chip —
        // the failure is shown outside the transcript, with its arguments and error.
        // Awaiting approval and denied are their own states: the first renders as a card the person acts
        // on, the second as a declined chip. An approved call still running is pending.
        ...(call.state === 'approval-requested' ? { approvalId: call.approval.id } : {}),
        // Shown but not yet decidable while the message asking is still being written: the server refuses
        // a decision until the turn has closed it (it would be overwritten by the turn's last writes).
        ...(call.state === 'approval-requested' && message.pending ? { approvalLocked: true } : {}),
        ...(typeof (call as any).toolMetadata?.serverId === 'string' ? { serverId: (call as any).toolMetadata.serverId } : {}),
        // What an approval card reads, so it speaks the tool's words rather than its name.
        ...(typeof (call as any).toolMetadata?.annotations?.title === 'string' ? { toolTitle: (call as any).toolMetadata.annotations.title } : {}),
        ...(typeof (call as any).toolMetadata?.description === 'string' ? { description: (call as any).toolMetadata.description } : {}),
        // The files a gated call would send (api/src/files/call-path.ts describeFileArguments), for its card.
        ...((call as any).toolMetadata?.files && typeof (call as any).toolMetadata.files === 'object' ? { files: (call as any).toolMetadata.files } : {}),
        // The decision recorded on the call (conversations/service.ts decideApproval). Without it an approved
        // call's chip read like any other, and a judged agent could tell the person it still awaited approval.
        ...((call as any).toolMetadata?.decision?.approved === true ? { approved: true as const } : {}),
        state: call.state === 'approval-requested'
          ? 'awaiting-approval'
          : call.state === 'output-denied'
            ? 'denied'
            : (call.state === 'input-streaming' || call.state === 'input-available' || call.state === 'approval-responded') ? 'pending' : 'done'
      }
    })
  }
  // The order the parts were written in, which the flat views above lose: a call made between two
  // sentences shows between them, not after the whole answer. Consecutive calls (one step's) share a row.
  const blocks: ChatMessageBlock[] = []
  for (const part of parts) {
    if (part.type === 'text') {
      if (part.text) blocks.push({ type: 'text', text: part.text })
    } else if (part.type === 'reasoning') {
      // A step's reasoning where it happened, in one block however many parts the provider streamed it in.
      // Some providers send an empty one (the reasoning itself withheld): nothing to fold, so no block.
      const last = blocks[blocks.length - 1]
      if (last?.type === 'reasoning') last.text += part.text
      else if (part.text?.trim()) blocks.push({ type: 'reasoning', text: part.text })
    } else if (isDynamicToolUIPart(part)) {
      const last = blocks[blocks.length - 1]
      if (last?.type === 'tools') last.toolCallIds.push(part.toolCallId)
      else blocks.push({ type: 'tools', toolCallIds: [part.toolCallId] })
    }
  }
  chat.blocks = blocks
  // A script's stored trace, under its code_mode call — the panel a reloaded thread or the review page
  // shows. Live, the chat gets the same thing from `trace` frames, and those win.
  for (const part of parts as any[]) {
    if (part?.type !== 'data-trace' || !part.data?.parentToolCallId) continue
    chat.tracePanels = {
      ...chat.tracePanels,
      [part.data.parentToolCallId]: { messages: [autonomousAgentMessageToChat({ seq: 0, role: 'assistant', parts: part.data.parts ?? [] })] }
    }
  }
  return chat
}
