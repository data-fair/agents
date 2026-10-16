/**
 * E2E tests for the sub-agent chat page.
 *
 * The mock model responds to:
 *   "hello"                          → "world"
 *   "call tool <name> <json-args>"   → tool call
 *   anything else                    → "what do you mean ?"
 *
 * Delegation rendering (chip, panel, reserved tools) is covered by chat-subagent-advanced and
 * chat-subagent-simplify; the step-cap close-out by agent-session/sub-agents.api.spec.ts.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForPageTools } from '../../support/page-tools.ts'

const admin = await superAdmin

test.describe('Chat Sub-Agent UI', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('The debug dialog shows the tools the server offered on the last turn', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await waitForPageTools(page, 'set_display', 'subagent_data_analyst')

    // Before any turn there is no server record to show.
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await expect(page.getByTestId('offered-tools-empty')).toBeVisible()
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // The record is read when the dialog opens, and the call record is written fire-and-forget, so
    // open it until the turn's tools show up: what the model was actually offered.
    await expect(async () => {
      await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
      try {
        const offered = page.getByTestId('offered-tools')
        await expect(offered).toContainText('set_display', { timeout: 1500 })
        await expect(offered).toContainText('subagent_data_analyst', { timeout: 1500 })
        // grouped by source: the page's own tool under the page's label
        await expect(offered.getByTestId('tool-group').filter({ hasText: 'This page (WebMCP)' })).toContainText('set_display', { timeout: 1500 })
      } finally {
        await page.getByRole('button', { name: /Close|Fermer/ }).click()
      }
    }).toPass({ timeout: 15000 })
  })
})
