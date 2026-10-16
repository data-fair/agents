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
  return created.data.id as string
}

const openPage = async (page: Page, goToWithAuth: any, agentId: string, title: string) => {
  await goToWithAuth(`/agents/organization/test1/agents/${agentId}`, 'superadmin', { adminMode: true })
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(title, { timeout: 20000 })
}

test.describe('Web access configuration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('warns while writes need no approval, not once they do', async ({ page, goToWithAuth }) => {
    const openWriter = await createAgent('Open writer')
    const carefulReader = await createAgent('Careful reader', { approvalLevel: 'write' })

    await openPage(page, goToWithAuth, carefulReader, 'Careful reader')
    await expect(page.getByText('https://github.com/data-fair')).toBeVisible()
    await expect(page.getByTestId('autonomous-agent-web-risk')).toHaveCount(0)

    await openPage(page, goToWithAuth, openWriter, 'Open writer')
    await expect(page.getByText('Web access', { exact: true })).toBeVisible()
    await expect(page.getByText('https://github.com/data-fair')).toBeVisible()
    await expect(page.getByTestId('autonomous-agent-web-risk')).toBeVisible()
    // a warning, never a block: an edit can still be saved (checked last, so no navigation away follows
    // an unsaved change and meets the leave guard)
    await page.getByRole('textbox', { name: 'Persona' }).fill('You answer at length.')
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})
