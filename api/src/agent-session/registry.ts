/**
 * Which live session, if any, belongs to a conversation.
 *
 * THE PAYOFF OF COLOCATION, and the reason this is a plain Map rather than infrastructure. The loop
 * runs in the process holding the socket, so "is someone watching this conversation, and what can their
 * page do?" is an in-memory lookup. The alternative — a loop that might be in another process — needs
 * sticky routing or a cross-process rendezvous for the same answer, which is the cost the earlier
 * two-platform design was weighing.
 *
 * In-process only, like the live-runs registry it sits beside, and for the same reason: a turn does not
 * migrate, so the process holding the connection is the only one that could serve it.
 */

import Debug from 'debug'
import type { AgentSession } from './session.ts'

const debug = Debug('agents:agent-session-registry')

const byConversation = new Map<string, AgentSession>()

/**
 * Bind a session to a conversation.
 *
 * A second attach REPLACES the first: a reconnect, a second tab, or a reloaded page all look like
 * this, and the newest connection is the one the person is actually looking at. The displaced session
 * is told, so its tab shows something rather than silently going deaf.
 */
export const attachSession = (conversationId: string, session: AgentSession) => {
  const displaced = byConversation.get(conversationId)
  if (displaced && displaced !== session) {
    displaced.send({ type: 'error', message: 'this conversation was opened somewhere else' })
  }
  byConversation.set(conversationId, session)
  debug('attached %s, %d live', conversationId, byConversation.size)
}

/**
 * Unbind, but only if this session is still the one bound.
 *
 * The guard matters: a reconnect attaches the new session before the old one's close event fires, so an
 * unguarded detach would clobber the live binding and leave a connected tab unreachable.
 */
export const detachSession = (conversationId: string, session: AgentSession) => {
  if (byConversation.get(conversationId) !== session) return
  byConversation.delete(conversationId)
  debug('detached %s, %d live', conversationId, byConversation.size)
}

/**
 * The session watching this conversation, or undefined.
 *
 * Undefined is a normal answer, not a failure: a turn can legitimately run with nobody watching — a
 * conversation whose tab was closed mid-turn, and, later, a scheduled run that never had one. Such a
 * turn simply has no page tools and streams to no one; the stored message is still the record.
 */
export const sessionFor = (conversationId: string): AgentSession | undefined => byConversation.get(conversationId)

/** How many conversations have a watcher. The prototype's per-conversation cost signal. */
export const attachedSessionCount = () => byConversation.size
