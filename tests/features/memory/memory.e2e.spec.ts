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

    await goToWithAuth('/agents/organization/test1', 'superadmin', { adminMode: true })
    await page.getByTestId(`autonomous-agent-memory-${agent.id}`).click({ timeout: 20000 })
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

  test('the agent form offers the memory switch', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    await expect(page.getByRole('checkbox', { name: 'Keep a memory across conversations' })).toBeVisible()
  })
})
