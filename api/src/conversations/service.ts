/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { standardAgent, isStandardAgentId } from '../agent-session/standard-agents.ts'
import { assertRoleQuota } from '../auth.ts'
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
 * Start an anonymous visitor's thread. It lives as long as the socket that asks for it (see the
 * `anonymous` field of the conversation schema).
 *
 * The checks the HTTP create route applies to a signed-in caller, restated for one who has no
 * session: a STANDARD agent only — a configured agent's instructors are named people, which an
 * anonymous visitor is not — and an account whose anonymous quota is open at all.
 */
export const createAnonymousConversation = async (
  owner: AccountKeys,
  agentId: string,
  usageUserId: string,
  quotas: Parameters<typeof assertRoleQuota>[1]
): Promise<Conversation> => {
  if (!isStandardAgentId(agentId)) throw httpError(403, 'an anonymous visitor can only talk to a standard agent')
  assertRoleQuota('anonymous', quotas)
  const now = new Date().toISOString()
  const conversation: Conversation = {
    id: nanoid(),
    agentId,
    // Typed organization-only by the schema, but a standard agent's thread may sit on a personal
    // account as well — the HTTP create route stores whatever account the agent resolved to.
    owner: owner as Conversation['owner'],
    userId: usageUserId,
    userName: 'Anonymous',
    anonymous: true,
    title: 'Anonymous conversation',
    createdAt: now,
    messageSeq: 0,
    credits: 0
  }
  await mongo.conversations.insertOne({ ...conversation })
  return conversation
}

/** How long an anonymous thread survives the socket that created it, when its close never ran. */
export const ANONYMOUS_ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000

/**
 * Purge anonymous threads left behind by a socket whose close handler never ran — a crash, a kill.
 *
 * Keyed on `updatedAt`, which every message and run transition bumps, so a thread still in use is
 * not swept from under its socket. Not done at boot by "every anonymous thread": with several API
 * instances, one booting would delete the threads another is serving.
 */
