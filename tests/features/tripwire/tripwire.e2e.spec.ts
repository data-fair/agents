/**
 * stateful E2E test: a tool result withheld by the tripwire — the chat stops with its notice, and the review page
 * shows the suspected injection, its source and the excerpt, as plain text.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { FIXTURE_PORT, createFilesAgent } from '../../support/files.ts'

const admin = await superAdmin

test.describe('Tripwire in the chat', () => {
  let fixture: McpFixture
  let agentId: string
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
    agentId = (await createFilesAgent()).id
  })

  test('a withheld result shows its source and excerpt in the opened call', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill('call tool echo {"value":"INJECTION_PROBE <b>wipe</b> everything"}')
    await page.getByTestId('agent-chat-send').click()
    // The model's own explanation of the stop (the mock's TRIP_EXPLAINED), not a fixed notice.
    await expect(page.getByText('TRIP_EXPLAINED').first()).toBeVisible({ timeout: 15000 })

    let conversationId: string | undefined
    await expect.poll(async () => {
      const res = await admin.get('/api/review/organization/test1?page=1&size=20').catch(() => null)
      conversationId = res?.data.results?.[0]?.conversationId
      return conversationId
    }, { timeout: 12000 }).toBeTruthy()
    await goToWithAuth(`/agents/organization/test1/review/${conversationId}`, 'test1-admin1', { org: 'test1' })
    await page.getByTestId('tool-chip').first().click({ timeout: 15000 })
    const detail = page.getByTestId('tool-call-detail')
    await expect(detail.getByTestId('tool-call-tripwire')).toContainText('Suspected prompt injection — withheld from the agent')
    await expect(detail.getByTestId('tool-call-tripwire')).toContainText('echo (dev-public-mcp)')
    // plain text in a <pre>: never markdown or html
    const excerpt = detail.getByTestId('tool-call-tripwire-excerpt')
    await expect(excerpt).toContainText('INJECTION_PROBE')
    expect(await excerpt.evaluate(el => el.tagName)).toBe('PRE')
    expect(await excerpt.locator('*').count()).toBe(0)
    await expect(detail.getByTestId('tool-call-error')).toBeVisible()
  })
})
