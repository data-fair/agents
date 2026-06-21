/**
 * E2E tests for hang protection in the chat loop.
 *
 * A turn must never freeze indefinitely with no feedback. These exercise:
 *  - the discreet activity indicator: while a streaming turn has no visible output
 *    yet, a muted "Thinking…" line names what's happening instead of a mute spinner;
 *  - the idle watchdog: a stream that goes silent for longer than the idle timeout
 *    (a stalled provider/gateway holding the socket open) is aborted and surfaced as
 *    a recoverable timeout error, rather than spinning forever.
 *
 * Driven deterministically by the mock provider "stall" seam (see
 * api/src/models/mock-model.ts), which sends the initial role chunk then holds the
 * response open well past any test idle timeout.
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
    }
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
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('A stalled stream shows a thinking indicator then times out instead of hanging', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    // Shorten the idle watchdog so the test doesn't wait the full default timeout.
    // Read live per turn in sendMessage, so no reload is needed.
    await frame.evaluate(() => sessionStorage.setItem('agent-chat-idle-timeout', '2500'))

    await frame.getByPlaceholder('Type your message...').fill('stall')
    await frame.getByRole('button', { name: 'Send' }).click()

    // While the stream is silent, the discreet activity line names the phase.
    const activity = frame.getByTestId('chat-activity')
    await expect(activity).toBeVisible({ timeout: 2000 })
    await expect(activity).toContainText('Thinking')

    // After the idle timeout with no further bytes, the watchdog aborts the turn and
    // surfaces a recoverable timeout error instead of an endless spinner.
    await expect(frame.locator('.v-alert')).toContainText('took too long', { timeout: 10000 })
  })
})
