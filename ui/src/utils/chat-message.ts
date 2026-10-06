/**
 * The shape of one message in an agent conversation, as the chat renders it.
 *
 * It lives here rather than in the UI composable that used to own it so the render
 * components, the session chat and the review page agree on one type. Moved verbatim
 * from the browser loop's composable (use-agent-chat, since removed); stored parts are
 * mapped onto it by ./autonomous-agent-chat-message.ts.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  // Reasoning ("thinking") tokens from reasoning models, shown collapsed in the UI.
  reasoning?: string
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
    state: 'pending' | 'done'
  }>
  // Per delegating tool-call id: the sub-agent's transcript. Keyed by toolCallId so
  // concurrent sub-agent calls under one assistant message render in separate panels
  // instead of clobbering one shared array. Workers are stateless (single-shot), so
  // there is no cross-call turn index — each delegation stands alone.
  subAgentPanels?: Record<string, { messages: ChatMessage[] }>
  // Set on the trailing sub-agent message when the worker stopped at its step limit
  // while still mid-tool-chain (truncated, not finished). The message content is the
  // best-effort answer recovered by the forced close-out turn (or empty if that failed);
  // toModelOutput uses the flag to mark the result partial instead of reporting success.
  stepLimitReached?: boolean
}
