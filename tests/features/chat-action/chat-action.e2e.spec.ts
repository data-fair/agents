/**
 * E2E tests for DfAgentChatAction — inline action button that opens
 * the agent chat drawer with a context-specific prompt via BroadcastChannel.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForChatFrame } from '../../support/chat-frame.ts'

const admin = await superAdmin

const chatDrawerSelector = '.v-navigation-drawer:has(d-frame)'

test.describe('Agent Chat Action Button', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('Clicking action buttons opens the drawer and appends their visible prompts, never the hidden context', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')

    // Click the "Create a dataset" action button (opens the drawer via BroadcastChannel)
    await page.locator('.df-agent-chat-action').first().click()

    // Wait for the chat frame to be ready inside the now-open drawer
    const frame = await waitForChatFrame(page)
    await expect(page.locator(chatDrawerSelector)).toBeVisible()

    // The visible (action) prompt renders as an accent-coloured user bubble,
    // distinct from ordinary typed messages (secondary).
    const userMessage = frame.locator('.v-card.bg-accent').first()
    await expect(userMessage).toContainText('Help me create a new dataset', { timeout: 10000 })

    // The hidden context should NOT be visible anywhere in the chat
    const chatContent = frame.locator('.agent-chat')
    expect(await chatContent.textContent()).not.toContain('Relevant tools to focus on')

    // A second action appends to the conversation: both prompts are present.
    await page.locator('.df-agent-chat-action').nth(1).click()
    await expect(chatContent).toContainText('Help me configure a data processing', { timeout: 10000 })
    await expect(chatContent).toContainText('Help me create a new dataset')
  })

  test('Destroying action button preserves the conversation', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')

    // Click the destroyable action (third button, opens the drawer)
    await page.locator('.df-agent-chat-action').nth(2).click()
    const frame = await waitForChatFrame(page)
    await expect(frame.locator('.v-card').first()).toContainText('Help me with this temporary action', { timeout: 10000 })

    // Click "Hide temporary action" to destroy the button
    await page.getByText('Hide temporary action').click()

    // The conversation should still be visible (not cleared)
    await expect(frame.locator('.v-card').first()).toContainText('Help me with this temporary action', { timeout: 5000 })

    // No session-cleared alert should appear
    await expect(frame.locator('.v-alert')).not.toBeVisible({ timeout: 2000 })
  })
})
