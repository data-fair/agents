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

// Source account (config.evaluatorAccount) — gives the promoted evaluator a model.
const sourceSettings = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
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
    await page.getByRole('textbox').fill('hello')
    await page.getByRole('textbox').press('Enter')
    await expect(page.getByText('world')).toBeVisible()

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
    await page.getByRole('textbox').fill('call tool getTraceOverview')
    await page.getByRole('textbox').press('Enter')
    const req = await reqPromise
    expect(req.url()).not.toContain('/api/gateway/user/test-standalone1/')
    await expect(page.getByText('getTraceOverview')).toBeVisible()
  })
})
