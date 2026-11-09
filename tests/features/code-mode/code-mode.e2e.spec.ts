/**
 * stateful E2E test: the calls a code_mode script makes are listed in a panel under its call, and after a reload; a
 * call that needs the person pauses the script on a card under its chip, and approving resumes it.
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

  test('a script is a chip in the chat with its calls beside it, and a panel on the review page', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    const js = 'const s = await tools.closure_stats({ district: "city-center" }); return s.count'
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(`call tool code_mode ${JSON.stringify({ js })}`)
    await page.getByTestId('agent-chat-send').click()

    // The chat names the script by what it did, and the calls it made beside it — not its code,
    // nor what the calls returned: those are the review page's to open.
    const script = page.getByTestId('tool-chip').filter({ hasText: 'Run a script' })
    await expect(script).toBeVisible({ timeout: 15000 })
    await expect.poll(() => fixture.invokedTools()).toEqual(['closure_stats'])
    await expect(page.getByTestId('script-calls').getByTestId('script-call')).toHaveText(['closure_stats'])
    await expect(page.getByTestId('trace-panel')).toHaveCount(0)
    await expect(page.getByTestId('tool-call-detail')).toHaveCount(0)

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

  test('a script calling a tool several times names it once, with its count', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    const js = 'for (const district of ["a", "b", "c"]) await tools.closure_stats({ district }); return await tools.echo({ value: "x" })'
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(`call tool code_mode ${JSON.stringify({ js })}`)
    await page.getByTestId('agent-chat-send').click()

    const script = page.getByTestId('tool-chip').filter({ hasText: 'Run a script' })
    await expect(script).toHaveAttribute('data-state', 'done', { timeout: 15000 })
    await expect(page.getByTestId('script-call')).toHaveText(['closure_stats ×3', 'echo'])
    await expect(page.getByTestId('nested-tool-chip')).toHaveCount(0)
  })

  test('a call needing the person pauses the script: its card under the script\'s chip, Approve, the chip settles', async ({ page, goToWithAuth }) => {
    agentId = (await createFilesAgent({ approvalRoutes: { write: 'reviewer+person' } })).id
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    const js = 'const s = await tools.closure_stats({ district: "city-center" }); const u = await tools.slow_update({}); return { count: s.count, u }'
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(`call tool code_mode ${JSON.stringify({ js })}`)
    await page.getByTestId('agent-chat-send').click()

    const script = page.getByTestId('tool-chip').filter({ hasText: 'Run a script' })
    await expect(script).toBeVisible({ timeout: 15000 })
    // Under the script's chip: the call it made first, then the card of the one it paused on.
    const row = script.locator('xpath=..')
    await expect(row.getByTestId('script-call')).toHaveText(['closure_stats'])
    const card = row.getByTestId('approval-card')
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.getByTestId('approval-in-script')).toBeVisible()
    await expect(card.getByTestId('approval-title')).toContainText('slow_update')
    expect(fixture.invokedTools()).toEqual(['closure_stats'])

    await expect(card.getByTestId('approval-approve')).toBeEnabled({ timeout: 15000 })
    await card.getByTestId('approval-approve').click()
    await expect.poll(() => fixture.invokedTools(), { timeout: 15000 }).toEqual(['closure_stats', 'slow_update'])
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect(script).toHaveAttribute('data-state', 'done', { timeout: 15000 })
    await expect(row.getByTestId('script-call')).toHaveText(['closure_stats', 'slow_update'])
  })
})
