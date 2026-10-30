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

  test('a script is a chip in the chat, and its calls a panel under it on the review page', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    const js = 'const s = await tools.closure_stats({ district: "city-center" }); return s.count'
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(`call tool code_mode ${JSON.stringify({ js })}`)
    await page.getByTestId('agent-chat-send').click()

    // The chat names the script as a chip, as any call; the calls it made are the review page's to open.
    await expect(page.getByTestId('tool-chip').filter({ hasText: 'code_mode' })).toBeVisible({ timeout: 15000 })
    await expect.poll(() => fixture.invokedTools()).toEqual(['closure_stats'])
    await expect(page.getByTestId('trace-panel')).toHaveCount(0)

    // The chat names the calls; the review page opens them. The script reads as its source and its value,
    // and the call it made as the arguments it was given and the result it returned — what knowing only
    // that closure_stats was called could not tell a reviewer.
    let conversationId: string | undefined
    await expect.poll(async () => {
      const res = await admin.get('/api/review/organization/test1?page=1&size=20').catch(() => null)
      conversationId = res?.data.results?.[0]?.conversationId
      return conversationId
    }, { timeout: 12000 }).toBeTruthy()
    await goToWithAuth(`/agents/organization/test1/review/${conversationId}`, 'test1-admin1', { org: 'test1' })
    const reviewed = page.getByTestId('trace-panel').filter({ hasText: 'Script' })
    await reviewed.getByTestId('trace-panel-header').click({ timeout: 15000 })
    const body = reviewed.getByTestId('trace-panel-body')
    await expect(body.getByTestId('tool-call-input').first()).toHaveText(js)
    await expect(body.getByTestId('tool-call-output').last()).toBeVisible()
    const chip = body.getByTestId('nested-tool-chip').filter({ hasText: 'closure_stats' })
    await chip.click()
    // under its own chip, not after the row of chips, where several open calls could not be told apart
    const nested = chip.locator('xpath=..').getByTestId('tool-call-detail')
    await expect(nested.getByTestId('tool-call-input')).toContainText('city-center')
    await expect(nested.getByTestId('tool-call-output')).toContainText('"district"')
  })
})
