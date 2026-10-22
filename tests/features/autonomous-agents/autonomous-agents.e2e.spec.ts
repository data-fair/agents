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

  test('creation asks only for a name, a role, its scopes and an example', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    const dialog = page.locator('.v-overlay--active')
    await expect(dialog.getByTestId('autonomous-agent-create-title')).toBeVisible()
    await expect(dialog.getByTestId('autonomous-agent-create-role')).toBeVisible()
    await expect(dialog.getByTestId('autonomous-agent-scopes')).toBeVisible()
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
    // and says why, persistently (the dialog's notification is gone by now)
    await expect(page.getByTestId('autonomous-agent-enrol-error')).toBeVisible()
    await expect(page.getByTestId('autonomous-agent-enrol-error')).not.toBeEmpty()
  })

  test('a refused attach deletes the identity it just created', async ({ page, goToWithAuth }) => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Attach refused', persona: 'x', mcpServers: [], enabled: true
    })
    const directoryDeletes: string[] = []
    await page.route('**/simple-directory/api/organizations/*/nhis**', async route => {
      const req = route.request()
      if (req.method() === 'POST') return route.fulfill({ status: 201, json: { id: 'nhi-stub' } })
      if (req.method() === 'DELETE') {
        directoryDeletes.push(new URL(req.url()).pathname)
        return route.fulfill({ status: 204 })
      }
      return route.continue()
    })
    await page.route('**/api/autonomous-agents/organization/test1/*', async route => {
      if (route.request().method() !== 'PUT') return route.continue()
      await route.fulfill({ status: 400, json: { message: 'exchange refused' } })
    })
    await goToWithAuth(`/agents/organization/test1/agents/${created.data.id}`, 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agent-enrol').click({ timeout: 20000 })
    await expect(page.getByTestId('autonomous-agent-enrol-error')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('autonomous-agent-enrol-error')).toContainText('exchange refused')
    await expect.poll(() => directoryDeletes).toEqual(['/simple-directory/api/organizations/test1/nhis/nhi-stub'])
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
    expect('scopes' in nhiBody).toBe(false)
  })

  test('the creation dialog sends the chosen scopes with the new identity', async ({ page, goToWithAuth }) => {
    await stubScopes(page)
    let nhiBody: any
    await page.route('**/simple-directory/api/organizations/*/nhis', async route => {
      if (route.request().method() !== 'POST') return route.continue()
      nhiBody = route.request().postDataJSON()
      await route.fulfill({ status: 201, json: { id: 'nhi-stub' } })
    })
    await page.route('**/api/autonomous-agents/organization/test1/*', async route => {
      if (route.request().method() !== 'PUT') return route.continue()
      const current = await (await route.fetch({ method: 'GET' })).json()
      await route.fulfill({ status: 200, json: { ...current, ...route.request().postDataJSON() } })
    })
    await goToWithAuth('/agents/organization/test1', 'superadmin', asSuperAdmin)
    await page.getByTestId('autonomous-agents-add').click({ timeout: 20000 })
    await page.getByTestId('autonomous-agent-create-title').locator('input').fill('Scoped by creation')
    await pickScope(page, 'datasets:read')
    await page.getByTestId('autonomous-agent-save').click()
    await expect(page).toHaveURL(/\/agents\/organization\/test1\/agents\/[^/?]+/, { timeout: 20000 })
    expect(nhiBody.scopes).toEqual(['datasets:read'])
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

    // The chat on that agent, as the panel loads it once the agent is picked.
    await page.goto(`/agents/organization/test1/chat?agentId=${journeyAgent.id}`)

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

  // A listed instructor who is NOT an admin posting in this chat: agent-page.e2e.spec.ts.
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

  test('switching agent starts a new conversation with it, earlier ones are in the history, and the first message goes to THAT agent', async ({ page, goToWithAuth }) => {
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
    await expect(page.getByTestId('agent-chat-transcript')).toHaveCount(0)
    await expect(page.getByTestId('agent-chat-agent-picker')).toContainText('Back-office assistant')

    // Back to the autonomous agent: a new conversation, as picking a project or a GPT does elsewhere.
    await pick('History agent')
    await expect(page.getByTestId('agent-chat-agent-picker')).toContainText('History agent')
    await expect(page.getByTestId('agent-chat-transcript')).toHaveCount(0)
    // Its earlier conversation is one click away, in the history.
    await page.getByTestId('agent-chat-history').click()
    await page.getByTestId('agent-chat-conversation').filter({ hasText: 'History agent' }).click()
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

// simple-directory's scope list, stubbed: this dev stack's simple-directory knows no platform scopes
const SCOPES = { scopes: { 'datasets:read': 'Read datasets', 'applications:read': 'Read applications', 'datasets:write': 'Write datasets' } }
const stubScopes = async (page: Page) => {
  await page.route('**/simple-directory/api/scopes', route => route.fulfill({ json: SCOPES }))
}
const pickScope = async (page: Page, scope: string) => {
  await page.getByTestId('autonomous-agent-scopes').click()
  await page.locator('.v-overlay--active .v-list-item').filter({ hasText: scope }).click()
  await page.keyboard.press('Escape')
}

test.describe('Scopes of an autonomous agent\'s identity', () => {
  const asSuperAdmin = { adminMode: true } as const
  const siteUrl = `http://localhost:${process.env.NGINX_PORT}`
  const AGENT_PAGE = '/agents/organization/test1/agents/test-fixture?config=security'
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-autonomous-agent-nhi',
      siteUrl,
      issuer: `${siteUrl}/agents/api/nhi`,
      autonomousAgent: { title: 'Scoped agent', persona: 'x', mcpServers: [], enabled: true }
    })
  })

  // The NHI list as simple-directory answers it, and every write the page sends, in order.
  const stubDirectory = async (page: Page, stored: string[] | undefined, patchAnswer?: { status: number, json: any }) => {
    await stubScopes(page)
    const sent: Array<{ method: string, path: string, body: any }> = []
    await page.route('**/simple-directory/api/organizations/test1/nhis**', async route => {
      const req = route.request()
      if (req.method() === 'GET') return route.fulfill({ json: { count: 1, results: [{ id: 'test-autonomous-agent-nhi', ...(stored ? { scopes: stored } : {}) }] } })
      sent.push({ method: req.method(), path: new URL(req.url()).pathname, body: req.postDataJSON() })
      return route.fulfill(patchAnswer ?? { status: 200, json: {} })
    })
    await page.route('**/agents/api/autonomous-agents/organization/test1/test-fixture', async route => {
      if (route.request().method() === 'PUT') sent.push({ method: 'PUT', path: new URL(route.request().url()).pathname, body: null })
      return route.continue()
    })
    return sent
  }

  test('the identity tab shows the scopes and their absence', async ({ page, goToWithAuth }) => {
    await stubDirectory(page, ['datasets:read'])
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-scopes')).toContainText('datasets:read', { timeout: 20000 })
    await expect(page.getByTestId('autonomous-agent-scopes-unrestricted')).toHaveCount(0)
    // the one control of what it may do on data-fair, whose server it has without picking it
    await expect(page.getByTestId('autonomous-agent-scopes-platform')).toHaveText('These scopes decide what the agent can do on Data Fair.')
  })

  test('the sites of the organization it cannot act on as itself are listed', async ({ page, goToWithAuth }) => {
    await stubDirectory(page, ['datasets:read'])
    const sessionReads: string[] = []
    await page.route('**/agents/api/autonomous-agents/organization/test1/test-fixture/session', async route => {
      sessionReads.push(route.request().url())
      return route.fulfill({ json: { userId: 'test-autonomous-agent-nhi', accountSites: [siteUrl], unreachableSites: ['http://sso.example.org'] } })
    })
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-unreachable-sites')).toContainText('sso.example.org', { timeout: 20000 })
    expect(sessionReads.length).toBe(1)
  })

  test('no unreachable site, no warning', async ({ page, goToWithAuth }) => {
    await stubDirectory(page, ['datasets:read'])
    await page.route('**/agents/api/autonomous-agents/organization/test1/test-fixture/session', route =>
      route.fulfill({ json: { userId: 'test-autonomous-agent-nhi', accountSites: [siteUrl], unreachableSites: [] } }))
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-scopes')).toContainText('datasets:read', { timeout: 20000 })
    await expect(page.getByTestId('autonomous-agent-unreachable-sites')).toHaveCount(0)
  })

  test('no stored scopes reads as no restriction', async ({ page, goToWithAuth }) => {
    await stubDirectory(page, undefined)
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-scopes-unrestricted')).toBeVisible({ timeout: 20000 })
  })

  test('changing only the scopes saves the agent after the identity', async ({ page, goToWithAuth }) => {
    const sent = await stubDirectory(page, ['datasets:read'])
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-scopes')).toContainText('datasets:read', { timeout: 20000 })
    await pickScope(page, 'applications:read')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.poll(() => sent.map(r => r.method)).toEqual(['PATCH', 'PUT'])
    expect(sent[0].path).toBe('/simple-directory/api/organizations/test1/nhis/test-autonomous-agent-nhi')
    expect([...sent[0].body.scopes].sort()).toEqual(['applications:read', 'datasets:read'])
  })

  test('a failed agent save keeps the scopes change pending, so saving again resends both', async ({ page, goToWithAuth }) => {
    const sent = await stubDirectory(page, ['datasets:read'])
    let puts = 0
    // registered last, so it answers before stubDirectory's handler: the first PUT fails
    await page.route('**/agents/api/autonomous-agents/organization/test1/test-fixture', async route => {
      if (route.request().method() === 'PUT' && puts++ === 0) {
        sent.push({ method: 'PUT', path: new URL(route.request().url()).pathname, body: null })
        return route.fulfill({ status: 500, json: 'boom' })
      }
      return route.fallback()
    })
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-scopes')).toContainText('datasets:read', { timeout: 20000 })
    await pickScope(page, 'applications:read')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.poll(() => sent.map(r => r.method)).toEqual(['PATCH', 'PUT'])
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.poll(() => sent.map(r => r.method)).toEqual(['PATCH', 'PUT', 'PATCH', 'PUT'])
  })

  test('clearing the scopes sends null', async ({ page, goToWithAuth }) => {
    const sent = await stubDirectory(page, ['datasets:read'])
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-scopes')).toContainText('datasets:read', { timeout: 20000 })
    await pickScope(page, 'datasets:read')
    await expect(page.getByTestId('autonomous-agent-scopes-unrestricted')).toBeVisible()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.poll(() => sent.map(r => r.method)).toEqual(['PATCH', 'PUT'])
    expect(sent[0].body).toEqual({ scopes: null })
  })

  test('a refused scope write stops the save', async ({ page, goToWithAuth }) => {
    const sent = await stubDirectory(page, ['datasets:read'], { status: 400, json: 'unknown scope "datasets:write"' })
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-scopes')).toContainText('datasets:read', { timeout: 20000 })
    await pickScope(page, 'datasets:write')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByTestId('autonomous-agent-scopes-error')).toContainText('unknown scope', { timeout: 20000 })
    expect(sent.map(r => r.method)).toEqual(['PATCH'])
  })

  test('an identity declared outside the directory API shows its scopes read-only', async ({ page, goToWithAuth }) => {
    await stubScopes(page)
    await page.route('**/simple-directory/api/organizations/test1/nhis**', route => route.fulfill({ json: { count: 0, results: [] } }))
    await goToWithAuth(AGENT_PAGE, 'superadmin', asSuperAdmin)
    await expect(page.getByTestId('autonomous-agent-scopes-elsewhere')).toBeVisible({ timeout: 20000 })
  })
})
