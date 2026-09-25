/**
 * stateless unit tests for the autonomous agent runtime's pure helpers
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { nextMessageSeq, isRunTerminal, runStopReasonMessage } from '../../../api/src/autonomous-agent-runtime/operations.ts'

test.describe('nextMessageSeq', () => {
  test('starts at 1 for a fresh conversation', () => {
    assert.equal(nextMessageSeq({}), 1)
  })

  test('increments monotonically', () => {
    assert.equal(nextMessageSeq({ messageSeq: 7 }), 8)
  })

  test('treats a zero seq as a fresh conversation rather than reusing 0', () => {
    // seq 0 would collide with the "no messages yet" state and break the
    // gap-detection C2 builds on top of it
    assert.equal(nextMessageSeq({ messageSeq: 0 }), 1)
  })
})

test.describe('isRunTerminal', () => {
  test('running is not terminal', () => {
    assert.equal(isRunTerminal('running'), false)
  })

  for (const status of ['done', 'error', 'aborted', 'interrupted'] as const) {
    test(`${status} is terminal`, () => {
      assert.equal(isRunTerminal(status), true)
    })
  }
})

test.describe('runStopReasonMessage', () => {
  test('every stop reason yields a non-empty, user-facing sentence', () => {
    // "Failure is a message, not a silence": a run that ends for any reason must
    // leave something a reader can understand, so no branch may return ''
    for (const reason of ['completed', 'step-limit', 'repeated-calls', 'budget', 'timeout', 'aborted', 'error'] as const) {
      const text = runStopReasonMessage(reason)
      assert.equal(typeof text, 'string')
      assert.ok(text.length > 0, `expected a message for ${reason}`)
    }
  })

  test('includes the detail when one is supplied', () => {
    assert.match(runStopReasonMessage('error', 'provider exploded'), /provider exploded/)
  })

  test('does not leak an empty detail as a dangling separator', () => {
    // the bare-prefix wart in formatMcpToolResult is exactly this bug; do not repeat it
    assert.doesNotMatch(runStopReasonMessage('error', ''), /:\s*$/)
  })
})
