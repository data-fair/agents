/**
 * E2E tests for the floating chat drawer integration (DfAgentChat component).
 * Validates the d-frame message flow between the chat iframe and the parent FAB.
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

const chatDrawerSelector = '.v-navigation-drawer:has(d-frame)'

async function closeDrawer (page: Page) {
  await clickFab(page)
  await expect(page.locator(`${chatDrawerSelector}.v-navigation-drawer--active`)).not.toBeAttached({ timeout: 5000 })
}

// The iframe URL carries an `?initConfig=<key>` param, so match on the pathname
// (which also avoids matching the parent `/_dev/chat-drawer` frame).
function isChatFrameUrl (url: string): boolean {
  try {
    return new URL(url).pathname.endsWith('/_dev/chat')
  } catch {
    return false
  }
}

async function waitForChatFrame (page: Page) {
  await expect(async () => {
    expect(page.frames().find(f => isChatFrameUrl(f.url()))).toBeTruthy()
  }).toPass({ timeout: 10000 })
  const frame = page.frames().find(f => isChatFrameUrl(f.url()))!
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

test.describe('Chat Drawer Integration', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('FAB is visible and opens the drawer', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer', 'test-standalone1')

    const fab = page.locator(fabSelector)
    await expect(fab).toBeAttached()

    await clickFab(page)

    const drawer = page.locator(chatDrawerSelector)
    await expect(drawer).toBeVisible()

    const dFrame = drawer.locator('d-frame')
    await expect(dFrame).toBeAttached()
  })

  test('Chat works inside the drawer iframe', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer', 'test-standalone1')

    await clickFab(page)
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByRole('button', { name: 'Send' }).click()

    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })
  })

  test('Iframe stays alive after closing drawer (keep-alive)', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer', 'test-standalone1')

    await clickFab(page)
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByRole('button', { name: 'Send' }).click()
    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    await closeDrawer(page)
    await clickFab(page)

    await expect(frame.locator('.assistant-content').last()).toContainText('world')
  })

  test('FAB shows waiting-user status after agent responds', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer', 'test-standalone1')

    await clickFab(page)
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByRole('button', { name: 'Send' }).click()
    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    await closeDrawer(page)

    // The FAB button should reflect waiting-user status (warning color)
    const fabBtn = page.locator(fabSelector)
    await expect(fabBtn).toHaveClass(/bg-warning/, { timeout: 5000 })
  })

  test('Unread badge appears for new messages when drawer is closed', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-drawer', 'test-standalone1')

    const fab = page.locator(fabSelector)
    await clickFab(page)
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')

    await closeDrawer(page)

    // No badge dot yet
    await expect(fab.locator('.v-badge__badge')).not.toBeVisible()

    // Hold the assistant reply at the network layer so it provably arrives only
    // *after* the drawer is closed. The unread signal is emitted on the first
    // streamed token; if that token lands while the drawer is still closing, the
    // parent treats the message as "seen" and never raises the badge. Gating the
    // reply removes that race.
    let releaseReply: () => void = () => {}
    const replyGate = new Promise<void>(resolve => { releaseReply = resolve })
    const completionsUrl = '**/v1/chat/completions'
    await page.route(completionsUrl, async (route) => {
      await replyGate
      await route.continue()
    })

    // Re-open, send the message, then close — all before the reply is released.
    await clickFab(page)
    await frame.getByRole('button', { name: 'Send' }).click()
    await closeDrawer(page)

    // Now let the reply stream back, while the drawer is closed.
    releaseReply()

    // Wait for the unread badge dot to appear
    await expect(fab.locator('.v-badge__badge')).toBeVisible({ timeout: 10000 })

    // Opening the drawer should clear the unread badge
    await clickFab(page)
    await expect(fab.locator('.v-badge__badge')).not.toBeVisible()

    await page.unroute(completionsUrl)
  })
})
