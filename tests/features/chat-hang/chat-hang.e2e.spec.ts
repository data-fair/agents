/**
 * E2E tests for hang protection in the chat.
 *
 * A turn must never freeze with no feedback. What this can prove from a browser, against the mock
 * provider's "stall" seam (a 30s silence before any output), is the half the person experiences: the
 * muted activity line names what is happening instead of leaving a mute spinner, and the turn
 * recovers on its own rather than staying stuck.
 *
 * WHAT IT NO LONGER PROVES, and why. It used to shorten the watchdog with
 * `sessionStorage['agent-chat-idle-timeout']` and then assert the timeout error. That knob belonged to
 * the browser loop; the watchdog is now server-side — `STREAM_IDLE_TIMEOUT_MS` (90s) passed as
 * `timeout.chunkMs` to `streamText`, with `autonomousAgentRunTimeoutSeconds` (300s) as the outer
 * ceiling — and neither is tunable per request, so firing either one inside an e2e would mean a
 * 90-second test. The test kept the assertion and lost the mechanism: it set a key nothing reads and
 * then waited 10s for a timeout that was never going to come at 90.
 *
 * The ceilings themselves are therefore not covered end to end. Both are one expression at a single
 * call site in api/src/conversations/executor.ts, and lowering them for tests would need a config
 * seam that does not exist yet.
 */

import { expect, type Page } from '@playwright/test'
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

test.describe('Chat hang protection', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'user/test-standalone1', settingsData)
  })

  test('A stalled stream shows a thinking indicator and the turn recovers instead of hanging', async ({ page, goToWithAuth }) => {
    // The seam's silence is 30s — deliberately long, because the api tests use it to hold a run open
    // while they abort or disable it (tests/features/autonomous-agents/runtime.api.spec.ts), so it
    // cannot be shortened for this one. Hence the raised ceiling: this test costs ~35s and is the only
    // one in the project that does.
    test.setTimeout(75_000)
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('stall')
    await frame.getByRole('button', { name: 'Send' }).click()

    // While the stream is silent, the discreet activity line names the phase — the thing that makes a
    // slow turn legible rather than frozen.
    const activity = frame.getByTestId('chat-activity')
    await expect(activity).toBeVisible({ timeout: 5000 })
    await expect(activity).toContainText('Thinking')

    // And the turn ends by itself. The seam stalls 30s and then answers, so this is the honest
    // statement of "not hung": the composer comes back and the answer arrives, with no error alert.
    await expect(frame.getByText('too late')).toBeVisible({ timeout: 45000 })
    await expect(frame.getByPlaceholder('Type your message...')).toBeEnabled()
    await expect(frame.locator('.v-alert')).toHaveCount(0)
  })
})
