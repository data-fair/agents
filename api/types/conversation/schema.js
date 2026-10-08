export default {
  $id: 'https://github.com/data-fair/agents/conversation',
  'x-exports': ['types'],
  title: 'Conversation',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'agentId', 'owner', 'userId', 'title', 'createdAt', 'messageSeq'],
  properties: {
    id: { type: 'string' },
    agentId: { type: 'string' },
    /**
     * The ONE person this conversation belongs to.
     *
     * A conversation used to be a shared timeline: several instructors of one agent contributed to it,
     * which is what made the attribution envelope necessary and what an HTTP polling fan-out
     * existed to serve. One user per conversation drops all of that — see
     * docs/superpowers/specs/2026-10-01-one-server-loop-prototype-design.md §2.
     *
     * Who may START a conversation with an agent is still a grant (`instructors`, `canInstruct`),
     * because a configured agent acts with its own permissions and may reach further than its user.
     * What is gone is two people in one thread.
     */
    userId: { type: 'string' },
    userName: { type: 'string' },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      properties: {
        type: { type: 'string', enum: ['user', 'organization'] },
        id: { type: 'string' },
        name: { type: 'string' },
        department: { type: 'string' }
      }
    },
    title: { type: 'string' },
    // Memory reflection bookkeeping (api/src/memory/reflection.ts). Server-written; absent until the
    // first reflection of a thread whose agent has memory.
    memoryReflection: {
      type: 'object',
      additionalProperties: false,
      properties: {
        upToSeq: { type: 'number' },
        at: { type: 'string', format: 'date-time' },
        credits: { type: 'number' },
        failedAt: { type: 'string', format: 'date-time' },
        // Last automatic pass that could not proceed (credit cap, a step still awaiting its approval):
        // backed off like a failure, so such threads do not take every sweep slot.
        deferredAt: { type: 'string', format: 'date-time' }
      }
    },
    createdAt: { type: 'string', format: 'date-time' },
    // Declared because the service WRITES it — appendMessage and finishRun both $set it.
    // With additionalProperties: false and no declaration, every stored conversation violated its own
    // schema and the generated type lacked a field the collection always has. The other three
    // autonomous-agent schemas all declare theirs.
    updatedAt: { type: 'string', format: 'date-time' },
    lastMessageAt: { type: 'string', format: 'date-time' },
    // monotonic, starts at 1 — see nextMessageSeq
    messageSeq: { type: 'number', minimum: 0 },
    /**
     * What this conversation has cost so far, in credits: the sum of its runs, kept as a running total
     * by the write that closes each run (see `finishRun`). Read on every attach and after every turn,
     * so the total is stored rather than aggregated over the runs each time.
     */
    credits: { type: 'number', minimum: 0 },
    /**
     * Whether this person agreed that an admin of the account may read this thread.
     *
     * ONE FLAG ON THE THREAD, which is what the privacy model actually describes: the conversation
     * is stored either way so the person can come back to it, and is not visible to org admins; this
     * is what makes it visible. It used to be a separate `trace-requests` collection holding a COPY
     * of the content under a 30-day TTL, plus the same consent re-derived onto every run — storing
     * the same disclosure twice and asking the question twice.
     *
     * Absent means no: the right default for a question nobody answered.
     */
    consentedToReview: { type: 'boolean' },
    /**
     * The handover this conversation is waiting on: a turn that ended on `wait_for_user_action`, its
     * call left open until the person acts, writes, or presses Stop (api/src/conversations/waits.ts).
     *
     * On the conversation rather than inferred from the last message, because claiming it is what
     * decides who settles the wait: the person's action, their message and Stop can race, and an
     * atomic $unset lets exactly one of them win. `triggeredBy`/`triggeredByRole` are the handover
     * turn's, carried to the turn the person's action starts — it is their turn, billed as theirs.
     */
    pendingWait: {
      type: 'object',
      additionalProperties: false,
      required: ['messageSeq', 'toolCallId', 'since'],
      properties: {
        messageSeq: { type: 'number' },
        toolCallId: { type: 'string' },
        expecting: { type: 'string' },
        since: { type: 'string', format: 'date-time' },
        // Where the page was when the turn handed over. A page reloaded during the wait re-announces it,
        // and a location report is the one keyed event that answers a wait (the person left) — this is
        // what tells the two apart.
        location: { type: 'string' },
        triggeredBy: {
          type: 'object',
          additionalProperties: false,
          properties: { userId: { type: 'string' }, userName: { type: 'string' } }
        },
        triggeredByRole: { type: 'string', enum: ['admin', 'contrib', 'user', 'external', 'anonymous'] }
      }
    },
    /**
     * An anonymous visitor's thread: it lives as long as the socket that created it.
     *
     * STORED, though the design says anonymous chat is never persisted, because the loop reads and
     * writes its turns through these collections and a second, in-memory loop is exactly what this
     * branch removed. What "not persisted" protects is kept another way: only the socket that created
     * the thread can read or continue it (no HTTP route serves an anonymous caller), it is purged when
     * that socket closes, and `purgeAbandonedAnonymous` sweeps any a crash left behind.
     *
     * `userId` is then `anon:<ip hash>`, the per-IP usage key the quota is charged to — not an owner
     * anyone could authenticate as.
     */
    anonymous: { type: 'boolean' },
    /**
     * When the person deleted this thread while it was still reviewable.
     *
     * ARCHIVED, not deleted, and the reason is a direct consequence of the conversation becoming the
     * review material. Review used to read a separate copy with its own retention, so what the person
     * did with their chat could not affect it. Now the two are one document, and an unconditional
     * delete would let anyone erase the record of a conversation their organization was entitled to
     * review — which is also the one thing an audit trail must not permit.
     *
     * An archived thread is gone FOR THE PERSON: hidden from their list, not readable, not
     * continuable (`requireConversation` excludes it). It stays visible to review until the window
     * closes, and is then purged whole.
     *
     * NOT the expiry clock. The window runs from `lastMessageAt` (see api/src/retention.ts), so
     * deleting late cannot extend how long the organization can see it.
     */
    archivedAt: { type: 'string', format: 'date-time' },
    /**
     * The compaction recap: a CACHE, not part of the conversation.
     *
     * The stored messages remain the conversation of record — complete, and never rewritten by a
     * compaction. This only spares the summarizer from re-reading the same prefix on every turn.
     *
     * Without it, compaction re-summarised from scratch on EVERY turn once a conversation crossed the
     * budget, permanently: nothing was persisted, so the next turn loaded the whole history again and
     * was over budget again. That grew more expensive as the conversation grew, and storing tool
     * results made conversations cross the threshold far sooner — a single 100k-char result is about a
     * quarter of a default budget on its own.
     *
     * `coversUpToSeq` is a STORED MESSAGE boundary, never mid-turn, so the model context can be
     * rebuilt as [recap, ...messages after it] and reproduce exactly what the previous turn saw.
     */
    compaction: {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'generation', 'coversUpToSeq'],
      properties: {
        summary: { type: 'string' },
        // How many times this conversation has been compacted. Drives the summarizer prompt: from the
        // second on it is told a recap already heads the content and asked to merge rather than
        // re-digest, which is what keeps chained generations from compounding loss.
        generation: { type: 'number', minimum: 1 },
        coversUpToSeq: { type: 'number', minimum: 1 },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  }
}
