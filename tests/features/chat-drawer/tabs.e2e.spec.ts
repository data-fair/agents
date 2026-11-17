/**
 * The chat across browser tabs.
 *
 * The drawer's open state and the conversation belong to the TAB (sessionStorage): a ctrl-clicked tab
 * starts with the drawer closed and, once opened, a new conversation, as a new tab of ChatGPT or
 * Claude.ai does. They were shared by every tab (localStorage, and the person's latest conversation), so a
 * new tab opened the drawer, resumed the conversation and took it over, the first tab showing an error.
 *
 * Only one tab follows a conversation (a turn runs on one page's tools). When another tab does open it —
 * a duplicated tab, which copies sessionStorage — the tab left behind says so and offers to take it back.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForChatFrame, findChatFrame } from '../../support/chat-frame.ts'

const admin = await superAdmin
const standalone = await axiosAuth('test-standalone1')

const drawerUrl = '/agents/_dev/chat-drawer'
const activeDrawer = '.v-navigation-drawer:has(d-frame).v-navigation-drawer--active'
const openDrawer = (page: Page) => page.locator('.df-agent-chat-toggle').dispatchEvent('click')

test.describe('Chat across tabs', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('a new tab starts closed and on a new conversation; the first tab keeps its own', async ({ page, context, goToWithAuth }) => {
    await goToWithAuth(drawerUrl, 'test-standalone1')
    await openDrawer(page)
    const first = await waitForChatFrame(page)
    await first.getByPlaceholder('Type your message...').fill('hello')
    await first.getByRole('button', { name: 'Send' }).click()
    await expect(first.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // A tab opened beside it (what a ctrl-click does: same cookies, its own sessionStorage).
    const second = await context.newPage()
    await second.goto(page.url())
    await expect(second.locator('.df-agent-chat-toggle')).toBeAttached()
    await expect(second.locator(activeDrawer)).not.toBeAttached()
    await openDrawer(second)
    const secondFrame = await waitForChatFrame(second)
    // Nothing of the first tab's exchange (the dev page shows a welcome message of its own).
    await expect(secondFrame.locator('.assistant-content', { hasText: 'world' })).toHaveCount(0)
    await expect(secondFrame.locator('body')).not.toContainText('hello')

    // The first tab was not taken over.
    await expect(first.getByTestId('agent-chat-displaced')).not.toBeAttached()
    await expect(first.getByPlaceholder('Type your message...')).toBeVisible()

    // ...and a reload of it reopens the drawer on its own conversation.
    await page.reload()
    await expect(page.locator(activeDrawer)).toBeAttached({ timeout: 10000 })
    const reloaded = await waitForChatFrame(page)
    await expect(reloaded.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
  })

  test('a tab that opens the same conversation takes it over, and the first can continue there', async ({ page, context, goToWithAuth }) => {
    await goToWithAuth(drawerUrl, 'test-standalone1')
    await openDrawer(page)
    const first = await waitForChatFrame(page)
    await first.getByPlaceholder('Type your message...').fill('hello')
    await first.getByRole('button', { name: 'Send' }).click()
    await expect(first.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // A duplicated tab: the browser copies sessionStorage, so the second tab resumes the same conversation.
    const storage = await first.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(sessionStorage))))
    const second = await context.newPage()
    await second.addInitScript(copied => {
      for (const [key, value] of Object.entries(JSON.parse(copied) as Record<string, string>)) sessionStorage.setItem(key, value)
    }, storage)
    await second.goto(page.url())
    await expect(second.locator(activeDrawer)).toBeAttached({ timeout: 10000 })
    const secondFrame = await findChatFrame(second)
    await expect(secondFrame.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // The first tab says the conversation went on elsewhere, and offers no composer that could send nothing.
    await expect(first.getByTestId('agent-chat-displaced')).toContainText('continues in another tab', { timeout: 10000 })
    await expect(first.getByPlaceholder('Type your message...')).not.toBeAttached()
    await expect(first.locator('.assistant-content').last()).toContainText('world')

    // Continue here: the first tab follows it again, and the second is the one told.
    await first.getByTestId('agent-chat-continue-here').click()
    await expect(first.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 10000 })
    await expect(first.getByTestId('agent-chat-displaced')).not.toBeAttached()
    await expect(secondFrame.getByTestId('agent-chat-displaced')).toBeVisible({ timeout: 10000 })

    // And it can be written in again.
    await first.getByPlaceholder('Type your message...').fill('hello')
    await first.getByRole('button', { name: 'Send' }).click()
    await expect(first.locator('.assistant-content')).toHaveCount(2, { timeout: 15000 })
  })

  test('a tab whose conversation was deleted meanwhile starts a new one rather than a blocked chat', async ({ page, goToWithAuth }) => {
    await goToWithAuth(drawerUrl, 'test-standalone1')
    await openDrawer(page)
    const first = await waitForChatFrame(page)
    await first.getByPlaceholder('Type your message...').fill('hello')
    await first.getByRole('button', { name: 'Send' }).click()
    await expect(first.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    const remembered = JSON.parse(await first.evaluate(() => sessionStorage.getItem('df-agents-conversation:user:test-standalone1') ?? 'null'))
    expect(remembered?.id).toBeTruthy()
    await standalone.delete(`/api/conversations/user/test-standalone1/${remembered.id}`)

    await page.reload()
    const reloaded = await waitForChatFrame(page)
    await expect(reloaded.getByTestId('agent-chat-error')).not.toBeAttached()
    await expect(reloaded.locator('.assistant-content', { hasText: 'world' })).toHaveCount(0)
    await reloaded.getByPlaceholder('Type your message...').fill('hello')
    await reloaded.getByRole('button', { name: 'Send' }).click()
    await expect(reloaded.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
  })
})
