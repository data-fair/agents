/**
 * E2E test for budget-based compaction, on the EMBEDDED chat surface.
 *
 * The property under test is the one that matters to a person: crossing the budget must not break
 * the thread. A handful of mock turns cross it, and the conversation still answers afterwards with
 * no error alert — which is what keeping recent turns verbatim buys.
 *
 * REWRITTEN for the server-held loop, and the old version is worth recording. It forced the budget
 * with `sessionStorage.setItem('agent-chat-compaction-threshold', …)` and asserted a
 * `df-agents:use-agent-chat` console line from `compactHistory`. Both belonged to the browser loop:
 * the override is read by nothing now, and that composable is deleted. So the test could neither
 * trigger compaction nor observe it, and it went unnoticed because it sits behind an
 * alphabetically-earlier failure in a --max-failures=1 suite.
 *
 * The budget is now sized server-side off the assistant model's context window, so a tiny
 * `contextWindow` in settings is the trigger. That compaction REALLY RAN is asserted on the run
 * telemetry in tests/features/agents/compaction.e2e.spec.ts (a `summarizer` call appears) and in
 * tests/features/autonomous-agents/runtime.api.spec.ts (the recap is persisted and reused); this
 * test deliberately does not re-assert it, because on this surface it would need review consent and
 * the consent sheet would overlay the composer the test has to type into.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'
import { mockProvider, mockModelRef, putSettings } from '../../support/settings.ts'

const admin = await superAdmin

const summarizerModelRef = {
  id: 'mock-summarizer',
  name: 'Mock Summarizer Model',
  provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
}

// Two catalog entries so the summarizer seat gets the dedicated mock summarizer
// rather than the plain mock model; the mapping is explicit because the global
// dev config also ships a mock model as the default for every role.
const settingsData = {
  providers: [mockProvider],
  models: [
    // contextWindow is the whole trigger: the server compacts above a share of it, so a few wordy
    // mock turns cross it. There is no client-side override any more.
    { model: mockModelRef, usage: ['assistant', 'tools', 'moderator'], inputPricePerMillion: 0, outputPricePerMillion: 0, contextWindow: 200 },
    { model: summarizerModelRef, usage: ['summarizer'], inputPricePerMillion: 0, outputPricePerMillion: 0 }
  ],
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' },
    summarizer: { provider: 'mock-provider', id: 'mock-summarizer', name: 'Mock Summarizer Model' }
  },
  quotas: defaultQuotas
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
    await putSettings(admin, 'user/test-standalone1', settingsData)
  })

  test('crossing the budget compacts and the conversation keeps answering', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    const input = frame.getByPlaceholder('Type your message...')
    const send = frame.getByRole('button', { name: 'Send' })

    // First turn establishes a real usage.inputTokens measurement.
    await input.fill('hello')
    await send.click()
    await expect(frame.getByText('world')).toBeVisible({ timeout: 15000 })

    // Subsequent turns push the measured fill past the budget. Each turn's real
    // usage.inputTokens (the honest fill measure) grows by roughly the size of the
    // previous exchange, so several turns are needed to cross it.
    for (let i = 0; i < 7; i++) {
      await input.fill(`question number ${i} with enough words to grow the history measurably`)
      await send.click()
      await expect(frame.getByText('what do you mean ?').last()).toBeVisible({ timeout: 15000 })
    }

    // The conversation still works after compaction — the retained window kept it coherent.
    await input.fill('hello')
    await send.click()
    await expect(frame.getByText('world').last()).toBeVisible({ timeout: 15000 })
    await expect(frame.locator('.v-alert')).toHaveCount(0)
  })
})
