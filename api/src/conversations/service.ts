/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { standardAgent } from '../agent-session/standard-agents.ts'
import { nanoid } from 'nanoid'
import { type AccountKeys, httpError } from '@data-fair/lib-express'
import { expiredArchiveFilter } from '../retention.ts'
import Debug from 'debug'
import type { AutonomousAgent, Conversation, ConversationRun } from '#types'
// The stored shape, whose `parts` carry the library's own part type (see mongo.ts).
import type { StoredMessage } from '#mongo'
import { canInstruct, type InstructSession } from '../autonomous-agents/operations.ts'
import { notifyConversationChanged } from './events.ts'
import { getAutonomousAgent, assertOrganizationOwner } from '../autonomous-agents/service.ts'

const debug = Debug('df-agents:conversations')

/**
 * Authorization for every runtime route.
 *
 * Deliberately NOT assertAccountRole(owner, 'admin'): a listed instructor may legitimately
 * be a member of another account (the cross-account instruct grant), so the owner's role is
 * not the rule. canInstruct is the single source of truth — it already grants admins of the
 * owning account, listed instructors from anywhere, and superadmins in admin mode.
 */
/**
 * Who may START a conversation with this agent.
 *
 * Still a grant, and still the sentence that matters when adding someone: a configured agent acts with
 * its OWN non-human identity, which may reach further than the person using it. What this no longer
 * governs is reading or writing an existing conversation — see assertOwnsConversation.
 */
export const assertCanInstruct = (autonomousAgent: { owner: { type: string, id: string }, instructors?: { userId: string }[] }, session: InstructSession) => {
  if (!canInstruct(autonomousAgent, session)) {
    throw httpError(403, 'you are not allowed to instruct this autonomous agent')
  }
}

/**
 * A conversation belongs to ONE person, and only they may read or write it.
 *
 * This replaces `assertCanInstruct` on every conversation-scoped route, and it is the whole of what
 * dropping the shared timeline means in access terms. The previous rule — anyone who may instruct the
 * agent may read every thread of it — is what made an org admin a reader of everyone's conversations,
 * and what the attribution envelope existed to make safe.
 *
 * `adminMode` is the only escape, as everywhere else in this service: a superadmin acting deliberately,
 * not an org admin by virtue of their role. An org admin sees nothing by default, which is the privacy
 * position the design takes.
 */
export const assertOwnsConversation = (conversation: { userId?: string }, session: InstructSession) => {
  if (session.user.adminMode) return
  if (conversation.userId && conversation.userId === session.user.id) return
  throw httpError(403, 'this conversation belongs to someone else')
}

/** The autonomous agent behind a request, 404 when it is not this owner's. */
export const requireAutonomousAgent = async (owner: AccountKeys, agentId: string) => {
  const autonomousAgent = await resolveAgent(owner, agentId)
  if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')
  return autonomousAgent
}

/**
 * The agent a conversation names: a configured one from the store, or the personal assistant.
 *
 * ONE resolver, because the claim this prototype tests is that the loop does not care which it is
 * serving. Everything downstream — the system prompt, the tool gathering, the guards, the spend — reads
 * the same shape; only the reserved id and the absence of an `nhi` distinguish them, and the second is
 * what the identity port keys on.
 *
 * A standard agent is built per call rather than stored,
 * so it costs no collection and no migration (see ../agent-session/standard-agents.ts).
 */
export const resolveAgent = async (owner: AccountKeys, agentId: string) => {
  // Standard agents FIRST, which is also what reserves their ids: a configured agent sharing an id
  // would otherwise shadow one, and a conversation naming it would resolve to the wrong identity.
  const standard = standardAgent(agentId, config.mcpServers ?? [])
  if (standard) return { ...standard, owner } as unknown as AutonomousAgent
  // Anything else is a CONFIGURED agent, and those remain organization-owned: their identity rests on
  // an NHI, which simple-directory binds to exactly one organization. Asserted rather than left to the
  // lookup below returning nothing — it would, since configured agents are stored org-owned, but a 404
  // reads as "no such agent" when the real answer is "not on this kind of account".
  assertOrganizationOwner(owner)
  return await getAutonomousAgent(owner, agentId)
}

/**
 * A conversation, scoped by owner. The owner scoping IS the cross-account guard here,
 * which is why a conversation of another account reads as 404 rather than 403.
 */
export const requireConversation = async (owner: AccountKeys, conversationId: string) => {
  const conversation = await mongo.conversations.findOne(
    // ARCHIVED threads are excluded, which is what makes "the person deleted it" true for them even
    // though the document survives for review: this is the lookup behind reading a thread, posting to
    // it, and binding a socket to it, so excluding it here covers all three at once rather than in
    // each route. Review reads the collection directly and therefore still sees them.
    { id: conversationId, 'owner.type': owner.type, 'owner.id': owner.id, archivedAt: { $exists: false } },
    { projection: { _id: 0 } }
  )
  if (!conversation) throw httpError(404, 'unknown conversation')
  return conversation
}

