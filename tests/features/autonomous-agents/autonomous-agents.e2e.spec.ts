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

    // Generous: the first navigation after a dev-server restart pays vite's compile cost.
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
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
    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Persisted agent', { timeout: 20000 })

    await page.reload()
    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Persisted agent')
  })

  test('the edit dialog opens pre-filled from the stored autonomous agent', async ({ page, goToWithAuth }) => {
    // What only e2e can show: that Edit actually loads the stored values into the form. The dangerous
    // half — that the body it builds keeps every writable field, nhi included — is pinned
    // deterministically in edit-draft.unit.spec.ts, including a guard that fails if the write-req
    // schema gains a property the form does not carry.
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Editable agent', persona: 'You answer briefly.', mcpServers: [], enabled: true
    })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: created.data.id })

    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agent-list').getByTitle('Edit').first().click({ timeout: 20000 })
    const dialog = page.locator('.v-overlay--active')
    await expect(dialog.getByTestId('autonomous-agent-save')).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue('Editable agent', { timeout: 10000 })
    await expect(dialog.getByRole('textbox', { name: 'Persona' })).toHaveValue('You answer briefly.')
    // The enrolment is loaded into the form, which is what stops a save from dropping it.
    await expect(dialog.getByRole('textbox', { name: 'Client id' })).toHaveValue('dev-fixture-nhi')
  })

  test('an unenrolled autonomous agent offers to enrol it, and reports what the directory says', async ({ page, goToWithAuth }) => {
    // The two services are federated CLIENT-side: this button calls simple-directory's own NHI API
    // with the admin's session, so the admin never leaves this UI.
    //
    // The SUCCESS path cannot run here: simple-directory's NHI management is mongo-only (createUser
    // throws under the file storage every data-fair dev stack uses), so creation fails. That makes
    // the failure path the valuable one to pin — an inert button would be the likely bug, and this
    // asserts the directory's own refusal is surfaced instead.
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Unenrolled agent', persona: 'x', mcpServers: [], enabled: true
    })
    expect(created.data.nhi?.clientId).toBeFalsy()

    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agent-list').getByRole('button', { name: 'Enrol an identity' }).first().click({ timeout: 20000 })

    const dialog = page.locator('.v-overlay--active')
    await expect(dialog.getByTestId('autonomous-agent-enrol-confirm')).toBeVisible()

    // The federation is the thing under test, so pin the request ACTUALLY reaching simple-directory.
    // Asserting only that some error is displayed passed while the call was being rewritten to
    // /agents/api/simple-directory/... by $fetch's baseURL and answered by our own /api 404 — the
    // directory was never contacted, and our 404 body read plausibly like a refusal from it.
    const nhiRequest = page.waitForRequest(req =>
      req.url().includes('/simple-directory/api/organizations/test1/nhis') && req.method() === 'POST',
    { timeout: 20000 })
    await dialog.getByTestId('autonomous-agent-enrol-confirm').click()
    const sent = await nhiRequest
    expect(new URL(sent.url()).pathname).toBe('/simple-directory/api/organizations/test1/nhis')

    // Whatever simple-directory answers, the admin is told — not left with a spinner that stops and
    // a dialog that does nothing.
    await expect(page.getByTestId('autonomous-agent-enrol-error')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('autonomous-agent-enrol-error')).not.toBeEmpty()
    // and specifically not our own catch-all, which is what the rewritten URL used to return
    await expect(page.getByTestId('autonomous-agent-enrol-error')).not.toContainText('unknown api endpoint')
  })

  test('an enrolled autonomous agent shows its identity instead of offering to enrol', async ({ page, goToWithAuth }) => {
    const siteUrl = `http://localhost:${process.env.NGINX_PORT}`
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-autonomous-agent-nhi',
      siteUrl,
      issuer: `${siteUrl}/agents/api/nhi`,
      autonomousAgent: { title: 'Enrolled agent', persona: 'x', mcpServers: [], enabled: true }
    })

    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Identity enrolled', { timeout: 20000 })
    await expect(page.getByTestId('autonomous-agent-list').getByRole('button', { name: 'Enrol an identity' })).toHaveCount(0)
  })

  test('the MCP server picker offers the catalog the API serves', async ({ page, goToWithAuth }) => {
    // Assert a known dev id rather than a count, which would pin the dev config.
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click()
    await page.getByRole('button', { name: 'Add item' }).first().click()
    await page.locator('.v-overlay .v-form').getByRole('combobox').first().click()
    await expect(page.getByRole('option', { name: /dev-public-mcp|Dev Public MCP/ })).toBeVisible()
  })

  test('the whole journey: create, open its thread, instruct it, see the answer', async ({ page, goToWithAuth }) => {
    // What only an end-to-end flow can show: that the pieces connect. Each is covered on its own
    // above; this asserts an admin can get from an empty organization to an answered question without
    // touching the API, following the same links a person would.
    //
    // One dev-only detour, at the one step this environment cannot do: giving the agent its identity.
    // simple-directory's NHI management is mongo-only, so the UI's Enrol button fails locally (see the
    // test above, which pins that failure being reported). The seam stands in for it here so the rest
    // of the journey is exercised rather than blocked.
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)

    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    await page.getByRole('textbox', { name: 'Name' }).fill('Journey agent')
    await page.getByRole('textbox', { name: 'Persona' }).fill('You answer briefly.')
    await page.getByTestId('autonomous-agent-save').click()
    await expect(page.getByTestId('autonomous-agent-list')).toContainText('Journey agent')

    const listed = (await admin.get('/api/autonomous-agents/organization/test1')).data.results
    const journeyAgent = listed.find((agent: any) => agent.title === 'Journey agent')
    expect(journeyAgent).toBeTruthy()
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: journeyAgent.id })

    // Follow the link a person would, rather than navigating by url.
    await page.reload()
    await page.getByTestId('autonomous-agent-list').getByRole('link', { name: 'Open' }).first().click()

    await page.getByTestId('autonomous-agent-new-conversation').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-composer').locator('textarea:not([aria-hidden="true"])').fill('hello')
    await page.getByTestId('autonomous-agent-send').click()

    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('world', { timeout: 15000 })
    await expect(page.getByTestId('conversation-run-status')).toContainText(/done/i)
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
      title: 'Thread agent', persona: 'You answer briefly.', mcpServers: [], enabled: true
    })
    agentId = created.data.id
    // Dev cannot complete a real NHI enrolment, and an unenrolled agent refuses every turn — which
    // produces the SAME generic failure text as a provider error, so a silently no-op fixture would
    // make several tests below pass for entirely the wrong reason. Assert it took.
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
    const enrolled = await admin.get(`/api/autonomous-agents/organization/test1/${agentId}`)
    expect(enrolled.data.nhi?.clientId).toBeTruthy()
  })

  const openThread = async (goToWithAuth: any, user = 'superadmin', opts: any = { adminMode: true }) =>
    await goToWithAuth(`/agents/organization/test1/autonomous-agents/${agentId}`, user, opts)

  test('posting a message shows the answer without a reload', async ({ page, goToWithAuth }) => {
    // The single most valuable assertion here: it can only pass if the notification and the
    // incremental fetch both work. Auto-waiting, never a fixed timeout — a fixed wait would also
    // pass on a page that secretly polls, hiding a broken socket.
    await openThread(goToWithAuth)
    await page.getByTestId('autonomous-agent-new-conversation').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-composer').locator('textarea:not([aria-hidden="true"])').fill('hello')
    await page.getByTestId('autonomous-agent-send').click()

    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('hello')
    // 'world' is the mock model's answer to 'hello'
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('world', { timeout: 15000 })
  })

  test('the run reaches a terminal state that is shown', async ({ page, goToWithAuth }) => {
    await openThread(goToWithAuth)
    await page.getByTestId('autonomous-agent-new-conversation').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-composer').locator('textarea:not([aria-hidden="true"])').fill('hello')
    await page.getByTestId('autonomous-agent-send').click()
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('world', { timeout: 15000 })
    await expect(page.getByTestId('conversation-run-status')).toContainText(/done/i)
  })

  test('a failed turn explains itself instead of leaving an empty bubble', async ({ page, goToWithAuth }) => {
    // 'stream error' is the mock seam for a provider error that does NOT throw — the class of
    // failure that used to end a conversation silently.
    await openThread(goToWithAuth)
    await page.getByTestId('autonomous-agent-new-conversation').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-composer').locator('textarea:not([aria-hidden="true"])').fill('stream error')
    await page.getByTestId('autonomous-agent-send').click()

    // The generic 'This turn failed and could not be completed.' is appended for EVERY stopReason
    // 'error' — a disabled agent, a missing enrolment, an exhausted quota, an empty completion. Only
    // the parenthetical detail runStopReasonMessage appends distinguishes the provider error this
    // test claims to drive.
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('could not be completed', { timeout: 15000 })
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText(/\(.*error.*\)/i)
    await expect(page.getByTestId('conversation-run-status')).toContainText(/error/i)
  })

  test('two conversations are listed and switching shows different messages', async ({ page, goToWithAuth }) => {
    await openThread(goToWithAuth)
    await page.getByTestId('autonomous-agent-new-conversation').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-composer').locator('textarea:not([aria-hidden="true"])').fill('hello')
    await page.getByTestId('autonomous-agent-send').click()
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('world', { timeout: 15000 })

    await page.getByTestId('autonomous-agent-new-conversation').click()
    // The fresh thread must not show the first one's messages.
    await expect(page.getByTestId('autonomous-agent-transcript')).not.toContainText('world')
    await expect(page.getByTestId('autonomous-agent-conversation-list').getByRole('listitem')).toHaveCount(2)
  })

  test('an org member who may not instruct is told exactly that', async ({ page, goToWithAuth }) => {
    // Asserting the TEXT, not merely that some alert appeared: pageError is set on any rejection, so
    // a 404, a 500 or a typo in the url all satisfied the old assertion. This message is the only
    // thing that pins the forbidden branch.
    await openThread(goToWithAuth, 'test1-user1', { org: 'test1' })
    await expect(page.getByTestId('autonomous-agent-error'))
      .toContainText('You are not allowed to instruct this autonomous agent', { timeout: 15000 })
  })

  test('a listed instructor who is NOT an admin can open the thread and post', async ({ page, goToWithAuth }) => {
    // The capability the cross-account instructor grant exists for. It was unreachable: the page's
    // first request was admin-gated, so every instructor saw the refusal above — and the refusal test
    // passed BECAUSE of that gate, never touching canInstruct at all.
    await admin.put(`/api/autonomous-agents/organization/test1/${agentId}`, {
      title: 'Thread agent',
      persona: 'You answer briefly.',
      mcpServers: [],
      enabled: true,
      instructors: [{ userId: 'test1-user1', userName: 'Test User' }]
      // nhi is deliberately NOT sent here: supplying it makes the write route rebuild the enrolment,
      // which needs an X-Forwarded-Host this direct client does not send. The PUT therefore drops the
      // enrolment, so re-apply it through the dev seam below.
    })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })

    await openThread(goToWithAuth, 'test1-user1', { org: 'test1' })
    await expect(page.getByTestId('autonomous-agent-error')).toBeHidden()
    await page.getByTestId('autonomous-agent-new-conversation').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-composer').locator('textarea:not([aria-hidden="true"])').fill('hello')
    await page.getByTestId('autonomous-agent-send').click()
    await expect(page.getByTestId('autonomous-agent-transcript')).toContainText('world', { timeout: 15000 })
  })
})
