/**
 * The scenario the mid-turn tool refresh exists for, end to end.
 *
 * `open_panel` mounts a component that registers `set_display` through WebMCP. Before the
 * fix the tool map was rebuilt once per turn, so `set_display` was advertised only on the
 * NEXT user turn and the model reported it as unavailable mid-turn — measured in
 * production as toolCount staying at 17 after a navigation and reaching 21 only next turn.
 *
 * The mock model's `chain` seam answers with what it was actually offered, so this test
 * fails loudly (assistant says "tool set_display is not available") if the tool set handed
 * to the running stream ever goes back to being frozen at request time.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForPageTools, expectNoPageTool } from '../../support/page-tools.ts'

test.describe('Live tool set (mid-turn refresh)', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('a tool registered by a panel opened mid-turn is callable in the same turn', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await putMockSettings(admin, 'user/test-standalone1')

    await goToWithAuth('/agents/_dev/chat-live-tools', 'test-standalone1')

    // Wait for the initial aggregate: open_panel is there, set_display is NOT — the panel
    // is closed, so nothing has registered it yet.
    await waitForPageTools(page, 'open_panel')
    await expectNoPageTool(page, 'set_display')

    // One turn, two steps: open_panel (which mounts the panel and registers set_display),
    // then set_display itself.
    await page.getByPlaceholder('Type your message...').fill('chain open_panel set_display')
    await page.getByRole('button', { name: 'Send' }).click()

    // The mock only emits this after it was offered set_display on the second step and
    // called it — the assertion that the running stream saw the refreshed tool set.
    await expect(page.locator('.assistant-content').last())
      .toContainText('chained open_panel then set_display', { timeout: 15000 })

    // And the tool really ran against the newly mounted component.
    await expect(page.getByLabel('Display')).toHaveValue('Displayed by set_display')
  })

  test('a tool whose component unmounts stops being offered', async ({ page, goToWithAuth }) => {
    // The mirror case: reconciliation must remove as well as add, or the model keeps being
    // offered tools that no longer have a component behind them.
    const admin = await superAdmin
    await putMockSettings(admin, 'user/test-standalone1')

    await goToWithAuth('/agents/_dev/chat-live-tools', 'test-standalone1')

    // Discovery is asynchronous; sending before it lands would start the turn with an
    // empty tool set and test nothing.
    await waitForPageTools(page, 'open_panel')

    await page.getByPlaceholder('Type your message...').fill('chain open_panel set_display')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last())
      .toContainText('chained open_panel then set_display', { timeout: 15000 })

    // Reload with the panel closed again: set_display must be gone from the aggregate.
    await page.reload()
    await waitForPageTools(page, 'open_panel')
    await expectNoPageTool(page, 'set_display')
  })
})
