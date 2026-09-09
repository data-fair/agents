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
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const mockSettings = {
  providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } } } },
  quotas: defaultQuotas
}

test.describe('Live tool set (mid-turn refresh)', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('a tool registered by a panel opened mid-turn is callable in the same turn', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', mockSettings)

    await goToWithAuth('/agents/_dev/chat-live-tools', 'test-standalone1')

    // Wait for the initial aggregate: open_panel is there, set_display is NOT — the panel
    // is closed, so nothing has registered it yet.
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.getByRole('button', { name: 'open_panel' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'set_display' })).toHaveCount(0)
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

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
    await admin.put('/api/settings/user/test-standalone1', mockSettings)

    await goToWithAuth('/agents/_dev/chat-live-tools', 'test-standalone1')

    // Discovery is asynchronous; sending before it lands would start the turn with an
    // empty tool set and test nothing.
    await expect(page.getByRole('button', { name: 'open_panel' })).toBeHidden()
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.getByRole('button', { name: 'open_panel' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await page.getByPlaceholder('Type your message...').fill('chain open_panel set_display')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last())
      .toContainText('chained open_panel then set_display', { timeout: 15000 })

    // Reload with the panel closed again: set_display must be gone from the aggregate.
    await page.reload()
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.getByRole('button', { name: 'open_panel' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'set_display' })).toHaveCount(0)
  })

  test('exploration mode announces a mid-turn tool in the same turn', async ({ page, goToWithAuth }) => {
    // With exploration on, a tool that appears mid-turn is not immediately callable (it
    // has to be promoted first) — but the model must still be TOLD about it within the
    // turn, otherwise it has no reason to go looking. The notice cannot ride on `history`
    // mid-run (the SDK re-reads it only as a prefix, so it would land before the work
    // already done), so it is injected through prepareStep; this is what covers that path.
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', mockSettings)

    await page.addInitScript(() => {
      const flags = { toolExploration: true, subAgents: true, mermaid: false }
      document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(flags))}; path=/`
    })
    await goToWithAuth('/agents/_dev/chat-live-tools', 'test-standalone1')
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 10000 })

    // Turn 1: promote open_panel so it is callable at all under exploration gating.
    await page.getByPlaceholder('Type your message...').fill('call tool explore_tools {"intent":"open the panel"}')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('done', { timeout: 20000 })

    // Turn 2: open_panel runs and registers set_display mid-turn. set_display stays
    // un-callable (not promoted) — the assertion is that the model was told about it on
    // the very next step, not that it could call it.
    await page.getByPlaceholder('Type your message...').fill('chain open_panel set_display')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last())
      .toContainText('tool set_display is not available (announced: yes)', { timeout: 20000 })
  })
})
