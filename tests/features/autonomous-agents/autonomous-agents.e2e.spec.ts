/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Autonomous agents configuration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  // Configuring an autonomous agent is behind the progressive rollout gate
  // (autonomousAgentsRequireAdminMode), so every write here needs a superadmin in admin mode.
  const asSuperAdmin = { adminMode: true } as const

  test('an admin creates an autonomous agent and sees it listed', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)

    await page.getByTestId('autonomous-agents-add').click()
    await page.getByRole('textbox', { name: 'Name' }).fill('Support triage')
    await page.getByRole('textbox', { name: 'Persona' }).fill('You triage support questions.')
    await page.getByTestId('autonomous-agent-save').click()

    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Support triage')
  })

  test('a created autonomous agent survives a reload, so it really persisted', async ({ page, goToWithAuth }) => {
    // Without the reload this would also pass on a list that only ever re-rendered local state.
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click()
    await page.getByRole('textbox', { name: 'Name' }).fill('Persisted agent')
    await page.getByRole('textbox', { name: 'Persona' }).fill('x')
    await page.getByTestId('autonomous-agent-save').click()
    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Persisted agent')

    await page.reload()
    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Persisted agent')
  })

  test('the MCP server picker offers the catalog the API serves', async ({ page, goToWithAuth }) => {
    // Assert a known dev id rather than a count, which would pin the dev config.
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click()
    await page.getByRole('button', { name: 'Add item' }).first().click()
    await page.locator('.v-overlay .v-form').getByRole('combobox').first().click()
    await expect(page.getByRole('option', { name: /dev-public-mcp|Dev Public MCP/ })).toBeVisible()
  })

  test('an org admin without admin mode is not offered the configuration form', async ({ page, goToWithAuth }) => {
    // The rollout gate means the API would refuse every save; offering the form anyway would be a
    // UI that cannot work. The section still explains itself rather than vanishing silently.
    await goToWithAuth('/agents/organization/test1', 'test1-admin1', { org: 'test1' })
    await expect(page.getByTestId('autonomous-agents-section')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('autonomous-agents-add')).toBeHidden()
    await expect(page.getByTestId('autonomous-agents-gated')).toBeVisible()
  })
})
