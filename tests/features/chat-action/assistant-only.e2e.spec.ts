/**
 * An action button asks the page's ASSISTANT, never an autonomous agent.
 *
 * A button's hidden context names the page's WebMCP tools, and only an assistant is offered those
 * (usesPageTools): an autonomous agent works through MCP with its own identity. Every chat of the tab
 * hears a button, so two shapes used to hand its request to an autonomous agent — an embed pinned to
 * one, which opened and sent it, and the back-office chat, which reopens the person's last conversation
 * whatever agent it was with and sent the button's prompt into it. Both are decided by the chat itself
 * (the service), not by the host embed of the published libraries.
 *
 * When the chat already SHOWS a conversation with another agent, the move to the assistant is asked
 * first: done silently, it replaced what the person was reading for a click elsewhere on the page.
 */

import { expect, type Frame, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { findChatFrame } from '../../support/chat-frame.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test_agents_org1_admin', { org: 'test_agents_org1' })

const composer = (target: Page | Frame) => target.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])')

test.describe('Action buttons reach the assistant only', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test_agents_org1')
  })

  const createAgent = async (title: string) => {
    const created = await admin.post('/api/autonomous-agents/organization/test_agents_org1', {
      title, persona: 'You answer briefly.', mcpServers: [], enabled: true
    })
    // Enrolled, or it refuses every turn: a refused button prompt would pass the tests below for the wrong reason.
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: created.data.id })
    return created.data.id as string
  }
  const backOfficeFrame = async (page: Page) => {
    let frame: Frame | undefined
    await expect(() => {
      frame = page.frames().find(f => new URL(f.url()).pathname.endsWith('/organization/test_agents_org1/chat'))
      expect(frame).toBeTruthy()
    }).toPass({ timeout: 10000 })
    return frame!
  }
  const threadsOf = async (id: string) => (await orgAdmin.get(`/api/conversations/organization/test_agents_org1?agentId=${id}`)).data.results
  const userTurns = async (conversationId: string) => (await orgAdmin.get(`/api/test-env/conversations/organization/test_agents_org1/${conversationId}/messages`)).data.results
    .filter((m: any) => m.role === 'user')

  test('a chat pinned to a configured agent sends nothing of a button', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent('Pinned agent')
    await goToWithAuth(`/agents/_dev/chat-action?agentId=${agentId}`, 'test_agents_org1_admin', { org: 'test_agents_org1' })
    const action = page.locator('.df-agent-chat-action').first()
    await expect(action).toBeVisible({ timeout: 10000 })
    await action.click()

    // The drawer opens (the host embed does not know which agent its chat is with)...
    const frame = await findChatFrame(page)
    // ...and the agent's conversation starts with what the person types, not with the button's prompt,
    // which would have been sent as the chat loaded.
    await composer(frame).fill('hello')
    await frame.getByTestId('agent-chat-send').click()
    await expect(frame.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })
    await expect(frame.getByTestId('agent-chat-transcript')).not.toContainText('Help me create a new dataset')
    const [thread] = await threadsOf(agentId)
    expect(await userTurns(thread.id)).toHaveLength(1)
  })

  test('the back-office chat leaves a resumed autonomous agent\'s conversation for the assistant', async ({ page, goToWithAuth }) => {
    const agentId = await createAgent('Resumed agent')

    // The person's last conversation is with the autonomous agent: the back-office chat reopens it.
    await goToWithAuth(`/agents/organization/test_agents_org1/chat?agentId=${agentId}&agents=1`, 'test_agents_org1_admin', { org: 'test_agents_org1' })
    await composer(page).fill('hello')
    await page.getByTestId('agent-chat-send').click()
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    await goToWithAuth('/agents/_dev/chat-action?agents=1', 'test_agents_org1_admin', { org: 'test_agents_org1' })
    const action = page.locator('.df-agent-chat-action').first()
    await expect(action).toBeVisible({ timeout: 10000 })
    await action.click()

    const frame = await backOfficeFrame(page)
    await expect(frame.getByTestId('agent-chat-agent-picker')).toContainText('Back-office assistant', { timeout: 20000 })
    await expect(frame.getByTestId('agent-chat-transcript')).toContainText('Help me create a new dataset', { timeout: 15000 })

    // The server's record: the autonomous agent got nothing more, the assistant got the button's turn.
    const [agentThread] = await threadsOf(agentId)
    expect(await userTurns(agentThread.id)).toHaveLength(1)
    await expect.poll(async () => (await threadsOf('back-office-assistant')).length, { timeout: 10000 }).toBe(1)
  })

  test('a chat showing a conversation the person chose with an autonomous agent asks before leaving it', async ({ page, goToWithAuth }) => {
    test.setTimeout(60000)
    const agentId = await createAgent('Open agent')
    await goToWithAuth('/agents/_dev/chat-action?agents=1', 'test_agents_org1_admin', { org: 'test_agents_org1' })
    await page.locator('.df-agent-chat-toggle').click()
    const frame = await backOfficeFrame(page)
    await frame.getByTestId('agent-chat-agent-picker').click()
    await frame.getByTestId('agent-chat-agent-option').filter({ hasText: 'Open agent' }).click()
    await composer(frame).fill('hello')
    await frame.getByTestId('agent-chat-send').click()
    await expect(frame.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    // Dismissed: the agent's conversation stays on screen, and nothing was sent anywhere.
    await page.locator('.df-agent-chat-action').first().click()
    const held = frame.getByTestId('agent-chat-held-action')
    await expect(held).toContainText('Help me create a new dataset')
    await expect(held).toContainText('Open agent')
    await held.getByTestId('agent-chat-held-action-dismiss').click()
    await expect(held).toHaveCount(0)
    await expect(frame.getByTestId('agent-chat-agent-picker')).toContainText('Open agent')
    await expect(frame.getByTestId('agent-chat-transcript')).not.toContainText('Help me create a new dataset')

    // Confirmed: a new conversation with the assistant, the agent's left as it was.
    await page.locator('.df-agent-chat-action').first().click()
    await held.getByTestId('agent-chat-held-action-confirm').click()
    await expect(frame.getByTestId('agent-chat-agent-picker')).toContainText('Back-office assistant', { timeout: 20000 })
    await expect(frame.getByTestId('agent-chat-transcript')).toContainText('Help me create a new dataset', { timeout: 15000 })
    const [agentThread] = await threadsOf(agentId)
    expect(await userTurns(agentThread.id)).toHaveLength(1)
    await expect.poll(async () => (await threadsOf('back-office-assistant')).length, { timeout: 10000 }).toBe(1)
  })
})
