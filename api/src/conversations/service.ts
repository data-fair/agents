/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { personalAgent, PERSONAL_AGENT_ID } from '../agent-session/personal-agent.ts'
import { sessionFor } from '../agent-session/registry.ts'
import { assertRoleQuota, assertCanUseModel } from '../auth.ts'
import { nanoid } from 'nanoid'
import { type AccountKeys, httpError } from '@data-fair/lib-express'
import { expiredArchiveFilter } from '../retention.ts'
import Debug from 'debug'
import type { AutonomousAgent, Conversation, ConversationRun } from '#types'
// The stored shape, whose `parts` carry the library's own part type (see mongo.ts).
import type { StoredMessage } from '#mongo'
import type { MessagePart } from '@agents/shared/message-parts'
import { canInstruct, type InstructableAgent } from '../autonomous-agents/operations.ts'
import type { SessionStateAuthenticated } from '@data-fair/lib-common-types/session/index.js'
import { getAutonomousAgent, assertOrganizationOwner, assertCanOwnAgent } from '../autonomous-agents/service.ts'
import { getSettings } from '../settings/service.ts'

const debug = Debug('df-agents:conversations')

/**
 * Who may START a conversation with this agent.
 *
 * Still a grant, and still the sentence that matters when adding someone: a configured agent acts with
 * its OWN non-human identity, which may reach further than the person using it. What this no longer
 * governs is reading or writing an existing conversation — see assertOwnsConversation.
 */
