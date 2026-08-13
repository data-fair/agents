/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { anonymousAx, axiosAuth, clean } from '../../support/axios.ts'

// matches api/config/development.js secretKeys.limits
const SECRET = 'secretlimits'

const test1Admin = await axiosAuth('test1-admin1') // admin of organization/test1
const otherOrgUser = await axiosAuth('dev1-user1') // member of organization/dev1, not test1

test.describe('limits API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('push with the shared key creates/updates the doc', async () => {
    const res = await anonymousAx.post(`/api/v1/limits/organization/test1?key=${SECRET}`, {
      name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 100, consumption: 0 }
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.ai_credits.limit, 100)

    const read = await anonymousAx.get(`/api/v1/limits/organization/test1?key=${SECRET}`)
    assert.equal(read.status, 200)
    assert.equal(read.data.ai_credits.limit, 100)
    assert.equal(read.data.type, 'organization')
    assert.equal(read.data.id, 'test1')
  })

  test('push without the key is rejected', async () => {
    await assert.rejects(
      anonymousAx.post('/api/v1/limits/organization/test1', {
        name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 100, consumption: 0 }
      }),
      { status: 401 }
    )
  })

  test('push without consumption preserves locally tracked consumption', async () => {
    await anonymousAx.post(`/api/v1/limits/organization/test1?key=${SECRET}`, {
      name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 100, consumption: 40 }
    })

    const res = await anonymousAx.post(`/api/v1/limits/organization/test1?key=${SECRET}`, {
      name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 200 }
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.ai_credits.limit, 200)
    assert.equal(res.data.ai_credits.consumption, 40)

    const read = await anonymousAx.get(`/api/v1/limits/organization/test1?key=${SECRET}`)
    assert.equal(read.data.ai_credits.limit, 200)
    assert.equal(read.data.ai_credits.consumption, 40)
  })

  test('account member can read its own limits, non-member cannot', async () => {
    await anonymousAx.post(`/api/v1/limits/organization/test1?key=${SECRET}`, {
      name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 100, consumption: 0 }
    })

    const res = await test1Admin.get('/api/v1/limits/organization/test1')
    assert.equal(res.status, 200)
    assert.equal(res.data.ai_credits.limit, 100)

    await assert.rejects(
      otherOrgUser.get('/api/v1/limits/organization/test1'),
      { status: 403 }
    )
  })

  test('defaults doc is lazily created with the configured default limit', async () => {
    const res = await test1Admin.get('/api/v1/limits/organization/test1')
    assert.equal(res.status, 200)
    assert.equal(res.data.defaults, true)
    assert.equal(res.data.ai_credits.limit, -1) // dev default (config.defaultLimits.credits)
    assert.equal(res.data.ai_credits.consumption, 0)
  })
})
