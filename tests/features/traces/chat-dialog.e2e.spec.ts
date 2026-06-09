/**
 * E2E test for the simplified two-tab chat debug dialog.
 *
 * Validates that the dialog exposes exactly two tabs (Info + Settings) and no
 * longer has the removed Trace tab.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'

const admin = await superAdmin
const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } } },
  quotas: { global: { unlimited: true, monthlyLimit: 0 }, admin: { unlimited: true, monthlyLimit: 0 }, contrib: { unlimited: false, monthlyLimit: 0 }, user: { unlimited: false, monthlyLimit: 0 }, external: { unlimited: true, monthlyLimit: 0 }, anonymous: { unlimited: false, monthlyLimit: 0 } },
  storeTraces: true
}

test.describe('Chat debug dialog', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', settingsData)
  })

  test('shows exactly two tabs and no trace tab', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/chat', 'superadmin', { adminMode: true })

    // The debug dialog is opened from the admin-only cog button in the chat
    // header (AgentChatHeader.vue emits `show-debug`); its title is "Settings".
    const opener = page.getByRole('button', { name: /^Settings$|^Paramètres$/ })
    await expect(opener).toBeVisible({ timeout: 10000 })
    await opener.click()

    // Exactly two tabs, neither labelled Trace
    await expect(page.getByRole('tab')).toHaveCount(2)
    await expect(page.getByRole('tab', { name: 'Trace' })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Info' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Settings' })).toBeVisible()
  })
})
