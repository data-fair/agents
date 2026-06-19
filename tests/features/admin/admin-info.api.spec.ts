/**
 * Admin /info advertises the configured promoted-evaluator source account and
 * whether it actually has an evaluator model.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, axiosAuth, clean, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin
const plainUser = await axiosAuth('test-standalone1')

test.describe('Admin info — promoted evaluator', () => {
  test.beforeEach(async () => { await clean() })

  test('requires admin mode', async () => {
    await assert.rejects(plainUser.get('/api/admin/info'))
  })

  test('reports evaluatorAccount and evaluatorAvailable=false when the source has no evaluator model', async () => {
    const res = await admin.get('/api/admin/info')
    assert.deepEqual(res.data.evaluatorAccount, { type: 'user', id: 'superadmin' })
    assert.equal(res.data.evaluatorAvailable, false)
  })

  test('evaluatorAvailable=true once the source account has an evaluator model', async () => {
    await admin.put('/api/settings/user/superadmin', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: { evaluator: { model: { id: 'mock-evaluator', name: 'Mock Evaluator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } } },
      quotas: defaultQuotas
    })
    const res = await admin.get('/api/admin/info')
    assert.equal(res.data.evaluatorAvailable, true)
  })
})
