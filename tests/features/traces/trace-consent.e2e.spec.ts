/**
 * E2E tests for the trace-storage consent bottom-sheet and Settings toggle.
 *
 * Validates that:
 *   - When storeTraces is enabled, the consent sheet appears after the first
 *     assistant response (which carries x-trace-storage: available).
 *   - Clicking Accept persists the cookie; after reload the sheet does not reappear.
 *   - When storeTraces is disabled, the sheet never appears.
 *   - The Settings tab in the debug dialog shows the consent toggle when storage is available.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const settingsWithStorage = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    }
  },
  quotas: defaultQuotas,
  storeTraces: true
}

const settingsWithoutStorage = {
  ...settingsWithStorage,
  storeTraces: false
}

test.describe('Trace consent sheet', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsWithStorage)
  })

  test('consent sheet appears after first response and Accept persists cookie', async ({ page, context, goToWithAuth }) => {
    // Navigate to the chat page (no consent cookie set yet)
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')

    // Send a message to trigger a gateway response with x-trace-storage: available
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

    // Send another message to trigger the storage-available header again
    const input2 = page.getByPlaceholder('Type your message...')
    await expect(input2).toBeEnabled({ timeout: 10000 })
    await input2.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Sheet must NOT reappear
    await expect(page.getByText('This assistant can store your conversation on the server so an administrator can review it.')).not.toBeVisible()
  })

  test('Settings tab shows consent toggle when storage is available', async ({ page, context, goToWithAuth }) => {
    // Pre-set the consent cookie so the bottom-sheet does not block interaction
    await context.addCookies([{
      name: 'agent-chat-trace-consent',
      value: 'yes',
      domain: 'localhost',
      path: '/'
    }])

    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')

    // Send a message so the gateway sets traceStorageAvailable
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Open the debug dialog
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()

    // Go to the Settings tab
    await page.getByRole('tab', { name: /^Settings$|^Paramètres$/ }).click()

    // The consent toggle should be visible
    await expect(page.getByText('Store my conversations for review')).toBeVisible({ timeout: 5000 })
  })

  test('consent sheet does not appear when storeTraces is disabled', async ({ page, goToWithAuth }) => {
    await admin.put('/api/settings/user/test-standalone1', settingsWithoutStorage)

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
