/**
 * The profile tree of a profiled server in the agent form (docs/superpowers/specs/2026-10-14-mcp-profile-selection-design.md §3).
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const asSuperAdmin = { adminMode: true } as const
let fixture: McpFixture

test.describe('profile tree', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('checking write_roads shows read_roads as included, and saves only what was checked', async ({ page, goToWithAuth }) => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', { title: 'Tree', persona: 'x', mcpServers: [{ serverId: 'dev-profiled-mcp', profiles: ['catalog'] }], enabled: true })
    await goToWithAuth(`/agents/organization/test1/agents/${created.data.id}`, 'superadmin', asSuperAdmin)
    const tree = page.getByTestId('mcp-profiles-tree')
    await expect(tree).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('checkbox', { name: 'Catalog' })).toBeChecked()
    await tree.getByRole('button', { name: /Write/ }).click() // unfold the root
    await page.getByRole('checkbox', { name: 'Write — roads' }).check()
    await expect(page.getByRole('checkbox', { name: 'Read — roads' })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: 'Read — roads' })).toBeDisabled()
    await expect(tree.getByText('included by write_roads')).toBeVisible()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.poll(async () => (await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}`)).data.mcpServers).toEqual([{ serverId: 'dev-profiled-mcp', profiles: ['catalog', 'write_roads'] }])
  })

  test('a server without profiles shows the tool filter, not the tree', async ({ page, goToWithAuth }) => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', { title: 'Plain', persona: 'x', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true })
    await goToWithAuth(`/agents/organization/test1/agents/${created.data.id}`, 'superadmin', asSuperAdmin)
    await expect(page.getByText('Only these tools').first()).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('mcp-profiles-tree')).toHaveCount(0)
  })

  test('switching a reference to a profiled server drops its hidden tool filter, so the save goes through', async ({ page, goToWithAuth }) => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', { title: 'Switch', persona: 'x', mcpServers: [{ serverId: 'dev-public-mcp', toolFilter: ['echo'] }], enabled: true })
    await goToWithAuth(`/agents/organization/test1/agents/${created.data.id}`, 'superadmin', asSuperAdmin)
    const item = page.getByRole('listitem').filter({ hasText: 'dev-public-mcp' })
    await expect(item).toBeVisible({ timeout: 20000 })
    // vjsf's list: hovering an item shows its actions menu, whose Edit entry makes the item editable
    await item.hover()
    await item.locator('.vjsf-list-item-actions-wrapper button').last().click()
    await page.getByText('Edit', { exact: true }).click()
    await page.getByRole('combobox', { name: 'Server' }).click()
    await page.getByRole('option', { name: 'Dev Profiled MCP' }).click()
    await expect(page.getByTestId('mcp-profiles-tree')).toBeVisible({ timeout: 20000 })
    await page.getByRole('checkbox', { name: 'Catalog' }).check()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.poll(async () => (await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}`)).data.mcpServers).toEqual([{ serverId: 'dev-profiled-mcp', profiles: ['catalog'] }])
  })
})
