/**
 * E2E tests for the reasoning-display toggle ("Full reasoning display").
 *
 * Reasoning is always captured onto the assistant message; this flag only decides
 * whether the foldable "Reasoning" panel renders (full) or is omitted entirely
 * (compact, the default — only the transient "Thinking…" activity line shows).
 * The toggle is render-only, so flipping it must NOT reset the conversation.
 *
 * The mock model answers the message "reason" with "world" and the reasoning
 * tokens "Let me think about it." (see api/src/models/mock-model.ts).
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const mockSettings = {
  providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } } } },
  quotas: defaultQuotas
}

// Seed the `agent-chat-flags` cookie readFlags() consumes before the app boots.
// Path '/' keeps it readable by the UI page (the app writes a gateway-scoped variant).
const seedFlags = (page: Page, showReasoning: boolean) => page.addInitScript((show) => {
  const flags = { toolExploration: false, subAgents: true, mermaid: false, showReasoning: show }
  document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(flags))}; path=/`
}, showReasoning)

const reasoningPanel = (page: Page) => page.locator('.agent-chat__reasoning-panel')

test.describe('Reasoning display toggle (e2e)', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', mockSettings)
  })

  test('compact mode (default): the answer shows but no reasoning panel', async ({ page, goToWithAuth }) => {
    await seedFlags(page, false)
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    await page.getByPlaceholder('Type your message...').fill('reason')
    await page.getByRole('button', { name: 'Send' }).click()

    // The answer renders…
    await expect(page.locator('.assistant-content').filter({ hasText: 'world' }).first())
      .toBeVisible({ timeout: 15000 })
    // …but the reasoning panel is omitted entirely.
    await expect(reasoningPanel(page)).toHaveCount(0)
  })

  test('full mode: enabling the switch reveals the captured reasoning, with no reset', async ({ page, goToWithAuth }) => {
    await seedFlags(page, true)
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    await page.getByPlaceholder('Type your message...').fill('reason')
    await page.getByRole('button', { name: 'Send' }).click()

    // The collapsed reasoning panel appears above the answer; expanding it shows the
    // model's thinking tokens.
    const panel = reasoningPanel(page)
    await expect(panel).toBeVisible({ timeout: 15000 })
    await panel.getByRole('button').first().click()
    await expect(page.getByText('Let me think about it.')).toBeVisible({ timeout: 5000 })
  })

  test('toggling the switch off hides the panel without resetting the conversation', async ({ page, goToWithAuth }) => {
    await seedFlags(page, true)
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')

    await page.getByPlaceholder('Type your message...').fill('reason')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(reasoningPanel(page)).toBeVisible({ timeout: 15000 })

    // Turn the flag off from the Settings tab.
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: /Settings|Paramètres/ }).click()
    const reasoningSwitch = page.getByLabel(/Full reasoning display|Affichage complet du raisonnement/)
    await expect(reasoningSwitch).toBeChecked({ timeout: 5000 })
    await reasoningSwitch.click()
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    // The existing turn stays in the transcript (no reset) but its reasoning panel
    // is hidden reactively.
    await expect(page.locator('.assistant-content').filter({ hasText: 'world' }).first()).toBeVisible()
    await expect(reasoningPanel(page)).toHaveCount(0)
  })
})
