/**
 * stateful E2E tests of an autonomous agent's admin page: the one place an agent is edited.
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const asSuperAdmin = { adminMode: true } as const

const createAgent = async (over: any = {}) => {
  const created = await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Page agent', persona: 'You answer briefly.', mcpServers: [], enabled: true, ...over
  })
  return created.data.id as string
}

const pageUrl = (agentId: string, query = '') => `/agents/organization/test1/agents/${agentId}${query}`

test.describe('Autonomous agent page', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('the org page lists the agent as a link to its page', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agent-list').getByRole('link', { name: /Page agent/ }).click({ timeout: 20000 })

    await expect(page).toHaveURL(new RegExp(`/agents/organization/test1/agents/${agentId}`))
    // The form is loaded from the stored agent, not merely rendered empty.
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Page agent', { timeout: 20000 })
  })

  test('an edited persona is saved and survives a reload', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await goToWithAuth(pageUrl(agentId), 'superadmin', asSuperAdmin)
    const persona = page.getByRole('textbox', { name: 'Persona' })
    await expect(persona).toHaveValue('You answer briefly.', { timeout: 20000 })
    // A loaded agent is clean: the Save below is caused by the edit, not by a spurious diff.
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden()

    await persona.fill('You answer at length.')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden({ timeout: 10000 })
    expect((await admin.get(`/api/autonomous-agents/organization/test1/${agentId}`)).data.persona).toBe('You answer at length.')
    // The saved agent is the new baseline, and a further edit is still noticed.
    await persona.fill('You answer in French.')
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    await persona.fill('You answer at length.')
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden()

    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Persona' })).toHaveValue('You answer at length.', { timeout: 20000 })
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden()
  })

  test('the approval levels are in the form', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent({ approvals: { readOnly: 'allow', write: 'approve', destructive: 'deny' } })
    await goToWithAuth(pageUrl(agentId), 'superadmin', asSuperAdmin)
    await expect(page.getByText('Approvals', { exact: true })).toBeVisible({ timeout: 20000 })
    // The stored levels, not just the fields: a form that dropped them would reset them on save.
    await expect(page.getByRole('combobox').filter({ hasText: 'Writing' })).toContainText('Approve each call')
    await expect(page.getByRole('combobox').filter({ hasText: 'Destructive' })).toContainText('Never offer')
  })

  test('?tab=tasks opens the Tasks tab', async ({ page, goToWithAuth }) => {
    // What a notification url relies on.
    const agentId = await createAgent()
    await goToWithAuth(pageUrl(agentId, '?tab=tasks'), 'superadmin', asSuperAdmin)
    await expect(page.getByRole('tab', { name: 'Tasks' })).toHaveAttribute('aria-selected', 'true', { timeout: 20000 })
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeHidden()

    // and the query follows a tab change, so a reload or a shared link keeps it
    await page.getByRole('tab', { name: 'Configuration' }).click()
    await expect(page).toHaveURL(/tab=configuration/)
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Page agent')
  })

  test('a non-admin instructor is told the page is not theirs, and gets no form', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent({ instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }] })
    await goToWithAuth(pageUrl(agentId), 'test1-user1', { org: 'test1' })
    await expect(page.getByTestId('autonomous-agents-gated')).toContainText('administrators', { timeout: 20000 })
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeHidden()
    // the chat stays theirs
    await expect(page.getByRole('link', { name: 'Open chat' })).toBeVisible()
  })
})
