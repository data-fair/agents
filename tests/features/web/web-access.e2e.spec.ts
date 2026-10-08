/**
 * stateful E2E tests of web access in the autonomous agent form: the section renders the stored
 * allowlist, and the prompt-injection warning shows while writes need no approval — a warning, the
 * save stays possible.
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
}

const openEdit = async (page: Page, title: string) => {
  await page.getByTestId('autonomous-agent-list').locator('.v-list-item', { hasText: title }).getByTitle('Edit').click({ timeout: 20000 })
  const dialog = page.locator('.v-overlay--active')
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue(title, { timeout: 10000 })
  return dialog
}

test.describe('Web access configuration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('warns while writes need no approval, not once they do', async ({ page, goToWithAuth }) => {
    await createAgent('Open writer')
    await createAgent('Careful reader', { approvals: { readOnly: 'allow', write: 'approve', destructive: 'deny' } })
    await goToWithAuth('/agents/organization/test1', 'superadmin', { adminMode: true })

    const open = await openEdit(page, 'Open writer')
    await expect(open.getByText('Web access', { exact: true })).toBeVisible()
    await expect(open.getByText('https://github.com/data-fair')).toBeVisible()
    await expect(open.getByTestId('autonomous-agent-web-risk')).toBeVisible()
    await expect(open.getByTestId('autonomous-agent-save')).toBeEnabled()
    await page.keyboard.press('Escape')
    await expect(open).toHaveCount(0)

    const careful = await openEdit(page, 'Careful reader')
    await expect(careful.getByText('https://github.com/data-fair')).toBeVisible()
    await expect(careful.getByTestId('autonomous-agent-web-risk')).toHaveCount(0)
  })
})
