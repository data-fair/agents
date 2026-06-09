/**
 * Gateway API tests - validates the OpenAI-compatible gateway endpoint
 * using the Vercel AI SDK with a custom provider
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText, streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, superAdmin, clean, directoryUrl, defaultQuotas, anonymousAx, getAnonymousActionToken } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
const externalUser = await axiosAuth('test1-user1')

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
      },
      inputPricePerMillion: 1,
      outputPricePerMillion: 2
    }
  },
  quotas: defaultQuotas
}

async function createGatewayProvider (ax: any, ownerType = 'user', ownerId = 'test-standalone1') {
  const cookieString = await ax.cookieJar.getCookieString(directoryUrl)
  return createOpenAI({
    baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/${ownerType}/${ownerId}/v1`,
    apiKey: 'unused',
    headers: { cookie: cookieString },
    name: 'data-fair-gateway'
  })
}

test.describe('Gateway API - OpenAI-compatible proxy', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('generateText through gateway', async () => {
    const provider = await createGatewayProvider(user)
    const result = await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })

    assert.equal(result.text, 'world')
    assert.equal(result.finishReason, 'stop')
  })

  test('streamText through gateway', async () => {
    const provider = await createGatewayProvider(user)
    const result = await streamText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })

    let text = ''
    for await (const chunk of result.textStream) {
      text += chunk
    }

    assert.equal(text, 'world')
  })

  test('generateText with system message', async () => {
    const provider = await createGatewayProvider(user)
    const result = await generateText({
      model: provider.chat('assistant'),
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'hello' }]
    })

    assert.equal(result.text, 'world')
  })

  test('rejects invalid model id', async () => {
    const provider = await createGatewayProvider(user)
    await assert.rejects(
      generateText({
        model: provider.chat('invalid-model'),
        messages: [{ role: 'user', content: 'hello' }]
      })
    )
  })

  test('external user can use gateway when external quota is positive', async () => {
    await admin.put('/api/settings/user/test-standalone1', {
      ...settingsData,
      quotas: {
        ...defaultQuotas,
        external: { unlimited: false, monthlyLimit: 100 }
      }
    })
    const provider = await createGatewayProvider(externalUser)
    const result = await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })
    assert.equal(result.text, 'world')
  })

  test('untrusted pool cap blocks an external user even when their external quota is not reached', async () => {
    // generous external per-user quota, but the shared untrusted pool is tight: monthly=4 → daily=1
    await admin.put('/api/settings/user/test-standalone1', {
      ...settingsData,
      quotas: {
        ...defaultQuotas,
        external: { unlimited: false, monthlyLimit: 1000 },
        untrusted: { unlimited: false, monthlyLimit: 4 }
      }
    })
    await anonymousAx.post('http://localhost:' + process.env.DEV_API_PORT + '/api/test-env/usage', {
      owner: { type: 'user', id: 'test-standalone1' },
      userId: 'pool:untrusted',
      cost: 2
    })

    const res = await externalUser.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
      model: 'assistant',
      messages: [{ role: 'user', content: 'hello' }]
    }).catch((err: any) => err.response ?? err)
    assert.equal(res.status, 429)
    assert.equal(res.data.error.scope, 'untrusted')
  })

  test('external user denied when external quota is zero', async () => {
    const provider = await createGatewayProvider(externalUser)
    await assert.rejects(
      generateText({
        model: provider.chat('assistant'),
        messages: [{ role: 'user', content: 'hello' }]
      })
    )
  })

  test('returns 429 with quota exceeded message when daily global quota is exceeded', async () => {
    // monthly=4 → daily=1 → seed daily usage >= 1
    await admin.put('/api/settings/user/test-standalone1', {
      ...settingsData,
      quotas: {
        ...defaultQuotas,
        global: { unlimited: false, monthlyLimit: 4 }
      }
    })
    const anonymousAx = (await import('../../support/axios.ts')).anonymousAx
    await anonymousAx.post('http://localhost:' + process.env.DEV_API_PORT + '/api/test-env/usage', {
      owner: { type: 'user', id: 'test-standalone1' },
      cost: 2
    })

    const res = await user.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
      model: 'assistant',
      messages: [{ role: 'user', content: 'hello' }]
    }).catch((err: any) => err.response ?? err)

    assert.equal(res.status, 429)
    assert.equal(res.data.error.message, 'Daily cost quota exceeded')
    assert.equal(res.data.error.type, 'rate_limit_error')
    assert.equal(res.data.error.scope, 'user')
    assert.equal(res.data.error.limit, 1)
    assert.ok(res.data.error.resets_at)
  })

  test('AI SDK receives quota exceeded error with extractable message', async () => {
    await admin.put('/api/settings/user/test-standalone1', {
      ...settingsData,
      quotas: {
        ...defaultQuotas,
        global: { unlimited: false, monthlyLimit: 4 }
      }
    })
    const anonymousAx = (await import('../../support/axios.ts')).anonymousAx
    await anonymousAx.post('http://localhost:' + process.env.DEV_API_PORT + '/api/test-env/usage', {
      owner: { type: 'user', id: 'test-standalone1' },
      cost: 2
    })

    const provider = await createGatewayProvider(user)
    try {
      await generateText({
        model: provider.chat('assistant'),
        messages: [{ role: 'user', content: 'hello' }],
        maxRetries: 0
      })
      assert.fail('should have thrown')
    } catch (err: any) {
      let found = false
      let current = err
      while (current) {
        if (current.data?.error?.message === 'Daily cost quota exceeded') { found = true; break }
        if (current.responseBody) {
          try {
            const body = JSON.parse(current.responseBody)
            if (body.error?.message === 'Daily cost quota exceeded') { found = true; break }
          } catch {}
        }
        current = current.cause
      }
      assert.ok(found, `Expected to find 'Daily cost quota exceeded' in error chain, got: ${err.message}`)
    }
  })

  const anonGatewayUrl = `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1/chat/completions`
  const anonQuotas = { ...defaultQuotas, anonymous: { unlimited: false, monthlyLimit: 100 } }
  const anonBody = { model: 'assistant', messages: [{ role: 'user', content: 'hello' }] }
  // reqIp requires the reverse-proxy's X-Forwarded-For header; the tests bypass nginx so we set it ourselves
  const anonForwardedFor = { 'x-forwarded-for': '203.0.113.7' }

  test('untrusted pool cap blocks an anonymous request even when its per-IP quota is not reached', async () => {
    // generous per-IP anonymous quota, but a tight shared pool: monthly=4 → daily=1
    await admin.put('/api/settings/user/test-standalone1', {
      ...settingsData,
      quotas: {
        ...defaultQuotas,
        anonymous: { unlimited: false, monthlyLimit: 1000 },
        untrusted: { unlimited: false, monthlyLimit: 4 }
      }
    })
    // seed the shared untrusted pool above its daily limit, with no per-IP usage
    await anonymousAx.post('http://localhost:' + process.env.DEV_API_PORT + '/api/test-env/usage', {
      owner: { type: 'user', id: 'test-standalone1' },
      userId: 'pool:untrusted',
      cost: 2
    })

    const token = await getAnonymousActionToken()
    const res = await anonymousAx.post(anonGatewayUrl, anonBody, { headers: { 'x-anonymous-token': token, ...anonForwardedFor } })
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 429)
    assert.equal(res.data.error.message, 'Daily cost quota exceeded')
    assert.equal(res.data.error.scope, 'untrusted')
    assert.equal(res.data.error.limit, 1)
  })

  test('anonymous request without token is rejected', async () => {
    await admin.put('/api/settings/user/test-standalone1', { ...settingsData, quotas: anonQuotas })
    const res = await anonymousAx.post(anonGatewayUrl, anonBody, { headers: { ...anonForwardedFor } }).catch((err: any) => err.response ?? err)
    assert.equal(res.status, 401)
  })

  test('anonymous request with invalid token is rejected', async () => {
    await admin.put('/api/settings/user/test-standalone1', { ...settingsData, quotas: anonQuotas })
    const res = await anonymousAx.post(anonGatewayUrl, anonBody, { headers: { 'x-anonymous-token': 'not-a-real-token', ...anonForwardedFor } })
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 401)
  })

  test('anonymous request with valid token succeeds', async () => {
    await admin.put('/api/settings/user/test-standalone1', { ...settingsData, quotas: anonQuotas })
    const token = await getAnonymousActionToken()
    const res = await anonymousAx.post(anonGatewayUrl, anonBody, { headers: { 'x-anonymous-token': token, ...anonForwardedFor } })
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].message.content, 'world')
  })
})
