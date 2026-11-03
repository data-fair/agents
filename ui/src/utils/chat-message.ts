/**
 * The shape of one message in an agent conversation, as the chat renders it.
 *
 * The render components, the session chat and the review page agree on this one type; stored parts
 * are mapped onto it by ./autonomous-agent-chat-message.ts.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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
    /** Set when the tripwire withheld the result as a suspected prompt injection: where it came from, and what it said. */
    tripwire?: { excerpt: string, source: { tool: string, server: string, url?: string } }
    /** Why an approval was refused, when the decision gave a reason: the person's, or the reviewer's own. */
    deniedReason?: string
    /** Set when the automated reviewer refused the call, not a person. */
    deniedByReviewer?: true
    /** What the automated reviewer made of a call awaiting a person's approval: why the card is shown. */
    review?: { outcome: 'allow' | 'deny' | 'unsure', reason: string, code: 'cleared' | 'judged' | 'review-failed' | 'breaker-tripped' | 'budget' }
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
  // Per code_mode call id: the calls its script made (api/src/code-mode/code-tools.ts), one panel each.
  tracePanels?: Record<string, { messages: ChatMessage[] }>
}

/**
 * A run of text, a step's reasoning ("thinking", from reasoning models — shown folded where it happened),
 * or the tool calls made between two runs of text (named by their call ids).
 */
export type ChatMessageBlock = { type: 'text', text: string } | { type: 'reasoning', text: string } | { type: 'tools', toolCallIds: string[] }

/**
 * A streamed token, appended where the message is being written: to its last text, or as new text after
 * the calls it last made.
 */
export function appendStreamedText (message: ChatMessage, text: string): ChatMessage {
  return { ...message, content: message.content + text, ...(message.blocks ? { blocks: appendToBlocks(message.blocks, 'text', text) } : {}) }
}

/** A streamed reasoning token, appended to the step's reasoning, or as new reasoning after what came before. */
export function appendStreamedReasoning (message: ChatMessage, text: string): ChatMessage {
  return { ...message, blocks: appendToBlocks(message.blocks ?? (message.content ? [{ type: 'text', text: message.content }] : []), 'reasoning', text) }
}

const appendToBlocks = (blocks: ChatMessageBlock[], type: 'text' | 'reasoning', text: string): ChatMessageBlock[] => {
  const last = blocks[blocks.length - 1]
  return last?.type === type
    ? [...blocks.slice(0, -1), { type, text: last.text + text }]
    : [...blocks, { type, text }]
}
