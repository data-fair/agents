/**
 * E2E for the org-admin self-service config form (OrgConfigSection), which
 * writes PUT /api/settings/:type/:id/org: role mapping picked from the merged
 * catalog, per-profile credit quotas, input moderation and store-traces.
 *
 * The org admin is logged straight into the organization account: the page
 * checks the role of the session's current account.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

const seedProviderAndModel = async () => {
  const admin = await superAdmin
  // superadmin-owned half only: the org half is what the form under test writes
  await putSettings(admin, 'organization/test1', {
    providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
    models: [{
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'],
      multiplier: 1
    }]
  })
}

test.describe('Org admin config UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('maps a role from the catalog, sets a profile quota, toggles store-traces and persists', async ({ page, goToWithAuth }) => {
    await seedProviderAndModel()

    await goToWithAuth('/agents/organization/test1', 'test1-admin1', { org: 'test1' })
    await expect(page.getByText('Model roles')).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(800)

    // A stored config must load clean, otherwise the Save clicked below could
    // "succeed" without the edits having registered.
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()

    // Map the assistant role through the catalog-backed autocomplete: the option
    // list proves GET /api/catalog/organization/test1?usage=assistant answered.
    await page.getByRole('combobox', { name: 'Assistant' }).click()
    await expect(page.getByRole('option', { name: 'Global Mock Model (Global Mock)' })).toBeVisible()
    await page.getByRole('option', { name: 'Mock Model (Mock Provider)' }).click()

    // A per-profile credit quota
    await page.getByRole('textbox', { name: 'Monthly Limit' }).first().fill('42')

    // And the store-traces switch
    await page.getByText('Store conversation traces').click()

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Changes have been saved')).toBeVisible()

    // Reload: everything round-trips and the form is clean again
    await page.reload()
    await expect(page.getByText('Model roles')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('combobox', { name: 'Assistant' })).toHaveValue('Mock Model (Mock Provider)')
    await expect(page.getByRole('textbox', { name: 'Monthly Limit' }).first()).toHaveValue('42')
    await expect(page.getByRole('switch', { name: 'Store conversation traces' })).toBeChecked()
    await page.waitForTimeout(800)
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
  })

  // Regression (moved here from settings.e2e.spec.ts when `storeTraces` moved
  // from the superadmin form to this one): sections that are `required` but
  // conditionally hidden get pruned by vjsf on the first edit, which used to
  // raise a global "required information" error the moment an unrelated,
  // always-visible switch was toggled on an otherwise empty config.
  test('Toggling store-traces on an empty config does not raise a required error', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'test1-admin1', { org: 'test1' })
    await expect(page.getByText('Model roles')).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(500)

    await page.getByText('Store conversation traces').click()
    await page.waitForTimeout(500)

    await expect(page.getByText('required information')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  test('a non-admin member is redirected to the chat', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'test1-user1', { org: 'test1' })
    await expect(page).toHaveURL(/\/organization\/test1\/chat/, { timeout: 15000 })
  })
})
