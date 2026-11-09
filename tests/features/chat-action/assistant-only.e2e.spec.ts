/**
 * An action button asks the page's ASSISTANT, never an autonomous agent.
 *
 * A button's hidden context names the page's WebMCP tools, and only an assistant is offered those
 * (usesPageTools): an autonomous agent works through MCP with its own identity. Every chat of the tab
 * hears a button, so two shapes used to hand its request to an autonomous agent — an embed pinned to
 * one, which opened and sent it, and the back-office chat, which reopens the person's last conversation
 * whatever agent it was with and sent the button's prompt into it.
 */

import { expect, type Frame, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const chatDrawerSelector = '.v-navigation-drawer:has(d-frame)'
const composer = (target: Page | Frame) => target.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])')

test.describe('Action buttons reach the assistant only', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a drawer pinned to a configured agent neither shows the buttons nor opens on one', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-action?agentId=some-autonomous-agent', 'test1-admin1', { org: 'test1' })
    await expect(page.locator('.df-agent-chat-toggle')).toBeVisible()

    // No chat of the tab takes actions, so none answers the buttons' ping and they stay hidden.
    const action = page.locator('.df-agent-chat-action').first()
    await expect(action).toBeHidden()

    // Even clicked anyway, nothing opens and nothing is sent.
    await action.dispatchEvent('click')
    // The click did go out (the button stores it for a chat not loaded yet)...
    expect(await page.evaluate(() => sessionStorage.getItem('df-agent-pending-action'))).toContain('Help me create a new dataset')
    // ...and the drawer stayed closed (a closed drawer is off-screen and inert, not hidden).
    await expect(page.locator(`${chatDrawerSelector}.v-navigation-drawer--active`)).not.toBeAttached({ timeout: 2000 })
    expect((await orgAdmin.get('/api/conversations/organization/test1')).data.results).toHaveLength(0)
  })

  test('the back-office chat leaves a resumed autonomous agent\'s conversation for the assistant', async ({ page, goToWithAuth }) => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Resumed agent', persona: 'You answer briefly.', mcpServers: [], enabled: true
    })
    const agentId = created.data.id
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })

    // The person's last conversation is with the autonomous agent: the back-office chat reopens it.
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}&agents=1`, 'test1-admin1', { org: 'test1' })
    await composer(page).fill('hello')
    await page.getByTestId('agent-chat-send').click()
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    await goToWithAuth('/agents/_dev/chat-action?agents=1', 'test1-admin1', { org: 'test1' })
    const action = page.locator('.df-agent-chat-action').first()
    await expect(action).toBeVisible({ timeout: 10000 })
    await action.click()

    let frame: Frame | undefined
    await expect(() => {
      frame = page.frames().find(f => new URL(f.url()).pathname.endsWith('/organization/test1/chat'))
      expect(frame).toBeTruthy()
    }).toPass({ timeout: 10000 })
    await expect(frame!.getByTestId('agent-chat-agent-picker')).toContainText('Back-office assistant', { timeout: 20000 })
    await expect(frame!.getByTestId('agent-chat-transcript')).toContainText('Help me create a new dataset', { timeout: 15000 })

    // The server's record: the autonomous agent got nothing more, the assistant got the button's turn.
    const threadsOf = async (id: string) => (await orgAdmin.get(`/api/conversations/organization/test1?agentId=${id}`)).data.results
    const userTurns = async (conversationId: string) => (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
      .filter((m: any) => m.role === 'user')
    const [agentThread] = await threadsOf(agentId)
    expect(await userTurns(agentThread.id)).toHaveLength(1)
    await expect.poll(async () => (await threadsOf('back-office-assistant')).length, { timeout: 10000 }).toBe(1)
  })
})
