/**
 * stateless unit tests for the 0.12.0 collection rename.
 *
 * The contract that matters is IDEMPOTENCY: the upgrade runner re-executes every script whose folder
 * version is >= the recorded service version on every deploy of that release, not once. A rename is
 * the shape most likely to get that wrong — the second run finds the source gone and the target
 * populated, and a naive script either throws on a missing collection or renames a live collection
 * onto a stale one.
 *
 * Driven against a fake `db` rather than mongo, because what is under test is the script's decision
 * table and not mongo's rename.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import script from '../../../upgrade/0.12.0/conversations-are-not-autonomous.js'

interface Call { from: string, to: string }

/** A `db` that records what the script asked it to do. */
const fakeDb = (collections: string[], counts: Record<string, number> = {}) => {
  const names = new Set(collections)
  const renames: Call[] = []
  const updates: Array<{ collection: string, filter: any, update: any }> = []
  return {
    renames,
    updates,
    names,
    listCollections: () => ({
      toArray: async () => [...names].map(name => ({ name }))
    }),
    renameCollection: async (from: string, to: string) => {
      renames.push({ from, to })
      names.delete(from)
      names.add(to)
    },
    drops: [] as string[],
    collection (name: string) {
      const self = this as any
      return {
        updateMany: async (filter: any, update: any) => {
          updates.push({ collection: name, filter, update })
          return { modifiedCount: 0 }
        },
        countDocuments: async () => counts[name] ?? 0,
        drop: async () => { self.drops.push(name); names.delete(name) }
      }
    }
  }
}

// The runner passes a `debug` Debugger; the script only ever calls it, so a no-op stands in.
const run = async (db: any) => script.exec(db, (() => {}) as any)

test.describe('0.12.0 — the conversation collections are not autonomous', () => {
  test('renames all three, and the field on each collection that carries it', async () => {
    const db = fakeDb(['autonomous-agent-conversations', 'autonomous-agent-messages', 'autonomous-agent-runs'])
    await run(db)

    assert.deepEqual(db.renames, [
      { from: 'autonomous-agent-conversations', to: 'conversations' },
      { from: 'autonomous-agent-messages', to: 'messages' },
      { from: 'autonomous-agent-runs', to: 'runs' }
    ])
    // The field lives on all three, so all three are updated — a rename that moved the collections
    // and left `autonomousAgentId` behind would leave every read filtering on a key nothing has.
    assert.deepEqual(db.updates.map(u => u.collection), ['conversations', 'messages', 'runs'])
    for (const update of db.updates) {
      assert.deepEqual(update.update, { $rename: { autonomousAgentId: 'agentId' } })
      // Matched on the OLD key, so a re-run is a no-op rather than a rewrite of every document.
      assert.deepEqual(update.filter, { autonomousAgentId: { $exists: true } })
    }
  })

  test('a SECOND run is a no-op, not a failure', async () => {
    // The contract. After the first run the old names are gone, and the script must not treat that
    // as an error — the runner will call it again on the next deploy of the same release.
    const db = fakeDb(['conversations', 'messages', 'runs'])
    await run(db)
    assert.deepEqual(db.renames, [], 'nothing left to rename')
    // The field update still runs, and still matches nothing, which is what makes it safe.
    assert.equal(db.updates.length, 3)
  })

  test('a fresh install with no old collections is a no-op', async () => {
    const db = fakeDb([])
    await run(db)
    assert.deepEqual(db.renames, [])
  })

  test('an EMPTY target is dropped, because the alternative is a service that cannot start', async () => {
    // This one happened for real while making the change: a service that starts on the renamed code
    // before this migration shipped has mongo auto-create the new collections on first write, and a
    // flat refusal then crashes startup with the data sitting right there under the old name.
    const db = fakeDb(['autonomous-agent-conversations', 'conversations'])
    await run(db)
    assert.deepEqual(db.drops, ['conversations'], 'the empty leftover is dropped')
    assert.deepEqual(db.renames, [{ from: 'autonomous-agent-conversations', to: 'conversations' }])
  })

  test('a POPULATED target REFUSES rather than guessing', async () => {
    // The genuinely ambiguous state: both hold documents, so one of them is live and merging is not
    // this script's call. Picking silently would hide that someone needs to look.
    const db = fakeDb(['autonomous-agent-conversations', 'conversations'], { conversations: 3 })
    await assert.rejects(run(db), /refusing to guess/)
    assert.deepEqual(db.renames, [], 'nothing is renamed when the state is ambiguous')
    assert.deepEqual(db.drops, [], 'and nothing is dropped')
  })

  test('a partial first run resumes', async () => {
    // A crash between renames leaves some moved and some not. The next run must finish the job.
    const db = fakeDb(['conversations', 'autonomous-agent-messages', 'autonomous-agent-runs'])
    await run(db)
    assert.deepEqual(db.renames, [
      { from: 'autonomous-agent-messages', to: 'messages' },
      { from: 'autonomous-agent-runs', to: 'runs' }
    ])
  })
})