/**
 * A conversation by id alone, for a caller that does not know which account it belongs to.
 *
 * THE SOCKET IS THAT CALLER, and getting this wrong broke the embedded case completely. A page embeds
 * the chat of the account that owns the data — so a person using someone else's portal is an EXTERNAL
 * caller: their session account is their own, the conversation belongs to the host account, and the
 * two legitimately differ. The session derived the owner from the session's account, so every turn in
 * that configuration answered "unknown conversation" while the account's own members were fine.
 *
 * Resolving by id is not a weaker gate, it is a different one: a conversation belongs to ONE person,
 * so the caller is then checked against `userId` by `assertOwnsConversation` — which is the rule the
 * HTTP routes apply too — and the role quota is enforced per turn by the executor's own gate. What is
 * gone is only the assumption that a thread lives in the caller's own account.
 */
export const requireConversationById = async (conversationId: string) => {
  const conversation = await mongo.conversations.findOne(
    { id: conversationId, archivedAt: { $exists: false } },
    { projection: { _id: 0 } }
  )
  if (!conversation) throw httpError(404, 'unknown conversation')
  return conversation
}

/**
 * Hide a thread from the person while keeping it reviewable.
 *
 * Returns false when there was nothing to archive, so a caller cannot mistake "already gone" for
 * "archived".
 */
export const archiveConversation = async (conversationId: string): Promise<boolean> => {
  const result = await mongo.conversations.updateOne(
    { id: conversationId, archivedAt: { $exists: false } },
    { $set: { archivedAt: new Date().toISOString() } }
  )
  return result.modifiedCount > 0
}

/** Delete a thread and everything hanging off it. Messages and runs are separate documents. */
export const purgeConversation = async (conversationId: string): Promise<{ messages: number, runs: number }> => {
  const messages = await mongo.messages.deleteMany({ conversationId })
  const runs = await mongo.runs.deleteMany({ conversationId })
  await mongo.conversations.deleteOne({ id: conversationId })
  return { messages: messages.deletedCount, runs: runs.deletedCount }
}

/**
 * Purge archived threads whose review window has closed.
 *
 * A sweep rather than a mongo TTL index, and deliberately: a TTL deletes the document it indexes and
 * nothing else, so it would leave this conversation's messages and runs orphaned in their own
 * collections — still readable by id, which for data that was supposed to expire is the whole
 * failure. Run at boot and daily, beside the usage cleanup.
 *
 * Keyed on `lastMessageAt`, not on `archivedAt`: the window is 30 days from when the exchange
 * happened, so deleting a thread cannot extend how long it stays visible.
 */
export const purgeExpiredArchives = async (): Promise<number> => {
  const expired = await mongo.conversations
    .find(expiredArchiveFilter(), { projection: { _id: 0, id: 1 } })
    .toArray()
  for (const conversation of expired) await purgeConversation(conversation.id)
  if (expired.length) debug('purged %d archived conversation(s) past the review window', expired.length)
  return expired.length
}

/**
 * Advance the conversation's version and return the new value.
 *
 * Every change a client might need to see goes through here — a message appended, a message
 * updated in place, a run transition — so one number is enough for a client to know it is behind,
 * and `?sinceVersion=` is enough to catch up. $inc, so two concurrent writers cannot collide on
 * it the way a timestamp would in the same millisecond.
 */
const bumpConversationVersion = async (conversationId: string): Promise<number | undefined> => {
  const updated = await mongo.conversations.findOneAndUpdate(
    { id: conversationId },
    { $inc: { version: 1 }, $set: { updatedAt: new Date().toISOString() } },
    { returnDocument: 'after', projection: { _id: 0, version: 1 } }
  )
  return updated?.version
}

/**
 * Append a message and allocate its sequence in one step.
 *
 * The seq comes from a findOneAndUpdate $inc on the conversation rather than a read
 * followed by a write: two people posting at the same moment on a shared timeline must
 * not be handed the same number. The unique { conversationId, seq } index is the backstop.
 */
