/**
 * stateful E2E test: the personal assistant's approval card, decided by a plain member of the organization
 * on their own thread (see personal-approvals.api.spec.ts for the gate itself).
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { giveAssistantsDevServers } from '../../support/personal-assistants.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin

test.describe('The personal assistant\'s approval card', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.MCP_FIXTURE_PORT)) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test_agents_org1', { quotas: { ...defaultQuotas, user: { unlimited: true, monthlyLimit: 0 } } })
    // the dev fixture serving `echo`, on the assistant whatever servers the deployment gives it
    await giveAssistantsDevServers()
  })

  test('a member approves their assistant\'s write, and it runs', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test_agents_org1/chat', 'test_agents_org1_user', { org: 'test_agents_org1' })
    await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill('call tool echo {"value":"x"}')
    await page.getByTestId('agent-chat-send').click()
    await expect(page.getByTestId('approval-card')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('approval-approve').click({ timeout: 15000 })
    await expect(page.getByTestId('approval-card')).toHaveCount(0, { timeout: 15000 })
    await expect(page.getByTestId('tool-chip').first()).toHaveText(/^Approved: /, { timeout: 15000 })
  })
})
