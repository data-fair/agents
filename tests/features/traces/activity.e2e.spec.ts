/**
 * E2E test: activity page (/:type/:id/activity) lists stored conversations
 * and navigates to /traces/:id/review when a row is clicked.
 *
 * Scenario:
 *   1. PUT settings with storeTraces: true and a mock provider/assistant model.
 *   2. Drive a gateway request with consent headers so a trace gets stored.
 *   3. Poll GET /api/traces/organization/test1 until the conversation appears.
 *   4. Navigate to /agents/organization/test1/activity as superadmin in adminMode.
 *   5. Assert ConfigSummary chip "Mock Provider · mock" is visible.
 *   6. Assert the trace row with preview "activity hello" is listed.
 *   7. Click the row; assert the URL changes to /traces/conv-act/review.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'

const admin = await superAdmin

const CONV_ID = 'conv-act'

const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
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

async function waitForTrace (conversationId: string) {
  for (let i = 0; i < 60; i++) {
    const res = await admin.get('/api/traces/organization/test1?page=1&size=20').catch(() => null)
    if (res && res.data.results?.some((r: any) => r.conversationId === conversationId)) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for conversation ${conversationId}`)
}

test.describe('Activity page', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', settingsData)

    await admin.post('/api/gateway/organization/test1/v1/chat/completions', {
      model: 'assistant',
      messages: [{ role: 'user', content: 'activity hello' }]
    }, {
      headers: {
        'x-trace-consent': 'yes',
        'x-trace-conversation': CONV_ID,
        'x-trace-ctx': `turn:${CONV_ID}`
      }
    })

    await waitForTrace(CONV_ID)
  })

  test('lists stored conversations and navigates to review', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/activity', 'superadmin', { adminMode: true })

    // ConfigSummary renders a chip per provider: "{{ p.name }} · {{ p.type }}"
    await expect(page.getByText('Mock Provider · mock')).toBeVisible({ timeout: 15000 })

    // The seeded conversation preview should appear in the list
    const convRow = page.getByText('activity hello')
    await expect(convRow).toBeVisible({ timeout: 10000 })

    // Clicking the row navigates to the review page
    await convRow.click()
    await expect(page).toHaveURL(/\/traces\/conv-act\/review/, { timeout: 10000 })
  })
})
