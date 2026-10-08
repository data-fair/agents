/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { isAuditedAgentId } from '@agents/shared/agent-audit'
import { Router } from 'express'
import mongo from '#mongo'
import { type AccountKeys, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { getAutonomousAgent } from '../autonomous-agents/service.ts'
import { assertMayStartConversation, assertOwnsConversation, requireAutonomousAgent, requireConversation, archiveConversation, purgeConversation } from './service.ts'
import { canInstruct } from '../autonomous-agents/operations.ts'
import { abortRun } from './executor.ts'
import { assertCanUseModel } from '../auth.ts'
import { withinRetention } from '../retention.ts'
import { PERSONAL_AGENT_ID, PERSONAL_AGENT_TITLE } from '../agent-session/personal-agent.ts'
import { getSettings } from '../settings/service.ts'

const router = Router()
export default router

/**
 * These routes deliberately do NOT apply `reqWriteSession` (the
 * `autonomousAgentsRequireAdminMode` rollout gate), unlike the configuration routes in
 * ../autonomous-agents/router.ts.
 *
 * The gate exists so the feature is not exposed to org admins before it is ready, and it
 * already achieves that at the only door that matters: while it is on, no org admin can
 * create an autonomous agent, so there is nothing for anyone to run. An agent that does exist
 * was created by a superadmin, who thereby chose both the owning organization and — through
 * `instructors` — who may drive it. Gating the runtime too would make that grant inert until
 * the flag flips, so the instruct path could never be exercised in the configuration it will
 * ship in.
 *
 * What the flag therefore means is "org admins cannot CONFIGURE autonomous agents yet", not
 * "nobody may use one".
 */

/**
 * The owner named in the path.
 *
 * It does NOT assert an organization any more, because on these runtime routes that depends on which
 * agent is involved: the personal assistant runs on a person's own account (see `assertCanOwnAgent`). The
 * invariant has not been dropped — it moved to where the agent id is known:
 *
 *  - a thread is created by the socket through `createConversation`, which calls `assertCanOwnAgent`
 *    with the agent's id;
 *  - every conversation-scoped route reaches its data through `requireConversation(owner, id)`, which
 *    scopes by owner, so a user-owned conversation is reachable only if it was created through that
 *    guarded path in the first place;
 *  - a CONFIGURED agent is still refused on a user account, now by `resolveAgent`.
 *
 * The agent CRUD router (../autonomous-agents/router.ts) keeps the blanket assertion in all eight of
 * its routes: configuring agents stays an organization feature.
 */
const reqOwner = (req: any): AccountKeys => {
  return { type: req.params.type, id: req.params.id } as AccountKeys
}

/**
 * The agents this caller may chat with on this account, the personal assistant first.
 *
 * This is the back-office chat's picker, and it exists because neither half of the list was
 * reachable: the personal assistant is synthetic and therefore not enumerable from any collection, and the
 * autonomous-agents list route is admin-gated while the people who may run an agent are exactly the
 * non-admin instructors. `canInstruct` is the same predicate every runtime route applies, so the list
 * cannot offer an agent the caller would then be refused.
 *
 * The personal assistant is listed only when the caller may use this account's models at all
 * (`assertCanUseModel`), which is the same gate conversation creation applies — otherwise the picker
 * would offer a personal assistant whose every conversation 403s. A configured agent is listed only
 * when it is enabled, since a disabled one keeps its configuration but must not run: the executor's
 * kill switch would turn any conversation started here into an error.
 */
router.get('/:type/:id/agents', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const settings = await getSettings(owner)

    const results: Array<{ id: string, title: string }> = []
    try {
      assertCanUseModel(session, owner, settings.quotas ?? {})
      results.push({ id: PERSONAL_AGENT_ID, title: PERSONAL_AGENT_TITLE })
    } catch { /* not usable with these quotas: not offered */ }

    // Configured agents are organizations only (their identity rests on an NHI), so on a personal
    // account the list is just the personal assistant.
    if (owner.type === 'organization') {
      const configured = await mongo.autonomousAgents
        .find(
          { 'owner.type': owner.type, 'owner.id': owner.id, enabled: { $ne: false } },
          { projection: { _id: 0, id: 1, title: 1, owner: 1, instructors: 1, enabled: 1 } }
        )
        .sort({ title: 1 })
        .toArray()
      for (const agent of configured) {
        if (canInstruct(agent, session)) results.push({ id: agent.id, title: agent.title })
      }
    }

    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

/**
 * A person's conversations on this account, newest first, for the chat's history.
 *
 * `agentId` is optional. With it, this is one agent's threads and the agent is resolved and
 * authorized first, exactly as before. Without it, the chat asks for the whole history at once —
 * across the personal assistant and every autonomous agent the caller may use — because that is the
 * list its switcher shows and one request per agent would make the panel's latency depend on how many
 * agents an account has configured.
 *
 * With no agentId, each thread's agent is resolved instead: the account cannot be asked for the
 * blanket assertion (a configured agent is organization-only, the personal assistant is the normal case on a
 * personal account), and it must not be asked, because a conversation whose agent was deleted or
 * whose grant was revoked is no longer the caller's to see.
 */
/** How many threads the chat's history lists, newest first. */
const HISTORY_LIMIT = 50

router.get('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const agentId = typeof req.query.agentId === 'string' && req.query.agentId ? req.query.agentId : undefined
    if (req.query.agentId !== undefined && !agentId) throw httpError(400, 'agentId must be a non-empty string')
    // One agent's list is unbounded unless asked: the chat resumes a thread with `size=1`.
    const size = req.query.size === undefined ? undefined : Number(req.query.size)
    if (size !== undefined && !(Number.isInteger(size) && size > 0 && size <= HISTORY_LIMIT)) {
      throw httpError(400, `size must be an integer between 1 and ${HISTORY_LIMIT}`)
    }

    // One agent's threads are listed to whoever may start one with it: the same checks.
    if (agentId) await assertMayStartConversation(owner, agentId, { kind: 'person', session })

    // Your own threads only, whoever you are. A conversation belongs to one person, so listing someone
    // else's would be a disclosure — an org admin's role does not grant it, and neither does a
    // superadmin's admin mode any more: this list is the chat's history and what it RESUMES, and a
    // superadmin's chat opened someone else's latest thread. Reading other people's threads is the
    // review page's job, under its consent rules.
    const filter: Record<string, any> = {
      'owner.type': owner.type,
      'owner.id': owner.id,
      userId: session.user.id,
      // Archived threads are gone FOR THE PERSON. They deleted them; the document survives only
      // because the organization was entitled to review it, and showing it back here would make
      // the delete look as though it had not worked.
      archivedAt: { $exists: false }
    }
    if (agentId) filter.agentId = agentId
    // A backstop: a thread whose first prompt's socket closed mid-creation has no message, and is not history.
    else filter.messageSeq = { $gt: 0 }

    let results = await mongo.conversations
      .find(filter, {
        // The whole history is a picker list: its rows, not the documents — a conversation carries its
        // cached compaction recap, which the history never shows. One agent's list keeps whole
        // documents, which API clients read.
        projection: agentId ? { _id: 0 } : { _id: 0, id: 1, agentId: 1, title: 1, createdAt: 1, lastMessageAt: 1, messageSeq: 1 },
        // and bounded: a person's history grows for as long as they use the chat
        limit: size ?? (agentId ? 0 : HISTORY_LIMIT)
      })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .toArray()

    if (!agentId) {
      const settings = await getSettings(owner)
      // One answer per agent, not one per thread: the account may have many threads of the same few
      // agents, and resolving an agent reads its document.
      const usable = new Map<string, boolean>()
      const filtered: typeof results = []
      for (const conversation of results) {
        let ok = usable.get(conversation.agentId)
        if (ok === undefined) {
          if (conversation.agentId === PERSONAL_AGENT_ID) {
            try {
              assertCanUseModel(session, owner, settings.quotas ?? {})
              ok = true
            } catch { ok = false }
          } else if (owner.type === 'organization') {
            const agent = await getAutonomousAgent(owner, conversation.agentId)
            ok = !!agent && agent.enabled !== false && canInstruct(agent, session)
          } else ok = false
          usable.set(conversation.agentId, ok)
        }
        if (ok) filtered.push(conversation)
      }
      results = filtered
    }

    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

/**
 * Erase one thread: the conversation, its messages, its runs.
 *
 * The means to comply with an erasure request without deleting the whole autonomous agent. Until this
 * existed, a stored conversation — which now holds complete tool results, not just prose — could only
 * be removed by deleting the agent it belonged to, and nothing at all could remove it if the agent was
 * still in use.
 *
 * Deliberately NOT a TTL. The stored conversation is the conversation of record, so a timer that
 * silently destroyed it would take the audit trail with it. Erasure is a decision someone makes, and
 * this is where they make it.
 */
router.delete('/:type/:id/:conversationId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    await requireAutonomousAgent(owner, conversation.agentId)
    // Your own thread, and nobody else's: not the agent grant, which would make erasure available to
    // every instructor of the agent.
    assertOwnsConversation(conversation, session)

    // A live turn is stopped first, or it would keep writing messages into a conversation that is being
    // deleted underneath it — and runTurn's "the conversation was deleted under us" path would then be
    // reached with tool calls already in flight.
    const live = await mongo.runs
      .find({ conversationId: conversation.id, status: 'running' }, { projection: { _id: 0, id: 1 } })
      .toArray()
    for (const run of live) await abortRun(run.id)

    // ARCHIVE OR PURGE, and which one is not the person's choice.
    //
    // A thread the person consented to having reviewed is the organization's review material now
    // that there is no separate copy of it. Letting a delete destroy it would mean anyone could
    // erase the record of a conversation their organization was entitled to see — the one thing an
    // audit trail cannot allow. So it is archived: gone for them (hidden, unreadable, not
    // continuable) and still visible to review until the window closes, then purged whole by
    // `purgeExpiredArchives`.
    //
    // Everything else is purged immediately. A thread nobody else may read has nothing to retain,
    // and one whose review window has already closed has nothing left to show — keeping either
    // would be retention for its own sake.
    //
    // An AUDITED thread (a configured agent's) is always archived, never purged by the person: it is the
    // organization's record of what its agent was told, with no review window to wait out.
    const reviewable = isAuditedAgentId(conversation.agentId) ||
      (conversation.consentedToReview === true && withinRetention(conversation.lastMessageAt))
    if (reviewable) {
      await archiveConversation(conversation.id)
      eventsLog.info('agents.conversation.archive', `conversation ${conversation.id} archived: still reviewable`, { req })
    } else {
      const purged = await purgeConversation(conversation.id)
      eventsLog.info('agents.conversation.delete', `conversation ${conversation.id} deleted with ${purged.messages} message(s) and ${purged.runs} run(s)`, { req })
    }
    // 204 either way. The person asked for it to be gone and for them it is; telling them their
    // organization retained a copy is a disclosure decision for the consent sheet, which is where
    // they agreed to review in the first place, not for the response to a delete.
    res.status(204).send()
  } catch (err) { next(err) }
})

router.get('/:type/:id/:conversationId/messages', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    // Still resolved, so a thread whose agent was deleted 404s rather than half-working; no longer the
    // thing that authorizes the read or the write.
    await requireAutonomousAgent(owner, conversation.agentId)
    assertOwnsConversation(conversation, session)

    const results = await mongo.messages
      .find({ conversationId: conversation.id }, { projection: { _id: 0 } })
      .sort({ seq: 1 })
      .toArray()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

/**
 * A thread's runs, in order.
 *
 * Authorized exactly like its messages: the one person it belongs to. It carries the per-call
 * telemetry that replaced the trace collection, so this is where "which model answered, what did it
 * cost, how much context did it send" is read from for a thread you own.
 */
router.get('/:type/:id/:conversationId/runs', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = reqOwner(req)
    const conversation = await requireConversation(owner, req.params.conversationId)
    assertOwnsConversation(conversation, session)
    const results = await mongo.runs
      .find({ conversationId: conversation.id }, { projection: { _id: 0 } })
      .sort({ startedAt: 1 })
      .toArray()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})
