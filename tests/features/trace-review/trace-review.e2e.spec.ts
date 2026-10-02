/**
 * E2E test for the stored-trace review flow.
 *
 * Scenario:
 *   1. Seed settings for user/test-standalone1 with storeTraces: true, a mock
 *      provider and an assistant model.
 *   2. Pre-set the agent-chat-trace-consent cookie to "yes" via the Playwright
 *      browser context so the chat sends the x-trace-consent header and the
 *      consent bottom-sheet never appears.
 *   3. Open /agents/user/test-standalone1/chat as test-standalone1 and send
 *      "hello". Wait for the assistant to reply with "world" (mock provider).
 *      With consent active, this conversation is stored server-side.
 *   4. Poll GET /api/review/user/test-standalone1 until the conversation appears
 *      and grab its conversationId.
 *   5. Navigate to /agents/user/test-standalone1/traces/:id as test-standalone1.
 *   6. Assert the conversation rendered — both sides of the exchange, not a type label.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

const admin = await superAdmin

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  ],
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
  },
  quotas: defaultQuotas,
  storeTraces: true
}

test.describe('Trace review flow', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'user/test-standalone1', settingsData)
  })

  test('real chat with consent stores a trace that renders on the review page', async ({ page, context, goToWithAuth }) => {
    // Step 1: Pre-set the consent cookie so the chat sends x-trace-consent: yes
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

    // Step 4: Poll the list API until the stored conversation appears
    let conversationId = ''
    for (let i = 0; i < 40; i++) {
      const res = await admin.get('/api/review/user/test-standalone1?page=1&size=20').catch(() => null)
      if (res && res.data.results.length) { conversationId = res.data.results[0].conversationId; break }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    expect(conversationId).toBeTruthy()

    // Step 5: Navigate to the new per-trace review page
    await goToWithAuth(`/agents/user/test-standalone1/traces/${conversationId}`, 'test-standalone1')

    // Step 6: the exchange itself. The old assertion looked for a `user-message` TYPE CHIP, which
    // the reconstruction layer emitted whether or not the entry had content — it kept passing after
    // the trace body stopped carrying messages, which is how the review page broke unnoticed.
    await expect(page.getByText('hello', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('world', { exact: true })).toBeVisible()

    // Step 7: and NO export button, because this reviewer is not in admin mode. The endpoint is
    // superadmin-only, so rendering it here would offer a button that answers 403.
    await expect(page.getByRole('link', { name: 'Download' })).toHaveCount(0)
  })
})
