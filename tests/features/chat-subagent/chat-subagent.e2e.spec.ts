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

    // Before any turn there is no server record: only the page's own tools, and no service tool yet.
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await expect(page.getByTestId('available-tools')).toContainText('set_display')
    await expect(page.getByTestId('available-tools')).not.toContainText('wait_for_user_action')
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Opened as soon as the answer shows, which is before the run closes and writes its record: the dialog
    // must catch up when the turn ends, without being reopened (it used to keep the turn before until a reload).
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    const available = page.getByTestId('available-tools')
    await expect(available).toContainText('subagent_data_analyst')
    // grouped by source: the page's own tool under the page's label, the service's from the turn's record
    await expect(available.getByTestId('tool-group').filter({ hasText: 'This page (WebMCP)' })).toContainText('set_display')
    await expect(available.getByTestId('tool-group').filter({ hasText: 'Built into the service' })).toContainText('wait_for_user_action', { timeout: 15000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()
  })
})
