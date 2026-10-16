/**
 * The back office's chat panel is where people talk to their agents: a page opens it on an agent
 * (OpenChatButton, useAgentChatLauncher) instead of linking to a chat page of its own.
 *
 * Driven through ui/src/pages/_dev/back-office.vue, a stand-in for the data-fair back office: the panel
 * beside one of this service's pages, framed same-origin as the back office frames it.
 */

import { expect, type Frame, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const backOffice = (page: string) => `/agents/_dev/back-office?page=${encodeURIComponent(page)}`
const framedPage = (page: Page) => page.frameLocator('[data-testid="back-office-page"]')

/** The panel's chat, once its composer shows. */
const panelChat = async (page: Page): Promise<Frame> => {
  let frame: Frame | undefined
  await expect(() => {
    frame = page.frames().find(f => new URL(f.url()).pathname.endsWith('/organization/test1/chat'))
    expect(frame).toBeTruthy()
  }).toPass({ timeout: 10000 })
  await expect(frame!.getByTestId('agent-chat-input')).toBeVisible({ timeout: 15000 })
  return frame!
}

const send = async (chat: Frame, text: string) => {
  await chat.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(text)
  await chat.getByTestId('agent-chat-send').click()
}

test.describe('Opening the chat panel on an agent', () => {
  let agentId: string

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Panel agent',
      persona: 'You answer briefly.',
      mcpServers: [],
      enabled: true,
      instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }]
    })
    agentId = created.data.id
    // An unenrolled agent refuses every turn; dev cannot complete a real enrolment.
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  })

  test('the agent page opens the panel on its agent, in a new conversation that goes to that agent', async ({ page, goToWithAuth }) => {
    await goToWithAuth(backOffice(`/organization/test1/agents/${agentId}`), 'test1-admin1', { org: 'test1' })
    // The panel starts on the back-office assistant, with a conversation of its own going.
    await page.locator('.df-agent-chat-toggle').click()
    const chat = await panelChat(page)
    await send(chat, 'hello')
    await expect(chat.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    await framedPage(page).getByTestId('open-chat').click({ timeout: 20000 })
    await expect(page.locator('.v-navigation-drawer:has(d-frame)')).toBeVisible()
    await expect(chat.getByTestId('agent-chat-agent-picker')).toContainText('Panel agent', { timeout: 15000 })
    await expect(chat.getByTestId('agent-chat-transcript')).toHaveCount(0)

    await send(chat, 'hello')
    await expect(chat.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
    const threads = (await orgAdmin.get(`/api/conversations/organization/test1?agentId=${agentId}`)).data.results
    expect(threads).toHaveLength(1)
  })

  test('someone who is not an admin is pointed to the panel, and can talk to the agent from there', async ({ page, goToWithAuth }) => {
    await goToWithAuth(backOffice(`/organization/test1/agents/${agentId}`), 'test1-user1', { org: 'test1' })
    const notice = framedPage(page).getByTestId('chat-panel-notice')
    await expect(notice).toBeVisible({ timeout: 20000 })
    await expect(framedPage(page).getByRole('textbox', { name: 'Name' })).toHaveCount(0)

    await notice.getByTestId('open-chat').click()
    const chat = await panelChat(page)
    // The only agent offered to this member: named in the header, with no picker to choose another.
    await expect(chat.getByTestId('agent-chat-title')).toContainText('Panel agent', { timeout: 15000 })
    await send(chat, 'hello')
    await expect(chat.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
    await expect(chat.getByTestId('agent-chat-error')).toBeHidden()
  })

  test('without a chat panel, the page offers no button that would go nowhere', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/agents/${agentId}`, 'test1-admin1', { org: 'test1' })
    await expect(page.getByRole('heading', { name: 'Panel agent' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('open-chat')).toHaveCount(0)
  })

  test('the organization page points a non-admin member to the panel', async ({ page, goToWithAuth }) => {
    await goToWithAuth(backOffice('/organization/test1'), 'test1-user1', { org: 'test1' })
    const notice = framedPage(page).getByTestId('chat-panel-notice')
    await expect(notice).toBeVisible({ timeout: 20000 })
    await notice.getByTestId('open-chat').click()
    await expect(page.locator('.v-navigation-drawer:has(d-frame)')).toBeVisible()
    await panelChat(page)
  })

  test('a request sent before the chat loaded starts it on that agent, not on the conversation it would resume', async ({ page, goToWithAuth }) => {
    // An ongoing conversation with the back-office assistant, which opening the chat would resume.
    await goToWithAuth('/agents/organization/test1/chat?agents=1', 'test1-admin1', { org: 'test1' })
    await send(await panelChat(page), 'hello')
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    // What useAgentChatLauncher stores for a chat that has not loaded yet.
    await page.addInitScript((id) => {
      sessionStorage.setItem('df-agent-pending-action', JSON.stringify({ type: 'agent-start-session', agentId: id }))
    }, agentId)
    await page.reload()
    await expect(page.getByTestId('agent-chat-agent-picker')).toContainText('Panel agent', { timeout: 15000 })
    await expect(page.getByTestId('agent-chat-transcript')).toHaveCount(0)
    await send(await panelChat(page), 'hello')
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
    expect((await orgAdmin.get(`/api/conversations/organization/test1?agentId=${agentId}`)).data.results).toHaveLength(1)
  })
})
