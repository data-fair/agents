/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })

const agentBody = (over: any = {}) => ({
  title: 'Runtime probe', persona: 'You answer briefly.', mcpServers: [], toolDisclosure: 'static', enabled: true, ...over
})

const createAgent = async (over: any = {}) =>
  (await admin.post('/api/autonomous-agents/organization/test1', agentBody(over))).data

test.describe('Autonomous agent conversations', () => {
  test.beforeEach(async () => { await clean() })

  test('an org admin creates a thread and lists it', async () => {
    const agent = await createAgent()
    const created = await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', {
      autonomousAgentId: agent.id, title: 'First thread'
    })
    assert.equal(created.status, 200)
    assert.ok(created.data.id)
    assert.equal(created.data.messageSeq, 0)

    const list = await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1?autonomousAgentId=${agent.id}`)
    assert.equal(list.data.count, 1)
    assert.equal(list.data.results[0].title, 'First thread')
  })

  test('a listed instructor who is not an admin can create a thread', async () => {
    const agent = await createAgent({ instructors: [{ userId: 'test1-user1', userName: 'Test User' }] })
    const created = await orgMember.post('/api/autonomous-agent-conversations/organization/test1', {
      autonomousAgentId: agent.id, title: 'Instructor thread'
    })
    assert.equal(created.status, 200)
  })

  test('a plain org member who is NOT listed is refused', async () => {
    const agent = await createAgent()
    await assert.rejects(
      orgMember.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 'Nope' }),
      (err: any) => { assert.equal(err.status, 403); assert.match(JSON.stringify(err.data), /instruct/i); return true }
    )
  })

  test('a thread for an unknown autonomous agent is refused 404', async () => {
    await assert.rejects(
      orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: 'no-such-agent', title: 'x' }),
      { status: 404 }
    )
  })

  test('listing threads without naming an autonomous agent is refused', async () => {
    // autonomousAgentId is what the instruct check resolves against, so it cannot be
    // optional: without it there is no agent whose instructors list can be consulted.
    await assert.rejects(
      orgAdmin.get('/api/autonomous-agent-conversations/organization/test1'),
      { status: 400 }
    )
  })

  test('posting a message appends it, bumps the seq, and returns a runId', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data

    const posted = await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })
    assert.equal(posted.status, 200)
    assert.ok(posted.data.runId, 'expected a runId so the caller can poll or abort')

    const messages = await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`)
    const user = messages.data.results.find((m: any) => m.role === 'user')
    assert.ok(user)
    assert.equal(user.seq, 1)
    assert.equal(user.content, 'hello')
    // attribution is mandatory on a shared timeline
    assert.equal(user.author.kind, 'user')
    assert.equal(user.author.userId, 'test1-admin1')
  })

  test('an empty message is refused rather than starting a run', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    await assert.rejects(
      orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: '   ' }),
      { status: 400 }
    )
  })

  test('sinceSeq returns only newer messages, so a poller can page forward', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })

    const all = await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`)
    const highest = Math.max(...all.data.results.map((m: any) => m.seq))
    const since = await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages?sinceSeq=${highest}`)
    assert.equal(since.data.results.length, 0)
  })

  test('a conversation of another account cannot be reached', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    // 404, NOT the 403 Plan A's admin-only routes give: these routes cannot call
    // assertAccountRole on the owner at all, because a listed instructor may legitimately
    // come from another account (the cross-account instruct grant). Owner scoping is
    // therefore enforced by the lookup itself, which simply does not find it.
    await assert.rejects(
      orgAdmin.get(`/api/autonomous-agent-conversations/organization/dev1/${conv.id}/messages`),
      { status: 404 }
    )
  })

  test('a personal-account owner is refused, as autonomous agents are org-only', async () => {
    await assert.rejects(
      orgAdmin.post('/api/autonomous-agent-conversations/user/test1-admin1', { autonomousAgentId: 'x', title: 'y' }),
      { status: 400 }
    )
  })
})
