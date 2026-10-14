/**
 * stateful E2E: an audited chat says so, and never asks for review consent.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

test.describe('Audited chat notice', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1', { reviewPersonalAssistant: true })
  })

  test('a configured agent chat shows the notice and no consent sheet', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Audited', persona: 'x', mcpServers: [], enabled: true })).data
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-admin1', { org: 'test1' })
    await expect(page.getByTestId('agent-chat-audited-notice')).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('This assistant can store your conversation on the server')).toHaveCount(0)
  })

  test('an instructor reads, from the notice, what the agent remembers, and cannot change it', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Audited',
      persona: 'x',
      mcpServers: [],
      enabled: true,
      memory: { enabled: true },
      instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }]
    })).data
    await admin.put(`/api/memory/organization/test1/${agent.id}/document`, { description: 'Core facts', content: '- the sales dataset is "ventes"' }, { params: { path: 'MEMORY.md' } })
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-user1', { org: 'test1' })
    await expect(page.getByTestId('agent-chat-audited-notice')).toContainText('other people it talks with', { timeout: 20000 })
    await page.getByTestId('agent-chat-memory').click()
    await page.getByTestId('memory-document-MEMORY.md').click()
    const content = page.getByTestId('memory-content').locator('textarea:not([aria-hidden="true"])')
    await expect(content).toHaveValue('- the sales dataset is "ventes"')
    await expect(content).not.toBeEditable()
    await expect(page.getByTestId('memory-save')).toHaveCount(0)
  })

  test('the debug dialog of an audited chat offers the review link and no consent toggle, whatever reviewPersonalAssistant says', async ({ page, goToWithAuth }) => {
    await putMockSettings(admin, 'organization/test1', { reviewPersonalAssistant: false })
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Audited', persona: 'x', mcpServers: [], enabled: true })).data
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-admin1', { org: 'test1' })
    await expect(page.getByTestId('agent-chat-input')).toBeVisible({ timeout: 20000 })
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })
    await input.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    // the turn itself fails (the agent is not enrolled); only that the conversation exists matters here
    await expect(page.locator('.assistant-content').last()).toBeVisible({ timeout: 20000 })
    await page.getByRole('button', { name: /^Settings$|^Paramètres$/ }).click()
    await expect(page.getByRole('button', { name: 'Open review' })).toBeVisible()
    await page.getByRole('tab', { name: 'Settings' }).click()
    await expect(page.getByText('Store my conversations for review')).toHaveCount(0)
  })

  test('the personal assistant shows no audited notice', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/chat', 'test1-admin1', { org: 'test1' })
    await expect(page.getByTestId('agent-chat-input')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('agent-chat-audited-notice')).toHaveCount(0)
  })
})
