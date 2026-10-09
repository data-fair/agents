/**
 * stateful E2E: an admin reads, edits and restores an agent's memory.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Agent memory dialog', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('view, edit, then restore the previous version', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true } })).data
    await admin.put(`/api/memory/organization/test1/${agent.id}/document`, { description: 'Core facts', content: '- first fact' }, { params: { path: 'MEMORY.md' } })

    await goToWithAuth(`/agents/organization/test1/agents/${agent.id}`, 'superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-memory').click({ timeout: 20000 })
    await page.getByTestId('memory-document-MEMORY.md').click()
    const editor = page.getByTestId('memory-content').locator('textarea:not([aria-hidden="true"])')
    await expect(editor).toHaveValue('- first fact')

    await editor.fill('- second fact')
    await page.getByTestId('memory-save').click()
    await expect(page.getByTestId('memory-document-MEMORY.md')).toContainText('MEMORY.md')

    await page.getByTestId('memory-tab-history').click()
    const rows = page.getByTestId('memory-version')
    await expect(rows).toHaveCount(2)
    await rows.nth(1).getByTestId('memory-version-restore').click()

    await page.getByTestId('memory-tab-documents').click()
    await page.getByTestId('memory-document-MEMORY.md').click()
    await expect(editor).toHaveValue('- first fact')
  })

  test('a save over a document changed underneath is refused and says so', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true } })).data
    const url = `/api/memory/organization/test1/${agent.id}/document`
    const created = (await admin.put(url, { description: 'Core facts', content: '- first fact' }, { params: { path: 'MEMORY.md' } })).data

    await goToWithAuth(`/agents/organization/test1/agents/${agent.id}`, 'superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-memory').click({ timeout: 20000 })
    await page.getByTestId('memory-document-MEMORY.md').click()
    const editor = page.getByTestId('memory-content').locator('textarea:not([aria-hidden="true"])')
    await expect(editor).toHaveValue('- first fact')

    await admin.put(url, { description: 'Core facts', content: '- changed elsewhere', version: created.version }, { params: { path: 'MEMORY.md' } })
    await editor.fill('- my edit')
    await page.getByTestId('memory-save').click()

    // the refusal is shown, and the dialog re-reads the document instead of pretending it saved
    await expect(page.locator('.ui-notif')).toContainText('was changed since it was loaded')
    await expect(editor).toHaveValue('- changed elsewhere')
  })

  test('the Memory button stays for an agent with memory off, and the dialog says so', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true })).data
    await goToWithAuth(`/agents/organization/test1/agents/${agent.id}`, 'superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-memory').click({ timeout: 20000 })
    await expect(page.getByText('Memory is turned off for this agent')).toBeVisible()
  })

  test('the agent form offers the memory switch', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    await expect(page.getByRole('checkbox', { name: 'Keep a memory across conversations' })).toBeVisible()
  })
})
