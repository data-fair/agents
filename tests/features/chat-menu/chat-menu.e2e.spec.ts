/**
 * E2E tests for the chat menu integration (DfAgentChatMenu component).
 * Validates the d-frame message flow between the chat iframe and the activator button.
 */

import { expect, type Page } from '@playwright/test'
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

const fabSelector = '.df-agent-chat-toggle'

async function clickFab (page: Page) {
  await page.locator(fabSelector).dispatchEvent('click')
}

const menuContentSelector = '.v-overlay__content:has(d-frame)'

async function closeMenu (page: Page) {
  await clickFab(page)
  await expect(page.locator(menuContentSelector)).not.toBeVisible({ timeout: 5000 })
}

async function waitForChatFrame (page: Page) {
  await expect(async () => {
    expect(page.frames().find(f => f.url().endsWith('/_dev/chat'))).toBeTruthy()
  }).toPass({ timeout: 10000 })
  const frame = page.frames().find(f => f.url().endsWith('/_dev/chat'))!
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

test.describe('Chat Menu Integration', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Button is visible and opens the menu', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-menu', 'test-standalone1')

    const fab = page.locator(fabSelector)
    await expect(fab).toBeAttached()

    await clickFab(page)

    const menuContent = page.locator(menuContentSelector)
    await expect(menuContent).toBeVisible()

    const dFrame = menuContent.locator('d-frame')
    await expect(dFrame).toBeAttached()
  })

  test('Chat works inside the menu iframe', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-menu', 'test-standalone1')

    await clickFab(page)
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByPlaceholder('Type your message...').press('Enter')

    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })
  })

  test('Iframe stays alive after closing menu (keep-alive)', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-menu', 'test-standalone1')

    await clickFab(page)
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByPlaceholder('Type your message...').press('Enter')
    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    await closeMenu(page)
    await clickFab(page)

    await expect(frame.locator('.assistant-content').last()).toContainText('world')
  })

  test('Button shows waiting-user status after agent responds', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-menu', 'test-standalone1')

    await clickFab(page)
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByPlaceholder('Type your message...').press('Enter')
    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    await closeMenu(page)

    // The button should reflect waiting-user status (warning color)
    const fabBtn = page.locator(fabSelector)
    await expect(fabBtn).toHaveClass(/bg-warning/, { timeout: 5000 })
  })

  test('Unread badge appears for new messages when menu is closed', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-menu', 'test-standalone1')

    const fab = page.locator(fabSelector)
    await clickFab(page)
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')

    await closeMenu(page)

    // No badge dot yet
    await expect(fab.locator('.v-badge__badge')).not.toBeVisible()

    // Re-open, send the message, then close
    await clickFab(page)
    await frame.getByPlaceholder('Type your message...').press('Enter')
    await closeMenu(page)

    // Wait for the unread badge dot to appear
    await expect(fab.locator('.v-badge__badge')).toBeVisible({ timeout: 10000 })

    // Opening the menu should clear the unread badge
    await clickFab(page)
    await expect(fab.locator('.v-badge__badge')).not.toBeVisible()
  })
})
