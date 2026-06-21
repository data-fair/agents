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
    assert.deepEqual(res.data.evaluatorAccount, { type: 'organization', id: 'test1' })
    assert.equal(res.data.evaluatorAvailable, false)
  })

  test('evaluatorAvailable stays false with an evaluator model but no assistant (gateway requires an assistant)', async () => {
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: { evaluator: { model: { id: 'mock-evaluator', name: 'Mock Evaluator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } } },
      quotas: defaultQuotas
    })
    const res = await admin.get('/api/admin/info')
    assert.equal(res.data.evaluatorAvailable, false)
  })

  test('evaluatorAvailable=true once the source account has both an assistant and an evaluator model', async () => {
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: {
        assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } },
        evaluator: { model: { id: 'mock-evaluator', name: 'Mock Evaluator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } }
      },
      quotas: defaultQuotas
    })
    const res = await admin.get('/api/admin/info')
    assert.equal(res.data.evaluatorAvailable, true)
  })
})
