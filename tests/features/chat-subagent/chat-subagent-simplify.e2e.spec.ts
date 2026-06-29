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

test.describe('Sub-agent simplify toggle', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('Switch is on by default and persists the off opt-out to the flags cookie', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
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
})
