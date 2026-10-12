/**
 * E2E test: activity page (/:type/:id) lists stored conversations
 * and navigates to /:type/:id/review/:id when a row is clicked.
 *
 * Scenario:
 *   1. PUT settings with reviewPersonalAssistant: true and a mock provider/assistant model.
 *   2. Run a consented turn so the conversation is reviewable.
 *   3. Poll GET /api/review/organization/test1 until the conversation appears.
 *   4. Navigate to /agents/organization/test1 as superadmin in adminMode.
 *   5. Assert the "Stored conversations" heading is visible — the page's
 *      read-only config summary was replaced by the editable org config form,
 *      so that heading is the stable landmark that the page rendered.
 *   6. Assert the row with preview "activity hello" is listed.
 *   7. Click the row; assert the URL changes to /organization/test1/review/conv-act.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { runTurn, setReviewConsent } from '../../support/turn.ts'

const admin = await superAdmin

// Assigned per test by the turn that creates it: the server owns conversation ids.
let convId = ''

const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  ],
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
  },
  quotas: {
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 0 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: true, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 }
  },
  reviewPersonalAssistant: true
}

async function waitForReviewable (conversationId: string) {
  for (let i = 0; i < 60; i++) {
    const res = await admin.get('/api/review/organization/test1?page=1&size=20').catch(() => null)
    if (res && res.data.results?.some((r: any) => r.conversationId === conversationId)) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for conversation ${conversationId}`)
}

test.describe('Activity page', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'organization/test1', settingsData)

    // A real turn is what makes a conversation reviewable; consent travels in the cookie.
    await setReviewConsent(admin, true)
    convId = (await runTurn(admin, 'organization/test1', 'activity hello')).conversationId

    await waitForReviewable(convId)
  })

  test('lists stored conversations and navigates to review', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'superadmin', { adminMode: true })

    // The stored conversations are a tab of the activity section
    await page.locator('#activity').getByRole('tab', { name: 'Stored conversations' }).click({ timeout: 15000 })

    // A real preview again: the list reads the conversation's first user message. While review went
    // through a copy of the exchange this came from a stored request body, and once the executor
    // stopped putting messages there it silently became empty and the row fell back to the id.
    const convRow = page.getByText('activity hello')
    await expect(convRow).toBeVisible({ timeout: 10000 })

    // Clicking the row navigates to the review page
    await convRow.click()
    await expect(page).toHaveURL(new RegExp(`/organization/test1/review/${convId}`), { timeout: 10000 })
  })
})
