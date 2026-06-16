import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { wrapHiddenContext, splitHiddenContext } from '../../../ui/src/traces/hidden-context.ts'

test.describe('hidden-context wire format (unit)', () => {
  test('wrap then split round-trips visible + hidden', () => {
    const wrapped = wrapHiddenContext('focus on tools A and B', 'Help me create a dataset')
    const { visible, hidden } = splitHiddenContext(wrapped)
    assert.equal(visible, 'Help me create a dataset')
    assert.equal(hidden, 'focus on tools A and B')
  })

  test('split passes through a plain message unchanged', () => {
    const { visible, hidden } = splitHiddenContext('just a normal message')
    assert.equal(visible, 'just a normal message')
    assert.equal(hidden, undefined)
  })

  test('split handles multi-line hidden context and visible prompt', () => {
    const wrapped = wrapHiddenContext('line1\nline2', 'do\nthis')
    const { visible, hidden } = splitHiddenContext(wrapped)
    assert.equal(hidden, 'line1\nline2')
    assert.equal(visible, 'do\nthis')
  })
})
