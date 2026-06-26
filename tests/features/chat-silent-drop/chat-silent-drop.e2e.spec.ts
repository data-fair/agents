/**
 * E2E tests for silent-drop protection in the chat loop.
 *
 * A turn must never end with no visible outcome. These exercise the two ways the
 * conversation used to stop silently:
 *  - an empty model completion (no text, no tool call) — e.g. a sub-agent or the
 *    main model returning nothing — now shows a fallback assistant message;
 *  - a mid-stream provider/gateway error, surfaced as an in-band SSE error chunk
 *    that the AI SDK reports without throwing, now shows an error alert.
 *
 * Both are driven deterministically by the mock provider seams ("empty" and
 * "stream error", see api/src/models/mock-model.ts).
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

test.describe('Chat silent-drop protection', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('An empty model completion shows a fallback instead of a blank turn', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    // An empty turn is treated as a bug: the physical request/response is dumped to the
    // console for diagnosis even though the user only sees the generic fallback bubble.
    const warnings: string[] = []
    page.on('console', msg => { if (msg.type() === 'warning') warnings.push(msg.text()) })

    await frame.getByPlaceholder('Type your message...').fill('empty')
    await frame.getByRole('button', { name: 'Send' }).click()

    // The model returned no text; the loop must surface a fallback assistant bubble.
    await expect(frame.locator('.assistant-content').last())
      .toContainText("wasn't able to produce a response", { timeout: 10000 })

    // ...and log the anomaly so a developer can inspect what the gateway returned.
    await expect.poll(() => warnings.some(w => w.includes('empty assistant response (treated as a bug)')), { timeout: 10000 })
      .toBe(true)
  })

  test('A mid-stream error is surfaced instead of silently dropping the turn', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('stream error')
    await frame.getByRole('button', { name: 'Send' }).click()

    // The in-band error chunk must reach the user as an error alert, not nothing.
    await expect(frame.locator('.v-alert')).toContainText('mock stream error', { timeout: 10000 })
  })
})
