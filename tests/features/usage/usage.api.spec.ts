/**
 * stateful API tests, validate usage API endpoints
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, superAdmin, anonymousAx, clean, directoryUrl, getAnonymousActionToken, proxyHeaders } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'

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
  // 400 000 EUR/M at the 0.40 EUR/credit peg makes one token cost one credit
  // (credits = tokens × price / 1e6 / eurosPerCredit), so a single mock request
  // produces a measurable, non-zero usage record. This suite deliberately keeps
  // non-zero prices: it is the one that exercises the pricing formula end to end.
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      inputPricePerMillion: 400_000,
      outputPricePerMillion: 400_000
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

  test('should return usage with limits after gateway request', async () => {
    const cookieString = await user.cookieJar.getCookieString(directoryUrl)
    const provider = createOpenAI({
      baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1`,
      apiKey: 'unused',
      headers: { ...proxyHeaders, cookie: cookieString },
      name: 'data-fair-gateway'
    })
    await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })

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

  test('should record usage dimensions for a gateway request', async () => {
    const cookieString = await user.cookieJar.getCookieString(directoryUrl)
    const provider = createOpenAI({
      baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1`,
      apiKey: 'unused',
      headers: { ...proxyHeaders, cookie: cookieString },
      name: 'data-fair-gateway'
    })
    await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })

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

  test('should allow anonymous gateway access when anonymous quota is configured', async () => {
    const settingsWithAnonymous = {
      ...settingsData,
      quotas: {
        ...settingsData.quotas,
        anonymous: { unlimited: false, monthlyLimit: 10 }
      }
    }
    await putSettings(admin, 'user/test-standalone1', settingsWithAnonymous)

    const token = await getAnonymousActionToken()
    const provider = createOpenAI({
      baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1`,
      apiKey: 'unused',
      headers: { 'x-anonymous-token': token, 'x-forwarded-for': '203.0.113.7' },
      name: 'data-fair-gateway'
    })
    const result = await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })
    assert.ok(result.text)
  })

  test('should deny anonymous gateway access with default quotas (0/0)', async () => {
    await putSettings(admin, 'user/test-standalone1', settingsData)

    await assert.rejects(
      anonymousAx.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
        model: 'assistant',
        messages: [{ role: 'user', content: 'hello' }]
      }),
      { status: 403 }
    )
  })

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
