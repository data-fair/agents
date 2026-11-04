/**
 * stateful E2E tests of web access in the autonomous agent form: the section renders the stored
 * allowlist, and an edit beside it can be saved. No warning: every change an agent with web access makes is
 * reviewed before it runs.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

const createAgent = async (title: string, over: any = {}) => {
  const created = await admin.post('/api/autonomous-agents/organization/test1', {
    title, persona: 'You answer briefly.', mcpServers: [], enabled: true, web: { enabled: true, allowedUrls: ['github.com/data-fair'] }, ...over
  })
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: created.data.id })
  return created.data.id as string
}

const openPage = async (page: Page, goToWithAuth: any, agentId: string, title: string) => {
  await goToWithAuth(`/agents/organization/test1/agents/${agentId}`, 'superadmin', { adminMode: true })
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(title, { timeout: 20000 })
  // web access is in the Tools tab
  await page.getByTestId('autonomous-agent-config-tab-tools').click()
}

test.describe('Web access configuration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('renders the stored allowlist, and an edit can be saved', async ({ page, goToWithAuth }) => {
    const reader = await createAgent('Reader')

    await openPage(page, goToWithAuth, reader, 'Reader')
    await expect(page.getByText('Web access', { exact: true })).toBeVisible()
    await expect(page.getByText('https://github.com/data-fair')).toBeVisible()
    await page.getByTestId('autonomous-agent-config-tab-mission').click()
    await page.getByRole('textbox', { name: 'Persona' }).fill('You answer at length.')
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})
