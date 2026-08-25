/**
 * Stateless unit tests for the mid-turn tool-refresh policy.
 *
 * Context (see ui/src/composables/tool-refresh.ts): the tool set handed to streamText is
 * frozen at request time, so tools registered by a page the agent navigated to during the
 * turn were only callable on the next user turn. The chat loop now stops the stream at a
 * step boundary and relaunches it with the refreshed set; these are the pure decisions
 * behind that — signature, restart policy, turn-global step budget.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  toolsSignature,
  signatureSize,
  remainingStepBudget,
  shouldRestartForTools,
  TURN_STEP_BUDGET,
  MAX_TOOL_REFRESHES
} from '../../../ui/src/composables/tool-refresh.ts'

test.describe('toolsSignature', () => {
  test('is order-independent and identity-independent', () => {
    // The aggregator rebuilds its tool wrappers on every re-merge, so only names may
    // decide whether the set changed.
    const a = { search: { execute: () => 1 }, navigate: { execute: () => 2 } }
    const b = { navigate: { execute: () => 3 }, search: { execute: () => 4 } }
    assert.equal(toolsSignature(a), toolsSignature(b))
  })

  test('changes when a tool appears or disappears', () => {
    const before = toolsSignature({ search: {}, navigate: {} })
    const after = toolsSignature({ search: {}, navigate: {}, set_display: {} })
    assert.notEqual(before, after)
    assert.notEqual(after, toolsSignature({ search: {}, set_display: {} }))
  })

  test('empty tool set has an empty signature of size 0', () => {
    assert.equal(toolsSignature({}), '')
    assert.equal(signatureSize(''), 0)
  })

  test('signatureSize counts the tools of a signature', () => {
    assert.equal(signatureSize(toolsSignature({ a: {}, b: {}, c: {} })), 3)
  })
})

test.describe('remainingStepBudget', () => {
  test('a restart resumes on what the turn has left, not a fresh budget', () => {
    assert.equal(remainingStepBudget(0), TURN_STEP_BUDGET)
    assert.equal(remainingStepBudget(3), TURN_STEP_BUDGET - 3)
    assert.equal(remainingStepBudget(TURN_STEP_BUDGET - 1), 1)
  })

  test('never returns a non-positive budget', () => {
    assert.equal(remainingStepBudget(TURN_STEP_BUDGET), 1)
    assert.equal(remainingStepBudget(TURN_STEP_BUDGET + 5), 1)
  })

  test('honours an explicit budget', () => {
    assert.equal(remainingStepBudget(2, 6), 4)
  })
})

test.describe('shouldRestartForTools', () => {
  const base = { toolsChanged: true, finishReason: 'tool-calls', restartsDone: 0, stepsUsed: 2 }

  test('restarts when the tool set changed and the model was still working', () => {
    assert.equal(shouldRestartForTools(base), true)
  })

  test('does not restart when the tool set is unchanged', () => {
    assert.equal(shouldRestartForTools({ ...base, toolsChanged: false }), false)
  })

  test('does not restart a stream that delivered a finished answer', () => {
    // finishReason 'stop' means the assistant is done; relaunching would make it keep
    // talking with no new user input.
    assert.equal(shouldRestartForTools({ ...base, finishReason: 'stop' }), false)
    assert.equal(shouldRestartForTools({ ...base, finishReason: 'length' }), false)
    assert.equal(shouldRestartForTools({ ...base, finishReason: 'content-filter' }), false)
    assert.equal(shouldRestartForTools({ ...base, finishReason: undefined }), false)
  })

  test('bounded number of restarts per turn (flicker guard)', () => {
    assert.equal(shouldRestartForTools({ ...base, restartsDone: MAX_TOOL_REFRESHES - 1 }), true)
    assert.equal(shouldRestartForTools({ ...base, restartsDone: MAX_TOOL_REFRESHES }), false)
    assert.equal(shouldRestartForTools({ ...base, restartsDone: MAX_TOOL_REFRESHES + 1 }), false)
  })

  test('does not restart once the turn-global step budget is spent', () => {
    assert.equal(shouldRestartForTools({ ...base, stepsUsed: TURN_STEP_BUDGET - 1 }), true)
    assert.equal(shouldRestartForTools({ ...base, stepsUsed: TURN_STEP_BUDGET }), false)
    assert.equal(shouldRestartForTools({ ...base, stepsUsed: TURN_STEP_BUDGET + 3 }), false)
  })

  test('explicit caps override the defaults', () => {
    assert.equal(shouldRestartForTools({ ...base, restartsDone: 1, maxRestarts: 1 }), false)
    assert.equal(shouldRestartForTools({ ...base, stepsUsed: 4, stepBudget: 4 }), false)
  })

  test('a turn that navigates twice restarts twice then runs to completion', () => {
    // Simulates the production scenario: two navigations, each registering a new tool set.
    let restartsDone = 0
    let stepsUsed = 0
    for (const change of [true, true, true]) {
      stepsUsed += 2
      if (shouldRestartForTools({ toolsChanged: change, finishReason: 'tool-calls', restartsDone, stepsUsed })) {
        restartsDone++
      }
    }
    assert.equal(restartsDone, MAX_TOOL_REFRESHES)
  })
})
