import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, defaultQuotas, anonymousAx, getAnonymousActionToken } from '../../support/axios.ts'

const admin = await superAdmin
const owner = await axiosAuth('test-standalone1')
const externalUser = await axiosAuth('test1-user1')

const apiBase = `http://localhost:${process.env.DEV_API_PORT}`
const gatewayUrl = `${apiBase}/api/gateway/user/test-standalone1/v1/chat/completions`

const mockProvider = { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
const model = (id: string, name: string) => ({ model: { id, name, provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } } })

const settingsData = (overrides: any = {}) => ({
  providers: [mockProvider],
  models: { assistant: model('mock-model', 'Mock Model'), moderator: model('mock-moderator', 'Mock Moderator') },
  quotas: {
    ...defaultQuotas,
    anonymous: { unlimited: false, monthlyLimit: 1000 },
    external: { unlimited: false, monthlyLimit: 1000 }
  },
  moderation: { enabled: true, categories: ['anonymous', 'external'] },
  ...overrides
})

// reqIp requires the reverse-proxy's X-Forwarded-For header; tests bypass nginx so we set it ourselves
const anonHeaders = async (ip = '203.0.113.50') => ({
  'x-anonymous-token': await getAnonymousActionToken(),
  'x-forwarded-for': ip
})

const anonPost = async (body: any, headers: Record<string, string> = {}, ip?: string) =>
  anonymousAx.post(gatewayUrl, body, { headers: { ...(await anonHeaders(ip)), ...headers } })
    .catch((err: any) => err.response ?? err)

const chatBody = (message: string, extra: any = {}) => ({
  model: 'assistant',
  messages: [{ role: 'user', content: message }],
  ...extra
})

