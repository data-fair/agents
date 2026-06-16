/**
 * E2E tests for the experimental "flatten sub-agents" toggle.
 *
 * When flattening is on:
 *  - reserved sub-agent tools (get_schema, query_data) are callable by the MAIN agent;
 *  - the sub-agent becomes a no-arg guidance tool registered under its de-prefixed name
 *    (data_analyst), rendered as an ordinary chip — never a sub-agent expansion panel.
 *
 * The mock model responds to:
 *   "hello"                          → "world"
 *   "call tool <name> <json-args>"   → tool call
 *   anything else                    → "what do you mean ?"
 */

import { expect } from '@playwright/test'
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

test.describe('Chat Sub-Agent Flatten toggle', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Flatten switch is visible and persists to localStorage', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Open the debug dialog, go to the Settings tab
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: /Settings|Paramètres/ }).click()

    const flattenSwitch = page.getByLabel(/Flatten sub-agents|Aplatir les sous-agents/)
    await expect(flattenSwitch).toBeVisible({ timeout: 5000 })

    await flattenSwitch.click()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('agent-chat-flatten')), { timeout: 5000 })
      .toBe('1')
  })

  test('Flat mode: main agent calls a reserved tool directly, no sub-agent panel', async ({ page, goToWithAuth }) => {
    // Pre-enable flatten before the app boots (admin-only localStorage opt-in)
    await page.addInitScript(() => localStorage.setItem('agent-chat-flatten', '1'))
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    // Wait until tools are discovered (set_display always exists on the main agent)
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.locator('.v-dialog .v-window-item--active').getByRole('button', { name: 'set_display' }))
      .toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    // get_schema is a RESERVED tool — only reachable from the main agent when flattened
    await page.getByPlaceholder('Type your message...').fill('call tool get_schema {"dataset":"test"}')
    await page.getByRole('button', { name: 'Send' }).click()

    // A get_schema chip appears in the MAIN message flow
    await expect(page.locator('.agent-chat .v-chip').filter({ hasText: 'get_schema' }).first())
      .toBeVisible({ timeout: 15000 })
    // And no sub-agent expansion panel is created
    await expect(page.locator('.agent-chat .v-expansion-panel')).toHaveCount(0)
  })

  test('Flat mode: the sub-agent is exposed as a de-prefixed guidance tool', async ({ page, goToWithAuth }) => {
    await page.addInitScript(() => localStorage.setItem('agent-chat-flatten', '1'))
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.locator('.v-dialog .v-window-item--active').getByRole('button', { name: 'set_display' }))
      .toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    // The guidance tool is registered as "data_analyst" (no subagent_ prefix)
    await page.getByPlaceholder('Type your message...').fill('call tool data_analyst {}')
    await page.getByRole('button', { name: 'Send' }).click()

    // Renders as an ordinary chip, never a "Data Analyst" expansion panel
    await expect(page.locator('.agent-chat .v-chip').filter({ hasText: 'data_analyst' }).first())
      .toBeVisible({ timeout: 15000 })
    await expect(page.locator('.agent-chat .v-expansion-panel')).toHaveCount(0)
  })

  test('Flat mode: a model-pinned sub-agent stays delegated (opt-out)', async ({ page, goToWithAuth }) => {
    await page.addInitScript(() => localStorage.setItem('agent-chat-flatten', '1'))
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.locator('.v-dialog .v-window-item--active').getByRole('button', { name: 'set_display' }))
      .toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    // data_summarizer pins model 'summarizer', so even with flatten on it must stay a
    // delegated sub-agent: calling it (under its subagent_ name) opens a sub-agent panel.
    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_summarizer {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.locator('.agent-chat').getByText('Data Summarizer').first())
      .toBeVisible({ timeout: 15000 })
  })
})
