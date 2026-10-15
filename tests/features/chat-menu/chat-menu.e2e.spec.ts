/**
 * E2E tests for the chat menu integration (DfAgentChatMenu component).
 * Validates the d-frame message flow between the chat iframe and the activator button.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForChatFrame } from '../../support/chat-frame.ts'

const admin = await superAdmin

const fabSelector = '.df-agent-chat-toggle'

async function clickFab (page: Page) {
  await page.locator(fabSelector).dispatchEvent('click')
}

const menuContentSelector = '.v-overlay__content:has(d-frame)'

async function closeMenu (page: Page) {
  await clickFab(page)
  await expect(page.locator(menuContentSelector)).not.toBeVisible({ timeout: 5000 })
}

test.describe('Chat Menu Integration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('Button opens the menu, the chat works inside it, stays alive with a waiting-user status once closed, and the menu starts closed after a reload', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-menu', 'test-standalone1')

    const fab = page.locator(fabSelector)
    await expect(fab).toBeAttached()

    await clickFab(page)

    const menuContent = page.locator(menuContentSelector)
    await expect(menuContent).toBeVisible()
    await expect(menuContent.locator('d-frame')).toBeAttached()

    const frame = await waitForChatFrame(page)
    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByPlaceholder('Type your message...').press('Enter')
    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    await closeMenu(page)

    // The button should reflect waiting-user status (warning color)
    await expect(fab).toHaveClass(/bg-warning/, { timeout: 5000 })

    // Keep-alive: the iframe survived the close, conversation included.
    await clickFab(page)
    await expect(menuContent).toBeVisible()
    await expect(frame.locator('.assistant-content').last()).toContainText('world')

    // The menu must always start closed and open only on click — it should not
    // restore its previously-open state from a prior visit.
    await page.reload()
    await expect(fab).toBeAttached()
    await expect(menuContent).not.toBeVisible()
  })

  test('Unread badge appears for new messages when menu is closed', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-menu', 'test-standalone1')

    const fab = page.locator(fabSelector)
    await clickFab(page)
    const frame = await waitForChatFrame(page)

    // "slow hello" makes the mock answer only after a delay, so the reply provably
    // arrives *after* the menu is closed (see the same test in chat-drawer.e2e.spec.ts).
    await frame.getByPlaceholder('Type your message...').fill('slow hello')

    await closeMenu(page)

    // No badge dot yet
    await expect(fab.locator('.v-badge__badge')).not.toBeVisible()

    // Re-open, send the message, then close — all before the reply arrives.
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
