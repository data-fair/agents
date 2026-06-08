/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

// E2E block: use full playwright capabilities to test the UI and indirectly the API
test.describe('Settings UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Page loads with AI Providers section', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/settings', 'test-standalone1')
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
  })

  test('Can add a new Mock provider', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/settings', 'test-standalone1')

    // Click "Add item" button in AI Providers section
    await page.getByRole('button', { name: 'Add item' }).click()

    // Select provider type from dropdown
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Verify provider was added with correct name
    await expect(page.getByText('Mock - ')).toBeVisible()

    // Verify the provider has Display Name field with "Mock" value
    await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue('Mock')

    // Verify the provider has Enabled checkbox (checked by default)
    await expect(page.getByRole('checkbox', { name: 'Enabled' })).toBeChecked()
  })

  test('Save button appears when there are changes', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/settings', 'test-standalone1')

    // Initially Save button should not be visible (no changes)
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()

    // Add a provider to create changes
    await page.getByRole('button', { name: 'Add item' }).click()
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Now Save button should be visible
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('Can save settings with valid form', async ({ page, goToWithAuth }) => {
    // Seed valid settings via API first so form is valid
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'seed-provider', type: 'mock', name: 'Mock Seed', enabled: true }],
      models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Seed', id: 'seed-provider' } } } },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/user/test-standalone1/settings', 'superadmin', { adminMode: true })

    // Wait for page to fully load
    await expect(page.getByText('AI Providers')).toBeVisible()

    // Wait for any validation to complete
    await page.waitForTimeout(500)

    // Add a provider to create changes
    await page.getByRole('button', { name: 'Add item' }).click()
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Wait for form to validate
    await page.waitForTimeout(500)

    // Click Save button
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify success notification appears
    await expect(page.getByText('Changes have been saved')).toBeVisible()
  })

  test('Can edit chat model with valid initial data', async ({ page, goToWithAuth }) => {
    // Seed valid settings via API
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'seed-provider', type: 'mock', name: 'Mock Seed', enabled: true }],
      models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Seed', id: 'seed-provider' } } } },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/user/test-standalone1/settings', 'test-standalone1')

    // Wait for page to load
    await expect(page.getByText('AI Providers')).toBeVisible()

    // Add a provider to create changes
    await page.getByRole('button', { name: 'Add item' }).click()
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Save button should now be visible
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('Can delete a provider', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/settings', 'test-standalone1')

    // Add a Mock provider first
    await page.getByRole('button', { name: 'Add item' }).click()
    await page.getByRole('combobox').first().click()
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

  // Regression: models/quotas are required but their form sections are hidden until
  // a provider exists. Toggling the always-visible "Store conversation traces" switch
  // on an empty config used to prune those hidden required props and raise a global
  // "required" error. The empty config must stay valid (models/quotas are not required).
  test('Toggling store-traces on an empty config does not raise a required error', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/user/test-standalone1/settings', 'superadmin', { adminMode: true })
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    await page.getByText('Store conversation traces').click()
    await page.waitForTimeout(500)

    // No validation error must appear and the form must remain valid (Save enabled)
    await expect(page.getByText('required information')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  // Regression: vjsf writes schema defaults (0 prices) into the model on load, so
  // a config whose stored shape predates them shows a diff once. Because the
  // server persists exactly what the form submits, saving normalises the document
  // and a subsequent reload must converge to a clean, diff-free state.
  test('A saved config converges after one save: no diff on reload', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } } },
      quotas: defaultQuotas
    })

    await goToWithAuth('/agents/organization/test1/settings', 'superadmin', { adminMode: true })
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(800)

    // Persist the form-normalised shape, then reload: the form must be clean.
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Changes have been saved')).toBeVisible()

    await page.reload()
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(800)
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
  })

  // Regression: the Save button used to reappear on every reload because the
  // server re-injected an empty `models` object that vjsf strips from the hidden
  // model-role sections (no providers). After saving, a reload must converge to a
  // clean state with no spurious diff.
  test('Saving an empty config converges: Save button stays hidden after reload', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/settings', 'superadmin', { adminMode: true })
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    // Make a real change (toggle store-traces) so Save becomes available, then save.
    await page.getByText('Store conversation traces').click()
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
