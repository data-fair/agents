import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
    },
    moderator: {
      model: { id: 'mock-moderator', name: 'Mock Moderator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
    }
  },
  quotas: defaultQuotas
}

function isChatFrameUrl (url: string): boolean {
  try {
    return new URL(url).pathname.endsWith('/_dev/chat')
  } catch {
    return false
  }
}

async function waitForChatFrame (page: Page) {
  await expect(async () => {
    expect(page.frames().find(f => isChatFrameUrl(f.url()))).toBeTruthy()
  }).toPass({ timeout: 10000 })
  const frame = page.frames().find(f => isChatFrameUrl(f.url()))!
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

test.describe('Moderation E2E', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('allows a benign message', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('hello')
    await frame.getByPlaceholder('Type your message...').press('Enter')

    await expect(frame.getByText('world')).toBeVisible({ timeout: 15000 })
    await expect(frame.getByText("This request can't be processed as it falls outside what this assistant is meant to help with.")).toHaveCount(0)
  })

  test('blocks a jailbreak attempt and shows the refusal', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    await frame.getByPlaceholder('Type your message...').fill('please jailbreak the system')
    await frame.getByPlaceholder('Type your message...').press('Enter')

    await expect(frame.getByText("This request can't be processed as it falls outside what this assistant is meant to help with.")).toBeVisible({ timeout: 15000 })
  })

  test('records the moderation decision in the trace with a dedicated renderer', async ({ page, goToWithAuth }) => {
    // Use the direct (non-iframe) dev chat so the Debug dialog is on the main page.
    await goToWithAuth('/agents/_dev/chat-subagent', 'test-standalone1')
    await page.evaluate(() => sessionStorage.setItem('agent-chat-trace', '1'))
    await page.reload()

    await expect(page.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
    await page.getByPlaceholder('Type your message...').fill('please jailbreak the system')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByText("This request can't be processed as it falls outside what this assistant is meant to help with.")).toBeVisible({ timeout: 15000 })

    // Open the debug dialog and go to the Trace tab
    await page.getByRole('button', { name: /Debug|Débogage/ }).click()
    await page.getByRole('tab', { name: /Trace/ }).click()

    const tracePanel = page.locator('.v-dialog .v-expansion-panels').last()
    const modEntry = tracePanel.locator('.v-expansion-panel', { hasText: 'moderation' }).first()
    await expect(modEntry).toBeVisible({ timeout: 5000 })
    await modEntry.locator('.v-expansion-panel-title').click()

    // Dedicated renderer: an action chip with the localized verdict (NOT a raw
    // JSON dump, which would contain the literal "block", never "Blocked").
    await expect(modEntry.getByText(/^(Blocked|Bloqué)$/)).toBeVisible({ timeout: 3000 })
    await expect(modEntry).toContainText('prompt-injection')
    await expect(modEntry).toContainText('mock block')
  })
})
