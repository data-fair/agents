import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  subAgentModelOutput,
  SUBAGENT_STEP_LIMIT_NOTICE,
  SUBAGENT_PARTIAL_PREFIX,
  SUBAGENT_DONE_FALLBACK
} from '../../../api/src/conversations/subagent-output.ts'

test.describe('subAgentModelOutput (what the lead receives)', () => {
  test('returns the worker\'s text on a normal completion', () => {
    assert.equal(subAgentModelOutput({ text: 'Sales grew 15% YoY.' }), 'Sales grew 15% YoY.')
  })

  test('step-limit with a recovered close-out answer hands the lead the data, flagged partial', () => {
    // The forced close-out turn synthesized a real answer despite the step cap: the lead
    // must receive that answer (not a bare notice), prefixed so it treats it as partial.
    const out = subAgentModelOutput({ text: 'Found 68 school-calendar rows for the Rennes academy.', stepLimitReached: true })
    assert.ok(out.startsWith(SUBAGENT_PARTIAL_PREFIX))
    assert.ok(out.includes('Found 68 school-calendar rows for the Rennes academy.'))
    assert.notEqual(out, SUBAGENT_DONE_FALLBACK)
  })

  test('step-limit with no recovered content falls back to the standalone notice', () => {
    // The close-out call itself failed (empty content): report the truncation rather
    // than fabricate a result, and never disguise it as 'Task completed.'.
    const out = subAgentModelOutput({ text: '', stepLimitReached: true })
    assert.equal(out, SUBAGENT_STEP_LIMIT_NOTICE)
    assert.notEqual(out, SUBAGENT_DONE_FALLBACK)
  })

  test('falls back to a generic completion when the worker produced no text', () => {
    assert.equal(subAgentModelOutput({ text: '' }), SUBAGENT_DONE_FALLBACK)
    assert.equal(subAgentModelOutput({}), SUBAGENT_DONE_FALLBACK)
  })
})
