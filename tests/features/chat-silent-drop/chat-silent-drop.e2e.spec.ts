/**
 * E2E tests for silent-drop protection in the chat loop.
 *
 * A turn must never end with no visible outcome. These exercise the two ways the
 * conversation used to stop silently:
 *  - an empty model completion (no text, no tool call) — the model returning nothing — now shows a fallback assistant message;
 *  - a mid-stream provider/gateway error, surfaced as an in-band SSE error chunk
 *    that the AI SDK reports without throwing, now shows an error alert.
 *
 * Both are driven deterministically by the mock provider seams ("empty" and
 * "stream error", see api/src/models/mock-model.ts).
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Chat silent-drop protection', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('An empty completion shows a fallback, and a mid-stream error an alert, instead of a silent turn', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    await page.getByPlaceholder('Type your message...').fill('empty')
    await page.getByRole('button', { name: 'Send' }).click()

    // The model returned no text; the loop must surface a fallback assistant bubble. The wording is
    // the server's (EMPTY_COMPLETION_MESSAGE in api/src/conversations/executor.ts) — the browser copy
    // this used to match went with the in-browser loop.
    await expect(page.locator('.assistant-content').last())
      .toContainText('I was not able to produce a response for this turn', { timeout: 10000 })

    // That the run is recorded as a fault rather than a normal answer is asserted server-side
    // (autonomous-agents/runtime.api.spec.ts, "an empty completion does not render as a blank,
    // successful turn"), on the same executor.

    // The next turn fails mid-stream.
    await page.getByPlaceholder('Type your message...').fill('stream error')
    await page.getByRole('button', { name: 'Send' }).click()

    // The in-band error chunk must reach the user as an error alert, not nothing — in words of the service:
    // the provider's own message stays on the run, for administrators (publicErrorDetail).
    // Filtered: this host page has an alert of its own, and the empty turn above left one too.
    await expect(page.locator('.v-alert').filter({ hasText: 'internal error, recorded for the administrators' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('mock stream error')).toHaveCount(0)
  })
})
