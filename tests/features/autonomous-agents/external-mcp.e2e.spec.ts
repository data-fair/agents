/**
 * stateful E2E tests, validate UI using playwright pages
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

test.describe('External MCP servers in the agent form', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(await superAdmin, 'organization/test1')
  })

  test('an admin lists an external MCP server, and it is saved as it is connected to', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Interop', persona: 'x', mcpServers: [], enabled: true })).data
    await goToWithAuth(`/agents/organization/test1/agents/${agent.id}`, 'superadmin', { adminMode: true })
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Interop', { timeout: 20000 })
    await expect(page.getByText('External MCP servers')).toBeVisible()
    // vjsf array: its "Add item" next to the section, then the URL field
    await page.getByText('External MCP servers').locator('xpath=ancestor::*[.//button][1]').getByRole('button', { name: 'Add item' }).click()
    await page.getByRole('textbox', { name: 'URL' }).last().fill('OpenData.Example.org/mcp-server/mcp')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden({ timeout: 10000 })
    const saved = (await admin.get(`/api/autonomous-agents/organization/test1/${agent.id}`)).data
    expect(saved.externalMcpServers).toEqual([{ url: 'https://opendata.example.org/mcp-server/mcp' }])
  })
})
