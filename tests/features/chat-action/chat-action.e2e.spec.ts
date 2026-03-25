/**
 * E2E tests for DfAgentChatAction — inline action button that opens
 * the agent chat drawer with a context-specific prompt via BroadcastChannel.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, axiosAuth, defaultQuotas } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

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

const chatDrawerSelector = '.v-navigation-drawer:has(d-frame)'

async function waitForChatFrame (page: Page) {
  await expect(async () => {
    expect(page.frames().find(f => f.url().endsWith('/_dev/chat'))).toBeTruthy()
  }).toPass({ timeout: 10000 })
  const frame = page.frames().find(f => f.url().endsWith('/_dev/chat'))!
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

test.describe('Agent Chat Action Button', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Clicking action button opens drawer with visible prompt', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')

    // Wait for the chat frame to be ready (iframe is always rendered)
    const frame = await waitForChatFrame(page)

    // Click the "Create a dataset" action button
    await page.locator('.df-agent-chat-action').first().click()

    // Drawer should be visible
    const drawer = page.locator(chatDrawerSelector)
    await expect(drawer).toBeVisible()

    // The visible prompt should appear as a user message
    const userMessage = frame.locator('.v-card.bg-secondary').first()
    await expect(userMessage).toContainText('Help me create a new dataset', { timeout: 10000 })
  })

  test('Hidden context is not visible in chat messages', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    await page.locator('.df-agent-chat-action').first().click()

    // Wait for the visible prompt to appear
    await expect(frame.locator('.v-card').first()).toContainText('Help me create a new dataset', { timeout: 10000 })

    // The hidden context should NOT be visible anywhere in the chat
    const chatContent = await frame.locator('.agent-chat').textContent()
    expect(chatContent).not.toContain('Relevant tools to focus on')
  })

  test('Clicking a second action button replaces the session', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    // Click first action
    await page.locator('.df-agent-chat-action').first().click()
    await expect(frame.locator('.v-card').first()).toContainText('Help me create a new dataset', { timeout: 10000 })

    // Click second action
    await page.locator('.df-agent-chat-action').nth(1).click()

    // Should now show the second action's prompt
    await expect(frame.locator('.v-card').first()).toContainText('Help me configure a data processing', { timeout: 10000 })

    // First prompt should be gone
    const chatContent = await frame.locator('.agent-chat').textContent()
    expect(chatContent).not.toContain('Help me create a new dataset')
  })

  test('Destroying action button shows session-cleared message', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    // Click the destroyable action (third button)
    await page.locator('.df-agent-chat-action').nth(2).click()
    await expect(frame.locator('.v-card').first()).toContainText('Help me with this temporary action', { timeout: 10000 })

    // Click "Hide temporary action" to destroy the button
    await page.getByText('Hide temporary action').click()

    // The chat should show a session-cleared info message
    await expect(frame.locator('.v-alert')).toContainText('session has ended', { timeout: 5000 })
  })
})
