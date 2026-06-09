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

  test('records the moderation decision in the reconstructed trace (review page)', async ({ page, context, goToWithAuth }) => {
    // Store traces + consent so the moderation round-trip is persisted server-side and
    // reconstructed on the review page.
    await admin.put('/api/settings/user/test-standalone1', { ...settingsData, storeTraces: true })
    await context.addCookies([{ name: 'agent-chat-trace-consent', value: 'yes', domain: 'localhost', path: '/' }])

    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    const input = page.getByPlaceholder('Type your message...')
    await expect(input).toBeEnabled({ timeout: 10000 })
    await input.fill('please jailbreak the system')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByText("This request can't be processed as it falls outside what this assistant is meant to help with.")).toBeVisible({ timeout: 15000 })

    // Poll the list API until the stored conversation appears.
    let conversationId = ''
    for (let i = 0; i < 40; i++) {
      const res = await admin.get('/api/traces/user/test-standalone1?page=1&size=20').catch(() => null)
      if (res && res.data.results.length) { conversationId = res.data.results[0].conversationId; break }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    expect(conversationId).toBeTruthy()

    // Open the per-trace review page — the moderator round-trip is reconstructed into a
    // dedicated moderation entry with a localized verdict chip + category/reason.
    await goToWithAuth(`/agents/traces/${conversationId}/review`, 'test-standalone1')
    const tracePanels = page.locator('.agent-chat__trace-panels')
    await expect(tracePanels).toBeVisible({ timeout: 10000 })

    const modEntry = tracePanels.locator('.v-expansion-panel', { hasText: 'moderation' }).first()
    await expect(modEntry).toBeVisible({ timeout: 10000 })
    await modEntry.locator('.v-expansion-panel-title').click()

    // Dedicated renderer: a localized action chip (NOT a raw JSON dump of "block").
    await expect(modEntry.getByText(/^(Blocked|Bloqué)$/)).toBeVisible({ timeout: 3000 })
    await expect(modEntry).toContainText('prompt-injection')
    await expect(modEntry).toContainText('mock block')
  })
})
