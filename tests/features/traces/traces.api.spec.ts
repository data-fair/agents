/**
 * stateful API tests for server-side trace storage.
 *
 * These used to drive the gateway as an OpenAI endpoint and choose their own conversation id through
 * an `x-trace-conversation` header. The gateway is gone: a turn is caused by asking for one, the
 * conversation id is the server's, and consent travels in the cookie both boundaries read.
 *
 * What that changed about these tests is worth stating, because it is a narrowing of what they can
 * check and not just a different spelling: the conversation ids are no longer chosen by the caller,
 * so every assertion is against the id the server assigned. The two tests covering experimental chat
 * flags on a trace are GONE rather than rewritten — those flags were read from a cookie by the
 * gateway, and the server-held loop receives no flags at all, so there is nothing left to assert.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { runTurn, setTraceConsent } from '../../support/turn.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
// test1-user1 is a member of organization/test1 → trackPerUser=true → userId stored in the trace
const orgMemberUser = await axiosAuth('test1-user1')

const settingsData = (storeTraces: boolean) => ({
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
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
  quotas: { admin: { unlimited: true, monthlyLimit: 0 }, contrib: { unlimited: false, monthlyLimit: 0 }, user: { unlimited: false, monthlyLimit: 0 }, external: { unlimited: true, monthlyLimit: 0 }, anonymous: { unlimited: false, monthlyLimit: 0 } },
  storeTraces
})

/** Configure the account, set consent, and run one turn. Returns the server's conversation id. */
async function chat (storeTraces: boolean, consented: boolean, owner = 'user/test-standalone1', ax = user) {
  await putSettings(admin, owner, settingsData(storeTraces))
  await setTraceConsent(ax, consented)
  const { conversationId } = await runTurn(ax, owner)
  return conversationId
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
    const conversationId = await chat(true, true)
    const list = await waitForConversations()
    assert.equal(list.results.length, 1)
    assert.equal(list.results[0].conversationId, conversationId)
    assert.ok(list.results[0].requestCount >= 1)
  })

  test('stores nothing without consent', async () => {
    // The gate the gateway enforced as a header, and which the session path had quietly lost: a
    // trace is visible to org admins while the conversation itself is not, so it needs the
    // person's yes even when the org has asked for traces.
    await chat(true, false)
    await new Promise(resolve => setTimeout(resolve, 500))
    const res = await admin.get('/api/traces/user/test-standalone1')
    assert.equal(res.data.results.length, 0)
  })

  test('stores nothing when the org setting is off', async () => {
    await chat(false, true)
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
    const conversationId = await chat(true, true)
    await waitForConversations()
    const conv = await admin.get(`/api/traces/user/test-standalone1/${conversationId}`)
    assert.ok(conv.data.results.length >= 1)
    // The recorded request carries the model actually resolved for the role, which is what makes a
    // stored trace readable at all.
    assert.equal(conv.data.results[0].request.model, 'mock-model')
    await admin.delete(`/api/traces/user/test-standalone1/${conversationId}`)
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
    await putSettings(admin, 'organization/test1', settingsData(true))
    await setTraceConsent(admin, true)

    const first = await runTurn(admin, 'organization/test1')
    const second = await runTurn(admin, 'organization/test1')

    let res: any
    for (let i = 0; i < 30; i++) {
      res = await admin.get('/api/traces/organization/test1?page=1&size=1')
      if ((res.data.count ?? 0) >= 2) break
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    if ((res?.data?.count ?? 0) < 2) assert.fail(`timed out waiting for 2 conversations, last count: ${res?.data?.count}`)

    assert.equal(res.data.results.length, 1, 'size=1 should return only 1 result')
    assert.ok(res.data.count >= 2, `count should be >= 2, got ${res.data.count}`)
    // newest-first: the second turn is the most recent
    assert.equal(res.data.results[0].conversationId, second.conversationId, 'first result should be the newest conversation')
    assert.notEqual(second.conversationId, first.conversationId)
  })

  test('fetches a trace by conversation id and returns its owner', async () => {
    const conversationId = await chat(true, true)
    await waitForConversations()
    const res = await admin.get(`/api/traces/conversation/${conversationId}`)
    assert.deepEqual(res.data.owner, { type: 'user', id: 'test-standalone1' })
    assert.ok(res.data.results.length >= 1)
  })

  test('by-conversation is 404 for unknown id', async () => {
    const res = await admin.get('/api/traces/conversation/does-not-exist').catch((err: any) => err.response ?? err)
    assert.equal(res.status, 404)
  })

  test('by-conversation rejects a non-admin of the owner', async () => {
    const conversationId = await chat(true, true)
    await waitForConversations()
    const stranger = await axiosAuth('test1-user1')
    const res = await stranger.get(`/api/traces/conversation/${conversationId}`).catch((err: any) => err.response ?? err)
    assert.equal(res.status, 403)
  })

  test('GDPR per-user erasure deletes all traces for a specific user (org owner)', async () => {
    // organization/test1 as owner: test1-user1 is a member rather than the owner, so trackPerUser is
    // true and their userId is stored on the trace. This exercises the real per-user deletion path.
    const conversationId = await chat(true, true, 'organization/test1', orgMemberUser)
    assert.ok(conversationId)

    const list = await waitForConversations('organization', 'test1')
    assert.equal(list.results.length, 1)
    const storedUserId = list.results[0].userId
    assert.equal(typeof storedUserId, 'string', 'expected userId to be stored for an org member')
    assert.equal(storedUserId, 'test1-user1', 'the PERSON is attributed, not the agent they talked to')

    await admin.delete(`/api/traces/organization/test1?userId=${encodeURIComponent(storedUserId)}`)
    const after = await admin.get('/api/traces/organization/test1')
    assert.equal(after.data.results.length, 0)
  })
})
