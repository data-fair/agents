/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 *
 * Admin review of conversations.
 *
 * This replaces `api/src/traces/`, which kept a second copy of every exchange in its own collection
 * under a 30-day TTL. That copy was redundant from the moment the loop moved server-side and the
 * conversation became the record: a trace held the same content, plus per-call telemetry that now
 * lives on the run. So review is a READ of the conversation, authorized rather than duplicated.
 *
 * TWO GATES, both required, and they are different questions:
 *  - `settings.storeTraces` — does this ORGANIZATION want review capability at all. Off by default.
 *  - `conversation.consentedToReview` — did THIS PERSON agree to this thread being read. Absent
 *    means no.
 *
 * The person's own access to their own thread is elsewhere (the runtime router), and is not this
 * gate: they may always read what they said.
 */

import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, httpError, reqAdminMode, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { getSettings } from '../settings/service.ts'
import { partsText } from '../conversations/operations.ts'
import { purgeConversation } from '../conversations/service.ts'
import { buildConversationExport, exportFilename } from './operations.ts'

const router = Router()
export default router

const reqOwner = (req: any): AccountKeys => ({ type: req.params.type, id: req.params.id })

/**
 * Assert the caller may review this account's conversations at all.
 *
 * The org setting is checked as well as the role, because an admin of an account that never asked
 * for review capability should not get it by virtue of being an admin — that setting is the
 * disclosure the organization made to its members.
 */
const assertMayReview = async (req: any, owner: AccountKeys) => {
  const session = reqSessionAuthenticated(req)
  assertAccountRole(session, owner, 'admin')
  const settings = await getSettings(owner)
  if (settings.storeTraces !== true) throw httpError(403, 'conversation review is not enabled for this account')
}

/** Only threads whose owner may be reviewed AND whose person agreed. */
const reviewableFilter = (owner: AccountKeys) => ({
  'owner.type': owner.type,
  'owner.id': owner.id,
  consentedToReview: true
})

/**
 * Resolve a conversation by id alone, for a review link that does not carry the account.
 *
 * Deliberately NOT a way to read it: it answers only where the thread lives, so the client can go to
 * the account-scoped route and be authorized there.
 *
 * DECLARED FIRST, and that is load-bearing: `/conversation/<id>` has two segments, so `/:type/:id`
 * below would match it with type='conversation' and answer with a conversation list instead.
 */
router.get('/conversation/:conversationId', async (req, res, next) => {
  try {
    reqSessionAuthenticated(req)
    const conversation = await mongo.conversations.findOne(
      { id: req.params.conversationId, consentedToReview: true },
      { projection: { _id: 0, owner: 1 } }
    )
    if (!conversation) throw httpError(404, 'no reviewable conversation with this id')
    res.json({ owner: conversation.owner })
  } catch (err) { next(err) }
})

router.get('/:type/:id', async (req, res, next) => {
  try {
    const owner = reqOwner(req)
    await assertMayReview(req, owner)

    const size = Math.min(Math.max(parseInt(String(req.query.size ?? '20'), 10) || 20, 1), 200)
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
    const filter = reviewableFilter(owner)

    // A plain find on the conversations collection, where the old version aggregated and grouped the
    // trace collection to reconstitute one row per conversation. The rows ARE conversations now.
    const [results, count] = await Promise.all([
      mongo.conversations
        .find(filter, { projection: { _id: 0, id: 1, title: 1, userId: 1, userName: 1, createdAt: 1, lastMessageAt: 1, agentId: 1, archivedAt: 1 } })
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .toArray(),
      mongo.conversations.countDocuments(filter)
    ])

    // The preview is the first thing the person said, read from the conversation rather than dug out
    // of a stored request body — which is why it is a real preview again.
    const previews = await Promise.all(results.map(async conversation => {
      const first = await mongo.messages.findOne(
        { conversationId: conversation.id, role: 'user' },
        { projection: { _id: 0, parts: 1 }, sort: { seq: 1 } }
      )
      return partsText((first?.parts ?? []) as any).slice(0, 150)
    }))

    res.json({
      count,
      results: results.map((conversation, i) => ({
        conversationId: conversation.id,
        title: conversation.title,
        startedAt: conversation.createdAt,
        lastMessageAt: conversation.lastMessageAt,
        userId: conversation.userId,
        userName: conversation.userName,
        agentId: conversation.agentId,
        // Surfaced so an admin can see the person has deleted their side of it: the thread is
        // retained until the review window closes and is then purged, which is worth knowing before
        // relying on it still being there tomorrow.
        ...(conversation.archivedAt ? { archivedAt: conversation.archivedAt } : {}),
        preview: previews[i]
      }))
    })
  } catch (err) { next(err) }
})

