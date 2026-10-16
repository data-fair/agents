/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { exampleFields } from '../../../ui/src/utils/autonomous-agent-examples.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

// The unified chat's composer. The wrapper carries the test id; v-textarea with auto-grow renders a
// second aria-hidden sizer textarea beside the real control.
const composer = (page: Page) => page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])')

const fillAndSend = async (page: Page, text: string) => {
  await composer(page).fill(text)
  await page.getByTestId('agent-chat-send').click()
}

test.describe('Autonomous agents configuration', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  // Configuring an autonomous agent is behind the progressive rollout gate
  // (autonomousAgentsRequireAdminMode), so every write here needs a superadmin in admin mode.
  const asSuperAdmin = { adminMode: true } as const

  test('creation asks only for a name, a role and an example', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    const dialog = page.locator('.v-overlay--active')
    await expect(dialog.getByTestId('autonomous-agent-create-title')).toBeVisible()
    await expect(dialog.getByTestId('autonomous-agent-create-role')).toBeVisible()
    await expect(dialog.getByTestId('autonomous-agent-create-example-quality')).toBeVisible()
    // nothing else: no persona, no MCP servers, no client id
    await expect(dialog.getByRole('textbox')).toHaveCount(1)
    await expect(dialog.getByText('Persona')).toHaveCount(0)
    await expect(dialog.getByText('MCP')).toHaveCount(0)
    await expect(dialog.getByText('Client id')).toHaveCount(0)
  })

  test('creation without directory lands on the page with a retry', async ({ page, goToWithAuth }) => {
    // In dev, simple-directory is file-storage: the identity cannot be created, which is the path to pin.
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-create-title').locator('input').fill('Quality agent')
    await page.getByTestId('autonomous-agent-create-example-quality').click()
    await page.getByTestId('autonomous-agent-save').click()
    await expect(page).toHaveURL(/\/agents\/organization\/test1\/agents\/[^/?]+/, { timeout: 20000 })

    const listed = (await admin.get('/api/autonomous-agents/organization/test1')).data.results
    const agent = listed.find((a: any) => a.title === 'Quality agent')
    expect(agent.role).toBe('user')
    expect(agent.approvalLevel).toBe('write')
    expect(agent.persona).toBe(exampleFields('quality', 'en', 'Quality agent').persona)
    expect(agent.nhi?.clientId).toBeFalsy()

    // the page offers to retry, in the configuration's bar
    await expect(page.getByTestId('autonomous-agent-enrol')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('autonomous-agent-enrol')).toHaveText('Create the identity')
  })

  test('creation enrols the identity when the directory accepts it', async ({ page, goToWithAuth }) => {
    let nhiBody: any
    await page.route('**/simple-directory/api/organizations/*/nhis', async route => {
      if (route.request().method() !== 'POST') return route.continue()
      nhiBody = route.request().postDataJSON()
      await route.fulfill({ status: 201, json: { id: 'nhi-stub' } })
    })
    // the real PUT performs a token exchange that would fail against a stub identity
    await page.route('**/api/autonomous-agents/organization/test1/*', async route => {
      if (route.request().method() !== 'PUT') return route.continue()
      const current = await (await route.fetch({ method: 'GET' })).json()
      await route.fulfill({ status: 200, json: { ...current, ...route.request().postDataJSON() } })
    })
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-create-title').locator('input').fill('Enrolled by creation')
    await page.getByTestId('autonomous-agent-save').click()
    await expect(page).toHaveURL(/\/agents\/organization\/test1\/agents\/[^/?]+/, { timeout: 20000 })
    expect(nhiBody.role).toBe('user')
    expect(nhiBody.name).toMatch(/ \(autonomous agent\)$/)
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

    await goToWithAuth(`/agents/organization/test1/agents/${created.data.id}`, 'superadmin', asSuperAdmin)
    const enrol = page.getByTestId('autonomous-agent-enrol')

    // Enrolling waits for unsaved edits to be saved or cancelled: it re-reads the agent, which would
    // silently drop them.
    await expect(enrol).toBeEnabled({ timeout: 20000 })
    await page.getByRole('textbox', { name: 'Persona' }).fill('An edit.')
    await expect(enrol).toBeDisabled()
    await page.getByRole('textbox', { name: 'Persona' }).fill('x')
    await expect(enrol).toBeEnabled()

    // The federation is the thing under test, so pin the request ACTUALLY reaching simple-directory.
    // Asserting only that some error is displayed passed while the call was being rewritten to
    // /agents/api/simple-directory/... by $fetch's baseURL and answered by our own /api 404 — the
    // directory was never contacted, and our 404 body read plausibly like a refusal from it.
    const nhiRequest = page.waitForRequest(req =>
      req.url().includes('/simple-directory/api/organizations/test1/nhis') && req.method() === 'POST',
    { timeout: 20000 })
    // Direct: one click creates the identity, no dialog in between.
    await enrol.click()
    const sent = await nhiRequest
    expect(new URL(sent.url()).pathname).toBe('/simple-directory/api/organizations/test1/nhis')

    // Whatever simple-directory answers, the admin is told — not left with a spinner that stops and
    // a button that does nothing.
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

    await goToWithAuth('/agents/organization/test1/agents/test-fixture', 'superadmin', asSuperAdmin)
    await expect(page.getByText('Identity enrolled')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('autonomous-agent-enrol')).toHaveCount(0)
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
    // Generous: the first navigation after a dev-server restart pays vite's compile cost.
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-create-title').locator('input').fill('Journey agent')
    await page.getByTestId('autonomous-agent-save').click()
    // The url first: the create dialog's own Name field holds the same value until it closes.
    await expect(page).toHaveURL(/\/agents\/organization\/test1\/agents\/[^/?]+/)
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Journey agent', { timeout: 20000 })

    const listed = (await admin.get('/api/autonomous-agents/organization/test1')).data.results
    const journeyAgent = listed.find((agent: any) => agent.title === 'Journey agent')
    expect(journeyAgent).toBeTruthy()
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: journeyAgent.id })

    // The agent survives a reload, so it really persisted: without it this would also pass on a page
    // that only ever re-rendered local state. (The reload also picks up the seam's enrolment.)
    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Journey agent', { timeout: 20000 })

    // Back on the org page the agent is listed, and its link leads back to its page.
    await page.goBack()
    await page.getByTestId('autonomous-agent-list').getByRole('link', { name: /Journey agent/ }).click({ timeout: 20000 })

    // Follow the link a person would, rather than navigating by url: from the agent's page to the
    // shared chat, mono-agent on that agent — the standalone thread page was removed.
    await page.getByRole('link', { name: 'Open chat' }).click({ timeout: 20000 })

    await page.getByTestId('agent-chat-input').waitFor({ state: 'visible', timeout: 20000 })
    // The chat names the agent it was opened on. Without this, a page pointed at an autonomous agent
    // still said "Assistant", because only the back-office picker ever read an agent's title.
    await expect(page.getByTestId('agent-chat-title')).toContainText('Journey agent', { timeout: 20000 })
    await fillAndSend(page, 'hello')

    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
    // History is offered in mono mode too: the thread just used is listed and can be reopened.
    await page.getByTestId('agent-chat-history').click()
    await expect(page.getByTestId('agent-chat-conversation')).toHaveCount(1)
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

