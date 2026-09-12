import { test } from 'playwright/test'
import assert from 'node:assert/strict'
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
})
