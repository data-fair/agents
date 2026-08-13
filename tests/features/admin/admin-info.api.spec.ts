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

  // The former "no model at all" and "evaluator but no assistant" negative cases
  // no longer exist: the deployment's global default model resolves the assistant
  // role for every account, and it is flagged for the evaluator usage too.
  test('reports evaluatorAccount, available from the global default even with no org config', async () => {
    const res = await admin.get('/api/admin/info')
    assert.deepEqual(res.data.evaluatorAccount, { type: 'organization', id: 'test1' })
    assert.equal(res.data.evaluatorAvailable, true)
  })

  // The negative case under the catalog model: the account pins its own model for
  // the assistant role, and that model is NOT flagged for `evaluator`. The
  // evaluator role still *resolves* (its fallback chain ends on the assistant),
  // so availability must be decided on the resolved model's declared usage.
  test('evaluatorAvailable=false when the resolved model is not flagged for the evaluator usage', async () => {
    await admin.put('/api/settings/organization/test1', {
      providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
      models: [
        {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
          usage: ['assistant'],
          multiplier: 0
        }
      ],
      modelMapping: {
        assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
      },
      quotas: defaultQuotas
    })
    const res = await admin.get('/api/admin/info')
    assert.equal(res.data.evaluatorAvailable, false)
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
