/**
 * The websocket channel naming for a conversation.
 *
 * It lived in `shared/` while the UI subscribed to these channels directly. The unified chat runs on
 * the agent-session socket and no longer does, so the publisher is the only consumer left — and the
 * shared-contract test says exactly this: a shared module without a UI consumer belongs under
 * `api/src`. Kept as its own module rather than inlined in events.ts because the tests exercise the
 * parser against the same prefix the publisher builds.
 */

/**
 * The websocket channel of one conversation.
 *
 * One channel per conversation: per-run would make a client re-subscribe every turn and miss
 * anything between them, and per-agent would broadcast one thread's content to another
 * thread's subscribers — a real disclosure, since a timeline is shared by several people.
 *
 * The slash form deliberately differs from the conversation LOCK id
 * (`conversation:<id>`, colon-separated): sharing a spelling between a lock
 * key and a subscribable channel is how one ends up used as the other.
 */
const CHANNEL_PREFIX = 'conversations/'

export function conversationChannel (conversationId: string): string {
  return `${CHANNEL_PREFIX}${conversationId}`
}

/**
 * The conversation a channel names, or undefined when the channel is not ours.
 *
 * Deliberately strict: exactly one non-empty segment after the prefix. A subscriber must not
 * be able to widen or redirect a subscription by appending segments.
 */
export function channelConversationId (channel: string): string | undefined {
  if (!channel.startsWith(CHANNEL_PREFIX)) return undefined
  const rest = channel.slice(CHANNEL_PREFIX.length)
  if (!rest || rest.includes('/')) return undefined
  return rest
}
