import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFlags, serializeFlagsCookie, DEFAULT_FLAGS, FLAGS_COOKIE } from '../../../ui/src/utils/agent-flags.ts'

test.describe('agent flags cookie (unit)', () => {
  test('reads positive flags from a cookie string, ignoring retired ones', () => {
    const cookie = `${FLAGS_COOKIE}=${encodeURIComponent(JSON.stringify({ toolExploration: true, subAgents: false, simpleSubAgents: false, mermaid: true, showReasoning: true }))}`
    assert.deepEqual(readFlags(cookie), { mermaid: true, showReasoning: true })
  })
  test('falls back to defaults for absent/malformed cookie', () => {
    assert.deepEqual(readFlags('other=1'), DEFAULT_FLAGS)
    assert.deepEqual(readFlags(`${FLAGS_COOKIE}=not-json`), DEFAULT_FLAGS)
  })
  test('defaults: all off', () => {
    assert.deepEqual(DEFAULT_FLAGS, { mermaid: false, showReasoning: false })
  })
  test('showReasoning defaults off when absent from an otherwise valid cookie', () => {
    const cookie = `${FLAGS_COOKIE}=${encodeURIComponent(JSON.stringify({ toolExploration: true, subAgents: true, mermaid: false }))}`
    assert.equal(readFlags(cookie).showReasoning, false)
  })
  test('serializes a service-scoped 1-year cookie', () => {
    const c = serializeFlagsCookie({ mermaid: false, showReasoning: false }, '/data-fair/agents/api')
    assert.match(c, new RegExp(`^${FLAGS_COOKIE}=`))
    assert.match(c, /Max-Age=31536000/)
    assert.match(c, /SameSite=Lax/)
    // Scoped to the agents service root, not the narrower gateway endpoint, so the
    // UI pages can read it back; still off sibling services like /data-fair/simple-directory.
    assert.match(c, /Path=\/data-fair\/agents; /)
  })
})
