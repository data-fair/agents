/**
 * stateful E2E tests: the chat's inspection dialog on an autonomous agent — its MCP servers' tools before
 * its first turn, and the tools a turn offered, grouped by where they come from.
 */
import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin

const openDialog = (page: Page) => page.getByRole('button', { name: /Settings|Paramètres/ }).click()
const closeDialog = (page: Page) => page.getByRole('button', { name: /Close|Fermer/ }).click()

test.describe('Chat inspection dialog', () => {
  let fixture: McpFixture
  let agentId: string
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
    agentId = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Inspected agent', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data.id
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  })

  test('an admin sees the agent\'s MCP tools before its first turn, then the offered tools by source', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await page.getByTestId('agent-chat-input').waitFor({ state: 'visible', timeout: 20000 })

    await openDialog(page)
    const available = page.getByTestId('available-tools')
    await expect(available).toContainText('MCP · dev-public-mcp', { timeout: 15000 })
    await expect(available).toContainText('list_road_closures')
    // the service's own tools come with a turn, which the dialog says
    await expect(available).not.toContainText('wait_for_user_action')
    await closeDialog(page)

    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill('hello')
    await page.getByTestId('agent-chat-send').click()
    await expect(page.getByTestId('agent-chat-transcript')).toContainText('world', { timeout: 15000 })

    // The call record is written fire-and-forget after the answer: reopen until it shows.
    await expect(async () => {
      await openDialog(page)
      try {
        const groups = page.getByTestId('available-tools').getByTestId('tool-group')
        await expect(groups.filter({ hasText: 'MCP · dev-public-mcp' })).toContainText('list_road_closures', { timeout: 1500 })
        // the turn's record replaces the servers' listing, and carries the service's tools
        await expect(groups.filter({ hasText: 'Built into the service' })).toContainText('wait_for_user_action', { timeout: 1500 })
      } finally {
        await closeDialog(page)
      }
    }).toPass({ timeout: 15000 })
  })
})
