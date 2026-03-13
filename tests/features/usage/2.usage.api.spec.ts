/**
 * stateful API tests, validate usage API endpoints
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, clean, directoryUrl } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
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
  models: {
    assistant: {
      model: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: {
          type: 'mock',
          name: 'Mock Provider',
          id: 'mock-provider'
        }
      }
    }
  },
  limits: { dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 }
}

test.describe('Usage API', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('should return usage with limits after gateway request', async () => {
    // Use gateway to generate a request (mock provider returns 0 tokens)
    const cookieString = await user.cookieJar.getCookieString(directoryUrl)
    const provider = createOpenAI({
      baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/v1`,
      apiKey: 'unused',
      headers: { cookie: cookieString },
      name: 'data-fair-gateway'
    })
    await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })

    const res = await user.get('/api/usage/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.ok(res.data.daily)
    assert.ok(res.data.monthly)
    assert.ok(res.data.limits)
    assert.equal(res.data.limits.dailyTokenLimit, 100000)
    assert.equal(res.data.limits.monthlyTokenLimit, 1000000)
    // mock provider returns 0 tokens, so usage stays at 0
    assert.equal(typeof res.data.daily.totalTokens, 'number')
    assert.equal(typeof res.data.monthly.totalTokens, 'number')
    assert.ok(res.data.daily.resetsAt)
    assert.ok(res.data.monthly.resetsAt)
  })

  test('should return zero usage when no requests made', async () => {
    const res = await user.get('/api/usage/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.equal(res.data.daily.totalTokens, 0)
    assert.equal(res.data.monthly.totalTokens, 0)
  })

  test('should filter by period=daily', async () => {
    const res = await user.get('/api/usage/user/test-standalone1?period=daily')
    assert.equal(res.status, 200)
    assert.ok(res.data.daily)
    assert.equal(res.data.monthly, undefined)
    assert.ok(res.data.limits)
  })

  test('should filter by period=monthly', async () => {
    const res = await user.get('/api/usage/user/test-standalone1?period=monthly')
    assert.equal(res.status, 200)
    assert.equal(res.data.daily, undefined)
    assert.ok(res.data.monthly)
    assert.ok(res.data.limits)
  })

  test('should reject unauthorized access', async () => {
    await assert.rejects(
      otherUser.get('/api/usage/user/test-standalone1'),
      { status: 403 }
    )
  })
})
