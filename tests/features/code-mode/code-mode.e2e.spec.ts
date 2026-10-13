/**
 * stateful E2E test: the calls a code_mode script makes are listed in a panel under its call, and after a reload.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { FIXTURE_PORT, createFilesAgent } from '../../support/files.ts'

const admin = await superAdmin

test.describe('Panel of a code_mode call', () => {
  let fixture: McpFixture
  let agentId: string
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
    agentId = (await createFilesAgent()).id
  })

  test('a script\'s calls are listed in a panel under its code_mode call, and after a reload', async ({ page, goToWithAuth }) => {
    // The panel is the full rendering of nested work; the product default is a chip.
    await page.addInitScript(() => {
      document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify({ mermaid: false, simpleSubAgents: false }))}; path=/`
    })
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    const js = 'const s = await tools.closure_stats({ district: "city-center" }); return s.count'
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(`call tool code_mode ${JSON.stringify({ js })}`)
    await page.getByTestId('agent-chat-send').click()

    const panel = page.getByTestId('subagent-panel').filter({ hasText: 'Script' })
    await expect(panel).toBeVisible({ timeout: 15000 })
    await expect.poll(() => fixture.invokedTools()).toEqual(['closure_stats'])
    await panel.getByTestId('subagent-panel-header').click()
    await expect(panel.getByTestId('subagent-panel-body')).toContainText('closure_stats', { timeout: 15000 })

    await page.reload()
    await expect(page.getByTestId('subagent-panel').filter({ hasText: 'Script' })).toBeVisible({ timeout: 15000 })
  })
})
