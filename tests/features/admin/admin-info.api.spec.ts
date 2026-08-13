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

  // The two former "evaluatorAvailable=false" cases (no model at all / an
  // evaluator but no assistant) no longer exist: the deployment's global default
  // model resolves the assistant role for every account, and the evaluator role
  // falls back to the assistant. Availability now reflects that.
  test('reports evaluatorAccount, available from the global default even with no org config', async () => {
    const res = await admin.get('/api/admin/info')
    assert.deepEqual(res.data.evaluatorAccount, { type: 'organization', id: 'test1' })
    assert.equal(res.data.evaluatorAvailable, true)
  })

  test('evaluatorAvailable=true when the source account maps its own assistant and evaluator models', async () => {
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
          usage: ['assistant'],
          multiplier: 0
        },
        {
          model: { id: 'mock-evaluator', name: 'Mock Evaluator', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
          usage: ['evaluator'],
          multiplier: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' },
        evaluator: { provider: 'mock-provider', id: 'mock-evaluator', name: 'Mock Evaluator' }
      },
      quotas: defaultQuotas
    })
    const res = await admin.get('/api/admin/info')
    assert.equal(res.data.evaluatorAvailable, true)
  })
})
