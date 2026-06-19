/**
 * Superadmin reviews another account's trace; the evaluator runs against the
 * configured source account (config.evaluatorAccount = user/superadmin in dev),
 * not the reviewed account.
 *
 * Mirrors trace-review.e2e.spec.ts for seeding a stored trace.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const reviewedSettings = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
    assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } }
  },
  quotas: defaultQuotas,
  storeTraces: true
}

// Source account (config.evaluatorAccount) — a fully configured agent: the
// gateway requires an assistant model on any account ("Agent not configured"
// otherwise), and the promoted evaluator additionally needs an evaluator model.
const sourceSettings = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
    assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } },
    evaluator: { model: { id: 'mock-evaluator', name: 'Mock Evaluator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } }
  },
  quotas: defaultQuotas
}

test.describe('Promoted evaluator (superadmin review)', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', reviewedSettings)
    await admin.put('/api/settings/user/superadmin', sourceSettings)
  })

  test('evaluator runs against the source account, not the reviewed account', async ({ page, context, goToWithAuth }) => {
    // Seed a stored trace on the reviewed account (consent cookie → x-trace-consent: yes).
    await context.addCookies([{ name: 'agent-chat-trace-consent', value: 'yes', domain: 'localhost', path: '/' }])
    await goToWithAuth('/agents/user/test-standalone1/chat', 'test-standalone1')
    const chatInput = page.getByPlaceholder('Type your message...')
    await expect(chatInput).toBeEnabled({ timeout: 10000 })
    await chatInput.fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })

    // Find the stored conversation id.
    let convId = ''
    await expect.poll(async () => {
      const res = await admin.get('/api/traces/user/test-standalone1')
      convId = res.data.results?.[0]?.conversationId ?? ''
      return convId
    }).not.toEqual('')

    // Review it as the superadmin (admin mode), via the admin route.
    await goToWithAuth(`/agents/admin/user/test-standalone1/traces/${convId}`, 'superadmin', { adminMode: true })

    // The evaluator's gateway call must target the SOURCE account, not the reviewed one.
    const reqPromise = page.waitForRequest(r => r.url().includes('/api/gateway/user/superadmin/'))
    const evalInput = page.getByPlaceholder('Type your message...')
    await expect(evalInput).toBeEnabled({ timeout: 10000 })
    await evalInput.fill('call tool getTraceOverview')
    await page.getByRole('button', { name: 'Send' }).click()
    const req = await reqPromise
    expect(req.url()).not.toContain('/api/gateway/user/test-standalone1/')

    // The tool-invocation chip only appears if the evaluator actually responded
    // (via the source account) with the tool call — proving the call did not 404.
    await expect(
      page.locator('.v-chip').filter({ hasText: 'getTraceOverview' }).first()
    ).toBeVisible({ timeout: 15000 })
  })
})