export const assertCanInstruct = (autonomousAgent: InstructableAgent, session: SessionStateAuthenticated) => {
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
export const assertOwnsConversation = (conversation: { userId?: string }, session: SessionStateAuthenticated) => {
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
 * ONE resolver, because the loop does not care which kind of agent it is serving. Everything downstream — the system prompt, the tool gathering, the guards, the spend — reads
 * the same shape; only the reserved id and the absence of an `nhi` distinguish them, and the second is
 * what the identity port keys on.
 *
 * The personal assistant is built per call rather than stored,
 * so it costs no collection and no migration (see ../agent-session/personal-agent.ts).
 */
export const resolveAgent = async (owner: AccountKeys, agentId: string) => {
  // The personal assistant FIRST, which is also what reserves its id: a configured agent sharing it
  // would otherwise shadow it, and a conversation naming it would resolve to the wrong identity.
  if (agentId === PERSONAL_AGENT_ID) return { ...personalAgent(config.mcpServers ?? []), owner } as unknown as AutonomousAgent
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
 * Who is asking: a signed-in person, or an anonymous visitor known only by the per-IP key their usage
 * is charged to. The visitor has no session, so their ownership of the thread is the socket's (only
 * the socket that created it may prompt into it) and their role is `anonymous` by definition.
 */
export type TurnCaller =
  | { kind: 'person', session: SessionStateAuthenticated }
  | { kind: 'anonymous', usageUserId: string }

/**
 * Whether this person may talk to this agent — and the two kinds of agent ask genuinely different
 * questions.
 *
 * A CONFIGURED agent lends its own identity: instructing it means borrowing an NHI's permissions, so
 * the gate is `canInstruct` — an account admin, or someone explicitly listed as an instructor.
 *
 * The PERSONAL assistant lends nothing. It acts as the person, through their own session, so the only
 * question is whether that person may use this account's models at all — which is the role-quota
 * gate every model call already answered. Applying `canInstruct` to it was a real regression and the
 * narrowest kind: a plain member of an organization could not use the assistant embedded in their own
 * application, because they are not an admin of the org and nobody had listed them as an instructor
 * of an agent that does not exist as a document.
 */
const assertMayTalkTo = async (
  autonomousAgent: InstructableAgent & { id: string },
  owner: AccountKeys,
  session: SessionStateAuthenticated
) => {
  if (autonomousAgent.id !== PERSONAL_AGENT_ID) {
    assertCanInstruct(autonomousAgent, session)
    return
  }
  const settings = await getSettings(owner)
  assertCanUseModel(session, owner, settings.quotas ?? {})
}

/**
 * The checks a new thread passes: may this caller start a conversation with this agent on this
 * account. Run when a socket names the agent (so a refusal shows when the chat opens) and again when
 * its first prompt creates the thread. Returns the account the thread is stored under.
 *
 * A configured agent stays organization-only (`assertCanOwnAgent`); an anonymous visitor may only talk
 * to the personal assistant, on an account whose quotas let anonymous visitors in.
 */
export const assertMayStartConversation = async (owner: AccountKeys, agentId: string, caller: TurnCaller): Promise<AccountKeys> => {
  if (caller.kind === 'anonymous') {
    if (agentId !== PERSONAL_AGENT_ID) throw httpError(403, 'an anonymous visitor can only talk to the personal assistant')
    assertRoleQuota('anonymous', (await getSettings(owner)).quotas ?? {})
    return owner
  }
  assertCanOwnAgent(owner, agentId)
  const autonomousAgent = await requireAutonomousAgent(owner, agentId)
  await assertMayTalkTo(autonomousAgent, owner, caller.session)
  return autonomousAgent.owner
}

/**
 * Create a thread: the ONE way a conversation starts, called by the socket when the first prompt of a
 * connection bound to nothing arrives (see the `hello` frame).
 *
 * A person's thread belongs to them (`userId`) on the ACCOUNT that pays for it (`owner`); an anonymous
 * visitor's to the per-IP key their usage is charged to, and it lives as long as their socket.
 */
export const createConversation = async (
  owner: AccountKeys,
  agentId: string,
  caller: TurnCaller,
  title?: string,
  siteUrl?: string
): Promise<Conversation> => {
  const threadOwner = await assertMayStartConversation(owner, agentId, caller)
  const conversation: Conversation = {
    id: nanoid(),
    agentId,
    owner: threadOwner,
    ...(caller.kind === 'person'
      ? {
          userId: caller.session.user.id,
          ...(caller.session.user.name ? { userName: caller.session.user.name } : {}),
          title: title?.trim() || 'New conversation'
        }
      : { userId: caller.usageUserId, userName: 'Anonymous', anonymous: true, title: 'Anonymous conversation' }),
    ...(siteUrl ? { siteUrl } : {}),
    createdAt: new Date().toISOString(),
    // starts at 0: the first message takes 1
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
 * Keyed on `updatedAt`, which every new message and every turn's close writes, so a thread in use is
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
export const purgeExpiredArchives = async (now = new Date(), scope: Record<string, unknown> = {}): Promise<number> => {
  const expired = await mongo.conversations
    .find({ ...expiredArchiveFilter(now), ...scope }, { projection: { _id: 0, id: 1 } })
    .toArray()
  for (const conversation of expired) await purgeConversation(conversation.id)
  if (expired.length) debug('purged %d archived conversation(s) past the review window', expired.length)
  return expired.length
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
    { $inc: { messageSeq: 1 }, $set: { lastMessageAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
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
    createdAt: new Date().toISOString()
  }
  await mongo.messages.insertOne({ ...doc })
  return doc
}

/** Patch a message in place, for the executor's incremental writes. */
export const updateMessage = async (conversationId: string, seq: number, patch: Partial<StoredMessage>) => {
  await mongo.messages.updateOne(
    { conversationId, seq },
    { $set: { ...patch, updatedAt: new Date().toISOString() } }
  )
}

/**
 * Settle a call on the message that MADE it, when its result arrives in a later turn — an approved call
 * the SDK executes on the next run's replay. Left on the earlier message without a result, the next
 * replay would see an approved call with nothing after it and execute it again.
 *
 * Only a part still `approval-responded` is settled: that is the one state a later turn completes, and
 * restricting to it means a result can never overwrite a call that already has one.
 */
export const settleStoredToolPart = async (
  conversationId: string,
  toolCallId: string,
  settled: { state: 'output-available', output: unknown, truncated?: { totalChars: number } } | { state: 'output-error', errorText: string }
): Promise<StoredMessage | null> => {
  const awaiting = { toolCallId, state: 'approval-responded' }
  if (!await mongo.messages.findOne({ conversationId, parts: { $elemMatch: awaiting } }, { projection: { _id: 1 } })) return null
  // `truncated` is metadata, beside the decision in `toolMetadata`, as on a call settled in its own turn:
  // an approved call is precisely the audited write, and a review must be able to tell its result was cut.
  const { truncated, ...fields } = settled as typeof settled & { truncated?: { totalChars: number } }
  const set: Record<string, unknown> = Object.fromEntries(Object.entries(fields).map(([key, value]) => [`parts.$[p].${key}`, value]))
  if (truncated) set['parts.$[p].toolMetadata.truncated'] = { totalChars: truncated.totalChars }
  return await mongo.messages.findOneAndUpdate(
    { conversationId, parts: { $elemMatch: awaiting } },
    { $set: { ...set, updatedAt: new Date().toISOString() } },
    { arrayFilters: [{ 'p.toolCallId': toolCallId, 'p.state': 'approval-responded' }], returnDocument: 'after', projection: { _id: 0 } }
  )
}

/**
 * Record a decision on a pending approval, atomically: only a part still `approval-requested` flips, so
 * two decisions racing (two tabs, a double click) settle it once. Null when nothing was pending under
 * that id — already decided, or never asked.
 *
 * `'still-finishing'` when the message asking is still being written (`pending`). The SDK emits the
 * approval request before the step's other calls have returned, so the card can show while the run
 * that asked still owns the message's parts in memory — and its next write (a slow call of the same
 * step settling, then the turn's own close) puts the WHOLE array back, restoring `approval-requested`
 * over the decision and erasing who made it. Refused rather than merged: the run closes the message
 * moments later, and the page is told the card is decidable when it does.
 */
export const decideApproval = async (
  conversationId: string,
  approvalId: string,
  decision: { approved: boolean, reason?: string, by: { userId: string, userName?: string } }
): Promise<StoredMessage | 'still-finishing' | null> => {
  const at = new Date().toISOString()
  const pending = { 'approval.id': approvalId, state: 'approval-requested' }
  const asking = await mongo.messages.findOne({ conversationId, parts: { $elemMatch: pending } }, { projection: { _id: 0, pending: 1 } })
  if (!asking) return null
  if (asking.pending) return 'still-finishing'
  return await mongo.messages.findOneAndUpdate(
    // `pending` again, in the write itself: the check above is only the reason given.
    { conversationId, pending: { $ne: true }, parts: { $elemMatch: pending } },
    {
      $set: {
        // Approved: `approval-responded`, which the SDK executes on replay. Rejected: `output-denied`,
        // which replays as a refusal carrying the reason, so the model is told and can react.
        'parts.$[p].state': decision.approved ? 'approval-responded' : 'output-denied',
        'parts.$[p].approval.approved': decision.approved,
        ...(decision.reason ? { 'parts.$[p].approval.reason': decision.reason } : {}),
        'parts.$[p].toolMetadata.decision': { ...decision.by, approved: decision.approved, at },
        updatedAt: at
      }
    },
    { arrayFilters: [{ 'p.approval.id': approvalId, 'p.state': 'approval-requested' }], returnDocument: 'after', projection: { _id: 0 } }
  )
}

/** The reason a pending approval is rejected with when the person writes instead of deciding. */
export const PENDING_APPROVAL_SUPERSEDED = 'The person sent a new message instead of deciding.'

/** The reason a pending approval is rejected with when the person acts on the page a wait handed them. */
export const PENDING_APPROVAL_ACTED = 'The person acted on the page instead of deciding.'

/**
 * The result a pending wait is settled with when the person decided on an approval stopped in the same
 * step instead of acting on the page: the decision is their move, and the turn continues from it.
 */
export const WAIT_SUPERSEDED_BY_DECISION = 'The person did not act on the page: they decided on the approval request instead.'

/** APPROVED_STEP_SUPERSEDED's counterpart, when it was an action on the page that moved on. */
export const APPROVED_STEP_ACTED = 'Approved, but the person acted on the page before every call of the step was decided, so it did not run.'

/**
 * The error an APPROVED call is settled with when the person wrote before deciding the rest of its step.
 * No run was started for that step (one starts only once every call of it is decided), and the SDK
 * executes approvals only from the last message, which is now the person's.
 */
export const APPROVED_STEP_SUPERSEDED = 'Approved, but the person sent a new message before every call of the step was decided, so it did not run.'

/**
 * Reject every pending approval of a conversation — what a new message from the person does. Keeps a
 * pending approval the conversation's latest step, so no undecided call can be compacted away or
 * approved out of order. Returns how many messages held one (a step's parallel calls share a message).
 *
 * The calls of the same step already APPROVED are settled too, as errors: they were waiting for the
 * rest of the step, which is now refused, so nothing will ever run them. Only in a message that still
 * has an undecided call — a fully decided step has its continuation run, which settles its own.
 *
 * `undecidedOnly` leaves those approved calls alone: the post-time callers use it, because a call
 * already approved may be executing in an `approval` run right now, and only the run-start rejection,
 * under the conversation lock, may settle it.
 */
export const rejectPendingApprovals = async (
  conversationId: string,
  reason: string = PENDING_APPROVAL_SUPERSEDED,
  approvedError: string = APPROVED_STEP_SUPERSEDED,
  opts?: { undecidedOnly?: boolean }
): Promise<number> => {
  // A message still holding an undecided call. Unless `undecidedOnly`, also one whose undecided calls an
  // earlier post-time rejection already refused (with this same reason) while approved calls remain: those
  // are what the run-start rejection must still settle.
  const filter = opts?.undecidedOnly
    ? { conversationId, 'parts.state': 'approval-requested' }
    : {
        conversationId,
        $or: [
          { 'parts.state': 'approval-requested' },
          { 'parts.state': 'approval-responded', parts: { $elemMatch: { state: 'output-denied', 'approval.reason': reason } } }
        ]
      }
  // The messages it will change, by seq, so the watching page can be sent exactly those afterwards.
  const seqs = (await mongo.messages.find(filter, { projection: { _id: 0, seq: 1 } }).toArray()).map(m => m.seq)
  if (!seqs.length) return 0
  // Only the messages read just above: one that starts matching in between is left for the next
  // rejection rather than changed without the watcher being sent it.
  const result = await mongo.messages.updateMany(
    { ...filter, seq: { $in: seqs } },
    {
      $set: {
        'parts.$[p].state': 'output-denied',
        'parts.$[p].approval.approved': false,
        'parts.$[p].approval.reason': reason,
        ...(opts?.undecidedOnly ? {} : { 'parts.$[q].state': 'output-error', 'parts.$[q].errorText': approvedError }),
        updatedAt: new Date().toISOString()
      }
    },
    { arrayFilters: opts?.undecidedOnly ? [{ 'p.state': 'approval-requested' }] : [{ 'p.state': 'approval-requested' }, { 'q.state': 'approval-responded' }] }
  )
  // The watching page is shown the refusal and loses the "awaiting approval" label, as for a decision.
  const watcher = sessionFor(conversationId)
  if (watcher && result.modifiedCount) {
    const rejected = await mongo.messages.find({ conversationId, seq: { $in: seqs } }, { projection: { _id: 0, seq: 1, parts: 1 } }).sort({ seq: 1 }).toArray()
    for (const message of rejected) watcher.send({ type: 'message', seq: message.seq, role: 'assistant', parts: message.parts as MessagePart[], pending: false })
    watcher.send({ type: 'activity', activity: null })
  }
  return result.modifiedCount
}

/**
 * Record a run, of either kind: a conversation's turn, or a task's run (`kind: 'task'`), whose content
 * lives on the run itself. Created `running`, or already `skipped` for a task slot that did not run.
 */
export const createRun = async <R extends Omit<ConversationRun, 'id'>>(run: R): Promise<R & { id: string }> => {
  const doc = { ...run, id: nanoid() }
  await mongo.runs.insertOne({ ...doc })
  return doc
}

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

/** Add one step's spend to a run, as it happens ($inc: a turn abandoned at its deadline keeps spending). */
export const incrementRunSpend = async (id: string, credits: number, steps: number) => {
  const buffer = runBuffers.get(id)
  if (buffer) { buffer.credits += credits; buffer.steps += steps; return }
  // Unbuffered: a turn abandoned at its deadline, still spending after its run was closed. The run
  // and the conversation's total are both kept true, at two writes — rare enough not to matter.
  const run = await mongo.runs.findOneAndUpdate({ id }, { $inc: { credits, steps } }, { projection: { _id: 0, conversationId: 1 } })
  // A task run has no conversation to add to.
  if (run?.conversationId && credits) await mongo.conversations.updateOne({ id: run.conversationId }, { $inc: { credits } })
}

/**
 * A live run's telemetry and spend, held until it closes instead of written as they happen.
 *
 * A turn wrote its system prompt, then a call record and a spend increment PER STEP, each a write of
 * its own — for data only read after the turn (review, the export, the cost). The executor's budget is
 * tracked in memory, so nothing reads them mid-turn. `finishRun` folds them into the write
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
 * every turn. Absent until the first run closes, which is a cost of zero.
 */
export const conversationCost = async (conversationId: string, known?: { credits?: number }): Promise<number> => {
  const conversation = known ?? await mongo.conversations.findOne({ id: conversationId }, { projection: { _id: 0, credits: 1 } })
  return conversation?.credits ?? 0
}

/**
 * Close a run, of either kind: once, while it is still `running`, so two writers cannot both decide how
 * it ended — the boot sweep of another instance racing the instance that is actually executing it, for
 * example. The run's buffered telemetry and spend are folded into its closing write.
 *
 * A conversation's turn also closes on its conversation: the turn's spend is added to the conversation's
 * running total (returned), with whatever the turn leaves there (a handover's `pendingWait`), so a reader
 * never sees the turn closed without the wait it is waiting on; then its final message, if any, is
 * written — both BEFORE the run's close, which is what every reader and the boot sweep key on.
 */
export const finishRun = async (
  run: { id: string, conversationId?: string },
  patch: Partial<ConversationRun>,
  turn: { message?: { seq: number, patch: Partial<StoredMessage> }, conversation?: Partial<Conversation> } = {}
): Promise<{ closed: boolean, conversationCredits?: number }> => {
  const buffered = drainRunBuffer(run.id)
  const now = new Date().toISOString()
  let conversationCredits: number | undefined
  if (run.conversationId) {
    const updated = await mongo.conversations.findOneAndUpdate(
      { id: run.conversationId },
      { ...(buffered.credits ? { $inc: { credits: buffered.credits } } : {}), $set: { ...turn.conversation, updatedAt: now } },
      { returnDocument: 'after', projection: { _id: 0, credits: 1 } }
    )
    conversationCredits = updated?.credits
    if (turn.message) {
      // CAUGHT: whatever failed this write (a mongo blip, a shutdown) is likely to fail the next one
      // too, and a run left `running` is worse than a message left without its notice — the run is what
      // every reader and the boot sweep key on. So the close below still runs.
      await mongo.messages.updateOne(
        { conversationId: run.conversationId, seq: turn.message.seq },
        { $set: { ...turn.message.patch, updatedAt: now } }
      ).catch(err => console.error('autonomous agent message could not be finalised', err))
    }
  }
  const updated = await mongo.runs.updateOne(
    { id: run.id, status: 'running' },
    { $set: { ...patch, ...buffered.set, endedAt: now }, ...buffered.update }
  )
  // A losing racer still owes the run what it buffered: the spend happened either way.
  if (!updated.modifiedCount && (Object.keys(buffered.update).length || Object.keys(buffered.set).length)) {
    await mongo.runs.updateOne({ id: run.id }, { ...(Object.keys(buffered.set).length ? { $set: buffered.set } : {}), ...buffered.update })
  }
  return { closed: updated.modifiedCount > 0, conversationCredits }
}

/**
 * Persist the compaction recap for a conversation.
 *
 * A CACHE, deliberately kept on the conversation rather than in the message log: the log is the
 * conversation of record and a compaction must never rewrite it.
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
