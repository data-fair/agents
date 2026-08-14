/**
 * stateful API tests: the org-wide credit cap (pushed via the customers
 * ecosystem `/api/v1/limits` endpoint) must block gateway requests, ahead of
 * any per-profile quota check.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'

// matches api/config/development.js secretKeys.limits
const SECRET = 'secretlimits'

const admin = await superAdmin
const test1Admin = await axiosAuth('test1-admin1', { org: 'test1' }) // admin of organization/test1

const settingsData = {
  providers: [
    {
      id: 'mock-provider',
      type: 'mock',
      name: 'Mock Provider',
      enabled: true
    }
  ],
  // multiplier is irrelevant here: the org cap is enforced from the pushed
  // limits doc, before any usage/cost is computed from a real call
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      multiplier: 1_000_000
    }
  ],
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
  },
  quotas: {
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 0 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: false, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 },
    untrusted: { unlimited: false, monthlyLimit: 0 }
  }
}

async function pushLimits (limit: number, consumption: number) {
  const res = await test1Admin.post(`/api/v1/limits/organization/test1?key=${SECRET}`, {
    name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit, consumption }
  })
  assert.equal(res.status, 200)
}

const gatewayBody = { model: 'assistant', messages: [{ role: 'user', content: 'hello' }] }

test.describe('org credit cap enforcement', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/organization/test1', settingsData)
  })

  test('gateway returns 429 when consumption reaches the pushed limit', async () => {
    await pushLimits(5, 5)

    const res = await test1Admin.post('/api/gateway/organization/test1/v1/chat/completions', gatewayBody)
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 429)
    assert.equal(res.data.error.scope, 'account')
    assert.equal(res.data.error.limit, 5)
    assert.equal(res.data.error.usage, 5)
  })

  test('limit -1 (default) means unlimited', async () => {
    await pushLimits(-1, 999999)

    const res = await test1Admin.post('/api/gateway/organization/test1/v1/chat/completions', gatewayBody)
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 200)
  })

  test('org cap is checked before per-profile quotas', async () => {
    // the caller's own profile quota (admin) is unlimited, yet the exhausted
    // org-wide cap must still block the request first
    await pushLimits(5, 5)

    const res = await test1Admin.post('/api/gateway/organization/test1/v1/chat/completions', gatewayBody)
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 429)
    assert.equal(res.data.error.scope, 'account')
  })

  test('usage endpoint exposes the cap', async () => {
    await pushLimits(42, 7)

    const res = await test1Admin.get('/api/usage/organization/test1')
    assert.equal(res.status, 200)
    assert.deepEqual(res.data.credits, { limit: 42, consumption: 7 })
  })
})