export const purgeAbandonedAnonymous = async (now = new Date()): Promise<number> => {
  const cutoff = new Date(now.getTime() - ANONYMOUS_ABANDONED_AFTER_MS).toISOString()
  const abandoned = await mongo.conversations
    .find({ anonymous: true, $or: [{ updatedAt: { $lt: cutoff } }, { updatedAt: { $exists: false }, createdAt: { $lt: cutoff } }] }, { projection: { _id: 0, id: 1 } })
    .toArray()
  for (const conversation of abandoned) await purgeConversation(conversation.id)
  if (abandoned.length) debug('purged %d abandoned anonymous conversation(s)', abandoned.length)
  return abandoned.length
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
const bumpConversationVersion = async (conversationId: string, credits = 0): Promise<{ version?: number, credits?: number }> => {
  const updated = await mongo.conversations.findOneAndUpdate(
    { id: conversationId },
    // The conversation's running total rides the same write when a turn's spend is flushed (see
    // `finishTurn`), so keeping it costs no operation of its own.
    { $inc: { version: 1, ...(credits ? { credits } : {}) }, $set: { updatedAt: new Date().toISOString() } },
    { returnDocument: 'after', projection: { _id: 0, version: 1, credits: 1 } }
  )
  return { version: updated?.version, credits: updated?.credits }
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
export const updateMessage = async (conversationId: string, id: string, patch: Partial<StoredMessage>) => {
  // The version has to advance for an in-place update too, or an incremental fetch cannot see it:
  // the assistant message keeps its seq while its content is filled in, so `seq` alone would only
  // ever reveal NEW messages. The conversation is the caller's to name — every caller holds it — which
  // spares a lookup on each of a turn's incremental writes.
  const { version } = await bumpConversationVersion(conversationId)
  const updated = await mongo.messages.updateOne(
    { id, conversationId },
    { $set: { ...patch, version, updatedAt: new Date().toISOString() } }
  )
  if (updated.matchedCount) await notifyConversationChanged(conversationId, version)
}

export const createRun = async (run: Omit<ConversationRun, 'id'>): Promise<ConversationRun> => {
  const doc: ConversationRun = { ...run, id: nanoid() }
  const { version } = await bumpConversationVersion(doc.conversationId)
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
  const buffer = runBuffers.get(id)
  if (buffer) { buffer.calls.push(call); return }
  await mongo.runs.updateOne({ id }, { $push: { calls: call } })
}

/** The instructions this run gave the model, recorded once. */
export const setRunSystemPrompt = async (id: string, systemPrompt: string) => {
  const buffer = runBuffers.get(id)
  if (buffer) { buffer.systemPrompt = systemPrompt; return }
  await mongo.runs.updateOne({ id }, { $set: { systemPrompt } })
}

export const incrementRunSpend = async (id: string, credits: number, steps: number) => {
  const buffer = runBuffers.get(id)
  if (buffer) { buffer.credits += credits; buffer.steps += steps; return }
  // Unbuffered: a turn abandoned at its deadline, still spending after its run was closed. The run
  // and the conversation's total are both kept true, at two writes — rare enough not to matter.
  const run = await mongo.runs.findOneAndUpdate({ id }, { $inc: { credits, steps } }, { projection: { _id: 0, conversationId: 1 } })
  if (run && credits) await mongo.conversations.updateOne({ id: run.conversationId }, { $inc: { credits } })
}

/**
 * A live run's telemetry and spend, held until it closes instead of written as they happen.
 *
 * A turn wrote its system prompt, then a call record and a spend increment PER STEP, each a write of
 * its own — for data only read after the turn (review, the export, the cost). The executor's budget is
 * tracked in memory, so nothing reads them mid-turn. `finishTurn`/`finishRun` fold them into the write
 * that closes the run; after that the buffer is gone and a late writer (a turn abandoned at its
 * deadline, still spending) writes directly. The price: a process dying mid-turn loses that turn's
 * telemetry. Its spend is not lost — the usage ledger is written per call, separately.
 */
interface RunBuffer { calls: NonNullable<ConversationRun['calls']>, credits: number, steps: number, systemPrompt?: string }
const runBuffers = new Map<string, RunBuffer>()

export const bufferRunWrites = (runId: string) => {
  if (!runBuffers.has(runId)) runBuffers.set(runId, { calls: [], credits: 0, steps: 0 })
}

/** The run update that applies a drained buffer, and its spend. */
const drainRunBuffer = (runId: string) => {
  const buffer = runBuffers.get(runId)
  runBuffers.delete(runId)
  if (!buffer) return { set: {}, update: {}, credits: 0 }
  return {
    set: buffer.systemPrompt !== undefined ? { systemPrompt: buffer.systemPrompt } : {},
    update: {
      ...(buffer.calls.length ? { $push: { calls: { $each: buffer.calls } } } : {}),
      ...(buffer.credits || buffer.steps ? { $inc: { credits: buffer.credits, steps: buffer.steps } } : {})
    },
    credits: buffer.credits
  }
}

/**
 * What a conversation has cost so far, in credits: the sum of its runs.
 *
 * Kept as a running total on the conversation, added to by the write that closes each run, so reading
 * it is the conversation's own document rather than an aggregate over its runs on every attach and
 * every turn. A conversation from before the total existed (absent until upgrade/0.12.0 backfills it)
 * falls back to the aggregate.
 */
export const conversationCost = async (conversationId: string, known?: { credits?: number }): Promise<number> => {
  const credits = known ?? await mongo.conversations.findOne({ id: conversationId }, { projection: { _id: 0, credits: 1 } })
  if (typeof credits?.credits === 'number') return credits.credits
  const [total] = await mongo.runs.aggregate<{ credits: number }>([
    { $match: { conversationId } },
    { $group: { _id: null, credits: { $sum: { $ifNull: ['$credits', 0] } } } }
  ]).toArray()
  return total?.credits ?? 0
}

/**
 * Close a run out. Conditional on it still being `running`, so two writers cannot both decide
 * how a run ended — the boot sweep of another instance racing the instance that is actually
 * executing it, for example. Returns whether this call was the one that closed it.
 */
export const finishRun = async (run: { id: string, conversationId: string }, patch: Partial<ConversationRun>): Promise<boolean> => {
  return (await finishTurn(run, undefined, patch)).closed
}

/**
 * Close a turn: its final message, if any, and its run — under ONE version bump and one notification.
 *
 * The message is written FIRST and the run closed after, as the two separate writes were, because the
 * terminal run state is the end-of-turn signal a subscriber stops listening on: it must already find
 * the finalised message. Both carry the same version, so one `?sinceVersion=` fetch returns both.
 *
 * The run's buffered telemetry and spend are folded into its closing write, and its spend into the
 * conversation's running total on the same bump — whose result is the total this returns.
 *
 * Conditional on the run still being `running`, so two writers cannot both decide how a run ended —
 * the boot sweep of another instance racing the instance that is actually executing it, for example.
 * The version is bumped before knowing whether this call wins: a losing racer advances it with nothing
 * new behind it, which costs a client one empty refetch — cheaper than a lookup on every turn.
 */
export const finishTurn = async (
  run: { id: string, conversationId: string },
  message: { id: string, patch: Partial<StoredMessage> } | undefined,
  patch: Partial<ConversationRun>
): Promise<{ closed: boolean, conversationCredits?: number }> => {
  const buffered = drainRunBuffer(run.id)
  const { version, credits } = await bumpConversationVersion(run.conversationId, buffered.credits)
  const now = new Date().toISOString()
  if (message) {
    // CAUGHT: whatever failed this write (a mongo blip, a shutdown) is likely to fail the next one
    // too, and a run left `running` is worse than a message left without its notice — the run is what
    // every reader and the boot sweep key on. So the close below still runs.
    await mongo.messages.updateOne(
      { id: message.id, conversationId: run.conversationId },
      { $set: { ...message.patch, version, updatedAt: now } }
    ).catch(err => console.error('autonomous agent message could not be finalised', err))
  }
  const updated = await mongo.runs.updateOne(
    { id: run.id, status: 'running' },
    { $set: { ...patch, ...buffered.set, version, endedAt: now }, ...buffered.update }
  )
  // A losing racer still owes the run what it buffered: the spend happened either way.
  if (!updated.modifiedCount && (Object.keys(buffered.update).length || Object.keys(buffered.set).length)) {
    await mongo.runs.updateOne({ id: run.id }, { ...(Object.keys(buffered.set).length ? { $set: buffered.set } : {}), ...buffered.update })
  }
  // Only the call that actually closed the run notifies, so a losing racer cannot announce a second,
  // contradictory terminal state — unless it wrote the message, which a reader must still be told of.
  if (updated.modifiedCount || message) await notifyConversationChanged(run.conversationId, version)
  return { closed: updated.modifiedCount > 0, conversationCredits: credits }
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
