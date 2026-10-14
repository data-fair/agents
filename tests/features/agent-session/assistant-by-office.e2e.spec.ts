/**
 * stateful E2E test: with no agent named, the office decides which personal assistant answers — the
 * back-office one in back-office mode (`agents`), the portal one otherwise. The client says, because the
 * host cannot: the back office is a path on the main portal's domain.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { axiosAuth, clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

test.describe('The personal assistant of each office', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  for (const [query, expected] of [['', 'portal-assistant'], ['?agents=1', 'back-office-assistant']]) {
    test(`a chat opened with "${query || 'nothing'}" talks to ${expected}`, async ({ page, goToWithAuth }) => {
      await goToWithAuth(`/agents/organization/test1/chat${query}`, 'test1-admin1', { org: 'test1' })
      await page.getByTestId('agent-chat-input').locator('textarea:not([aria-hidden="true"])').fill('hello')
      await page.getByTestId('agent-chat-send').click()
      await expect(page.getByText('world', { exact: true })).toBeVisible({ timeout: 15000 })
      const threads = (await orgAdmin.get('/api/conversations/organization/test1')).data.results
      expect(threads.map((t: any) => t.agentId)).toEqual([expected])
    })
  }
})
