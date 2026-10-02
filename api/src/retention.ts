/**
 * How long this service keeps data that exists only so an admin can review it.
 *
 * One policy, two kinds of data: moderation events, and conversations the person consented to having
 * reviewed. It used to live beside the trace collection whose TTL index it configured; when that
 * collection went away it landed in `moderation/operations.ts` because moderation was its only
 * remaining consumer, and conversation review has now made it shared again.
 *
 * WHAT CHANGED WHEN THE CONVERSATION BECAME THE REVIEW MATERIAL, stated here because the unit of
 * retention changed with it. A trace was one model call with its own `createdAt`, so a long-running
 * conversation lost its early turns while its recent ones stayed — retention was per TURN. A
 * conversation is one document, so the window now runs from its LAST message: a thread in active use
 * keeps refreshing it and does not age out, and a thread that has gone quiet expires 30 days later,
 * whole. Coarser, and the honest consequence of making the conversation the record.
 */
export const RETENTION_SECONDS = 30 * 24 * 60 * 60

/** The moment before which review data has outlived its window. */
export const retentionCutoff = (now = new Date()): Date => new Date(now.getTime() - RETENTION_SECONDS * 1000)

/** Whether a conversation last touched at `lastMessageAt` is still inside the review window. */
export const withinRetention = (lastMessageAt: string | undefined, now = new Date()): boolean => {
  if (!lastMessageAt) return false
  const at = new Date(lastMessageAt).getTime()
  // An unparseable date is NOT treated as recent: it would keep a document alive forever, and the
  // conservative reading of "we cannot tell when this was last used" is that it is not reviewable.
  if (!Number.isFinite(at)) return false
  return at > retentionCutoff(now).getTime()
}

/**
 * The mongo filter for archived conversations whose review window has closed.
 *
 * Pure, and separate from the sweep that runs it, because the sweep lives in a module that imports
 * `#config` and so cannot be reached from a test at all — the decision is the part worth pinning.
 *
 * Both clauses are load-bearing. `archivedAt` present: a thread the person still has is their own
 * history and never expires, however old. `lastMessageAt` past the cutoff: the window runs from when
 * the exchange happened, so deleting a thread late cannot extend how long it stays visible.
 */
export const expiredArchiveFilter = (now = new Date()) => ({
  archivedAt: { $exists: true },
  lastMessageAt: { $lt: retentionCutoff(now).toISOString() }
})
