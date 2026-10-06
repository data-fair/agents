/**
 * stateless unit tests for the 0.12.0 backfill of each conversation's running credit total.
 *
 * Driven against a fake `db`, like the rename's spec: what is under test is which conversations the
 * script touches and what it sets, plus the folder ORDER it relies on — the runner sorts a folder's
 * scripts alphabetically, and this one reads the collections the rename produces.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import script from '../../../upgrade/0.12.0/credits-total.js'

const fakeDb = (conversations: Array<{ id: string, credits?: number }>, runs: Array<{ conversationId: string, credits?: number }>) => {
  const docs = conversations.map(c => ({ ...c }))
  return {
    docs,
    collection (name: string) {
      if (name === 'conversations') {
        return {
          find: (filter: any) => docs.filter(d => filter.credits?.$exists === false ? d.credits === undefined : true),
          updateOne: async (filter: any, update: any) => {
            const doc = docs.find(d => d.id === filter.id && (filter.credits?.$exists === false ? d.credits === undefined : true))
            if (doc) Object.assign(doc, update.$set)
          }
        }
      }
      return {
        aggregate: (pipeline: any[]) => ({
          toArray: async () => {
            const id = pipeline[0].$match.conversationId
            const mine = runs.filter(r => r.conversationId === id)
            return mine.length ? [{ _id: null, credits: mine.reduce((sum, r) => sum + (r.credits ?? 0), 0) }] : []
          }
        })
      }
    }
  }
}

test.describe('upgrade 0.12.0: conversation credit totals', () => {
  test('sets each total to the sum of its runs, zero when it has none', async () => {
    const db = fakeDb(
      [{ id: 'a' }, { id: 'b' }],
      [{ conversationId: 'a', credits: 3 }, { conversationId: 'a', credits: 4 }, { conversationId: 'a' }]
    )
    await script.exec(db as any, (() => {}) as any)
    assert.deepEqual(db.docs, [{ id: 'a', credits: 7 }, { id: 'b', credits: 0 }])
  })

  test('leaves a total that already exists alone, so a re-run changes nothing', async () => {
    const db = fakeDb([{ id: 'a', credits: 100 }], [{ conversationId: 'a', credits: 3 }])
    await script.exec(db as any, (() => {}) as any)
    await script.exec(db as any, (() => {}) as any)
    assert.deepEqual(db.docs, [{ id: 'a', credits: 100 }])
  })

  test('runs after the collection rename in its folder', () => {
    const names = readdirSync(new URL('../../../upgrade/0.12.0/', import.meta.url)).sort()
    assert.ok(names.indexOf('credits-total.js') > names.indexOf('conversations-are-not-autonomous.js'))
  })
})
