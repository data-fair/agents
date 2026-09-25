/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import { nanoid } from 'nanoid'
import { type AccountKeys, httpError } from '@data-fair/lib-express'
import type { AutonomousAgentConversation, AutonomousAgentMessage, AutonomousAgentRun } from '#types'
import { canInstruct, type InstructSession } from '../autonomous-agents/operations.ts'
import { getAutonomousAgent } from '../autonomous-agents/service.ts'

/**
 * Authorization for every runtime route.
 *
 * Deliberately NOT assertAccountRole(owner, 'admin'): a listed instructor may legitimately
 * be a member of another account (the cross-account instruct grant), so the owner's role is
 * not the rule. canInstruct is the single source of truth — it already grants admins of the
 * owning account, listed instructors from anywhere, and superadmins in admin mode.
 */
export const assertCanInstruct = (autonomousAgent: { owner: { type: string, id: string }, instructors?: { userId: string }[] }, session: InstructSession) => {
  if (!canInstruct(autonomousAgent, session)) {
    throw httpError(403, 'you are not allowed to instruct this autonomous agent')
  }
}

/** The autonomous agent behind a request, 404 when it is not this owner's. */
export const requireAutonomousAgent = async (owner: AccountKeys, autonomousAgentId: string) => {
  const autonomousAgent = await getAutonomousAgent(owner, autonomousAgentId)
  if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')
  return autonomousAgent
}

/**
 * A conversation, scoped by owner. The owner scoping IS the cross-account guard here,
 * which is why a conversation of another account reads as 404 rather than 403.
 */
export const requireConversation = async (owner: AccountKeys, conversationId: string) => {
  const conversation = await mongo.autonomousAgentConversations.findOne(
    { id: conversationId, 'owner.type': owner.type, 'owner.id': owner.id },
    { projection: { _id: 0 } }
  )
  if (!conversation) throw httpError(404, 'unknown conversation')
  return conversation
}

/**
 * Append a message and allocate its sequence in one step.
 *
 * The seq comes from a findOneAndUpdate $inc on the conversation rather than a read
 * followed by a write: two people posting at the same moment on a shared timeline must
 * not be handed the same number. The unique { conversationId, seq } index is the backstop.
 */
export const appendMessage = async (
  conversation: AutonomousAgentConversation,
  message: Omit<AutonomousAgentMessage, 'id' | 'seq' | 'createdAt' | 'conversationId' | 'autonomousAgentId' | 'owner'>
): Promise<AutonomousAgentMessage> => {
  const updated = await mongo.autonomousAgentConversations.findOneAndUpdate(
    { id: conversation.id },
    { $inc: { messageSeq: 1 }, $set: { lastMessageAt: new Date().toISOString() } },
    { returnDocument: 'after', projection: { _id: 0 } }
  )
  if (!updated) throw httpError(404, 'unknown conversation')
  const doc: AutonomousAgentMessage = {
    ...message,
    id: nanoid(),
    conversationId: conversation.id,
    autonomousAgentId: conversation.autonomousAgentId,
    owner: conversation.owner,
    seq: updated.messageSeq,
    createdAt: new Date().toISOString()
  }
  await mongo.autonomousAgentMessages.insertOne({ ...doc })
  return doc
}

/** Patch a message in place, for the executor's incremental writes. */
export const updateMessage = async (id: string, patch: Partial<AutonomousAgentMessage>) => {
  await mongo.autonomousAgentMessages.updateOne(
    { id },
    { $set: { ...patch, updatedAt: new Date().toISOString() } }
  )
}

export const createRun = async (run: Omit<AutonomousAgentRun, 'id'>): Promise<AutonomousAgentRun> => {
  const doc: AutonomousAgentRun = { ...run, id: nanoid() }
  await mongo.autonomousAgentRuns.insertOne({ ...doc })
  return doc
}

export const finishRun = async (id: string, patch: Partial<AutonomousAgentRun>) => {
  await mongo.autonomousAgentRuns.updateOne(
    { id },
    { $set: { ...patch, endedAt: new Date().toISOString() } }
  )
}