export const appendMessage = async (
  conversation: Conversation,
  message: Omit<StoredMessage, 'id' | 'seq' | 'createdAt' | 'conversationId' | 'agentId' | 'owner'>
): Promise<StoredMessage> => {
  const updated = await mongo.conversations.findOneAndUpdate(
    { id: conversation.id },
    // One round trip allocates both: the seq (per message) and the version (per change).
    { $inc: { messageSeq: 1, version: 1 }, $set: { lastMessageAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
    { returnDocument: 'after', projection: { _id: 0 } }
  )
  if (!updated) throw httpError(404, 'unknown conversation')
  const doc: StoredMessage = {
    ...message,
    id: nanoid(),
    conversationId: conversation.id,
    agentId: conversation.agentId,
    owner: conversation.owner,
    seq: updated.messageSeq,
    version: updated.version,
    createdAt: new Date().toISOString()
  }
  await mongo.messages.insertOne({ ...doc })
  // After the write, never before. The notification carries no content — just "there is
  // something at version N" — so a client always reads the record over HTTP, where authorization
  // is re-checked and nothing is size-capped.
  await notifyConversationChanged(conversation.id, doc.version)
  return doc
}

/**
 * Patch a message in place, for the executor's incremental writes.
 *
 * findOneAndUpdate rather than updateOne plus a read: the event carries the RESULTING document,
 * and two round trips would let a concurrent write make the event disagree with what is stored.
 */
export const updateMessage = async (id: string, patch: Partial<StoredMessage>) => {
  const existing = await mongo.messages.findOne({ id }, { projection: { _id: 0, conversationId: 1 } })
  if (!existing) return
  // The version has to advance for an in-place update too, or an incremental fetch cannot see it:
  // the assistant message keeps its seq while its content is filled in, so `seq` alone would only
  // ever reveal NEW messages.
  const version = await bumpConversationVersion(existing.conversationId)
  await mongo.messages.updateOne(
    { id },
    { $set: { ...patch, version, updatedAt: new Date().toISOString() } }
  )
  await notifyConversationChanged(existing.conversationId, version)
}

export const createRun = async (run: Omit<ConversationRun, 'id'>): Promise<ConversationRun> => {
  const doc: ConversationRun = { ...run, id: nanoid() }
  const version = await bumpConversationVersion(doc.conversationId)
  await mongo.runs.insertOne({ ...doc, version })
  await notifyConversationChanged(doc.conversationId, version)
  return { ...doc, version }
}

/**
 * Add one step's spend to a run, as it happens.
 *
 * $inc rather than a value written at finish time: a turn abandoned at its deadline keeps
 * streaming (abort() is only a request, and a provider may ignore it), and its later steps
 * are really billed through recordUsage. If the run's own numbers were written once when it
 * was closed out, the run and the usage records would then disagree about what was spent.
 */
/**
 * Record whether this thread may be read by an admin of the account.
 *
 * One flag on the conversation, which is what the privacy model describes: the thread is stored
 * either way so the person can return to it and is not admin-visible; this is what makes it visible.
 */
export const setReviewConsent = async (conversationId: string, consented: boolean) => {
  await mongo.conversations.updateOne({ id: conversationId }, { $set: { consentedToReview: consented } })
}

/**
 * Append one model call's telemetry to the run.
 *
 * `$push` rather than a read-modify-write: several calls of one turn settle independently (the
 * summarizer finishes while the assistant is still streaming), and a read-modify-write would lose
 * whichever landed second.
 */
export const appendRunCall = async (id: string, call: NonNullable<ConversationRun['calls']>[number]) => {
  await mongo.runs.updateOne({ id }, { $push: { calls: call } })
}

/** The instructions this run gave the model, recorded once. */
export const setRunSystemPrompt = async (id: string, systemPrompt: string) => {
  await mongo.runs.updateOne({ id }, { $set: { systemPrompt } })
}

export const incrementRunSpend = async (id: string, credits: number, steps: number) => {
  await mongo.runs.updateOne({ id }, { $inc: { credits, steps } })
}

/**
 * Close a run out. Conditional on it still being `running`, so two writers cannot both decide
 * how a run ended — the boot sweep of another instance racing the instance that is actually
 * executing it, for example. Returns whether this call was the one that closed it.
 */
export const finishRun = async (id: string, patch: Partial<ConversationRun>): Promise<boolean> => {
  const existing = await mongo.runs.findOne({ id, status: 'running' }, { projection: { _id: 0, conversationId: 1 } })
  if (!existing) return false
  const version = await bumpConversationVersion(existing.conversationId)
  const updated = await mongo.runs.findOneAndUpdate(
    { id, status: 'running' },
    { $set: { ...patch, version, endedAt: new Date().toISOString() } },
    { returnDocument: 'after', projection: { _id: 0 } }
  )
  // Only the call that actually closed the run notifies, so a losing racer cannot announce a
  // second, contradictory terminal state.
  if (updated) await notifyConversationChanged(existing.conversationId, version)
  return !!updated
}

/**
 * Persist the compaction recap for a conversation.
 *
 * A CACHE, deliberately kept on the conversation rather than in the message log: the log is the
 * conversation of record and a compaction must never rewrite it. Writing here does not bump the
 * conversation version, because nothing a reader can see has changed — a version bump would wake every
 * subscriber to refetch a transcript that is byte-identical.
 */
export const saveCompaction = async (
  conversationId: string,
  compaction: { summary: string, generation: number, coversUpToSeq: number }
) => {
  await mongo.conversations.updateOne(
    { id: conversationId },
    { $set: { compaction: { ...compaction, createdAt: new Date().toISOString() } } }
  )
}
