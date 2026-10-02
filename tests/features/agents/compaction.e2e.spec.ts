/**
 * E2E tests for conversation history compaction.
 *
 * REWRITTEN for the server-held loop, and the previous version is worth recording because it was
 * passing-shaped rather than passing. It forced the budget with
 * `sessionStorage.setItem('agent-chat-compaction-threshold', …)` — a knob the browser loop read and
 * that nothing reads any more — and then asserted a `.agent-chat__trace-panels` compaction entry
 * rebuilt by `reconstruct-trace`, a renderer that no longer exists. So it was testing a trigger that
 * could not fire and a view that could not render, and it only surfaced on the first full-suite run
 * that got as far as the e2e project.
 *
 * Compaction is now decided and performed on the server, sized off the assistant model's context
 * window, so the way a test forces it is a tiny `contextWindow` in settings (as
 * docs/architecture/context-management.md says). What stays e2e is the part that is about the person:
 * compaction must be INVISIBLE to them — every turn they sent is still on screen and the
 * conversation keeps answering — while being visible to an admin reviewing it. The decision itself
 * (what gets summarized, what is retained verbatim) is unit-tested on
 * `decideContextManagement`, and the persistence of the recap in
 * tests/features/autonomous-agents/runtime.api.spec.ts.
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
      outputPricePerMillion: 0,
      // The whole trigger: the server sizes the budget off this window (compactionPercent of it), so
      // a couple of short mock turns cross it. There is no client-side override any more.
      contextWindow: 200
    },
    // The compaction round-trip goes through the summarizer seat, so this entry must exist for the
    // call — and the run telemetry that proves it happened — to exist at all.
    {
      model: { id: 'mock-summarizer', name: 'Mock Summarizer', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['summarizer'],
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  ],
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' },
    summarizer: { provider: 'mock-provider', id: 'mock-summarizer', name: 'Mock Summarizer' }
  },
  quotas: defaultQuotas
}

/** Poll the review list until the thread shows up, and return its id. */
async function reviewableConversationId () {
  for (let i = 0; i < 40; i++) {
    const res = await admin.get('/api/review/user/test-standalone1?page=1&size=20').catch(() => null)
    if (res?.data.results.length) return res.data.results[0].conversationId as string
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error('no reviewable conversation appeared')
}

test.describe('History Compaction', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('a compacted turn is recorded as a summarizer call and shows up in review', async ({ page, context, goToWithAuth }) => {
    await putSettings(admin, 'user/test-standalone1', { ...settingsData, storeTraces: true })
    // Consent pre-set so the thread is reviewable and the consent sheet never overlays the composer.
    await context.addCookies([{ name: 'agent-chat-trace-consent', value: 'yes', domain: 'localhost', path: '/' }])

    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })

    // The first turn establishes a measured history; each further turn adds roughly the previous
    // exchange to the measured fill, so a few wordy ones cross the window. Fewer than this is
    // tuning the test to a knife edge — the budget is a share of 200 tokens, not 200.
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
    for (let i = 0; i < 4; i++) {
      await input.fill(`question number ${i} with enough words in it to grow the history measurably`)
      await page.getByRole('button', { name: 'Send' }).click()
      await expect(page.locator('.assistant-content').last()).toContainText('what do you mean', { timeout: 15000 })
    }

    const conversationId = await reviewableConversationId()

    // Compaction really ran — asserted on the run telemetry, which is where the summarizer's own
    // call is recorded. A DOM-only assertion here would pass whether or not it happened.
    let summarizerCalls: any[] = []
    for (let i = 0; i < 20; i++) {
      const res = await admin.get(`/api/review/user/test-standalone1/${conversationId}`)
      summarizerCalls = res.data.runs.flatMap((run: any) => (run.calls ?? []).filter((call: any) => call.modelRole === 'summarizer'))
      if (summarizerCalls.length) break
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    expect(summarizerCalls.length).toBeGreaterThan(0)
    expect(summarizerCalls[0].model).toBe('mock-summarizer')

    // And an admin can see it on the review page, in the per-call detail.
    await goToWithAuth(`/agents/user/test-standalone1/traces/${conversationId}`, 'test-standalone1')
    await expect(page.getByRole('button', { name: 'Show detail' })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Show detail' }).click()
    await expect(page.getByRole('cell', { name: 'summarizer' }).first()).toBeVisible()
    await expect(page.getByRole('cell', { name: 'mock-summarizer' }).first()).toBeVisible()
  })

  test('compaction is invisible to the person: every turn they sent is still there, and it keeps answering', async ({ page, goToWithAuth }) => {
    // storeTraces off, so no consent sheet can overlay the composer during three sends.
    await putSettings(admin, 'user/test-standalone1', settingsData)

    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })

    for (let i = 0; i < 3; i++) {
      await input.fill('hello')
      await page.getByRole('button', { name: 'Send' }).click()
      // The retained window keeps the latest turn verbatim, so the mock still answers 'world' to it
      // after compaction — which is the user-visible consequence of keeping recent turns.
      await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
    }

    await expect(page.locator('.d-flex.justify-end .v-card')).toHaveCount(3)
    await expect(page.locator('.v-alert')).toHaveCount(0)
  })
})
