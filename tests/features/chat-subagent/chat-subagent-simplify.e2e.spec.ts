/**
 * E2E for the "Simplify sub-agent display" toggle (simpleSubAgents flag).
 *
 * The flag is ON by default and is presentation-only: toggling it must NOT
 * reset the conversation. The chip-vs-panel rendering itself is covered by the
 * panel-rendering tests; this spec pins the switch behaviour + no-reset.
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
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
    }
  },
  quotas: defaultQuotas
}

const openSettings = async (page: Page) => {
  await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
  await page.getByRole('tab', { name: /Settings|Paramètres/ }).click()
}

// Pin chip mode before boot. goToWithAuth reuses a cached browser context, so a
// prior test that toggled/seeded the flag would otherwise leak its cookie here.
const seedChipCookie = (page: Page) => page.addInitScript(() => {
  const flags = { toolExploration: false, subAgents: true, mermaid: false, simpleSubAgents: true }
  document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(flags))}; path=/`
})

test.describe('Sub-agent simplify toggle', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Switch is on by default and persists the off opt-out to the flags cookie', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    // goToWithAuth re-adds a cached cookie bundle that may carry a flags cookie
    // seeded by an earlier test. Clear it and reload so this exercises the
    // genuine default-on state.
    await page.context().clearCookies({ name: 'agent-chat-flags' })
    await page.reload()
    await openSettings(page)

    const simplifySwitch = page.getByLabel(/Simplify sub-agent display|Affichage simplifié des sous-agents/)
    await expect(simplifySwitch).toBeChecked({ timeout: 5000 })

    await simplifySwitch.click()
    await expect
      .poll(async () => {
        const cookie = (await page.context().cookies()).find(c => c.name === 'agent-chat-flags')
        return cookie ? JSON.parse(decodeURIComponent(cookie.value)).simpleSubAgents : undefined
      }, { timeout: 5000 })
      .toBe(false)

    await page.reload()
    await openSettings(page)
    await expect(page.getByLabel(/Simplify sub-agent display|Affichage simplifié des sous-agents/)).not.toBeChecked({ timeout: 5000 })
  })

  test('Toggling does not reset the conversation', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Toggle the flag; the prior exchange must remain (no reset).
    await openSettings(page)
    await page.getByLabel(/Simplify sub-agent display|Affichage simplifié des sous-agents/).click()
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await expect(page.locator('.assistant-content').last()).toContainText('world')
  })

  test('Simple mode renders a chip; full mode renders a collapsed panel', async ({ page, goToWithAuth }) => {
    // Pin chip mode (a prior test may have toggled/persisted the flag off).
    await seedChipCookie(page)
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.locator('.v-dialog .v-window-item--active').getByText('data_analyst (2 tools)')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()

    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByTestId('subagent-chip').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('subagent-panel')).toHaveCount(0)

    // Turn off simplify and re-run: now a collapsed panel appears.
    await openSettings(page)
    await page.getByLabel(/Simplify sub-agent display|Affichage simplifié des sous-agents/).click()
    await page.getByRole('button', { name: /Close|Fermer/ }).click()
    await expect(page.getByPlaceholder('Type your message...')).toBeEnabled({ timeout: 15000 })

    await page.getByPlaceholder('Type your message...').fill('call tool subagent_data_analyst {"task":"hello"}')
    await page.getByRole('button', { name: 'Send' }).click()
    const panel = page.getByTestId('subagent-panel').first()
    await expect(panel).toBeVisible({ timeout: 15000 })
    await expect(panel.getByTestId('subagent-panel-body')).toBeHidden()
    await panel.getByTestId('subagent-panel-header').click()
    await expect(panel.getByTestId('subagent-panel-body')).toBeVisible({ timeout: 5000 })
  })
})
