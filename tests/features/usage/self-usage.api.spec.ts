/**
 * stateful API tests: the self-usage view — any caller sees their
 * own quota; shared account budgets are a status for non-admins.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, anonymousAx, getAnonymousActionToken } from '../../support/axios.ts'
import { putMockSettings, mockModelRef } from '../../support/settings.ts'
import { runTurn } from '../../support/turn.ts'

// matches api/config/development.js secretKeys.limits
const SECRET = 'secretlimits'

const admin = await superAdmin
const owner = await axiosAuth('test_agents_standalone') // owner (admin) of user/test_agents_standalone
const externalUser = await axiosAuth('test_agents_org1_user') // external to user/test_agents_standalone
const test1Admin = await axiosAuth('test_agents_org1_admin', { org: 'test_agents_org1' })
// contrib member of organization/test_agents_org1
const test1Member = await axiosAuth('test_agents_org1_contrib', { org: 'test_agents_org1' })

const apiBase = `http://localhost:${process.env.DEV_API_PORT}`
const pricedSettings = (quotas: any) => ({ models: [{ model: mockModelRef, usage: ['assistant'], inputPricePerMillion: 8_000, outputPricePerMillion: 8_000 }], quotas })

const seedUsage = (ownerKeys: { type: string, id: string }, userId: string | undefined, cost: number) =>
  anonymousAx.post(`${apiBase}/api/test-env/usage`, { owner: ownerKeys, ...(userId ? { userId } : {}), cost })

const pushLimits = async (limit: number, consumption: number) => {
  const res = await test1Admin.post(`/api/v1/limits/organization/test_agents_org1?key=${SECRET}`, {
    name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit, consumption }
  })
  assert.equal(res.status, 200)
}

test.describe('self usage endpoint', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('an org member sees their own quota windows', async () => {
    await putMockSettings(admin, 'organization/test_agents_org1', pricedSettings({ contrib: { unlimited: false, monthlyLimit: 100 } }))
    await seedUsage({ type: 'organization', id: 'test_agents_org1' }, 'test_agents_org1_contrib', 3)

    const res = await test1Member.get('/api/usage/organization/test_agents_org1/self')
    assert.equal(res.status, 200)
    assert.equal(res.data.role, 'contrib')
    assert.equal(res.data.quota.unlimited, false)
    assert.equal(res.data.quota.daily.used, 3)
    assert.equal(res.data.quota.daily.limit, 25)
    assert.equal(res.data.quota.weekly.limit, 50)
    assert.equal(res.data.quota.monthly.limit, 100)
    assert.ok(res.data.quota.monthly.resetsAt)
    assert.deepEqual(res.data.account, { status: 'ok' })
  })

  test('an exhausted credit cap is a status for a member, numbers for an admin', async () => {
    await putMockSettings(admin, 'organization/test_agents_org1', pricedSettings({ contrib: { unlimited: false, monthlyLimit: 100 } }))
    await pushLimits(5, 5)

    const member = await test1Member.get('/api/usage/organization/test_agents_org1/self')
    assert.equal(member.data.account.status, 'exhausted')
    assert.ok(member.data.account.resetsAt)
    assert.equal('used' in member.data.account, false)
    assert.equal('limit' in member.data.account, false)

    const orgAdmin = await test1Admin.get('/api/usage/organization/test_agents_org1/self')
    assert.equal(orgAdmin.data.account.status, 'exhausted')
    assert.equal(orgAdmin.data.account.used, 5)
    assert.equal(orgAdmin.data.account.limit, 5)
  })

  test('an admin with an unlimited quota sees unlimited, with the account numbers', async () => {
    await putMockSettings(admin, 'organization/test_agents_org1', pricedSettings({}))
    await pushLimits(42, 7)
    const res = await test1Admin.get('/api/usage/organization/test_agents_org1/self')
    assert.equal(res.data.role, 'admin')
    assert.equal(res.data.quota.unlimited, true)
    assert.equal('limit' in res.data.quota.daily, false)
    assert.deepEqual(res.data.account, { status: 'ok', used: 7, limit: 42 })
  })

  test('the owner of a user account reads the account aggregate as unlimited', async () => {
    await putMockSettings(admin, 'user/test_agents_standalone', pricedSettings({}))
    await seedUsage({ type: 'user', id: 'test_agents_standalone' }, undefined, 4)
    const res = await owner.get('/api/usage/user/test_agents_standalone/self')
    assert.equal(res.status, 200)
    assert.equal(res.data.quota.unlimited, true)
    assert.equal(res.data.quota.daily.used, 4)
  })

  test('an external user in a full untrusted pool sees exhausted, no pool numbers', async () => {
    await putMockSettings(admin, 'user/test_agents_standalone', pricedSettings({
      external: { unlimited: false, monthlyLimit: 1000 },
      untrusted: { unlimited: false, monthlyLimit: 4 }
    }))
    await seedUsage({ type: 'user', id: 'test_agents_standalone' }, 'pool:untrusted', 2)

    const res = await externalUser.get('/api/usage/user/test_agents_standalone/self')
    assert.equal(res.data.role, 'external')
    assert.equal(res.data.quota.monthly.limit, 1000)
    assert.equal(res.data.account.status, 'exhausted')
    assert.equal('used' in res.data.account, false)

    // The turn is refused with the same redaction main's 429 body had: what was exceeded and when it
    // resets, never the shared pool's numbers — in the stored text as well as in the structured part.
    const { conversationId } = await runTurn(externalUser, 'user/test_agents_standalone')
    const messages = (await externalUser.get(`/api/test-env/conversations/user/test_agents_standalone/${conversationId}/messages`)).data.results as any[]
    const answer = messages.filter(m => m.role === 'assistant').pop()
    const refusal = answer.parts.find((part: any) => part.type === 'data-refusal')
    assert.deepEqual(Object.keys(refusal.data).sort(), ['kind', 'period', 'resetsAt', 'scope'])
    assert.equal(refusal.data.scope, 'untrusted')
    assert.equal(refusal.data.period, 'daily')
    assert.ok(refusal.data.resetsAt)
    const text = answer.parts.filter((part: any) => part.type === 'text').map((part: any) => part.text).join('')
    assert.ok(text.includes('untrusted'), text)
    assert.ok(!/limit \d|used \d/.test(text), text)
  })

  test('an anonymous visitor with an action token sees their per-IP quota', async () => {
    await putMockSettings(admin, 'user/test_agents_standalone', pricedSettings({ anonymous: { unlimited: false, monthlyLimit: 40 } }))
    const res = await anonymousAx.get(`${apiBase}/api/usage/user/test_agents_standalone/self`, {
      headers: { 'x-anonymous-token': await getAnonymousActionToken(), 'x-forwarded-for': '203.0.113.60' }
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.role, 'anonymous')
    assert.equal(res.data.quota.daily.limit, 10)
    assert.equal(res.data.quota.daily.used, 0)
  })

  test('a caller who may not use the model is refused', async () => {
    // external quota 0 → externals may not use the model at all
    await putMockSettings(admin, 'user/test_agents_standalone', pricedSettings({}))
    const res = await externalUser.get('/api/usage/user/test_agents_standalone/self').catch((err: any) => err.response ?? err)
    assert.equal(res.status, 403)
  })

  test('an external person\'s chat spend fills the untrusted pool, which then refuses them', async () => {
    // The pool's whole point: untrusted traffic combined cannot drain the account. It only counted the
    // moderation gate and the summary endpoint — a chat turn's own model calls never reached it.
    await putMockSettings(admin, 'user/test_agents_standalone', pricedSettings({
      external: { unlimited: false, monthlyLimit: 100_000 },
      untrusted: { unlimited: false, monthlyLimit: 40 }
    }))
    assert.equal((await externalUser.get('/api/usage/user/test_agents_standalone/self')).data.account.status, 'ok')

    await runTurn(externalUser, 'user/test_agents_standalone')
    assert.equal((await externalUser.get('/api/usage/user/test_agents_standalone/self')).data.account.status, 'exhausted')

    const { conversationId } = await runTurn(externalUser, 'user/test_agents_standalone')
    const messages = (await externalUser.get(`/api/test-env/conversations/user/test_agents_standalone/${conversationId}/messages`)).data.results as any[]
    const refusal = messages.filter(m => m.role === 'assistant').pop().parts.find((p: any) => p.type === 'data-refusal')
    assert.equal(refusal?.data?.scope, 'untrusted')
  })

  test('the owner of a user account records into its own document, never an external user\'s', async () => {
    await putMockSettings(admin, 'user/test_agents_standalone', pricedSettings({ external: { unlimited: false, monthlyLimit: 1000 } }))
    // the external user's record exists alone (no account aggregate yet): an owner write
    // with no userId clause used to match it, since the upsert took the first document
    await seedUsage({ type: 'user', id: 'test_agents_standalone' }, 'test_agents_org1_user', 3)
    const externalBefore = (await externalUser.get('/api/usage/user/test_agents_standalone/self')).data.quota.daily.used
    assert.equal(externalBefore, 3)
    const ownerBefore = (await owner.get('/api/usage/user/test_agents_standalone/self')).data.quota.daily.used
    assert.equal(ownerBefore, 0)

    await runTurn(owner, 'user/test_agents_standalone')

    const externalAfter = (await externalUser.get('/api/usage/user/test_agents_standalone/self')).data.quota.daily.used
    const ownerAfter = (await owner.get('/api/usage/user/test_agents_standalone/self')).data.quota.daily.used
    assert.equal(externalAfter, externalBefore)
    assert.ok(ownerAfter > ownerBefore)
  })
})
