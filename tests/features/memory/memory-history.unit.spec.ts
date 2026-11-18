/**
 * stateless unit tests for the memory history view: a line diff, and each version's change against the one before.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { lineDiff, historyEntries } from '../../../ui/src/utils/memory-history.ts'

test.describe('lineDiff', () => {
  test('keeps common lines and marks added and removed ones, in order', () => {
    assert.deepEqual(lineDiff('a\nb\nc', 'a\nx\nc\nd'), [
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: 'b' },
      { kind: 'added', text: 'x' },
      { kind: 'same', text: 'c' },
      { kind: 'added', text: 'd' }
    ])
  })

  test('from nothing, every line is added', () => {
    assert.deepEqual(lineDiff(undefined, 'a\nb'), [{ kind: 'added', text: 'a' }, { kind: 'added', text: 'b' }])
  })
})

const row = (over: any) => ({ id: over.id, path: 'x.md', op: 'update', version: 1, createdAt: '2026-11-01T00:00:00Z', author: { kind: 'user', userId: 'u' }, description: 'd', ...over })

test.describe('historyEntries', () => {
  test('each version is diffed against the previous one, newest first', () => {
    const entries = historyEntries([
      row({ id: '3', op: 'update', content: 'a\nc' }),
      row({ id: '2', op: 'update', content: 'a\nb' }),
      row({ id: '1', op: 'create', content: 'a' })
    ], false)
    assert.deepEqual(entries.map(e => e.version.id), ['3', '2', '1'])
    assert.deepEqual(entries[0].lines.filter(l => l.kind !== 'same'), [{ kind: 'removed', text: 'b' }, { kind: 'added', text: 'c' }])
    assert.deepEqual(entries[2].lines, [{ kind: 'added', text: 'a' }])
  })

  test('only the changed lines are kept, with a line of context around them', () => {
    const before = ['1', '2', '3', '4', '5', '6', '7'].join('\n')
    const after = ['1', '2', '3', 'X', '5', '6', '7'].join('\n')
    const [entry] = historyEntries([row({ id: '2', content: after }), row({ id: '1', op: 'create', content: before })], false)
    assert.deepEqual(entry.lines, [
      { kind: 'skipped', text: '' },
      { kind: 'same', text: '3' },
      { kind: 'removed', text: '4' },
      { kind: 'added', text: 'X' },
      { kind: 'same', text: '5' },
      { kind: 'skipped', text: '' }
    ])
  })

  test('a description change is reported, a delete or a rename carries no diff', () => {
    const entries = historyEntries([
      row({ id: '3', op: 'delete', content: undefined, description: undefined }),
      row({ id: '2', op: 'update', content: 'a', description: 'new' }),
      row({ id: '1', op: 'rename', content: 'a', description: 'old', previousPath: 'old.md' })
    ], false)
    assert.deepEqual(entries[0].lines, [])
    assert.deepEqual(entries[1].description, { before: 'old', after: 'new' })
    assert.deepEqual(entries[1].lines, [])
    assert.deepEqual(entries[2].lines, [])
  })

  test('a redacted neighbour gives no diff rather than a diff against "[redacted]"', () => {
    const entries = historyEntries([
      row({ id: '2', content: 'b' }),
      row({ id: '1', op: 'create', content: '[redacted]', redacted: { at: 'x' } })
    ], false)
    assert.equal(entries[0].baselineUnknown, true)
    assert.deepEqual(entries[0].lines, [])
    assert.deepEqual(entries[1].lines, [])
  })

  test('the oldest loaded version is not diffed against nothing while older ones remain to load', () => {
    const entries = historyEntries([row({ id: '2', content: 'b' })], true)
    assert.equal(entries[0].baselineUnknown, true)
  })
})
