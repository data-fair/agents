/**
 * The runner helpers host repos used to copy: bridge settings, the review consent,
 * run errors from the conversation export, case selection from the environment.
 * No model and no network.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { bridgeSettings, MODEL_ROLES, REVIEW_CONSENT_COOKIE, REVIEW_CONSENT_YES } from '../../../lib-sim/bridge-settings.ts'
import { runErrors } from '../../../lib-sim/conversation-export.ts'
import { simCaseNames } from '../../../lib-sim/cases.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '../../../ui/src/review/review-consent.ts'

test.describe('bridge settings', () => {
  test('declares the provider openai-compatible in compatible mode', () => {
    const { superadmin } = bridgeSettings('sonnet', 'haiku', 'http://localhost:1/v1')
    assert.equal(superadmin.providers.length, 1)
    assert.equal(superadmin.providers[0].type, 'openai-compatible')
    assert.equal(superadmin.providers[0].baseURL, 'http://localhost:1/v1')
    // In 'default' mode createModel targets /v1/responses, which the bridge does not implement.
    assert.equal(superadmin.providers[0].compatibility, 'compatible')
  })

  test('maps every model role to a catalog entry that serves it', () => {
    const { superadmin, org } = bridgeSettings('sonnet', 'haiku')
    for (const role of MODEL_ROLES) {
      const ref = org.modelMapping[role]
      assert.equal(ref.provider, 'bridge', `role ${role}`)
      const entry = superadmin.models.find(m => m.model.id === ref.id)
      assert.ok(entry?.usage.includes(role), `role ${role}`)
    }
  })

  test('runs the background roles on the tools model', () => {
    const { org } = bridgeSettings('sonnet', 'haiku')
    assert.deepEqual([...MODEL_ROLES].sort(), ['assistant', 'moderator', 'summarizer', 'tools'])
    assert.equal(org.modelMapping.assistant.id, 'sonnet')
    assert.equal(org.modelMapping.tools.id, 'haiku')
    assert.equal(org.modelMapping.summarizer.id, 'haiku')
    assert.equal(org.modelMapping.moderator.id, 'haiku')
  })

  test('lists one catalog entry per model, even when both roles share it', () => {
    assert.equal(bridgeSettings('sonnet', 'haiku').superadmin.models.length, 2)
    const { models } = bridgeSettings('sonnet', 'sonnet').superadmin
    assert.equal(models.length, 1)
    assert.deepEqual([...models[0].usage].sort(), [...MODEL_ROLES].sort())
  })

  test('prices the run at zero, opens the review the export sits behind, and quotas no role', () => {
    const { superadmin, org } = bridgeSettings('sonnet', 'haiku')
    for (const entry of superadmin.models) {
      assert.equal(entry.inputPricePerMillion, 0)
      assert.equal(entry.outputPricePerMillion, 0)
    }
    // the run is read back through the conversation export, which the review gate guards
    assert.equal(org.reviewPersonalAssistant, true)
    // portal visitors are anonymous, back-office cases admins
    for (const quota of Object.values(org.quotas)) assert.equal(quota.unlimited, true)
  })
})

// The consent the export route requires, set by the runner before the chat loads: the same cookie
// the chat's consent sheet writes, so the two cannot drift.
test('the review consent cookie is the chat\'s own', () => {
  assert.equal(REVIEW_CONSENT_COOKIE, CONSENT_COOKIE)
  assert.equal(REVIEW_CONSENT_YES, CONSENT_YES)
})

// A provider failure does not throw: the turn "completes" and the run's own record says it ended in error.
test.describe('run errors from the conversation export', () => {
  const parsed = (runs: any[]) => [{ conversationId: 'c', messages: [], runs, blobs: new Map() }] as any

  test('a run that ended in error makes the case unjudgeable', () => {
    assert.deepEqual(runErrors(parsed([{ status: 'done', calls: [] }, { status: 'error', stopReason: 'provider: rate limited', calls: [] }])), ['provider: rate limited'])
  })

  test('reports the run\'s own error over its stop reason', () => {
    assert.deepEqual(runErrors(parsed([{ status: 'error', stopReason: 'error', error: 'credit cap reached', calls: [] }])), ['credit cap reached'])
  })

  test('finished and aborted runs report nothing', () => {
    assert.deepEqual(runErrors(parsed([{ status: 'done', calls: [] }, { status: 'aborted', calls: [] }])), [])
  })
})

test('simCaseNames reads SIM_CASES', () => {
  assert.deepEqual(simCaseNames({}), [])
  assert.deepEqual(simCaseNames({ SIM_CASES: ' a, b ,,' }), ['a', 'b'])
})
