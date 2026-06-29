import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  subAgentModelOutput,
  SUBAGENT_MODERATION_NOTICE,
  SUBAGENT_STEP_LIMIT_NOTICE,
  SUBAGENT_PARTIAL_PREFIX,
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

  test('step-limit with a recovered close-out answer hands the lead the data, flagged partial', () => {
    // The forced close-out turn synthesized a real answer despite the step cap: the lead
    // must receive that answer (not a bare notice), prefixed so it treats it as partial.
    const out = subAgentModelOutput([
      { role: 'assistant', content: 'querying…' },
      { role: 'assistant', content: 'Found 68 school-calendar rows for the Rennes academy.', stepLimitReached: true }
    ])
    assert.ok(out.startsWith(SUBAGENT_PARTIAL_PREFIX))
    assert.ok(out.includes('Found 68 school-calendar rows for the Rennes academy.'))
    assert.notEqual(out, SUBAGENT_DONE_FALLBACK)
  })

  test('step-limit with no recovered content falls back to the standalone notice', () => {
    // The close-out call itself failed (empty content): report the truncation rather
    // than fabricate a result, and never disguise it as 'Task completed.'.
    const out = subAgentModelOutput([
      { role: 'assistant', content: 'querying…' },
      { role: 'assistant', content: '', stepLimitReached: true }
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
