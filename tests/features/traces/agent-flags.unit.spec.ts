import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFlags, serializeFlagsCookie, DEFAULT_FLAGS, FLAGS_COOKIE } from '../../../ui/src/utils/agent-flags.ts'

test.describe('agent flags cookie (unit)', () => {
  test('reads positive flags from a cookie string (simpleSubAgents default-on when absent)', () => {
    const cookie = `${FLAGS_COOKIE}=${encodeURIComponent(JSON.stringify({ toolExploration: true, subAgents: false, mermaid: true }))}`
    assert.deepEqual(readFlags(cookie), { toolExploration: true, subAgents: false, mermaid: true, simpleSubAgents: true })
  })
  test('reads simpleSubAgents:false explicitly', () => {
    const cookie = `${FLAGS_COOKIE}=${encodeURIComponent(JSON.stringify({ simpleSubAgents: false }))}`
    assert.equal(readFlags(cookie).simpleSubAgents, false)
  })
  test('falls back to defaults for absent/malformed cookie', () => {
    assert.deepEqual(readFlags('other=1'), DEFAULT_FLAGS)
    assert.deepEqual(readFlags(`${FLAGS_COOKIE}=not-json`), DEFAULT_FLAGS)
  })
  test('defaults: subAgents + simpleSubAgents on, others off', () => {
    assert.deepEqual(DEFAULT_FLAGS, { toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: true })
  })
  test('serializes a service-scoped 1-year cookie', () => {
    const c = serializeFlagsCookie({ toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: true }, '/data-fair/agents/api')
    assert.match(c, new RegExp(`^${FLAGS_COOKIE}=`))
    assert.match(c, /Max-Age=31536000/)
    assert.match(c, /SameSite=Lax/)
    // Scoped to the agents service root, not the narrower gateway endpoint, so the
    // UI pages can read it back; still off sibling services like /data-fair/simple-directory.
    assert.match(c, /Path=\/data-fair\/agents; /)
  })
})
