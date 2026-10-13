/**
 * E2E test for the simplified three-tab chat debug dialog.
 *
 * Validates that the dialog exposes exactly three tabs (Info + Settings + Consumption) and no
 * longer has the removed Trace tab.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
// External visitors unlimited, and the account offers review.
const reviewSettings = { quotas: { external: { unlimited: true, monthlyLimit: 0 } }, reviewPersonalAssistant: true }

test.describe('Chat debug dialog', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1', reviewSettings)
  })

  test('shows Info, Settings and Consumption tabs and no trace tab', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/chat', 'superadmin', { adminMode: true })

    // The debug dialog is opened from the admin-only cog button in the chat
    // header (AgentChatHeader.vue emits `show-debug`); its title is "Settings".
    const opener = page.getByRole('button', { name: /^Settings$|^Paramètres$/ })
    await expect(opener).toBeVisible({ timeout: 10000 })
    await opener.click()

    // Exactly three tabs, neither labelled Trace
    await expect(page.getByRole('tab')).toHaveCount(3)
    await expect(page.getByRole('tab', { name: 'Trace' })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Info' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Consumption' })).toBeVisible()
  })
})
