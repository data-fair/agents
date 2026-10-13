/**
 * stateful E2E test: the approval card of a call that sends a file shows the file's path, type and size.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { FIXTURE_PORT, createFilesAgent } from '../../support/files.ts'

const admin = await superAdmin

test.describe('Approval card of a file upload', () => {
  let fixture: McpFixture
  let agentId: string
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
    agentId = (await createFilesAgent({ approvals: { write: 'approve' } })).id
  })

  const ask = async (page: any, text: string) => {
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill(text)
    await page.getByTestId('agent-chat-send').click()
  }

  test('shows the file, and approving sends it', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    await ask(page, 'call tool write_file {"file_path":"/clean.csv","content":"a,b\\n1,2\\n"}')
    await expect(page.getByTestId('tool-chip').first()).toBeVisible({ timeout: 15000 })
    await ask(page, 'call tool import_table {"file":"/clean.csv","title":"Clean"}')
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('approval-file')).toHaveText('/clean.csv — text/csv, 8 B')
    await expect(page.getByTestId('approval-approve')).toBeEnabled({ timeout: 15000 })
    await page.getByTestId('approval-approve').click()
    await expect.poll(() => fixture.invokedTools()).toEqual(['import_table'])
  })
})
