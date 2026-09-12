import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bridgeSettings } from '../../../simulations/runner/settings.ts'

test.describe('bridge settings', () => {
  test('points every model role at the bridge provider', () => {
    const s = bridgeSettings('sonnet') as any
    for (const role of ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']) {
      assert.equal(s.models[role].model.id, 'sonnet', `${role} model`)
      assert.equal(s.models[role].model.provider.id, 'bridge', `${role} provider`)
    }
  })

  test('uses openai-compatible in compatible mode', () => {
    // The default mode targets /v1/responses, which the bridge does not implement.
    const s = bridgeSettings('sonnet') as any
    assert.equal(s.providers[0].type, 'openai-compatible')
    assert.equal(s.providers[0].compatibility, 'compatible')
  })

  test('gives the admin role unlimited quota so a long scenario is not cut off', () => {
    const s = bridgeSettings('sonnet') as any
    assert.equal(s.quotas.admin.unlimited, true)
  })

  test('does not perform network I/O at module load', () => {
    // Guard against regression: settings.ts must not statically import test helpers,
    // which would cause authentication (network I/O) before any test runs. Dynamic
    // imports inside functions (await import(...)) are allowed.
    const source = readFileSync('simulations/runner/settings.ts', 'utf8')
    const hasStaticTestSupport = /^import\s+.*from\s+['"].*tests\/support/m.test(source)
    assert.equal(
      hasStaticTestSupport,
      false,
      'settings.ts must not statically import from tests/support (causes network I/O at module load, violating the constraint that unit tests must not hit the network)'
    )
  })
})
