/**
 * E2E tests for the flat chat block integration (DfAgentChatBlock component).
 * The block renders the chat iframe inline in the page (inside a card), always
 * visible, so there is no FAB/toggle, open/close, or unread badge to exercise.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForChatFrame } from '../../support/chat-frame.ts'

const admin = await superAdmin

test.describe('Chat Block Integration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('Block renders the chat iframe inline without any toggle, and the chat works inside it', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')

    // The chat is rendered flat: the iframe is present and visible immediately,
    // with no FAB/toggle to click.
    await expect(page.locator('.df-agent-chat-toggle')).toHaveCount(0)
    const dFrame = page.locator('d-frame')
    await expect(dFrame).toBeAttached()
    await expect(dFrame).toBeVisible()

    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByRole('button', { name: 'Send' }).click()

    await expect(frame.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })
  })
})
