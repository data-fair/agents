/**
 * E2E tests for conversation history compaction.
 *
 * Validates that:
 *   - When history exceeds the compaction threshold, compaction is triggered
 *   - The compaction is visible in the debug trace as a distinct entry
 *   - The conversation continues working after compaction
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

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
      }
    }
  },
  quotas: defaultQuotas
}

test.describe('History Compaction', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Compaction triggers and appears in trace', async ({ page, goToWithAuth }) => {
    // Use an admin user with adminMode so the debug button is visible
    await admin.put('/api/settings/user/superadmin', settingsData)
    await goToWithAuth('/agents/user/superadmin/chat', 'superadmin', { adminMode: true })
    await page.evaluate(() => {
      sessionStorage.setItem('agent-chat-trace', '1')
      // Set a very low threshold so compaction triggers after just one round-trip
      sessionStorage.setItem('agent-chat-compaction-threshold', '100')
    })
    await page.reload()

    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })

    // Send first message to build some history
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Send second message — history should now exceed 100 chars and trigger compaction
    // After compaction, the latest "hello" message is preserved verbatim so mock responds "world"
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Open debug dialog and go to Trace tab
    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await page.getByRole('tab', { name: /Trace/ }).click()

    // Verify a compaction trace entry exists
    const tracePanel = page.locator('.v-dialog .v-expansion-panels').last()
    const compactionEntry = tracePanel.locator('.v-expansion-panel', { hasText: 'compaction' })
    await expect(compactionEntry.first()).toBeVisible({ timeout: 5000 })

    // Expand the compaction entry to verify details load
    await compactionEntry.first().locator('.v-expansion-panel-title').click()
    await expect(compactionEntry.first().locator('.agent-chat__pre')).toBeVisible({ timeout: 3000 })

    // Verify the detail content contains the expected compaction fields
    const detailContent = await compactionEntry.first().locator('.agent-chat__pre').textContent()
    expect(detailContent).toContain('summary')
    expect(detailContent).toContain('originalMessages')
    expect(detailContent).toContain('originalCharCount')
  })

  test('Conversation remains functional after compaction', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    await page.evaluate(() => {
      sessionStorage.setItem('agent-chat-compaction-threshold', '100')
    })
    await page.reload()

    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })

    // First message builds history
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Second message triggers compaction, conversation should still work
    // The latest "hello" is preserved verbatim so mock responds "world"
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Third message — after compaction, the chat should still accept messages
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Verify all 3 user messages are visible in the UI (compaction is invisible to user)
    const userMessages = page.locator('.d-flex.justify-end .v-card')
    await expect(userMessages).toHaveCount(3)
  })
})