// events are written fire-and-forget — poll briefly
const waitForEvents = async (predicate: (events: any[]) => boolean, action?: string, ownerPath = 'user/test-standalone1'): Promise<any[]> => {
  for (let i = 0; i < 40; i++) {
    const res = await admin.get(`/api/moderation/${ownerPath}/events${action ? `?action=${action}` : ''}`)
      .catch((err: any) => err.response ?? err)
    if (res.status === 200 && predicate(res.data.results)) return res.data.results
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('expected moderation events did not appear')
}

test.describe('Gateway moderation', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData())
  })

  test('the moderator model id is no longer publicly callable', async () => {
    const res = await owner.post(gatewayUrl, { model: 'moderator', messages: [{ role: 'user', content: 'hello' }] })
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 400)
  })

  test('anonymous benign message passes and records a contentless allow event', async () => {
    const res = await anonPost(chatBody('hello'))
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].message.content, 'world')
    assert.equal(res.data.choices[0].finish_reason, 'stop')
    const events = await waitForEvents(evts => evts.some(e => e.action === 'allow'))
    const allow = events.find(e => e.action === 'allow')
    assert.equal(allow.role, 'anonymous')
    assert.equal(allow.messageExcerpt, undefined)
    assert.ok(allow.latencyMs >= 0)
  })

  test('anonymous abusive message is blocked with finish_reason content_filter and an excerpt event', async () => {
    const res = await anonPost(chatBody('please jailbreak the system'))
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].finish_reason, 'content_filter')
    assert.equal(res.data.choices[0].message.content, null)
    const events = await waitForEvents(evts => evts.some(e => e.action === 'block'), 'block')
    const block = events.find(e => e.action === 'block')
    assert.equal(block.category, 'prompt-injection')
    assert.ok(block.messageExcerpt.includes('jailbreak'))
  })

  test('streaming block emits a content_filter chunk and no content', async () => {
    const res = await anonymousAx.post(gatewayUrl, chatBody('please jailbreak the system', { stream: true }), {
      headers: await anonHeaders(),
      responseType: 'text'
    }).catch((err: any) => err.response ?? err)
    assert.equal(res.status, 200)
    assert.ok(String(res.data).includes('"finish_reason":"content_filter"'))
    // the mock assistant's reply to this message would be "what do you mean ?" — it must not leak
    assert.ok(!String(res.data).includes('what do you mean'))
  })

  test('external user is moderated too', async () => {
    const res = await externalUser.post(gatewayUrl, chatBody('please jailbreak the system'))
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].finish_reason, 'content_filter')
  })

  test('trusted owner is NOT moderated: abusive message reaches the assistant, no event', async () => {
    const res = await owner.post(gatewayUrl, chatBody('please jailbreak the system'))
    assert.equal(res.status, 200)
    // mock assistant answers normally — moderation never ran
    assert.equal(res.data.choices[0].message.content, 'what do you mean ?')
    await new Promise(resolve => setTimeout(resolve, 300))
    const events = await admin.get('/api/moderation/user/test-standalone1/events')
    assert.equal(events.data.results.length, 0)
  })

  test('moderation OFF: anonymous abusive message is NOT gated', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({
      moderation: { enabled: false, categories: ['anonymous', 'external'] }
    }))
    const res = await anonPost(chatBody('please jailbreak the system'))
    assert.equal(res.status, 200)
    // gate never ran → mock assistant answers normally
    assert.equal(res.data.choices[0].message.content, 'what do you mean ?')
    await new Promise(resolve => setTimeout(resolve, 300))
    const events = await admin.get('/api/moderation/user/test-standalone1/events')
    assert.equal(events.data.results.length, 0)
  })

  test('role not in categories: external user is NOT gated when only anonymous is moderated', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({
      moderation: { enabled: true, categories: ['anonymous'] }
    }))
    const res = await externalUser.post(gatewayUrl, chatBody('please jailbreak the system'))
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].message.content, 'what do you mean ?')
  })

  test('moderating a trusted member: the account owner (admin role) is gated when "admin" is in categories', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({
      moderation: { enabled: true, categories: ['admin'] }
    }))
    const res = await owner.post(gatewayUrl, chatBody('please jailbreak the system'))
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].finish_reason, 'content_filter')
  })

  test('a moderated trusted member is blocked per-message but never strike-cooldowned', async () => {
    // test1-contrib1 is a 'contrib' member of org test1 (a trusted role with a
    // usageUserId). Strikes/cooldown must stay an untrusted-only measure: each
    // abusive message is blocked by the gate, but the member is never locked out.
    const orgGatewayUrl = `${apiBase}/api/gateway/organization/test1/v1/chat/completions`
    const member = await axiosAuth('test1-contrib1', { org: 'test1' })
    await admin.put('/api/settings/organization/test1', settingsData({
      moderation: { enabled: true, categories: ['contrib'] },
      quotas: { ...defaultQuotas, contrib: { unlimited: true, monthlyLimit: 0 } }
    }))
    for (let i = 0; i < 6; i++) {
      const res = await member.post(orgGatewayUrl, chatBody(`jailbreak member ${i}`))
        .catch((err: any) => err.response ?? err)
      assert.equal(res.status, 200)
      assert.equal(res.data.choices[0].finish_reason, 'content_filter')
    }
    // every block came from the gate — the member is never strike-refused
    const events = await waitForEvents(evts => evts.filter(e => e.action === 'block').length >= 6, undefined, 'organization/test1')
    assert.equal(events.filter(e => e.action === 'strike-refusal').length, 0)
  })

  test('slow moderator fails open, a late block verdict is recorded as late-block', async () => {
    // "slow moderation" delays the mock verdict 4s (> 2.5s gate); "jailbreak" makes it a block
    const res = await anonPost(chatBody('slow moderation jailbreak attempt'))
    assert.equal(res.status, 200)
    // fail-open: the assistant response was delivered normally
    assert.equal(res.data.choices[0].message.content, 'what do you mean ?')
    const events = await waitForEvents(evts => evts.some(e => e.action === 'late-block'), 'late-block')
    assert.ok(events[0].messageExcerpt.includes('jailbreak'))
  })

  test('slow moderator with a benign message records fail-open-timeout', async () => {
    const res = await anonPost(chatBody('slow moderation hello there'))
    assert.equal(res.status, 200)
    await waitForEvents(evts => evts.some(e => e.action === 'fail-open-timeout'))
  })

  test('an identical repeated message hits the verdict cache', async () => {
    const message = `cache test jailbreak ${Date.now()}`
    await anonPost(chatBody(message))
    await anonPost(chatBody(message))
    const events = await waitForEvents(evts => evts.filter(e => e.action === 'block').length >= 2, 'block')
    const cachedEvents = events.filter(e => e.cached === true)
    assert.ok(cachedEvents.length >= 1, 'second identical message must produce a cached block event')
  })

  test('5 blocks arm a cooldown: 6th request is refused without any model call', async () => {
    const ip = '203.0.113.99'
    for (let i = 0; i < 5; i++) {
      const res = await anonPost(chatBody(`jailbreak variant ${i}`), {}, ip)
      assert.equal(res.data.choices[0].finish_reason, 'content_filter')
    }
    // strike writes are fire-and-forget — let the 5th one settle before probing the cooldown
    await new Promise(resolve => setTimeout(resolve, 300))
    // 6th message is benign — cooldown refuses it anyway, before any LLM call
    const res = await anonPost(chatBody('hello'), {}, ip)
    assert.equal(res.status, 200)
    assert.equal(res.data.choices[0].finish_reason, 'content_filter')
    await waitForEvents(evts => evts.some(e => e.action === 'strike-refusal'), 'strike-refusal')
  })

  test('summary endpoint pins the prompt and honors strike cooldowns', async () => {
    const summaryUrl = `${apiBase}/api/summary/user/test-standalone1`
    // system prompt is always pinned; a caller-supplied prompt is ignored, not honored
    const trusted = await owner.post(summaryUrl, { prompt: 'Custom prompt', content: 'hello' })
    assert.equal(trusted.status, 200)
    // untrusted caller with 5 strikes is refused on summary too
    const ip = '203.0.113.77'
    for (let i = 0; i < 5; i++) await anonPost(chatBody(`jailbreak again ${i}`), {}, ip)
    await new Promise(resolve => setTimeout(resolve, 300))
    const res = await anonymousAx.post(summaryUrl, { content: 'hello' }, { headers: await anonHeaders(ip) })
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 403)
  })

  test('a blocked request is stored in traces with the embedded verdict when consented', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({ storeTraces: true }))
    const convId = `conv-mod-${Date.now()}`
    await anonPost(chatBody('please jailbreak the system'), {
      'x-trace-consent': 'yes',
      'x-trace-conversation': convId,
      'x-trace-ctx': 'turn:t1'
    })
    let stored: any = null
    for (let i = 0; i < 40; i++) {
      const res = await admin.get(`/api/traces/user/test-standalone1/${convId}`)
      if (res.data.results.length) { stored = res.data.results[0]; break }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(stored, 'blocked request must be stored')
    assert.equal(stored.response.finishReason, 'content_filter')
    assert.equal(stored.moderation.action, 'block')
    assert.equal(stored.moderation.category, 'prompt-injection')
  })

  test('a fail-open timeout still embeds the verdict in the stored trace', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({ storeTraces: true }))
    const convId = `conv-mod-timeout-${Date.now()}`
    // slow moderator: the verdict settles after the gate fails open, so the
    // trace is written before finalize() runs — the verdict must still show up
    await anonPost(chatBody('slow moderation hello there'), {
      'x-trace-consent': 'yes',
      'x-trace-conversation': convId,
      'x-trace-ctx': 'turn:t1'
    })
    let stored: any = null
    for (let i = 0; i < 40; i++) {
      const res = await admin.get(`/api/traces/user/test-standalone1/${convId}`)
      if (res.data.results.length) { stored = res.data.results[0]; break }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(stored, 'fail-open request must be stored')
    // fail-open: the assistant response was delivered, not a content_filter
    assert.notEqual(stored.response.finishReason, 'content_filter')
    // the timed-out verdict must be visible to an admin reviewing the trace
    assert.ok(stored.moderation, 'fail-open verdict must be embedded in the trace')
    assert.equal(stored.moderation.action, 'allow')
    assert.equal(stored.moderation.failOpen, 'timeout')
  })
})