test.describe('Autonomous agent chat', () => {
  let agentId: string

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
    // Created through the API rather than the UI: this block is about the chat, and driving the
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

  const openChat = async (goToWithAuth: any, user = 'superadmin', opts: any = { adminMode: true }) =>
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, user, opts)

  test('opening creates no thread, posting shows the answer, and reopening resumes it', async ({ page, goToWithAuth }) => {
    // Opening the chat creates nothing: a thread starts with its first message. It used to be created
    // on open, and each visit by someone who never typed left one more behind.
    const threads = async () => (await admin.get(`/api/conversations/organization/test1?agentId=${agentId}`)).data.results.length
    await openChat(goToWithAuth)
    await page.getByTestId('agent-chat-input').waitFor({ state: 'visible', timeout: 20000 })
    await openChat(goToWithAuth)
    await page.getByTestId('agent-chat-input').waitFor({ state: 'visible', timeout: 20000 })
    expect(await threads()).toBe(0)

    // The user turn and the answer can only both appear if the socket stored them and echoed them back.
    await fillAndSend(page, 'hello')
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('hello')
    // 'world' is the mock model's answer to 'hello'
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
    // The first message is what starts one — exactly one, which also proves the count above reads the
    // threads this chat would have made.
    await expect.poll(threads).toBe(1)

    // A fresh page load on the same agent continues that thread instead of opening an empty one.
    await openChat(goToWithAuth)
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('hello')
  })

  test('a failed turn explains itself instead of leaving an empty bubble', async ({ page, goToWithAuth }) => {
    // 'stream error' is the mock seam for a provider error that does NOT throw — the class of
    // failure that used to end a conversation silently.
    await openChat(goToWithAuth)
    await page.getByTestId('agent-chat-input').waitFor({ state: 'visible', timeout: 20000 })
    await fillAndSend(page, 'stream error')

    // The generic 'This turn failed and could not be completed.' is appended for EVERY stopReason
    // 'error' — a disabled agent, a missing enrolment, an exhausted quota, an empty completion. Only
    // the parenthetical detail runStopReasonMessage appends distinguishes the provider error this
    // test claims to drive: for an internal failure, the generic one (publicErrorDetail).
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('could not be completed', { timeout: 15000 })
    await expect(page.getByTestId('agent-chat-transcript')).toContainText(/\(.*error.*\)/i)
  })

  test('an org member who may not instruct is told exactly that', async ({ page, goToWithAuth }) => {
    // Asserting the TEXT, not merely that some alert appeared: the chat's error is set on any
    // rejection, so a 404, a 500 or a typo in the url would satisfy a bare visibility assertion. This
    // message is the only thing that pins the forbidden branch.
    await openChat(goToWithAuth, 'test1-user1', { org: 'test1' })
    await expect(page.getByTestId('agent-chat-error'))
      .toContainText('not allowed to instruct this autonomous agent', { timeout: 15000 })
  })

  // A listed instructor who is NOT an admin posting in this chat: agent-page.e2e.spec.ts, where they
  // land after being redirected from the agent's page.
})

