/**
 * stateful E2E tests: the approval card in the chat, on a configured autonomous agent with the mock model
 * and the MCP fixture.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin

test.describe('Approval card', () => {
  let fixture: McpFixture
  let agentId: string
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
    agentId = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Gate probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data.id
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  })

  const ask = async (page: any, text: string) => {
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(text)
    await page.getByTestId('agent-chat-send').click()
  }

  test('approving from the card runs the call; the card survives a reload until decided', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tool wipe_everything {}')
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toContainText('Awaiting your approval')

    await page.reload()
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toContainText('Awaiting your approval')

    await page.getByTestId('approval-approve').click()
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect.poll(() => fixture.invokedTools()).toEqual(['wipe_everything'])
  })

  test('rejecting with a reason leaves a declined chip, and nothing runs', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tool wipe_everything {}')
    await page.getByTestId('approval-reject').click({ timeout: 15000 })
    await page.getByTestId('approval-reason').locator('input').fill('not today')
    await page.getByTestId('approval-confirm-reject').click()
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect(page.getByTestId('tool-chip').first()).toBeVisible()
    expect(fixture.invokedTools()).toEqual([])
  })
})
