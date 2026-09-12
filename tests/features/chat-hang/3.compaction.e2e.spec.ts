/**
 * E2E test for budget-based compaction.
 *
 * The account budget is forced small via the sessionStorage override so a handful of
 * mock-provider turns cross it. Asserts that a compaction actually ran — via
 * compactHistory's debug log line, not the transient "Compacting…" activity chip,
 * which proved too short-lived (the mock summarizer round-trip is fast enough that
 * polling the DOM for it misses it more often than not) to catch reliably — and,
 * the point of keeping recent turns verbatim, that the conversation keeps answering
 * afterwards rather than losing its thread.
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
    },
    summarizer: {
      model: {
        id: 'mock-summarizer',
        name: 'Mock Summarizer Model',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    }
  },
  quotas: defaultQuotas,
  compaction: { percent: 70 }
}

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

test.describe('History compaction', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('crossing the budget compacts and the conversation keeps answering', async ({ page, goToWithAuth }) => {
    // Enable the composable's debug namespace before any page script runs (applies to
    // the chat iframe too — addInitScript re-injects on every navigation/child frame),
    // so compactHistory's `debug('compacted history from …')` line reaches the console.
    await page.addInitScript(() => {
      try { window.localStorage.setItem('debug', 'df-agents:use-agent-chat') } catch { /* ignore */ }
    })
    let sawCompactionLog = false
    page.on('console', msg => {
      if (msg.text().includes('compacted history from')) sawCompactionLog = true
    })

    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    // Force a tiny budget. Read live per turn in compactHistory, so no reload needed.
    await frame.evaluate(() => sessionStorage.setItem('agent-chat-compaction-threshold', '300'))

    const input = frame.getByPlaceholder('Type your message...')
    const send = frame.getByRole('button', { name: 'Send' })

    // First turn establishes a real usage.inputTokens measurement.
    await input.fill('hello')
    await send.click()
    await expect(frame.getByText('world')).toBeVisible({ timeout: 15000 })

    // Subsequent turns push measured fill past the 300-token budget. Each turn's
    // real usage.inputTokens (the honest fill measure) grows by roughly the size
    // of the previous exchange, so several turns are needed to cross the budget.
    for (let i = 0; i < 7; i++) {
      await input.fill(`question number ${i} with enough words to grow the history measurably`)
      await send.click()
      await expect(frame.getByText('what do you mean ?').last()).toBeVisible({ timeout: 15000 })
    }

    expect(sawCompactionLog).toBe(true)

    // The conversation still works after compaction — the retained window kept it coherent.
    await input.fill('hello')
    await send.click()
    await expect(frame.getByText('world').last()).toBeVisible({ timeout: 15000 })
    await expect(frame.locator('.v-alert')).toHaveCount(0)
  })
})
