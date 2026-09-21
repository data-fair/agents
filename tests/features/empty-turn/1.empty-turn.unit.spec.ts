import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { isEmptyTurn } from '../../../ui/src/composables/empty-turn.ts'

test.describe('isEmptyTurn', () => {
  test('a turn with no text at all is empty', () => {
    assert.equal(isEmptyTurn({ producedText: false, lastStepHadTool: false }), true)
  })

  test('a turn that spoke and then stopped on a tool call is empty', () => {
    // "Let me delegate that" and never coming back: producedText latched on the
    // announcement, so only the trailing tool call gives it away.
    assert.equal(isEmptyTurn({ producedText: true, lastStepHadTool: true, lastStepToolName: 'subagent_editLine_form' }), true)
  })

  test('a turn that answered is not empty', () => {
    assert.equal(isEmptyTurn({ producedText: true, lastStepHadTool: false }), false)
  })

  test('a turn that ended on a declared wait is not empty — it is paused', () => {
    // The wait ends this stream on purpose and resumes the same turn when it
    // resolves. Reporting it as a failure put a falsehood in the transcript,
    // above the answer that arrived two bubbles later.
    assert.equal(isEmptyTurn({ producedText: true, lastStepHadTool: true, lastStepToolName: 'wait_for_user_action' }), false)
  })

  test('even a silent turn that ended on a declared wait is not a failure', () => {
    assert.equal(isEmptyTurn({ producedText: false, lastStepHadTool: true, lastStepToolName: 'wait_for_user_action' }), false)
  })
})