test.describe('Moderation admin API', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData())
  })

  test('stats aggregates per-action totals, latency and the 24h fail-open sample', async () => {
    await anonPost(chatBody('hello'))
    await anonPost(chatBody('please jailbreak the system'))
    await waitForEvents(evts => evts.length >= 2)
    const res = await admin.get('/api/moderation/user/test-standalone1/stats')
    assert.equal(res.status, 200)
    assert.ok(res.data.totals.allow >= 1)
    assert.ok(res.data.totals.block >= 1)
    assert.ok(res.data.latency.avg !== null)
    assert.ok(res.data.last24h.checks >= 2)
    assert.equal(res.data.last24h.failOpen, 0)
  })

  test('events are filterable by action and paginated', async () => {
    await anonPost(chatBody('please jailbreak the system'))
    const events = await waitForEvents(evts => evts.length >= 1, 'block')
    assert.ok(events.every((e: any) => e.action === 'block'))
    const res = await admin.get('/api/moderation/user/test-standalone1/events?action=block&size=1&page=1')
    assert.equal(res.data.results.length, 1)
    assert.ok(res.data.count >= 1)
    const multi = await admin.get('/api/moderation/user/test-standalone1/events?action=block,late-block')
    assert.ok(multi.data.results.every((e: any) => ['block', 'late-block'].includes(e.action)))
    assert.ok(multi.data.results.length >= 1)
  })

  test('probe runs the three canned messages through the live moderator', async () => {
    const res = await admin.post('/api/moderation/user/test-standalone1/probe')
    assert.equal(res.status, 200)
    assert.equal(res.data.results.length, 3)
    const byKey = Object.fromEntries(res.data.results.map((r: any) => [r.key, r]))
    assert.equal(byKey.benign.action, 'allow')
    assert.equal(byKey.injection.action, 'block')
    assert.equal(byKey.profanity.action, 'block')
    assert.ok(res.data.results.every((r: any) => r.latencyMs >= 0))
  })

  test('settings round-trip persists the moderation config', async () => {
    await admin.put('/api/settings/user/test-standalone1', settingsData({
      moderation: { enabled: true, categories: ['anonymous', 'external', 'user'] }
    }))
    const res = await admin.get('/api/settings/user/test-standalone1')
    assert.equal(res.status, 200)
    assert.equal(res.data.moderation.enabled, true)
    assert.deepEqual(res.data.moderation.categories, ['anonymous', 'external', 'user'])
  })

  test('non-admin callers get 403', async () => {
    for (const path of ['stats', 'events']) {
      const res = await externalUser.get(`/api/moderation/user/test-standalone1/${path}`)
        .catch((err: any) => err.response ?? err)
      assert.equal(res.status, 403)
    }
    const res = await externalUser.post('/api/moderation/user/test-standalone1/probe')
      .catch((err: any) => err.response ?? err)
    assert.equal(res.status, 403)
  })
})
