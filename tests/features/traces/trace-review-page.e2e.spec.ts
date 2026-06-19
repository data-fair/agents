/**
 * E2E test: navigate to /organization/test1/traces/:id and assert the stored trace renders.
 *
 * Scenario:
 *   1. PUT settings with storeTraces: true and a mock provider/assistant model.
 *   2. Drive a gateway request with consent headers so a trace gets stored.
 *   3. Poll GET /api/traces/conversation/:id until the trace appears.
 *   4. Navigate to /agents/organization/test1/traces/:id as superadmin.
 *   5. Assert the TraceView rendered (a user-message chip is visible).
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'

const admin = await superAdmin

const CONV_ID = 'conv-review-page-e2e'

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      },
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

async function waitForConversation (conversationId: string) {
  for (let i = 0; i < 60; i++) {
    const res = await admin.get(`/api/traces/conversation/${conversationId}`).catch(() => null)
    if (res && res.data.results.length > 0) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for conversation ${conversationId}`)
}

test.describe('Trace review page (/organization/test1/traces/:id)', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', settingsData)

    // Drive a gateway request with consent headers to create a stored trace
    await admin.post('/api/gateway/organization/test1/v1/chat/completions', {
      model: 'assistant',
      messages: [{ role: 'user', content: 'hello review page' }]
    }, {
      headers: {
        'x-trace-consent': 'yes',
        'x-trace-conversation': CONV_ID,
        'x-trace-ctx': `turn:${CONV_ID}`,
        cookie: `agent-chat-flags=${encodeURIComponent(JSON.stringify({ toolExploration: true, subAgents: false, mermaid: true }))}`
      }
    })

    // Wait until the trace is persisted (async write)
    await waitForConversation(CONV_ID)
  })

  test('renders the stored trace for an admin', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/traces/${CONV_ID}`, 'superadmin', { adminMode: true })

    // The page must not show the load-error state
    await expect(page.getByText('Trace not found or access denied.', { exact: false })).toHaveCount(0)

    // TraceView renders a chip per trace entry; the first user message produces a
    // "user-message" chip — same assertion used in trace-review.e2e.spec.ts
    await expect(page.getByText('user-message').first()).toBeVisible({ timeout: 15000 })
  })

  test('shows the summary bar, flag chips and view toggle', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/traces/${CONV_ID}`, 'superadmin', { adminMode: true })

    // summary bar: the request-count metric and a feature-specific flag chip
    // ('tool exploration' is active per the cookie set in beforeEach).
    await expect(page.getByText('1 requests', { exact: false })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('tool exploration', { exact: false })).toBeVisible()

    // default Interpreted view hides physical-request entries
    await expect(page.getByText('physical-request')).toHaveCount(0)

    // switching to Raw reveals them
    await page.getByRole('button', { name: 'Raw' }).click()
    await expect(page.getByText('physical-request').first()).toBeVisible()
  })
})
