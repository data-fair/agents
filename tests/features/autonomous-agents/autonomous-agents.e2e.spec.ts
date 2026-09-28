/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Autonomous agents configuration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  // Configuring an autonomous agent is behind the progressive rollout gate
  // (autonomousAgentsRequireAdminMode), so every write here needs a superadmin in admin mode.
  const asSuperAdmin = { adminMode: true } as const

  test('an admin creates an autonomous agent and sees it listed', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)

    await page.getByTestId('autonomous-agents-add').click()
    await page.getByRole('textbox', { name: 'Name' }).fill('Support triage')
    await page.getByRole('textbox', { name: 'Persona' }).fill('You triage support questions.')
    await page.getByTestId('autonomous-agent-save').click()

    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Support triage')
  })

  test('a created autonomous agent survives a reload, so it really persisted', async ({ page, goToWithAuth }) => {
    // Without the reload this would also pass on a list that only ever re-rendered local state.
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click()
    await page.getByRole('textbox', { name: 'Name' }).fill('Persisted agent')
    await page.getByRole('textbox', { name: 'Persona' }).fill('x')
    await page.getByTestId('autonomous-agent-save').click()
    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Persisted agent')

    await page.reload()
    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Persisted agent')
  })

  test('the MCP server picker offers the catalog the API serves', async ({ page, goToWithAuth }) => {
    // Assert a known dev id rather than a count, which would pin the dev config.
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click()
    await page.getByRole('button', { name: 'Add item' }).first().click()
    await page.locator('.v-overlay .v-form').getByRole('combobox').first().click()
    await expect(page.getByRole('option', { name: /dev-public-mcp|Dev Public MCP/ })).toBeVisible()
  })

  test('an org admin without admin mode is not offered the configuration form', async ({ page, goToWithAuth }) => {
    // The rollout gate means the API would refuse every save; offering the form anyway would be a
    // UI that cannot work. The section still explains itself rather than vanishing silently.
    await goToWithAuth('/agents/organization/test1', 'test1-admin1', { org: 'test1' })
    await expect(page.getByTestId('autonomous-agents-section')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('autonomous-agents-add')).toBeHidden()
    await expect(page.getByTestId('autonomous-agents-gated')).toBeVisible()
  })
})

test.describe('Autonomous agent thread', () => {
  let agentId: string

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
    // Created through the API rather than the UI: this block is about the thread, and driving the
    // configuration form again would make every failure here ambiguous.
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Thread agent', persona: 'You answer briefly.', mcpServers: [], toolDisclosure: 'static', enabled: true
    })
    agentId = created.data.id
    // Dev cannot complete a real NHI enrolment, and an unenrolled agent refuses every turn.
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  })

  const openThread = async (goToWithAuth: any, user = 'superadmin', opts: any = { adminMode: true }) =>
    await goToWithAuth(`/agents/organization/test1/autonomous-agents/${agentId}`, user, opts)

  test('posting a message shows the answer without a reload', async ({ page, goToWithAuth }) => {
    // The single most valuable assertion here: it can only pass if the notification and the
    // incremental fetch both work. Auto-waiting, never a fixed timeout — a fixed wait would also
    // pass on a page that secretly polls, hiding a broken socket.
    await openThread(goToWithAuth)
    await page.getByTestId('autonomous-agent-new-conversation').click()
    await page.getByTestId('autonomous-agent-composer').fill('hello')
    await page.getByTestId('autonomous-agent-send').click()

    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('hello')
    // 'world' is the mock model's answer to 'hello'
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('world', { timeout: 15000 })
  })

  test('the run reaches a terminal state that is shown', async ({ page, goToWithAuth }) => {
    await openThread(goToWithAuth)
    await page.getByTestId('autonomous-agent-new-conversation').click()
    await page.getByTestId('autonomous-agent-composer').fill('hello')
    await page.getByTestId('autonomous-agent-send').click()
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('world', { timeout: 15000 })
    await expect(page.getByTestId('autonomous-agent-run-status')).toContainText(/done/i)
  })

  test('a failed turn explains itself instead of leaving an empty bubble', async ({ page, goToWithAuth }) => {
    // 'stream error' is the mock seam for a provider error that does NOT throw — the class of
    // failure that used to end a conversation silently.
    await openThread(goToWithAuth)
    await page.getByTestId('autonomous-agent-new-conversation').click()
    await page.getByTestId('autonomous-agent-composer').fill('stream error')
    await page.getByTestId('autonomous-agent-send').click()

    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText(/could not be completed|failed/i, { timeout: 15000 })
    await expect(page.getByTestId('autonomous-agent-run-status')).toContainText(/error/i)
  })

  test('two conversations are listed and switching shows different messages', async ({ page, goToWithAuth }) => {
    await openThread(goToWithAuth)
    await page.getByTestId('autonomous-agent-new-conversation').click()
    await page.getByTestId('autonomous-agent-composer').fill('hello')
    await page.getByTestId('autonomous-agent-send').click()
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('world', { timeout: 15000 })

    await page.getByTestId('autonomous-agent-new-conversation').click()
    // The fresh thread must not show the first one's messages.
    await expect(page.getByTestId('autonomous-agent-transcript')).not.toContainText('world')
    await expect(page.getByTestId('autonomous-agent-conversation-list').getByRole('listitem')).toHaveCount(2)
  })

  test('an org member who may not instruct is told so, not shown an empty thread', async ({ page, goToWithAuth }) => {
    await openThread(goToWithAuth, 'test1-user1', { org: 'test1' })
    await expect(page.getByTestId('autonomous-agent-error')).toBeVisible({ timeout: 15000 })
  })
})
