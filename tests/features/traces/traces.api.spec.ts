/** stateful API tests for server-side trace storage */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin

const settingsData = (storeTraces: boolean) => ({
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }, inputPricePerMillion: 0, outputPricePerMillion: 0 } },
  quotas: { global: { unlimited: true, monthlyLimit: 0 }, admin: { unlimited: true, monthlyLimit: 0 }, contrib: { unlimited: false, monthlyLimit: 0 }, user: { unlimited: false, monthlyLimit: 0 }, external: { unlimited: false, monthlyLimit: 0 }, anonymous: { unlimited: false, monthlyLimit: 0 } },
  storeTraces
})

async function chat (storeTraces: boolean, headers: Record<string, string>) {
  await admin.put('/api/settings/user/test-standalone1', settingsData(storeTraces))
  const cookieString = await user.cookieJar.getCookieString(directoryUrl)
  const provider = createOpenAI({
    baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1`,
    apiKey: 'unused',
    headers: { cookie: cookieString, ...headers },
    name: 'data-fair-gateway'
  })
  await generateText({ model: provider.chat('assistant'), messages: [{ role: 'user', content: 'hello' }] })
}

async function waitForConversations () {
  for (let i = 0; i < 30; i++) {
    const res = await admin.get('/api/traces/user/test-standalone1')
    if (res.data.results.length > 0) return res.data
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return (await admin.get('/api/traces/user/test-standalone1')).data
}

test.describe('Trace storage API', () => {
  test.beforeEach(async () => { await clean() })

  test('stores a trace request when enabled AND consented', async () => {
    await chat(true, { 'x-trace-consent': 'yes', 'x-trace-conversation': 'conv-A', 'x-trace-ctx': 'turn:t1' })
    const list = await waitForConversations()
    assert.equal(list.results.length, 1)
    assert.equal(list.results[0].conversationId, 'conv-A')
    assert.equal(list.results[0].requestCount, 1)
  })

  test('stores nothing without consent', async () => {
    await chat(true, { 'x-trace-conversation': 'conv-B', 'x-trace-ctx': 'turn:t1' })
    await new Promise(resolve => setTimeout(resolve, 500))
    const res = await admin.get('/api/traces/user/test-standalone1')
    assert.equal(res.data.results.length, 0)
  })

  test('stores nothing when the org setting is off', async () => {
    await chat(false, { 'x-trace-consent': 'yes', 'x-trace-conversation': 'conv-C', 'x-trace-ctx': 'turn:t1' })
    await new Promise(resolve => setTimeout(resolve, 500))
    const res = await admin.get('/api/traces/user/test-standalone1')
    assert.equal(res.data.results.length, 0)
  })

  test('non-admin cannot list traces', async () => {
    const other = await axiosAuth('test1-user1')
    await assert.rejects(
      other.get('/api/traces/user/test-standalone1'),
      { status: 403 }
    )
  })

  test('get + delete a conversation', async () => {
    await chat(true, { 'x-trace-consent': 'yes', 'x-trace-conversation': 'conv-D', 'x-trace-ctx': 'turn:t1' })
    await waitForConversations()
    const conv = await admin.get('/api/traces/user/test-standalone1/conv-D')
    assert.equal(conv.data.results.length, 1)
    assert.equal(conv.data.results[0].request.body.model, 'assistant')
    await admin.delete('/api/traces/user/test-standalone1/conv-D')
    const after = await admin.get('/api/traces/user/test-standalone1')
    assert.equal(after.data.results.length, 0)
  })
})
