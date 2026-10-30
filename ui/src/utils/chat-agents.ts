/**
 * The shapes the chat's switcher and history read.
 *
 * Deliberately local to the UI rather than generated from the API's schemas: they are projections of
 * two runtime responses (`GET /conversations/:type/:id/agents` and `GET /conversations/:type/:id`),
 * not stored documents, and the projection is the contract — the UI never sees `nhi`, `instructors`
 * or a conversation's full document through these routes.
 */

/** One entry of the chat's agent picker. */
export interface AgentOption {
  id: string
  title: string
}

/** One thread in the chat's history, newest first. */
export interface ConversationSummary {
  id: string
  agentId: string
  /** A date string for a thread the chat created; a caller-supplied title otherwise. */
  title?: string
  lastMessageAt?: string
  createdAt?: string
}
