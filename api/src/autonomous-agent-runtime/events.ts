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
import type { AutonomousAgentMessage, AutonomousAgentRun } from '#types'
import { canInstruct, type InstructSession } from '../autonomous-agents/operations.ts'
import { conversationChannel, channelConversationId } from './operations.ts'

/**
 * What a subscriber receives.
 *
 * `seq` is on every message-bearing variant so a client can notice a hole in the sequence and
 * refetch with `?sinceSeq=`. Without it a dropped event is indistinguishable from an ordering
 * difference, and the client silently diverges from the server.
 */
export type AutonomousAgentConversationEvent =
  | { type: 'message', seq: number, message: AutonomousAgentMessage }
  | { type: 'message-revision', seq: number, revision: number, content: string, reasoning?: string }
  | { type: 'run', run: AutonomousAgentRun }

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
 * Publish an event to a conversation's channel.
 *
 * Always AFTER the persisted change it describes, never before, so a client that reloads from
 * the HTTP routes never disagrees with what it was told. Failures are swallowed and logged:
 * the documents are the source of truth, so a dropped event costs liveness, not correctness.
 */
export const emitConversationEvent = async (conversationId: string, event: AutonomousAgentConversationEvent) => {
  try {
    await emit(conversationChannel(conversationId), event)
  } catch (err) {
    console.error('autonomous agent conversation event could not be published', err)
  }
}
