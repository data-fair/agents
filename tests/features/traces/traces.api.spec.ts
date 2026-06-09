/** stateful API tests for server-side trace storage */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
// test1-user1 is a member of organization/test1 → trackPerUser=true → userId stored in trace
const orgMemberUser = await axiosAuth('test1-user1')

const settingsData = (storeTraces: boolean) => ({
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } }, inputPricePerMillion: 0, outputPricePerMillion: 0 } },
  quotas: { global: { unlimited: true, monthlyLimit: 0 }, admin: { unlimited: true, monthlyLimit: 0 }, contrib: { unlimited: false, monthlyLimit: 0 }, user: { unlimited: false, monthlyLimit: 0 }, external: { unlimited: true, monthlyLimit: 0 }, anonymous: { unlimited: false, monthlyLimit: 0 } },
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

async function waitForConversations (ownerType = 'user', ownerId = 'test-standalone1') {
  for (let i = 0; i < 30; i++) {
    const res = await admin.get(`/api/traces/${ownerType}/${ownerId}`)
    if (res.data.results.length > 0) return res.data
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('timed out waiting for stored conversations')
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

  test('GDPR per-user erasure rejects with 400 when userId query param is missing', async () => {
    // For a user-type owner with a same-account user, trackPerUser=false so userId is not stored.
    // The DELETE /:type/:id endpoint requires ?userId= and rejects without it.
    const res = await admin.delete('/api/traces/user/test-standalone1').catch((err: any) => err.response ?? err)
    assert.equal(res.status, 400)
  })

  test('paginates the conversation list newest-first', async () => {
    await admin.put('/api/settings/organization/test1', settingsData(true))

    // Seed two conversations via the gateway with trace headers
    async function seedTrace (conversationId: string) {
      await admin.post('/api/gateway/organization/test1/v1/chat/completions', {
        model: 'assistant',
        messages: [{ role: 'user', content: 'hello' }]
      }, { headers: { 'x-trace-conversation': conversationId, 'x-trace-consent': 'yes', 'x-trace-ctx': `turn:${conversationId}` } })
    }
    await seedTrace('conv-page-a')
    await seedTrace('conv-page-b')

    // Poll until both conversations are visible, failing loudly if they never land
    let res: any
    for (let i = 0; i < 30; i++) {
      res = await admin.get('/api/traces/organization/test1?page=1&size=1')
      if ((res.data.count ?? 0) >= 2) break
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    if ((res?.data?.count ?? 0) < 2) assert.fail(`timed out waiting for 2 conversations, last count: ${res?.data?.count}`)

    assert.equal(res.data.results.length, 1, 'size=1 should return only 1 result')
    assert.equal(typeof res.data.count, 'number', 'count should be a number')
    assert.ok(res.data.count >= 2, `count should be >= 2, got ${res.data.count}`)
    // newest-first: conv-page-b was seeded last, so it is the most recent
    assert.equal(res.data.results[0].conversationId, 'conv-page-b', 'first result should be the newest conversation')
  })

  test('GDPR per-user erasure deletes all traces for a specific user (org owner)', async () => {
    // Use organization/test1 as owner: test1-user1 is a member (not the owner), so
    // trackPerUser=true and their userId ('test1-user1') is stored in the trace document.
    // This exercises the real per-user deletion path.
    await admin.put('/api/settings/organization/test1', settingsData(true))
    const cookieString = await orgMemberUser.cookieJar.getCookieString(directoryUrl)
    const provider = createOpenAI({
      baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/organization/test1/v1`,
      apiKey: 'unused',
      headers: { cookie: cookieString, 'x-trace-consent': 'yes', 'x-trace-conversation': 'conv-gdpr', 'x-trace-ctx': 'turn:t1' },
      name: 'data-fair-gateway'
    })
    await generateText({ model: provider.chat('assistant'), messages: [{ role: 'user', content: 'hello' }] })

    const list = await waitForConversations('organization', 'test1')
    assert.equal(list.results.length, 1)
    const storedUserId = list.results[0].userId
    assert.equal(typeof storedUserId, 'string', 'expected userId to be stored for org member user')

    await admin.delete(`/api/traces/organization/test1?userId=${encodeURIComponent(storedUserId)}`)
    const after = await admin.get('/api/traces/organization/test1')
    assert.equal(after.data.results.length, 0)
  })
})
