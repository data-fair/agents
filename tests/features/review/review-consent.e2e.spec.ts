/**
 * E2E tests for the review consent bottom-sheet and Settings toggle.
 *
 * Validates that:
 *   - When reviewPersonalAssistant is enabled, the consent sheet appears after the first
 *     assistant response.
 *   - Clicking Accept persists the cookie; after reload the sheet does not reappear.
 *   - When reviewPersonalAssistant is disabled, the sheet never appears.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

const admin = await superAdmin

const settingsWithStorage = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
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
  quotas: defaultQuotas,
  reviewPersonalAssistant: true
}

const settingsWithoutStorage = {
  ...settingsWithStorage,
  reviewPersonalAssistant: false
}

test.describe('Review consent sheet', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'user/test-standalone1', settingsWithStorage)
  })

  test('consent sheet appears after first response and Accept persists cookie', async ({ page, context, goToWithAuth }) => {
    // Navigate to the chat page (no consent cookie set yet)
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')

    // Send a message: the sheet waits for a first assistant response
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()

    // Wait for assistant response
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Consent bottom-sheet should now be visible
    await expect(page.getByText('This assistant can store your conversation on the server so an administrator can review it.')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible()

    // Click Accept
    await page.getByRole('button', { name: 'Accept' }).click()

    // Sheet must disappear immediately (proves the reactive consent write hides the sheet)
    await expect(page.getByText('This assistant can store your conversation on the server so an administrator can review it.')).toBeHidden()

    // Reload the page — cookie should be set, sheet should NOT reappear
    await page.reload()

    // Send another message, possibly before the restored conversation is on screen: it arrives into the
    // same composer, so nothing typed is lost.
    const input2 = page.getByPlaceholder('Type your message...')
    await expect(input2).toBeEnabled({ timeout: 10000 })
    await input2.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Sheet must NOT reappear
    await expect(page.getByText('This assistant can store your conversation on the server so an administrator can review it.')).not.toBeVisible()
  })

  // The Settings tab's consent toggle: consented-review.e2e.spec.ts, in the same chat before it reviews.

  test('consent sheet does not appear when reviewPersonalAssistant is disabled', async ({ page, goToWithAuth }) => {
    await putSettings(admin, 'user/test-standalone1', settingsWithoutStorage)

    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')

    // Send a message
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Sheet must NOT appear
    await expect(page.getByText('This assistant can store your conversation on the server so an administrator can review it.')).not.toBeVisible()
  })
})
