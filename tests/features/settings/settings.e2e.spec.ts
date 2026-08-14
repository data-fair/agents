/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

// E2E block: use full playwright capabilities to test the UI and indirectly the API
test.describe('Settings UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Page loads with AI Providers section', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
  })

  test('Can add a new Mock provider', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })

    // Click "Add item" button in AI Providers section
    // .first(): the models array renders its own "Add item" once a provider exists
    await page.getByRole('button', { name: 'Add item' }).first().click()

    // Select provider type from dropdown
    await page.locator('.v-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Verify provider was added with correct name
    await expect(page.getByText('Mock - ')).toBeVisible()

    // Verify the provider has Display Name field with "Mock" value
    await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue('Mock')

    // Verify the provider has Enabled checkbox (checked by default)
    await expect(page.getByRole('checkbox', { name: 'Enabled' })).toBeChecked()
  })

  test('Save button appears when there are changes', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })

    // Initially Save button should not be visible (no changes)
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()

    // Add a provider to create changes
    // .first(): the models array renders its own "Add item" once a provider exists
    await page.getByRole('button', { name: 'Add item' }).first().click()
    await page.locator('.v-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Now Save button should be visible
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('Can save settings with valid form', async ({ page, goToWithAuth }) => {
    // Seed valid settings via API first so form is valid
    const admin = await superAdmin
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'seed-provider', type: 'mock', name: 'Mock Seed', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Seed', id: 'seed-provider' } },
          usage: ['assistant'],
          multiplier: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'seed-provider', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })

    // Wait for page to fully load
    await expect(page.getByText('AI Providers')).toBeVisible()

    // Wait for any validation to complete
    await page.waitForTimeout(500)

    // Precondition: this seeded config must load clean (no unsaved change) —
    // otherwise the Save click below would "succeed" even if the page never
    // reacted to the interaction that follows.
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()

    // Add a provider to create changes
    // .first(): the models array renders its own "Add item" once a provider exists
    await page.getByRole('button', { name: 'Add item' }).first().click()
    await page.locator('.v-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Wait for form to validate
    await page.waitForTimeout(500)

    // Click Save button
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify success notification appears
    await expect(page.getByText('Changes have been saved')).toBeVisible()
  })

  // Exercises the models array editor end to end: the Model autocomplete (whose
  // getItems URL walks `rootData.providers` to scope the listing to the account's
  // providers), the usage multi-select, the credit multiplier, and the array
  // itemTitle expression.
  test('Can add a model definition with a usage and a credit multiplier', async ({ page, goToWithAuth }) => {
    // Seed valid settings via API
    const admin = await superAdmin
    await putSettings(admin, 'user/test-standalone1', {
      providers: [{ id: 'seed-provider', type: 'mock', name: 'Mock Seed', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Seed', id: 'seed-provider' } },
          usage: ['assistant'],
          multiplier: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'seed-provider', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })

    // Wait for page to load
    await expect(page.getByText('AI Providers')).toBeVisible()

    // Precondition: this seeded config must load clean (no unsaved change).
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()

    // The stored model definition is listed through the array itemTitle expression
    await expect(page.getByText('Mock Model (assistant)')).toBeVisible()

    // .nth(1): the models array's own "Add item" (the providers array owns the first one)
    await page.getByRole('button', { name: 'Add item' }).nth(1).click()

    // The Model autocomplete opens on the new item and lists the models of the
    // account's providers — proof the getItems URL resolved the provider ids.
    await page.getByRole('option', { name: 'Mock Tools Model' }).click()

    // Flag it for the "tools" usage
    // the outer combobox wrapper, not the input it overlays (which intercepts clicks)
    await page.getByRole('combobox').filter({ hasText: 'Appropriate usages' }).last().click()
    await page.getByRole('option', { name: 'Tools', exact: true }).click()
    await page.keyboard.press('Escape')

    await page.getByRole('textbox', { name: 'Credit multiplier' }).last().fill('3')

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Changes have been saved')).toBeVisible()

    // Reload: the new definition is persisted and the form is clean again
    await page.reload()
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Mock Tools Model (tools)')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Credit multiplier' }).last()).toHaveValue('3')
    await page.waitForTimeout(800)
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
  })

  test('Can delete a provider', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })

    // Add a Mock provider first
    // .first(): the models array renders its own "Add item" once a provider exists
    await page.getByRole('button', { name: 'Add item' }).first().click()
    await page.locator('.v-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Verify provider was added
    await expect(page.getByText('Mock - ')).toBeVisible()

    // Click Close button to collapse the provider item
    await page.getByRole('button', { name: 'Close' }).click()

    // Wait for the item to collapse and find the action button
    await page.waitForTimeout(500)

    // Click on the button next to the collapsed provider to show the menu
    // This should be the button that appears after collapsing
    const providerItem = page.locator('.v-list-item').filter({ hasText: /Mock - [a-f0-9]+/ })
    await providerItem.locator('button').click()

    // Wait for menu to appear
    await page.waitForTimeout(500)

    // Click Delete from the menu using getByText
    await page.getByText('Delete', { exact: true }).click()

    // Wait for confirmation dialog
    await page.waitForTimeout(500)

    // Click Confirm to confirm deletion
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()

    // Provider should be removed
    await expect(page.getByText('Mock - ')).not.toBeVisible()
  })

  // The "toggling store-traces on an empty config does not raise a required
  // error" regression lives in org-settings.e2e.spec.ts now: `storeTraces` moved
  // to the org-admin form (PUT /api/settings/:type/:id/org), and this form has no
  // always-visible field left to toggle on an empty config — the only widget it
  // renders then is the providers array's "Add item".

  // Regression: GET /api/settings returns the whole document while this form is
  // generated from the narrowed superadmin PUT schema, so vjsf pruned the
  // org-owned fields (modelMapping/quotas/moderation/storeTraces) from its model
  // on mount and the page reported a spurious unsaved change on every load —
  // which also tripped `useLeaveGuard` on every navigation away. The page now
  // projects the fetched document down to the fields the form owns before
  // handing it to the form and to the diff.
  test('A populated config loads clean and stays clean across a save and reload', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await putSettings(admin, 'organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
          usage: ['assistant'],
          multiplier: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/admin/organization/test1', 'superadmin', { adminMode: true })
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(800)

    // The stored shape already matches what the form produces: no diff on load.
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()

    // Make a real change (add a second provider), save it, and reload: the form
    // must be clean again. `storeTraces` — the previous trigger here — moved to
    // the org-admin endpoint and is no longer part of this (superadmin) form.
    await page.getByRole('button', { name: 'Add item' }).first().click()
    await page.locator('.v-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Changes have been saved')).toBeVisible()

    await page.reload()
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(800)
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
  })

  // Regression: the Save button used to reappear on every reload of a config
  // saved from an empty state, because the server re-injected an empty `models`
  // value that vjsf then pruned (the models section is hidden until a provider
  // exists). Its original trigger — toggling `storeTraces` — moved to the
  // org-admin form, so the change that takes the config out of its empty state
  // is now adding a provider (which is also what makes the models section
  // appear, i.e. exactly the transition this regression lived on).
  test('Saving an empty config converges: Save button stays hidden after reload', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/admin/organization/test1', 'superadmin', { adminMode: true })
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    // An empty config must already be clean, so the Save below is caused by the edit.
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()

    // Make a real change (add a provider) so Save becomes available, then save.
    await page.getByRole('button', { name: 'Add item' }).first().click()
    await page.locator('.v-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Changes have been saved')).toBeVisible()

    // Reload twice: the form must not report any unsaved change.
    for (let i = 0; i < 2; i++) {
      await page.reload()
      await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(800)
      await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
    }
  })
})