/**
 * One conversation, for review: its messages and its runs.
 *
 * The runs carry what the conversation cannot — the system prompt the model was given and per-call
 * provider, model, tokens, cost and duration — which is the whole of what the trace collection held
 * beyond the content.
 *
 * Shared by the two routes below so the rendered page and the downloaded file are the SAME read,
 * under the same gate: a reviewer comparing them must not be shown two different things.
 */
const loadForReview = async (owner: AccountKeys, conversationId: string) => {
  const conversation = await mongo.conversations.findOne(
    { ...reviewableFilter(owner), id: conversationId },
    { projection: { _id: 0 } }
  )
  // 404 rather than 403 for a thread that exists but was not consented to: an admin has no
  // business learning which of their members declined.
  if (!conversation) throw httpError(404, 'no reviewable conversation with this id')

  const [messages, runs] = await Promise.all([
    mongo.messages
      .find({ conversationId: conversation.id }, { projection: { _id: 0 } })
      .sort({ seq: 1 })
      .toArray(),
    mongo.runs
      .find({ conversationId: conversation.id }, { projection: { _id: 0 } })
      .sort({ startedAt: 1 })
      .toArray()
  ])

  return { conversation, messages, runs }
}

router.get('/:type/:id/:conversationId', async (req, res, next) => {
  try {
    const owner = reqOwner(req)
    await assertMayReview(req, owner)
    res.json(await loadForReview(owner, req.params.conversationId))
  } catch (err) { next(err) }
})

/**
 * The same conversation as a downloadable JSONL file, for analysis by a standalone coding agent.
 *
 * This is what replaced the trace evaluator — an in-browser agent with its own tools, model role and
 * source-exploration proxy, all of which existed to let someone ask questions about a recorded
 * conversation. A download plus a skill answers the same questions with none of that surface, and
 * with a far more capable agent than the one the platform could host. See ./operations.ts for why
 * the file is line-addressable JSONL, and .claude/skills/conversation-export/SKILL.md for how to
 * read it.
 *
 * SUPERADMIN ONLY, and a tighter gate than the review page it is reached from. The page shows an
 * account admin a rendered transcript; this hands over a file containing every tool argument and
 * result verbatim, which is a different disclosure — and the analysis it is for is a platform
 * engineering task, not an account administration one.
 */
router.get('/:type/:id/:conversationId/export', async (req, res, next) => {
  try {
    const owner = reqOwner(req)
    reqAdminMode(req)
    await assertMayReview(req, owner)
    const loaded = await loadForReview(owner, req.params.conversationId)

    eventsLog.info('agents.review.export', `reviewed conversation ${req.params.conversationId} exported`, { req })
    // `attachment` with the filename: the UI follows this link rather than fetching and assembling a
    // blob, so the browser's own download handles a file of any size.
    res.attachment(exportFilename(req.params.conversationId))
    res.type('application/jsonl').send(buildConversationExport(loaded))
  } catch (err) { next(err) }
})

router.delete('/:type/:id/:conversationId', async (req, res, next) => {
  try {
    const owner = reqOwner(req)
    await assertMayReview(req, owner)
    await deleteConversations({ ...reviewableFilter(owner), id: req.params.conversationId })
    eventsLog.info('agents.review.delete', `reviewed conversation ${req.params.conversationId} deleted`, { req })
    res.status(204).send()
  } catch (err) { next(err) }
})

/**
 * Per-user erasure, for a GDPR request.
 *
 * `userId` is required rather than optional, so a request meant to erase one person's history cannot
 * silently erase the account's.
 */
router.delete('/:type/:id', async (req, res, next) => {
  try {
    const owner = reqOwner(req)
    await assertMayReview(req, owner)
    const userId = typeof req.query.userId === 'string' ? req.query.userId : ''
    if (!userId) throw httpError(400, 'userId is required')
    await deleteConversations({ 'owner.type': owner.type, 'owner.id': owner.id, userId })
    eventsLog.info('agents.review.erase', `conversations of user ${userId} erased`, { req })
    res.status(204).send()
  } catch (err) { next(err) }
})

/**
 * Delete conversations and everything hanging off them.
 *
 * Messages and runs are separate documents, so deleting only the conversation would leave them
 * orphaned and still readable by id — which for an erasure request is the whole failure.
 */
const deleteConversations = async (filter: Record<string, unknown>) => {
  const conversations = await mongo.conversations
    .find(filter, { projection: { _id: 0, id: 1 } })
    .toArray()
  if (!conversations.length) return
  // Through the shared purge, one thread at a time: an admin erasure and the archive sweep must not
  // be able to differ about what "delete a conversation" removes.
  //
  // ARCHIVED THREADS INCLUDED, deliberately. The archive stops the PERSON from erasing review
  // material; it must not stop an admin acting on a GDPR request, which is the one instruction that
  // outranks retention.
  for (const conversation of conversations) await purgeConversation(conversation.id)
}
