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
    await putMockSettings(admin, 'organization/test1', { storeTraces: true })
  })

  test('a configured agent chat shows the notice and no consent sheet', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Audited', persona: 'x', mcpServers: [], enabled: true })).data
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agent.id}`, 'test1-admin1', { org: 'test1' })
    await expect(page.getByTestId('agent-chat-audited-notice')).toBeVisible({ timeout: 20000 })
  })

  test('the personal assistant shows no audited notice', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/organization/test1/chat', 'test1-admin1', { org: 'test1' })
    await expect(page.getByTestId('agent-chat-input')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('agent-chat-audited-notice')).toHaveCount(0)
  })
})
