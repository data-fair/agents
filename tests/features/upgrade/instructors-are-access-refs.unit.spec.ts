/**
 * stateless unit tests for the 0.12.0 instructor access-ref migration.
 *
 * The contract that matters is IDEMPOTENCY: the upgrade runner re-executes every script whose folder
 * version is >= the recorded service version on every deploy of that release, not once. The script's
 * own filter is what makes a re-run safe, so the fake below honours it the same way mongo would.
 *
 * Driven against a fake `db` rather than mongo, because what is under test is the mapping and its
 * guard, not mongo's update.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import script from '../../../upgrade/0.12.0/instructors-are-access-refs.js'

/** A `db` holding documents, that applies the script's updates in place. */
const fakeDb = (docs: any[]) => {
  const updates: Array<{ selector: any, update: any }> = []
  return {
    docs,
    updates,
    collection: () => ({
      find: (filter: any) => ({
        // The script's filter selects only documents still holding an old-shape item, which is the
        // idempotency guard: an empty async iterator means a re-run has nothing to do.
        async * [Symbol.asyncIterator] () {
          for (const doc of docs) {
            if (doc.instructors?.some((item: any) => item && typeof item === 'object' && 'userId' in item)) yield doc
          }
        }
      }),
      updateOne: async (selector: any, update: any) => {
        const doc = docs.find(d => d._id === selector._id)
        Object.assign(doc, update.$set)
        updates.push({ selector, update })
      }
    })
  }
}

// The runner passes a `debug` Debugger; the script only ever calls it, so a no-op stands in.
const run = async (db: any) => script.exec(db, (() => {}) as any)

test.describe('0.12.0 — instructors are access refs', () => {
  test('an old-shape item becomes a member access ref, and its name is dropped', async () => {
    const db = fakeDb([{ _id: 'a1', instructors: [{ userId: 'u1', userName: 'User One' }] }])
    await run(db)

    assert.equal(db.updates.length, 1)
    assert.deepEqual(db.docs[0].instructors, [{ mode: 'member', type: 'user', id: 'u1' }])
  })

  test('a mixed list keeps the new-shape items as they are', async () => {
    const kept = { mode: 'member', type: 'user', email: 'a@test.com' }
    const db = fakeDb([{ _id: 'a1', instructors: [{ userId: 'u1' }, kept] }])
    await run(db)

    assert.deepEqual(db.docs[0].instructors, [{ mode: 'member', type: 'user', id: 'u1' }, kept])
  })

  test('a SECOND run is a no-op, not a failure', async () => {
    const db = fakeDb([{ _id: 'a1', instructors: [{ userId: 'u1' }] }])
    await run(db)
    await run(db)

    assert.equal(db.updates.length, 1, 'the second run has nothing left to match')
  })

  test('an agent already in the new shape is never rewritten', async () => {
    const db = fakeDb([{ _id: 'a1', instructors: [{ mode: 'internal', type: 'organization', id: 'test1', roles: ['admin'] }] }])
    await run(db)
    assert.deepEqual(db.updates, [])
  })

  test('an agent with no instructors is untouched', async () => {
    const db = fakeDb([{ _id: 'a1' }, { _id: 'a2', instructors: [] }])
    await run(db)
    assert.deepEqual(db.updates, [])
  })
})
