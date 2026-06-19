/**
 * E2E test: compare two stored traces side by side from the review page.
 *
 * Scenario:
 *   1. PUT settings with storeTraces + a mock provider/assistant model.
 *   2. Drive two gateway requests (two conversation ids) so two traces get stored.
 *   3. Navigate to /agents/organization/test1/traces/:idA as superadmin.
 *   4. Click "Compare with…", pick the second conversation.
 *   5. Assert ?compare= is set and two TraceViews render.
 *   6. Collapse the evaluator, then clear the comparison.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'

const admin = await superAdmin

const CONV_A = 'conv-compare-a'
const CONV_B = 'conv-compare-b'

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  },
  quotas: {
    global: { unlimited: true, monthlyLimit: 0 },
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 0 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: true, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 }
  },
  storeTraces: true
}

async function driveConversation (convId: string, message: string) {
  await admin.post('/api/gateway/organization/test1/v1/chat/completions', {
    model: 'assistant',
    messages: [{ role: 'user', content: message }]
  }, {
    headers: {
      'x-trace-consent': 'yes',
      'x-trace-conversation': convId,
      'x-trace-ctx': `turn:${convId}`
    }
  })
}

async function waitForConversation (conversationId: string) {
  for (let i = 0; i < 60; i++) {
    const res = await admin.get(`/api/traces/conversation/${conversationId}`).catch(() => null)
    if (res && res.data.results.length > 0) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for conversation ${conversationId}`)
}

test.describe('Trace comparison (/traces/:id/review?compare=)', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', settingsData)
    await driveConversation(CONV_A, 'hello trace A')
    await driveConversation(CONV_B, 'hello trace B')
    await waitForConversation(CONV_A)
    await waitForConversation(CONV_B)
  })

  test('picks a second trace and renders both side by side', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/traces/${CONV_A}`, 'superadmin', { adminMode: true })

    // single view first: one TraceView (one user-message chip)
    await expect(page.getByText('user-message').first()).toBeVisible({ timeout: 15000 })

    // open the picker and choose the other conversation
    await page.getByRole('button', { name: 'Compare with…' }).click()
    await page.getByText('hello trace B').click()

    // ?compare= now points at CONV_B
    await expect(page).toHaveURL(new RegExp(`compare=${CONV_B}`))

    // both traces render: two user-message chips across the two panes
    await expect(page.getByText('user-message')).toHaveCount(2, { timeout: 15000 })

    // collapse the evaluator, then clear the comparison
    await page.getByRole('button', { name: 'Hide evaluator' }).click()
    await page.getByRole('button', { name: 'Close comparison' }).click()

    // back to single view: ?compare= gone, one user-message chip
    await expect(page).not.toHaveURL(/compare=/)
    await expect(page.getByText('user-message')).toHaveCount(1, { timeout: 15000 })
  })
})
