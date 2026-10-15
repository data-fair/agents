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

  test('the page opens pre-filled, and an edited persona is saved and survives a reload', async ({ page, goToWithAuth }) => {
    // What only e2e can show: that the page actually loads the stored values into the form. The dangerous
    // half — that the body it builds keeps every writable field, nhi included — is pinned
    // deterministically in edit-draft.unit.spec.ts, including a guard that fails if the write-req
    // schema gains a property the form does not carry.
    const agentId = await createAgent({ approvals: { readOnly: 'allow', write: 'approve', destructive: 'deny' } })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
    await goToWithAuth(pageUrl(agentId), 'superadmin', asSuperAdmin)
    const persona = page.getByRole('textbox', { name: 'Persona' })
    await expect(persona).toHaveValue('You answer briefly.', { timeout: 20000 })
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Page agent')
    // The enrolment is loaded into the form, which is what stops a save from dropping it.
    await expect(page.getByRole('textbox', { name: 'Client id' })).toHaveValue('dev-fixture-nhi')
    // The stored approval levels, not just the fields: a form that dropped them would reset them on save.
    await expect(page.getByText('Approvals', { exact: true })).toBeVisible()
    await expect(page.getByRole('combobox').filter({ hasText: 'Writing' })).toContainText('Approve each call')
    await expect(page.getByRole('combobox').filter({ hasText: 'Destructive' })).toContainText('Never offer')
    // A loaded agent is clean: the Save below is caused by the edit, not by a spurious diff.
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden()

    await persona.fill('You answer at length.')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden({ timeout: 10000 })
    const saved = (await admin.get(`/api/autonomous-agents/organization/test1/${agentId}`)).data
    expect(saved.persona).toBe('You answer at length.')
    expect(saved.nhi?.clientId).toBe('dev-fixture-nhi')
    expect(saved.approvals).toMatchObject({ write: 'approve', destructive: 'deny' })
    // The saved agent is the new baseline, and a further edit is still noticed.
    await persona.fill('You answer in French.')
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    await persona.fill('You answer at length.')
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden()

    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Persona' })).toHaveValue('You answer at length.', { timeout: 20000 })
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden()
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

  test('a non-admin instructor is sent to the agent\'s chat, as the org page sends them, and can post', async ({ page, goToWithAuth }) => {
    // The capability the cross-account instructor grant exists for, on the same chat every other
    // person uses (the server side: runtime.api.spec.ts).
    const agentId = await createAgent({ instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }] })
    // An unenrolled agent refuses every turn; dev cannot complete a real enrolment.
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
    await goToWithAuth(pageUrl(agentId), 'test1-user1', { org: 'test1' })
    await expect(page).toHaveURL(new RegExp(`/agents/organization/test1/chat\\?agentId=${agentId}`), { timeout: 20000 })
    await page.getByTestId('agent-chat-input').waitFor({ state: 'visible', timeout: 20000 })
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveCount(0)
    await expect(page.getByTestId('agent-chat-error')).toBeHidden()

    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill('hello')
    await page.getByTestId('agent-chat-send').click()
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
  })

  test('an unknown agent says so instead of leaving the page blank', async ({ page, goToWithAuth }) => {
    await goToWithAuth(pageUrl('no-such-agent'), 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-unavailable')).toContainText('does not exist', { timeout: 20000 })
  })

  // Enrolling waits for unsaved edits: autonomous-agents.e2e.spec.ts, on its unenrolled-agent test.
})
