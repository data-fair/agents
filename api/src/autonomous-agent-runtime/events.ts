/**
 * Publishing and subscribing to an autonomous agent conversation.
 *
 * Stateful half of the event surface; the channel naming itself is pure and lives in
 * operations.ts. Everything emitted here reaches every authorized subscriber, so a payload
 * carries only what the HTTP routes already expose to a reader of that conversation: no
 * credential, and nothing beyond what is persisted on the message.
 */

import { emit } from '@data-fair/lib-node/ws-emitter.js'
import mongo from '#mongo'
import { canInstruct, type InstructSession } from '../autonomous-agents/operations.ts'
import { conversationChannel, channelConversationId } from './operations.ts'

/**
 * What a subscriber receives: a bare "this conversation changed, and it is now at version N".
 *
 * Deliberately tiny and constant-size, and deliberately carrying NO content. Three reasons:
 *  - ws-server authorizes a subscription once, at connect time, and caches the session on the
 *    upgrade request. Nothing revalidates it, so a revoked instructor keeps receiving whatever is
 *    published for as long as the socket stays open. Carrying no content means the worst that
 *    leaks is the fact that something changed; the record is read over HTTP, where authorization
 *    is re-checked on every request.
 *  - ws-emitter's queue is a CAPPED collection of 100 000 bytes total. An event bigger than that
 *    cannot be inserted at all, so a long assistant message would silently lose the very event a
 *    client needs. A fixed-size notification cannot hit that ceiling.
 *  - it removes a whole class of divergence: there is no payload that can disagree with the
 *    stored document, because there is no payload.
 *
 * The client's half is one call: `GET .../messages?sinceVersion=<last seen>`.
 */
export interface AutonomousAgentConversationChanged {
  conversationId: string
  version: number
}

/**
 * Authorization for a subscription — the same rule as the HTTP routes, through the same
 * `canInstruct`, so the two cannot drift apart.
 *
 * Returns false rather than throwing: ws-server turns false into a 403, while an exception
 * becomes a 500 whose message would tell a caller more than a refusal should. Note that
 * ws-server skips this callback entirely for a session in admin mode, so a superadmin
 * subscribes to anything and is not a useful subject for a test of this rule.
 */
export const canSubscribeAutonomousAgent = async (channel: string, sessionState: any): Promise<boolean> => {
  try {
    const conversationId = channelConversationId(channel)
    if (!conversationId) return false
    if (!sessionState?.user?.id || !sessionState.account) return false

    const conversation = await mongo.autonomousAgentConversations.findOne(
      { id: conversationId },
      { projection: { _id: 0 } }
    )
    if (!conversation) return false

    const autonomousAgent = await mongo.autonomousAgents.findOne(
      { id: conversation.autonomousAgentId },
      { projection: { _id: 0 } }
    )
    if (!autonomousAgent) return false

    return canInstruct(autonomousAgent, sessionState as InstructSession)
  } catch (err) {
    console.error('autonomous agent subscription check failed', err)
    return false
  }
}

/**
 * Tell subscribers the conversation moved to a new version.
 *
 * Always AFTER the write it describes, so a client that fetches on the notification always finds
 * at least what it was told about. Failures are swallowed and logged: the documents are the source
 * of truth, so a dropped notification costs liveness, not correctness — and a client that also
 * refetches on reconnect or focus recovers on its own.
 */
export const notifyConversationChanged = async (conversationId: string, version?: number) => {
  if (version === undefined) return
  try {
    await emit(conversationChannel(conversationId), { conversationId, version } satisfies AutonomousAgentConversationChanged)
  } catch (err) {
    console.error('autonomous agent conversation notification could not be published', err)
  }
}
