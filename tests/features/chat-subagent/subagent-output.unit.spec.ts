import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  subAgentModelOutput,
  SUBAGENT_MODERATION_NOTICE,
  SUBAGENT_STEP_LIMIT_NOTICE,
  SUBAGENT_DONE_FALLBACK
} from '../../../ui/src/composables/agent-subagent-output.ts'

test.describe('subAgentModelOutput (what the lead receives)', () => {
  test('returns the trailing assistant text on a normal completion', () => {
    const out = subAgentModelOutput([
      { role: 'assistant', content: 'first step' },
      { role: 'assistant', content: 'Sales grew 15% YoY.' }
    ])
    assert.equal(out, 'Sales grew 15% YoY.')
  })

  test('step-limit truncation reports a partial notice, not a success', () => {
    // The regression: a worker cut off at its step cap ends on an empty/flagged
    // message and must NOT be reported as 'Task completed.'.
    const out = subAgentModelOutput([
      { role: 'assistant', content: 'querying…' },
      { role: 'assistant', content: SUBAGENT_STEP_LIMIT_NOTICE, stepLimitReached: true }
    ])
    assert.equal(out, SUBAGENT_STEP_LIMIT_NOTICE)
    assert.notEqual(out, SUBAGENT_DONE_FALLBACK)
  })

  test('moderation block takes precedence and yields the moderation notice', () => {
    const out = subAgentModelOutput([
      { role: 'assistant', content: 'refused', moderationBlocked: true }
    ])
    assert.equal(out, SUBAGENT_MODERATION_NOTICE)
  })

  test('falls back to a generic completion when the last message has no text', () => {
    const out = subAgentModelOutput([{ role: 'assistant', content: '' }])
    assert.equal(out, SUBAGENT_DONE_FALLBACK)
  })

  test('empty or non-array output falls back to a generic completion', () => {
    assert.equal(subAgentModelOutput([]), SUBAGENT_DONE_FALLBACK)
    assert.equal(subAgentModelOutput(null), SUBAGENT_DONE_FALLBACK)
    assert.equal(subAgentModelOutput(undefined), SUBAGENT_DONE_FALLBACK)
  })
})