test.describe('Agent switcher and conversation history', () => {
  let agentId: string

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'History agent', persona: 'You answer briefly.', mcpServers: [], enabled: true
    })
    agentId = created.data.id
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  })

  // The account's own admin, not the superadmin: quota roles are resolved against the ACTIVE account,
  // so a superadmin in admin mode on someone else's org counts as `external` and the personal
  // assistant is (correctly) not offered there.
  const openBackOfficeChat = async (goToWithAuth: any) =>
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}&agents=1`, 'test1-admin1', { org: 'test1' })

  test('a new conversation starts empty, threads are listed and resuming one restores it', async ({ page, goToWithAuth }) => {
    await openBackOfficeChat(goToWithAuth)
    // The picker is the proof the agents list came back with more than the agent named in the url:
    // it renders only when there is a choice, and the personal assistant is the other entry.
    await expect(page.getByTestId('agent-chat-agent-picker')).toBeVisible({ timeout: 20000 })

    await fillAndSend(page, 'hello')
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    // A fresh conversation must not show the first one's messages.
    await page.getByTestId('agent-chat-new-conversation').click()
    await expect(page.getByTestId('agent-chat-transcript')).toHaveCount(0)

    await fillAndSend(page, 'hello')
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    // Both threads are now history, and resuming the older one replays its stored transcript instead
    // of leaving an empty pane.
    await page.getByTestId('agent-chat-history').click()
    await expect(page.getByTestId('agent-chat-conversation')).toHaveCount(2)
    await page.getByTestId('agent-chat-conversation').last().click()
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
  })

  test('switching agent opens its ongoing conversation or an empty one, and the first message goes to THAT agent', async ({ page, goToWithAuth }) => {
    await openBackOfficeChat(goToWithAuth)
    await expect(page.getByTestId('agent-chat-agent-picker')).toBeVisible({ timeout: 20000 })
    await fillAndSend(page, 'hello')
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    const pick = async (name: string) => {
      // The previous menu's content must be gone before reopening: clicking through its closing
      // transition aims at a list item that is about to be detached.
      await expect(page.getByTestId('agent-chat-agent-option')).toHaveCount(0)
      await page.getByTestId('agent-chat-agent-picker').click()
      await page.getByTestId('agent-chat-agent-option').filter({ hasText: name }).click()
    }

    await pick('Back-office assistant')
    // The personal assistant has no thread yet: an empty pane, and the picker names it.
    await expect(page.getByTestId('agent-chat-transcript')).toHaveCount(0)
    await expect(page.getByTestId('agent-chat-agent-picker')).toContainText('Back-office assistant')

    // Back to the autonomous agent: its ongoing conversation is reopened, not a third one started.
    await pick('History agent')
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    // The switch leaves nothing bound until the first send creates the thread. A stale binding sent that
    // message into the previous agent's thread instead.
    await pick('Back-office assistant')
    await expect(page.getByTestId('agent-chat-transcript')).toHaveCount(0)
    await fillAndSend(page, 'hello')
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    const threadsOf = async (id: string) => (await orgAdmin.get(`/api/conversations/organization/test1?agentId=${id}`)).data.results
    expect((await threadsOf('back-office-assistant')).length).toBe(1)
    const [agentThread] = await threadsOf(agentId)
    const agentMessages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${agentThread.id}/messages`)).data.results
    expect(agentMessages.filter((m: any) => m.role === 'user')).toHaveLength(1)
  })
})
