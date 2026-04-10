/**
 * stateful API tests, validate monitoring/history endpoints
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
const otherUser = await axiosAuth('test1-user1')

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }
    }
  },
  quotas: {
    global: { unlimited: false, dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 },
    admin: { unlimited: true, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
    contrib: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
    user: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
    external: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
    anonymous: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 }
  }
}

const owner = { type: 'user', id: 'test-standalone1' }

function dailyPeriod (daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return `daily:${d.toISOString().slice(0, 10)}`
}

function dateFromDaysAgo (daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function monthlyPeriod (monthsAgo: number): string {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() - monthsAgo)
  return `monthly:${d.toISOString().slice(0, 7)}`
}

function monthFromMonthsAgo (monthsAgo: number): string {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() - monthsAgo)
  return d.toISOString().slice(0, 7)
}

test.describe('Monitoring History API', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('should return account daily history with zero-filled entries', async () => {
    await admin.post('/api/test-env/usage', { owner, totalTokens: 100, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, totalTokens: 200, period: dailyPeriod(2) })
    await admin.post('/api/test-env/usage', { owner, totalTokens: 300, period: dailyPeriod(5) })

    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.entries))
    assert.equal(res.data.entries.length, 7)

    const today = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.equal(today.totalTokens, 100)

    const twoDaysAgo = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(2))
    assert.equal(twoDaysAgo.totalTokens, 200)

    const fiveDaysAgo = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(5))
    assert.equal(fiveDaysAgo.totalTokens, 300)

    const oneDayAgo = res.data.entries.find((e: any) => e.label === dateFromDaysAgo(1))
    assert.equal(oneDayAgo.totalTokens, 0)
  })

  test('should return account monthly history with zero-filled entries', async () => {
    await admin.post('/api/test-env/usage', { owner, totalTokens: 5000, period: monthlyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, totalTokens: 3000, period: monthlyPeriod(2) })

    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-monthly&months=4')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.entries))
    assert.equal(res.data.entries.length, 4)

    const thisMonth = res.data.entries.find((e: any) => e.label === monthFromMonthsAgo(0))
    assert.equal(thisMonth.totalTokens, 5000)

    const twoMonthsAgo = res.data.entries.find((e: any) => e.label === monthFromMonthsAgo(2))
    assert.equal(twoMonthsAgo.totalTokens, 3000)

    const oneMonthAgo = res.data.entries.find((e: any) => e.label === monthFromMonthsAgo(1))
    assert.equal(oneMonthAgo.totalTokens, 0)
  })

  test('should return user daily history grouped by userId', async () => {
    await admin.post('/api/test-env/usage', { owner, userId: 'user-a', totalTokens: 500, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, userId: 'user-b', totalTokens: 300, period: dailyPeriod(0) })
    await admin.post('/api/test-env/usage', { owner, userId: 'user-a', totalTokens: 100, period: dailyPeriod(1) })

    const res = await user.get('/api/usage/user/test-standalone1/history?scope=users&days=7')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.users))

    const userA = res.data.users.find((u: any) => u.userId === 'user-a')
    assert.ok(userA)
    assert.equal(userA.entries.length, 7)

    const userAToday = userA.entries.find((e: any) => e.label === dateFromDaysAgo(0))
    assert.equal(userAToday.totalTokens, 500)

    const userB = res.data.users.find((u: any) => u.userId === 'user-b')
    assert.ok(userB)
  })

  test('should return empty entries when no data exists', async () => {
    const res = await user.get('/api/usage/user/test-standalone1/history?scope=account-daily&days=7')
    assert.equal(res.status, 200)
    assert.equal(res.data.entries.length, 7)
    for (const entry of res.data.entries) {
      assert.equal(entry.totalTokens, 0)
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
