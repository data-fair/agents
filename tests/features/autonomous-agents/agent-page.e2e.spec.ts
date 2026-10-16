/**
 * stateful E2E tests of an autonomous agent's admin page: the one place an agent is edited.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { exampleFields } from '../../../ui/src/utils/autonomous-agent-examples.ts'

const admin = await superAdmin
const asSuperAdmin = { adminMode: true } as const

const createAgent = async (over: any = {}) => {
  const created = await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Page agent', persona: 'You answer briefly.', mcpServers: [], enabled: true, ...over
  })
  return created.data.id as string
}

const pageUrl = (agentId: string, query = '') => `/agents/organization/test1/agents/${agentId}${query}`
const getAgent = async (agentId: string) => (await admin.get(`/api/autonomous-agents/organization/test1/${agentId}`)).data
// The Save of the configuration block, in its top bar rather than below the form.
const saveButton = (page: Page) => page.locator('#autonomous-agent-configuration .v-card').getByRole('button', { name: 'Save' })

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
    const agentId = await createAgent({ approvalLevel: 'write' })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
    await goToWithAuth(pageUrl(agentId), 'superadmin', asSuperAdmin)
    const persona = page.getByRole('textbox', { name: 'Persona' })
    await expect(persona).toHaveValue('You answer briefly.', { timeout: 20000 })
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Page agent')
    // The client id is never shown: the enrolment travels in the draft, and the save below keeps it.
    await expect(page.getByRole('textbox', { name: 'Client id' })).toHaveCount(0)
    // The stored approval level, not just the fields: a form that dropped them would reset them on save.
    await page.getByTestId('autonomous-agent-config-tab-security').click()
    await expect(page.getByRole('radio', { name: 'Every operation that makes changes' })).toBeChecked()
    await page.getByTestId('autonomous-agent-config-tab-role').click()
    // A loaded agent is clean: the Save below is caused by the edit, not by a spurious diff.
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden()

    await persona.fill('You answer at length.')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden({ timeout: 10000 })
    const saved = (await admin.get(`/api/autonomous-agents/organization/test1/${agentId}`)).data
    expect(saved.persona).toBe('You answer at length.')
    expect(saved.nhi?.clientId).toBe('dev-fixture-nhi')
    expect(saved.approvalLevel).toBe('write')
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

  test('configuration is split in tabs with save in the bar', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await goToWithAuth(pageUrl(agentId), 'superadmin', asSuperAdmin)
    for (const key of ['role', 'tools', 'security', 'memory']) {
      await expect(page.getByTestId(`autonomous-agent-config-tab-${key}`)).toBeVisible({ timeout: 20000 })
    }
    await page.getByRole('textbox', { name: 'Persona' }).fill('You answer at length.')
    await expect(saveButton(page)).toBeEnabled()

    // One draft across the tabs: the persona edited in Role is saved with the level picked in Security.
    await page.getByTestId('autonomous-agent-config-tab-security').click()
    await expect(page).toHaveURL(/config=security/)
    await page.getByRole('radio', { name: 'Every operation that makes changes' }).check()
    await saveButton(page).click()
    await expect(saveButton(page)).toBeHidden({ timeout: 10000 })
    const saved = await getAgent(agentId)
    expect(saved.approvalLevel).toBe('write')
    expect(saved.persona).toBe('You answer at length.')

    // The kill switch is not part of the form, in any tab (the hidden ones included).
    await expect(page.getByRole('checkbox', { name: 'Enabled', exact: true, includeHidden: true })).toHaveCount(0)
    // The organization's own roles are offered (read from simple-directory), the default selected.
    const role = page.getByRole('combobox', { name: 'Role in the organization' })
    await expect(role).toHaveValue('user')
    await role.click({ force: true })
    await expect(page.getByRole('option', { name: 'admin' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'user' })).toBeVisible()
  })

  test('example picker confirms over edits', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent({ approvalLevel: 'none' })
    await goToWithAuth(pageUrl(agentId), 'superadmin', asSuperAdmin)
    const persona = page.getByRole('textbox', { name: 'Persona' })
    await persona.fill('My very own persona.', { timeout: 20000 })

    await page.getByTestId('autonomous-agent-example').click()
    await page.getByRole('option', { name: 'Data publication' }).click()
    await page.getByTestId('autonomous-agent-example-confirm').click()
    const example = exampleFields('publication', 'en', 'Page agent')
    await expect(persona).toHaveValue(example.persona)
    await expect(page.getByRole('textbox', { name: 'Instructions' })).toHaveValue(example.instructions)

    await saveButton(page).click()
    await expect(saveButton(page)).toBeHidden({ timeout: 10000 })
    const saved = await getAgent(agentId)
    expect(saved.persona).toBe(example.persona)
    // the example replaces the text only: another tab is never loosened (or tightened) behind the admin's back
    expect(saved.approvalLevel).toBe('none')

    // Text that is exactly an example's is replaced without asking.
    await page.getByTestId('autonomous-agent-example').click()
    await page.getByRole('option', { name: 'Quality monitoring' }).click()
    await expect(persona).toHaveValue(exampleFields('quality', 'en', 'Page agent').persona)
    await expect(page.getByTestId('autonomous-agent-example-confirm')).toHaveCount(0)
  })

  test('identity sync failure is reported', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent()
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
    await goToWithAuth(pageUrl(agentId), 'superadmin', asSuperAdmin)
    await page.getByRole('textbox', { name: 'Name' }).fill('Renamed agent', { timeout: 20000 })
    // The PATCH must actually reach the directory, which (file storage in dev) refuses it.
    const patch = page.waitForRequest(req => req.method() === 'PATCH' &&
      new URL(req.url()).pathname === '/simple-directory/api/organizations/test1/nhis/dev-fixture-nhi')
    await saveButton(page).click()
    expect((await patch).postDataJSON()).toEqual({ name: 'Renamed agent (autonomous agent)' })

    const alert = page.getByTestId('autonomous-agent-identity-sync-error')
    await expect(alert).toBeVisible({ timeout: 10000 })
    await expect(alert).toContainText('the new name')
    // the agent itself is saved: the divergence is accepted, and said
    const saved = await getAgent(agentId)
    expect(saved.title).toBe('Renamed agent')
    expect(saved.nhi?.clientId).toBe('dev-fixture-nhi')
  })

  test('an agent stored with empty instructions has a working page', async ({ page, goToWithAuth }) => {
    // The blank example has no instructions: a stored '' once read as a permanent unsaved change, and the
    // leave guard then made every link on the page inert.
    const agentId = await createAgent({ instructions: '' })
    await goToWithAuth(pageUrl(agentId), 'superadmin', asSuperAdmin)
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Page agent', { timeout: 20000 })
    await expect(saveButton(page)).toBeHidden()

    await page.getByTestId('autonomous-agent-config-tab-tools').click()
    await expect(page.getByText('External MCP servers')).toBeVisible()
    await page.getByTestId('autonomous-agent-config-tab-role').click()
    await page.getByRole('textbox', { name: 'Persona' }).fill('You answer at length.')
    await saveButton(page).click()
    await expect(saveButton(page)).toBeHidden({ timeout: 10000 })
    expect((await getAgent(agentId)).persona).toBe('You answer at length.')

    await page.getByRole('link', { name: 'Open chat' }).click()
    await expect(page).toHaveURL(new RegExp(`/agents/organization/test1/chat\\?agentId=${agentId}`), { timeout: 20000 })
  })

  // Enrolling waits for unsaved edits: autonomous-agents.e2e.spec.ts, on its unenrolled-agent test.
})
