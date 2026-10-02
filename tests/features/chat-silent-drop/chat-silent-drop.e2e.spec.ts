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
import { axiosAuth, clean, superAdmin, defaultQuotas } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

const admin = await superAdmin
// The PERSON, for reading their own thread: a superadmin is an `external` caller on someone else's
// account and the conversation routes refuse that (see assertMayTalkTo), admin mode or not.
const user = await axiosAuth('test-standalone1')

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

test.describe('Chat silent-drop protection', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'user/test-standalone1', settingsData)
  })

  test('An empty model completion shows a fallback instead of a blank turn', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('empty')
    await frame.getByRole('button', { name: 'Send' }).click()

    // The model returned no text; the loop must surface a fallback assistant bubble. The wording is
    // the server's (EMPTY_COMPLETION_MESSAGE in api/src/conversations/executor.ts) — the browser copy
    // this used to match went with the in-browser loop.
    await expect(frame.locator('.assistant-content').last())
      .toContainText('I was not able to produce a response for this turn', { timeout: 10000 })

    // AND it must be recorded as a FAULT, not as a normal answer. The old assertion read a devtools
    // console warning emitted by the in-browser loop ("empty assistant response (treated as a bug)"),
    // which no longer exists — the loop is server-side and warns to the operator's log, which a
    // browser test cannot see. What a test can see is the decision itself: the run ends `error`, so
    // the anomaly is in the data rather than only in a log line nobody greps.
    await expect.poll(async () => {
      // The person's own thread list, not the review list: review needs `storeTraces` plus consent,
      // neither of which this scenario sets, and the run is readable without them.
      const list = await user.get('/api/conversations/user/test-standalone1?agentId=personal').catch(() => null)
      const conversationId = list?.data.results[0]?.id
      if (!conversationId) return undefined
      const runs = await user.get(`/api/conversations/user/test-standalone1/${conversationId}/runs`).catch(() => null)
      return runs?.data.results[0]?.stopReason
    }, { timeout: 15000 }).toBe('error')
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
