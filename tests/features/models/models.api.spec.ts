/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean } from '../../support/axios.ts'

const admin = await superAdmin

test.describe('Models API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('mock provider models advertise a context window', async () => {
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }]
    })
    const res = await admin.get('/api/models/user/test-standalone1')
    assert.equal(res.status, 200)
    const model = res.data.results.find((m: any) => m.id === 'mock-model')
    assert.ok(model)
    assert.equal(model.contextWindow, 128000)
  })
})
