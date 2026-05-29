/**
 * E2E tests for the flat chat block integration (DfAgentChatBlock component).
 * The block renders the chat iframe inline in the page (inside a card), always
 * visible, so there is no FAB/toggle, open/close, or unread badge to exercise.
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

// The iframe URL carries an `?initConfig=<key>` param, so match on the pathname
// (which also avoids matching the parent `/_dev/chat-block` frame).
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

test.describe('Chat Block Integration', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Block renders the chat iframe inline without any toggle', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')

    // The chat is rendered flat: the iframe is present and visible immediately,
    // with no FAB/toggle to click.
    await expect(page.locator('.df-agent-chat-toggle')).toHaveCount(0)
    const dFrame = page.locator('d-frame')
    await expect(dFrame).toBeAttached()
    await expect(dFrame).toBeVisible()
  })

  test('Chat works inside the block iframe', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')

    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByRole('button', { name: 'Send' }).click()

    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })
  })
})
