/**
 * stateful API tests for admin review of conversations.
 *
 * This replaces tests for a `trace-requests` collection that stored a COPY of each exchange. There is
 * no copy any more: review is a READ of the conversation, authorized rather than duplicated, so what
 * these tests assert is the AUTHORIZATION — two gates, both required, and each failing closed.
 *
 *  - the organization enabled review at all (`settings.storeTraces`)
 *  - this person agreed to this thread being read (`conversation.consentedToReview`)
 *
 * The per-call telemetry that the trace collection held beyond content now lives on the run, and is
 * tested in tests/features/autonomous-agents/runtime.api.spec.ts.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { runTurn, setTraceConsent } from '../../support/turn.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
// a member of organization/test1, so their threads on the org account are attributable to them
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

/** Configure the account, answer the consent question, and run one turn. */
async function chat (storeTraces: boolean, consented: boolean, owner = 'user/test-standalone1', ax = user) {
  await putSettings(admin, owner, settingsData(storeTraces))
  await setTraceConsent(ax, consented)
  const { conversationId } = await runTurn(ax, owner)
  return conversationId
}

test.describe('Conversation review API', () => {
  test.beforeEach(async () => { await clean() })

  test('lists a consented conversation, with a real preview of what was asked', async () => {
    const conversationId = await chat(true, true)
    const res = await admin.get('/api/review/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
    assert.equal(res.data.results[0].conversationId, conversationId)
    // The preview reads the conversation's first user message. Under the trace collection it was dug
    // out of a stored request body, and once the executor stopped copying messages into that body it
    // silently became empty — the list fell back to showing the conversation id.
    assert.equal(res.data.results[0].preview, 'hello')
    assert.equal(res.data.results[0].agentId, 'personal')
  })

  test('a thread the person did NOT consent to is invisible', async () => {
    await chat(true, false)
    const res = await admin.get('/api/review/user/test-standalone1')
    assert.equal(res.data.count, 0)
  })

  test('nothing is reviewable when the organization has not enabled review', async () => {
    await chat(false, true)
    await assert.rejects(admin.get('/api/review/user/test-standalone1'), { status: 403 })
  })

  test('a non-admin cannot review', async () => {
    await chat(true, true)
    const other = await axiosAuth('test1-user1')
    await assert.rejects(other.get('/api/review/user/test-standalone1'), { status: 403 })
  })

  test('reading one conversation returns its messages and its runs', async () => {
    const conversationId = await chat(true, true)
    const res = await admin.get(`/api/review/user/test-standalone1/${conversationId}`)
    assert.equal(res.status, 200)

    const roles = res.data.messages.map((message: any) => message.role)
    assert.deepEqual(roles, ['user', 'assistant'], 'the exchange itself, in order')

    // What the conversation cannot say about itself, and the whole of what the trace collection held
    // beyond the content.
    assert.equal(res.data.runs.length, 1)
    assert.ok(res.data.runs[0].systemPrompt.length > 0, 'the instructions the model was given')
    assert.ok((res.data.runs[0].calls ?? []).length >= 1, 'which model answered, and what it cost')
  })

  test('a thread without consent is 404 on read, not 403', async () => {
    // An admin has no business learning which of their members declined, so a thread that exists but
    // was not consented to is indistinguishable from one that does not exist.
    const conversationId = await chat(true, false)
    const res = await admin.get(`/api/review/user/test-standalone1/${conversationId}`).catch((err: any) => err.response ?? err)
    assert.equal(res.status, 404)
  })

  test('by-conversation resolves the owner and nothing else', async () => {
    const conversationId = await chat(true, true)
    const res = await admin.get(`/api/review/conversation/${conversationId}`)
    assert.deepEqual(res.data.owner, { type: 'user', id: 'test-standalone1' })
    // Deliberately not a way to READ it: it answers where the thread lives so the client can go and
    // be authorized at the account-scoped route.
    assert.equal(res.data.messages, undefined)
  })

  test('by-conversation is 404 for an unknown id', async () => {
    const res = await admin.get('/api/review/conversation/does-not-exist').catch((err: any) => err.response ?? err)
    assert.equal(res.status, 404)
  })

  test('deleting a reviewed conversation removes its messages and runs too', async () => {
    const conversationId = await chat(true, true)
    await admin.delete(`/api/review/user/test-standalone1/${conversationId}`)

    assert.equal((await admin.get('/api/review/user/test-standalone1')).data.count, 0)
    // Orphans are the failure that matters for an erasure: messages and runs are separate documents,
    // so deleting only the conversation would leave them readable by id.
    const res = await admin.get(`/api/review/user/test-standalone1/${conversationId}`).catch((err: any) => err.response ?? err)
    assert.equal(res.status, 404)
  })

  test('per-user erasure requires a userId rather than erasing the account', async () => {
    await chat(true, true)
    const res = await admin.delete('/api/review/user/test-standalone1').catch((err: any) => err.response ?? err)
    assert.equal(res.status, 400)
  })

  test('per-user erasure deletes that person\'s threads and attributes them correctly', async () => {
    const conversationId = await chat(true, true, 'organization/test1', orgMemberUser)
    const list = await admin.get('/api/review/organization/test1')
    assert.equal(list.data.count, 1)
    assert.equal(list.data.results[0].userId, 'test1-user1', 'the PERSON is attributed, not the agent')
    assert.equal(list.data.results[0].conversationId, conversationId)

    await admin.delete('/api/review/organization/test1?userId=test1-user1')
    assert.equal((await admin.get('/api/review/organization/test1')).data.count, 0)
  })

  test('withdrawing consent hides a thread that was previously visible', async () => {
    // Consent is one flag on the thread and the person can change their mind, which is the behaviour
    // a per-run copy of the answer could not express.
    const conversationId = await chat(true, true)
    assert.equal((await admin.get('/api/review/user/test-standalone1')).data.count, 1)

    await setTraceConsent(user, false)
    await runTurn(user, 'user/test-standalone1', 'again', { conversationId })

    assert.equal((await admin.get('/api/review/user/test-standalone1')).data.count, 0)
  })
  test('exports the conversation as a line-addressable JSONL file', async () => {
    // The download the admin page offers, and what replaced the in-browser trace evaluator. What is
    // asserted here is the HTTP contract (gate, headers, filename) and that the file the route
    // produced is the one the format promises — the format itself is pinned in
    // tests/features/trace-review/conversation-export.unit.spec.ts.
    const conversationId = await chat(true, true)
    const res = await admin.get(`/api/review/user/test-standalone1/${conversationId}/export`, { responseType: 'text' })
    assert.equal(res.status, 200)
    assert.match(String(res.headers['content-disposition']), new RegExp(`conversation-${conversationId}.jsonl`))
    assert.match(String(res.headers['content-type']), /jsonl/)

    const lines = String(res.data).replace(/\n$/, '').split('\n')
    const meta = JSON.parse(lines[0])
    assert.equal(meta.type, 'meta')
    assert.equal(meta.conversation.id, conversationId)
    assert.equal(meta.lines.total, lines.length, 'the header counts the real file')

    // The outline's pointers resolve, against a file the server actually assembled from mongo.
    const outline = JSON.parse(lines[1]).records
    assert.ok(outline.length >= 3, 'two messages and at least one run')
    for (const entry of outline) assert.equal(JSON.parse(lines[entry.line - 1]).type, entry.record)

    // And the content is there: the exchange, and the instructions the model was given.
    const text = String(res.data)
    assert.ok(text.includes('hello'), 'what the person said')
    assert.ok(text.includes('"type":"run"'), 'the run with its per-call telemetry')
    assert.ok(text.includes('"prompt:1"'), 'the system prompt, stored once and referenced')
  })

  test('the export is superadmin-only, unlike the review page it is reached from', async () => {
    // `user` is an admin of their own account, so they may review it — but the export hands over
    // every tool argument and result verbatim, which is a different disclosure.
    const conversationId = await chat(true, true)
    assert.equal((await user.get(`/api/review/user/test-standalone1/${conversationId}`)).status, 200, 'they can review')
    await assert.rejects(
      user.get(`/api/review/user/test-standalone1/${conversationId}/export`),
      (err: any) => err.status === 403 || err.status === 401
    )
  })

  test('exporting a thread without consent is 404, like reading it', async () => {
    const conversationId = await chat(true, false)
    await assert.rejects(admin.get(`/api/review/user/test-standalone1/${conversationId}/export`), { status: 404 })
  })
})
