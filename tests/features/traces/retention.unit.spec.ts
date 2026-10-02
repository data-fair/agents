/**
 * stateless unit tests for the review-retention window.
 *
 * The window decides whether deleting a thread archives it or purges it, so getting it wrong either
 * destroys review material the organization was entitled to or retains a thread nobody can review.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { RETENTION_SECONDS, retentionCutoff, withinRetention, expiredArchiveFilter } from '../../../api/src/retention.ts'

const now = new Date('2026-10-02T12:00:00.000Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

test.describe('review retention', () => {
  test('the window is thirty days', () => {
    assert.equal(RETENTION_SECONDS, 30 * 24 * 60 * 60)
  })

  test('the cutoff is that far back from now', () => {
    assert.equal(retentionCutoff(now).toISOString(), daysAgo(30))
  })

  test('a thread used recently is inside the window', () => {
    assert.equal(withinRetention(daysAgo(1), now), true)
    assert.equal(withinRetention(daysAgo(29), now), true)
  })

  test('a thread quiet for longer than the window is outside it', () => {
    assert.equal(withinRetention(daysAgo(31), now), false)
    assert.equal(withinRetention(daysAgo(365), now), false)
  })

  test('an UNKNOWN last-used date is outside the window, not inside it', () => {
    // The conservative reading. Treating "we cannot tell when this was last used" as recent would
    // keep a document alive forever, archived and never purged — a retention policy that silently
    // retains everything is worse than none.
    assert.equal(withinRetention(undefined, now), false)
    assert.equal(withinRetention('', now), false)
    assert.equal(withinRetention('not a date', now), false)
  })

  test('the boundary is exclusive on the old side', () => {
    // Exactly at the cutoff is OUT: the window has closed, so there is nothing to review.
    assert.equal(withinRetention(daysAgo(30), now), false)
    assert.equal(withinRetention(new Date(retentionCutoff(now).getTime() + 1).toISOString(), now), true)
  })

  test('the sweep only ever selects ARCHIVED threads', () => {
    // A thread the person still has is their own history and must never be swept, however old. This
    // clause is the whole difference between a retention policy and data loss.
    const filter = expiredArchiveFilter(now) as any
    assert.deepEqual(filter.archivedAt, { $exists: true })
  })

  test('the sweep measures from the last message, not from the archive', () => {
    // So deleting a thread cannot extend how long the organization can see it.
    const filter = expiredArchiveFilter(now) as any
    assert.deepEqual(filter.lastMessageAt, { $lt: daysAgo(30) })
    assert.equal(Object.keys(filter).length, 2, 'both clauses, and only those two')
  })
})
