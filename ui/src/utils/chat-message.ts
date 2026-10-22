/**
 * The shape of one message in an agent conversation, as the chat renders it.
 *
 * The render components, the session chat and the review page agree on this one type; stored parts
 * are mapped onto it by ./autonomous-agent-chat-message.ts.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  // Reasoning ("thinking") tokens from reasoning models, shown collapsed in the UI.
  reasoning?: string
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
    state: 'pending' | 'done' | 'awaiting-approval' | 'denied'
    /** The call's arguments: what a chip is labelled from (a wait's `expecting`), and what an approval card shows. */
    input?: unknown
    /** What the call returned, verbatim as the model got it. Rendered only where a transcript shows tool details. */
    output?: unknown
    /** Why the call failed: the error the model was handed in place of an output. */
    errorText?: string
    /** Why an approval was refused, when the decision gave a reason. */
    deniedReason?: string
    /** Set while the call awaits the person's approval: what their decision names. */
    approvalId?: string
    /** Set while the turn that asked is still finishing: the card shows, but cannot be decided yet. */
    approvalLocked?: boolean
    /** The catalog server the call goes to, shown on an approval card. */
    serverId?: string
    /** The tool's declared annotation title: an approval card's heading. */
    toolTitle?: string
    /** The tool's description, recorded on a gated call: what an approval card says the call will do. */
    description?: string
    /** A gated call's file arguments, as its approval card shows them: path, type, size — or missing. */
    files?: Record<string, { path: string, mimeType?: string, size?: number, missing?: boolean }>
    /** Set on a gated call someone approved: its chip says so, as a denied one says it was declined. */
    approved?: true
  }>
  /**
   * The message in the order it happened: what the agent wrote, the calls a step made, what it wrote
   * next… — rendered in this order, as the stored parts are. `content` and `toolInvocations` stay the
   * flat views the other readers use (scrolling, the welcome check, a localized refusal). Absent, the
   * renderer shows the text, then the calls.
   */
  blocks?: ChatMessageBlock[]
  // Per delegating tool-call id: the sub-agent's transcript. Keyed by toolCallId so
  // concurrent sub-agent calls under one assistant message render in separate panels
  // instead of clobbering one shared array. Workers are stateless (single-shot), so
  // there is no cross-call turn index — each delegation stands alone.
  subAgentPanels?: Record<string, { messages: ChatMessage[] }>
}

/** A run of text, or the tool calls made between two runs of text (named by their call ids). */
export type ChatMessageBlock = { type: 'text', text: string } | { type: 'tools', toolCallIds: string[] }

/**
 * A streamed token, appended where the message is being written: to its last text, or as new text after
 * the calls it last made.
 */
export function appendStreamedText (message: ChatMessage, text: string): ChatMessage {
  const next: ChatMessage = { ...message, content: message.content + text }
  if (message.blocks) {
    const last = message.blocks[message.blocks.length - 1]
    next.blocks = last?.type === 'text'
      ? [...message.blocks.slice(0, -1), { type: 'text', text: last.text + text }]
      : [...message.blocks, { type: 'text', text }]
  }
  return next
}
