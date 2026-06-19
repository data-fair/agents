/**
 * E2E test for the stored-trace review flow.
 *
 * Scenario:
 *   1. Seed settings for user/test-standalone1 with storeTraces: true, a mock
 *      provider, and both assistant and evaluator models.
 *   2. Pre-set the agent-chat-trace-consent cookie to "yes" via the Playwright
 *      browser context so the chat sends the x-trace-consent header and the
 *      consent bottom-sheet never appears.
 *   3. Open /agents/user/test-standalone1/chat as test-standalone1 and send
 *      "hello". Wait for the assistant to reply with "world" (mock provider).
 *      With consent active, this conversation is stored server-side.
 *   4. Poll GET /api/traces/user/test-standalone1 until the conversation appears
 *      and grab its conversationId.
 *   5. Navigate to /agents/user/test-standalone1/traces/:id as test-standalone1.
 *   6. Assert the TraceView rendered (a "user-message" chip is visible).
 *   7. Use the evaluator: send "call tool getTraceOverview" and assert the
 *      getTraceOverview tool-invocation chip appears.
 */

import { expect } from '@playwright/test'
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
    },
    evaluator: {
      model: {
        id: 'mock-evaluator',
        name: 'Mock Evaluator',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    }
  },
  quotas: defaultQuotas,
  storeTraces: true
}

test.describe('Trace review flow', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('real chat with consent stores a trace that renders on the review page with a working evaluator', async ({ page, context, goToWithAuth }) => {
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
      const res = await admin.get('/api/traces/user/test-standalone1?page=1&size=20').catch(() => null)
      if (res && res.data.results.length) { conversationId = res.data.results[0].conversationId; break }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    expect(conversationId).toBeTruthy()

    // Step 5: Navigate to the new per-trace review page
    await goToWithAuth(`/agents/user/test-standalone1/traces/${conversationId}`, 'test-standalone1')

    // Step 6: Assert the TraceView populated — a "user-message" type chip is visible
    await expect(page.getByText('user-message').first()).toBeVisible({ timeout: 10000 })

    // Step 7: Use the evaluator — send a message that triggers the getTraceOverview tool call
    const evalInput = page.getByPlaceholder('Type your message...')
    await expect(evalInput).toBeEnabled({ timeout: 10000 })
    await evalInput.fill('call tool getTraceOverview')
    await page.getByRole('button', { name: 'Send' }).click()

    // The tool-invocation chip for getTraceOverview must appear
    await expect(
      page.locator('.v-chip').filter({ hasText: 'getTraceOverview' }).first()
    ).toBeVisible({ timeout: 15000 })
  })
})
