/**
 * E2E test for the consented review flow.
 *
 * Scenario:
 *   1. Seed settings for user/test-standalone1 with reviewPersonalAssistant: true, a mock
 *      provider and an assistant model.
 *   2. Pre-set the agent-chat-trace-consent cookie to "yes" via the Playwright
 *      browser context so the chat says the consent over the agent session and the
 *      consent bottom-sheet never appears.
 *   3. Open /agents/user/test-standalone1/chat as test-standalone1 and send
 *      "hello". Wait for the assistant to reply with "world" (mock provider).
 *      With consent active, this conversation is stored server-side.
 *   4. Open the chat's debug dialog: exactly three tabs, and the consent toggle in Settings.
 *   5. Poll GET /api/review/user/test-standalone1 until the conversation appears
 *      and grab its conversationId.
 *   6. Navigate to /agents/user/test-standalone1/review/:id as test-standalone1.
 *   7. Assert the conversation rendered — both sides of the exchange, not a type label.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Consented review flow', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1', { reviewPersonalAssistant: true })
  })

  test('real chat with consent is reviewable on the review page', async ({ page, context, goToWithAuth }) => {
    // Step 1: Pre-set the consent cookie so the chat says yes over the agent session
    // and the consent bottom-sheet never blocks interaction.
    await context.addCookies([{
      name: 'agent-chat-trace-consent',
      value: 'yes',
      domain: 'localhost',
      path: '/'
    }])

    // Step 2: Open the chat page as test-standalone1
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')

    // Step 3: Send a message and wait for the assistant response
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Step 4: the debug dialog, opened from the admin-only cog button in the chat header
    // (AgentChatHeader.vue emits `show-debug`); its title is "Settings". Exactly three tabs (Info,
    // Settings, Consumption) — the Trace tab was removed — and, since this account offers review
    // and the turn above set reviewOffered, the consent toggle in its Settings tab.
    await page.getByRole('button', { name: /^Settings$|^Paramètres$/ }).click()
    await expect(page.getByRole('tab')).toHaveCount(3)
    await expect(page.getByRole('tab', { name: 'Trace' })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Info' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Consumption' })).toBeVisible()
    await page.getByRole('tab', { name: /^Settings$|^Paramètres$/ }).click()
    await expect(page.getByText('Store my conversations for review')).toBeVisible({ timeout: 5000 })

    // Step 5: Poll the list API until the stored conversation appears
    let conversationId = ''
    await expect.poll(async () => {
      const res = await admin.get('/api/review/user/test-standalone1?page=1&size=20').catch(() => null)
      conversationId = res?.data.results[0]?.conversationId ?? ''
      return conversationId
    }, { timeout: 8000 }).not.toBe('')

    // Step 6: Navigate to the review page
    await goToWithAuth(`/agents/user/test-standalone1/review/${conversationId}`, 'test-standalone1')

    // Step 7: the exchange itself. The old assertion looked for a `user-message` TYPE CHIP, which
    // the reconstruction layer emitted whether or not the entry had content — it kept passing after
    // the trace body stopped carrying messages, which is how the review page broke unnoticed.
    await expect(page.getByText('hello', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('world', { exact: true })).toBeVisible()

    // Step 8: and NO export button, because this reviewer is not in admin mode. The endpoint is
    // superadmin-only, so rendering it here would offer a button that answers 403.
    await expect(page.getByRole('link', { name: 'Download' })).toHaveCount(0)
  })
})
