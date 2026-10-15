/**
 * E2E tests for the floating chat drawer integration (DfAgentChat component).
 * Validates the d-frame message flow between the chat iframe and the parent FAB.
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

const chatDrawerSelector = '.v-navigation-drawer:has(d-frame)'

async function closeDrawer (page: Page) {
  await clickFab(page)
  await expect(page.locator(`${chatDrawerSelector}.v-navigation-drawer--active`)).not.toBeAttached({ timeout: 5000 })
}

test.describe('Chat Drawer Integration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('FAB opens the drawer, the chat works inside it, and stays alive with a waiting-user status once closed', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer', 'test-standalone1')

    const fab = page.locator(fabSelector)
    await expect(fab).toBeAttached()

    await clickFab(page)

    const drawer = page.locator(chatDrawerSelector)
    await expect(drawer).toBeVisible()
    await expect(drawer.locator('d-frame')).toBeAttached()

    const frame = await waitForChatFrame(page)
    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByRole('button', { name: 'Send' }).click()
    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    await closeDrawer(page)

    // The FAB button should reflect waiting-user status (warning color)
    await expect(fab).toHaveClass(/bg-warning/, { timeout: 5000 })

    // Keep-alive: the iframe survived the close, conversation included.
    await clickFab(page)
    await expect(frame.locator('.assistant-content').last()).toContainText('world')
  })

  test('Unread badge appears for new messages when drawer is closed', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer', 'test-standalone1')

    const fab = page.locator(fabSelector)
    await clickFab(page)
    const frame = await waitForChatFrame(page)

    // "slow hello" makes the mock answer only after a delay, so the reply provably
    // arrives *after* the drawer is closed. The unread signal is emitted on the first
    // streamed token; if that token lands while the drawer is still closing, the
    // parent treats the message as "seen" and never raises the badge. The model loop
    // runs on the server, so the delay has to be held there, not at a browser route.
    await frame.getByPlaceholder('Type your message...').fill('slow hello')

    await closeDrawer(page)

    // No badge dot yet
    await expect(fab.locator('.v-badge__badge')).not.toBeVisible()

    // Re-open, send the message, then close — all before the reply arrives.
    await clickFab(page)
    await frame.getByRole('button', { name: 'Send' }).click()
    await closeDrawer(page)

    // Wait for the unread badge dot to appear
    await expect(fab.locator('.v-badge__badge')).toBeVisible({ timeout: 10000 })

    // Opening the drawer should clear the unread badge
    await clickFab(page)
    await expect(fab.locator('.v-badge__badge')).not.toBeVisible()
  })
})
