/**
 * E2E tests for conversation history compaction.
 *
 * Validates that:
 *   - When history exceeds the compaction threshold, compaction is triggered
 *   - The compaction round-trip is stored server-side and visible on the
 *     /traces/:id/review page
 *   - The conversation continues working after compaction
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
    // The compaction round-trip goes through the summarizer role, so this model
    // must be configured for the compaction call (and its stored trace) to exist.
    summarizer: {
      model: {
        id: 'mock-summarizer',
        name: 'Mock Summarizer',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    }
  },
  quotas: defaultQuotas,
  storeTraces: true
}

test.describe('History Compaction', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Compaction triggers and appears in trace', async ({ page, context, goToWithAuth }) => {
    // Pre-set the consent cookie so the chat sends x-trace-consent: yes and the
    // conversation (including the compaction round-trip) is stored server-side.
    await context.addCookies([{
      name: 'agent-chat-trace-consent',
      value: 'yes',
      domain: 'localhost',
      path: '/'
    }])

    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    await page.evaluate(() => {
      // Set a very low threshold so compaction triggers after just one round-trip
      sessionStorage.setItem('agent-chat-compaction-threshold', '100')
    })
    await page.reload()

    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })

    // Send first message to build some history
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Send second message — history should now exceed 100 chars and trigger compaction.
    // After compaction, the latest "hello" message is preserved verbatim so mock responds "world"
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Poll the list API until the stored conversation appears.
    let conversationId = ''
    for (let i = 0; i < 40; i++) {
      const res = await admin.get('/api/traces/user/test-standalone1?page=1&size=20').catch(() => null)
      if (res && res.data.results.length) { conversationId = res.data.results[0].conversationId; break }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    expect(conversationId).toBeTruthy()

    // Open the per-trace review page.
    await goToWithAuth(`/agents/traces/${conversationId}/review`, 'test-standalone1')

    // reconstruct-trace rebuilds a dedicated "compaction" trace entry from the stored
    // summarizer round-trip, so the review page shows a compaction chip with the
    // summary + char-count details (same as the old in-browser recorder).
    const tracePanels = page.locator('.agent-chat__trace-panels')
    await expect(tracePanels).toBeVisible({ timeout: 10000 })

    const compactionEntry = tracePanels.locator('.v-expansion-panel', { hasText: 'compaction' }).first()
    await expect(compactionEntry).toBeVisible({ timeout: 10000 })

    // Expand the entry — detail auto-loads and contains the compaction fields.
    await compactionEntry.locator('.v-expansion-panel-title').click()
    await expect(compactionEntry.locator('.agent-chat__pre').first()).toBeVisible({ timeout: 3000 })
    const detail = await compactionEntry.locator('.agent-chat__pre').first().textContent()
    expect(detail).toContain('summary')
    expect(detail).toContain('originalCharCount')
    expect(detail).toContain('compactedCharCount')
  })

  test('Conversation remains functional after compaction', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    await page.evaluate(() => {
      sessionStorage.setItem('agent-chat-compaction-threshold', '100')
    })
    await page.reload()

    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })

    // First message builds history
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Second message triggers compaction, conversation should still work
    // The latest "hello" is preserved verbatim so mock responds "world"
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Third message — after compaction, the chat should still accept messages
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 10000 })

    // Verify all 3 user messages are visible in the UI (compaction is invisible to user)
    const userMessages = page.locator('.d-flex.justify-end .v-card')
    await expect(userMessages).toHaveCount(3)
  })
})
