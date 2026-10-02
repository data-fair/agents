/**
 * stateful API tests, validate usage API endpoints
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, anonymousAx, clean, getAnonymousActionToken } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { runTurn } from '../../support/turn.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
const otherUser = await axiosAuth('test1-user1')

const settingsData = {
  providers: [
    {
      id: 'mock-provider',
      type: 'mock',
      name: 'Mock Provider',
      enabled: true
    }
  ],
  // 8 000 EUR/M at the 0.008 EUR/credit peg makes one token cost one credit
  // (credits = tokens × price / 1e6 / eurosPerCredit), so a single mock request
  // produces a measurable, non-zero usage record. This suite deliberately keeps
  // non-zero prices: it is the one that exercises the pricing formula end to end.
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      inputPricePerMillion: 8_000,
      outputPricePerMillion: 8_000
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
    anonymous: { unlimited: false, monthlyLimit: 0 }
  }
}

test.describe('Usage API', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'user/test-standalone1', settingsData)
  })

  test('should return usage with limits after a turn', async () => {
    await runTurn(user, 'user/test-standalone1')

    const res = await user.get('/api/usage/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.ok(res.data.daily)
    assert.ok(res.data.weekly)
    assert.ok(res.data.monthly)
    assert.ok(res.data.quotas)
    assert.equal(res.data.quotas.admin.unlimited, true)
    // the mock model reports length-proportional tokens, so at 1 credit per token
    // the single request above recorded a whole number of credits in every period
    assert.ok(res.data.daily.cost > 0)
    assert.equal(res.data.weekly.cost, res.data.daily.cost)
    assert.equal(res.data.monthly.cost, res.data.daily.cost)
    assert.ok(res.data.daily.resetsAt)
    assert.ok(res.data.weekly.resetsAt)
    assert.ok(res.data.monthly.resetsAt)
  })

  test('should record usage dimensions for a turn', async () => {
    await runTurn(user, 'user/test-standalone1')

    const today = new Date().toISOString().slice(0, 10)
    const todayEntry = (entries: any[]) => entries.find(e => e.label === today)

    const byRole = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7&dimension=modelRole')
    assert.equal(byRole.status, 200)
    assert.ok(todayEntry(byRole.data.entries).breakdown.assistant > 0)

    const byModel = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7&dimension=model')
    assert.ok(todayEntry(byModel.data.entries).breakdown['mock-model'] > 0)

    const byProfile = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7&dimension=profile')
    const profile = todayEntry(byProfile.data.entries).breakdown
    assert.equal(Object.keys(profile).length, 1)

    const byToken = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7&dimension=tokenType')
    const tokens = todayEntry(byToken.data.entries).breakdown
    assert.ok(tokens.input > 0)
    assert.ok(tokens.output > 0)
  })

  test('should return zero usage when no requests made', async () => {
    const res = await user.get('/api/usage/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.equal(res.data.daily.cost, 0)
    assert.equal(res.data.weekly.cost, 0)
    assert.equal(res.data.monthly.cost, 0)
  })

  test('should filter by period=daily', async () => {
    const res = await user.get('/api/usage/user/test-standalone1?period=daily')
    assert.equal(res.status, 200)
    assert.ok(res.data.daily)
    assert.equal(res.data.monthly, undefined)
    assert.ok(res.data.quotas)
  })

  test('should filter by period=monthly', async () => {
    const res = await user.get('/api/usage/user/test-standalone1?period=monthly')
    assert.equal(res.status, 200)
    assert.equal(res.data.daily, undefined)
    assert.ok(res.data.monthly)
    assert.ok(res.data.quotas)
  })

  test('should reject unauthorized access', async () => {
    await assert.rejects(
      otherUser.get('/api/usage/user/test-standalone1'),
      { status: 403 }
    )
  })
})

test.describe('Anonymous Usage', () => {
  test.beforeEach(async () => {
    await clean()
  })

  // REMOVED WITH THE GATEWAY: anonymous model access.
  //
  // Two tests here asserted that an anonymous caller with a signed action token could reach a model
  // when the `anonymous` quota allowed it, and was refused when it did not. The gateway was the only
  // endpoint that served an unauthenticated model call; the socket refuses an anonymous turn
  // outright (`agent-session/service.ts`), so there is no "allowed" case left to assert and the
  // "refused" case is now true of every path by construction rather than by quota.
  //
  // The anonymous quota itself still exists and is still enforced — see the summary endpoint below,
  // which is the remaining surface an anonymous caller can consume. Restoring anonymous CHAT means
  // building it on the socket, and this is the test that should come back with it.
  test('should deny anonymous summary access with default quotas', async () => {
    await putSettings(admin, 'user/test-standalone1', settingsData)

    await assert.rejects(
      anonymousAx.post('/api/summary/user/test-standalone1', {
        content: 'some text to summarize'
      }),
      { status: 403 }
    )
  })

  test('should allow anonymous summary access when anonymous quota is configured', async () => {
    const settingsWithAnonymous = {
      ...settingsData,
      quotas: {
        ...settingsData.quotas,
        anonymous: { unlimited: false, monthlyLimit: 10 }
      }
    }
    await putSettings(admin, 'user/test-standalone1', settingsWithAnonymous)

    const token = await getAnonymousActionToken()
    const res = await anonymousAx.post('/api/summary/user/test-standalone1', {
      content: 'some text to summarize'
    }, { headers: { 'x-anonymous-token': token, 'x-forwarded-for': '203.0.113.7' } })
    assert.equal(res.status, 200)
    assert.ok(res.data.summary)
  })
})
