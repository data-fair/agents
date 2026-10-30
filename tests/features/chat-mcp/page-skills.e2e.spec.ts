/**
 * A page's skill, end to end: registered with useAgentSkill beside the page's tools, carried by the
 * chat to the server, listed in the Skills index and loaded with read_skill.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForPageTools } from '../../support/page-tools.ts'

test.describe('Page skills', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('a skill the page registers is loaded by the agent through read_skill', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await putMockSettings(admin, 'user/test-standalone1')

    await goToWithAuth('/agents/_dev/chat-page-skills', 'test-standalone1')
    await waitForPageTools(page, 'describe_note')

    await page.getByPlaceholder('Type your message...').fill('read page skill skill://note-guide/SKILL.md')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.locator('.assistant-content').last())
      .toContainText('Always describe the note before changing it', { timeout: 15000 })
  })
})
