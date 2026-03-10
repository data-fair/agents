/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, axiosAuth } from '../../support/axios.ts'

// E2E block: use full playwright capabilities to test the UI and indirectly the API
test.describe('Settings UI', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('Page loads with Settings title', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/settings', 'test-standalone1')
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
  })

  test('Can add a new Mock provider', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/settings', 'test-standalone1')

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
    await goToWithAuth('/agents/settings', 'test-standalone1')

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
    // First, seed valid settings via API (with a Mock provider and model)
    const user = await axiosAuth('test-standalone1')
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'seed-provider', type: 'mock', name: 'Mock Seed', enabled: true }],
      agents: { backOfficeAssistant: { name: 'Test Agent', prompt: 'Hello', model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Seed', id: 'seed-provider' } } } }
    })

    await goToWithAuth('/agents/settings', 'test-standalone1')

    // Wait for page to fully load
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()

    // Add another provider to create changes
    await page.getByRole('button', { name: 'Add item' }).click()
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Mock' }).click()

    // Click Save button - should be enabled now because form is valid
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify success notification appears
    await expect(page.getByText('Changes have been saved')).toBeVisible()
  })

  test('Can edit agent name with valid initial data', async ({ page, goToWithAuth }) => {
    // Seed valid settings via API
    const user = await axiosAuth('test-standalone1')
    await user.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'seed-provider', type: 'mock', name: 'Mock Seed', enabled: true }],
      agents: { backOfficeAssistant: { name: 'Data Fair Assistance', prompt: 'Hello', model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Seed', id: 'seed-provider' } } } }
    })

    await goToWithAuth('/agents/settings', 'test-standalone1')

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()

    // Clear the agent name and enter new one
    const nameInput = page.getByRole('textbox', { name: 'Name', exact: true })
    await nameInput.fill('Test Agent')

    // Blur the input to trigger change detection (vjsf uses updateOn: 'blur')
    await nameInput.blur()

    // Save button should now be visible
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()

    // Click Save
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify success notification
    await expect(page.getByText('Changes have been saved')).toBeVisible()
  })

  test('Can delete a provider', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/settings', 'test-standalone1')

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
})
