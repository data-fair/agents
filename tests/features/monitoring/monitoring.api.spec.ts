/**
 * stateful API tests, validate monitoring/history endpoints
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import dayjs from 'dayjs'
import { putSettings } from '../../support/settings.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
const otherUser = await axiosAuth('test1-user1')

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
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

const owner = { type: 'user', id: 'test-standalone1' }

function dateFromDaysAgo (daysAgo: number): string {
  const d = dayjs().subtract(daysAgo, 'day')
  return d.toISOString().slice(0, 10)
}

function dailyPeriod (daysAgo: number): string {
  return `daily:${dateFromDaysAgo(daysAgo)}`
}

function monthFromMonthsAgo (monthsAgo: number): string {
  const d = dayjs().subtract(monthsAgo, 'month')
  return d.toISOString().slice(0, 7)
}

function monthlyPeriod (monthsAgo: number): string {
  return `monthly:${monthFromMonthsAgo(monthsAgo)}`
}

test.describe('Monitoring History API', () => {
  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, 'user/test-standalone1', settingsData)
  })

  test('should return account daily history with zero-filled entries', async () => {
    await admin.post('/api/test-env/usage', { owner, cost: 1, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, cost: 2, period: dailyPeriod(2) })
    await admin.post('/api/test-env/usage', { owner, cost: 3, period: dailyPeriod(5) })

    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.entries))
    assert.equal(res.data.entries.length, 7)

    const today = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.equal(today.cost, 1)

    const twoDaysAgo = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(2))
    assert.equal(twoDaysAgo.cost, 2)

    const fiveDaysAgo = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(5))
    assert.equal(fiveDaysAgo.cost, 3)

    const oneDayAgo = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(1))
    assert.equal(oneDayAgo.cost, 0)
  })

  test('should return account monthly history with zero-filled entries', async () => {
    await admin.post('/api/test-env/usage', { owner, cost: 50, period: monthlyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, cost: 30, period: monthlyPeriod(2) })

    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-monthly&months=4')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.entries))
    assert.equal(res.data.entries.length, 4)

    const thisMonth = res.data.entries.find((e: any) => e.label === monthFromMonthsAgo(0))
    assert.equal(thisMonth.cost, 50)

    const twoMonthsAgo = res.data.entries.find((e: any) => e.label === monthFromMonthsAgo(2))
    assert.equal(twoMonthsAgo.cost, 30)

    const oneMonthAgo = res.data.entries.find((e: any) => e.label === monthFromMonthsAgo(1))
    assert.equal(oneMonthAgo.cost, 0)
  })

  test('should return user daily history grouped by userId', async () => {
    await admin.post('/api/test-env/usage', { owner, userId: 'user-a', cost: 5, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, userId: 'user-b', cost: 3, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, userId: 'user-a', cost: 1, period: dailyPeriod(1) })

    const res = await user.get('/api/usage/user/test-standalone1/history?scope=users&days=7')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.users))

    const userA = res.data.users.find((u: any) => u.userId === 'user-a')
    assert.ok(userA)
    assert.equal(userA.entries.length, 7)

    const userAToday = userA.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.equal(userAToday.cost, 5)

    const userB = res.data.users.find((u: any) => u.userId === 'user-b')
    assert.ok(userB)
  })

  test('should return account daily history broken down by dimension', async () => {
    await admin.post('/api/test-env/usage', {
      owner,
      cost: 4,
      period: dailyPeriod(0),
      breakdown: { modelRole: { assistant: 3, summarizer: 1 } }
    })
    await admin.post('/api/test-env/usage', {
      owner,
      cost: 2,
      period: dailyPeriod(1),
      breakdown: { modelRole: { assistant: 2 } }
    })

    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7&dimension=modelRole')
    assert.equal(res.status, 200)

    const today = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.equal(today.cost, 4)
    assert.deepEqual(today.breakdown, { assistant: 3, summarizer: 1 })

    const yesterday = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(1))
    assert.deepEqual(yesterday.breakdown, { assistant: 2 })

    const empty = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(2))
    assert.deepEqual(empty.breakdown, {})
  })

  test('should return per-user history broken down by dimension', async () => {
    await admin.post('/api/test-env/usage', {
      owner,
      userId: 'user-a',
      cost: 5,
      period: dailyPeriod(0),
      breakdown: { model: { 'gpt-3.5-turbo': 5 } }
    })

    const res = await user.get('/api/usage/user/test-standalone1/history?scope=users&days=7&dimension=model')
    assert.equal(res.status, 200)

    const userA = res.data.users.find((u: any) => u.userId === 'user-a')
    const today = userA.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.deepEqual(today.breakdown, { 'gpt-3.5-turbo': 5 })
  })

  test('should reject an unknown breakdown dimension', async () => {
    await assert.rejects(
      user.get('/api/usage/user/test-standalone1/history?scope=account-daily&dimension=unknown'),
      { status: 400 }
    )
  })

  test('should return empty entries when no data exists', async () => {
    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7')
    assert.equal(res.status, 200)
    assert.equal(res.data.entries.length, 7)
    for (const entry of res.data.entries) {
      assert.equal(entry.cost, 0)
    }
  })

  test('should reject unauthorized access', async () => {
    await assert.rejects(
      otherUser.get('/api/usage/user/test-standalone1/history'),
      { status: 403 }
    )
  })

  test('should default to 30 days for account-daily scope', async () => {
    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily')
    assert.equal(res.status, 200)
    assert.equal(res.data.entries.length, 30)
  })

  test('should default to 12 months for account-monthly scope', async () => {
    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-monthly')
    assert.equal(res.status, 200)
    assert.equal(res.data.entries.length, 12)
  })

  test('should default to 7 days for users scope', async () => {
    const res = await user.get('/api/usage/user/test-standalone1/history?scope=users')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.users))
  })
})

test.describe('Platform History API', () => {
  const otherOwner = { type: 'organization', id: 'test1' }

  test.beforeEach(async () => {
    await clean()
  })

  // These tests run against a shared dev database that can legitimately hold other
  // owners' consumption (dev fixtures, manual testing), so they never assert the
  // aggregate totals: they scope every expectation to the seeded test owners.
  test('should stack by owner by default across all accounts', async () => {
    await admin.post('/api/test-env/usage', { owner, cost: 4, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner: otherOwner, cost: 2, period: dailyPeriod(0) })

    const res = await admin.get('/api/usage/history?scope=platform-daily&days=7')
    assert.equal(res.status, 200)

    const today = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.equal(today.breakdown['user/test-standalone1'], 4)
    assert.equal(today.breakdown['organization/test1'], 2)
    assert.ok(res.data.owners.some((o: any) => o.type === 'organization' && o.id === 'test1'))
    assert.ok(res.data.owners.some((o: any) => o.type === 'user' && o.id === 'test-standalone1'))
  })

  test('should merge dimensions across owners', async () => {
    // a model id no other owner/consumer uses, so the merged value is exact
    await admin.post('/api/test-env/usage', {
      owner,
      cost: 4,
      period: dailyPeriod(0),
      breakdown: { model: { 'test-merge-model': 4 } }
    })
    await admin.post('/api/test-env/usage', {
      owner: otherOwner,
      cost: 2,
      period: dailyPeriod(0),
      breakdown: { model: { 'test-merge-model': 2 } }
    })

    const res = await admin.get('/api/usage/history?scope=platform-daily&days=7&dimension=model')
    assert.equal(res.status, 200)
    const today = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.equal(today.breakdown['test-merge-model'], 6)
  })

  test('should filter the entries on one owner while keeping the owner list', async () => {
    await admin.post('/api/test-env/usage', { owner, cost: 4, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner: otherOwner, cost: 2, period: dailyPeriod(0) })

    const res = await admin.get(`/api/usage/history?scope=platform-daily&days=7&ownerType=${otherOwner.type}&ownerId=${otherOwner.id}&dimension=modelRole`)
    assert.equal(res.status, 200)
    const today = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.equal(today.cost, 2)
    assert.ok(res.data.owners.some((o: any) => o.type === 'organization' && o.id === 'test1'))
    assert.ok(res.data.owners.some((o: any) => o.type === 'user' && o.id === 'test-standalone1'))
  })

  test('should return monthly platform history with zero-filled entries', async () => {
    await admin.post('/api/test-env/usage', {
      owner,
      cost: 50,
      period: monthlyPeriod(0),
      breakdown: { model: { 'test-monthly-model': 50 } }
    })

    const res = await admin.get('/api/usage/history?scope=platform-monthly&months=4&dimension=model')
    assert.equal(res.status, 200)
    assert.equal(res.data.entries.length, 4)
    const thisMonth = res.data.entries.find((e: any) => e.label === monthFromMonthsAgo(0))
    assert.equal(thisMonth.breakdown['test-monthly-model'], 50)
  })

  test('should reject non-superadmin access', async () => {
    await assert.rejects(
      user.get('/api/usage/history?scope=platform-daily&days=7'),
      { status: 403 }
    )
  })

  test('should reject invalid dimensions and incomplete owner filters', async () => {
    await assert.rejects(
      admin.get('/api/usage/history?scope=platform-daily&dimension=unknown'),
      { status: 400 }
    )
    await assert.rejects(
      admin.get('/api/usage/history?scope=platform-daily&ownerType=user'),
      { status: 400 }
    )
  })
})
