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
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    // Wait for the turn to finish first: the executor appends its own message, so without
    // this the assistant message can land between the two reads below and the assertion
    // becomes a race.
    await pollRun(runId)

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

  // The executor is asynchronous and there is no websocket yet, so these poll rather
  // than sleep a fixed time.
  const pollRun = async (runId: string) => {
    for (let i = 0; i < 60; i++) {
      const run = (await orgAdmin.get(`/api/autonomous-agent-runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') return run
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('run never reached a terminal status')
  }

  const pollAssistants = async (conversationId: string, atLeast: number) => {
    for (let i = 0; i < 80; i++) {
      const messages = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conversationId}/messages`)).data.results
      const done = messages.filter((m: any) => m.role === 'assistant' && m.pending === false)
      if (done.length >= atLeast) return done
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`fewer than ${atLeast} finished assistant messages`)
  }

  test('a run reaches a terminal status and the assistant message is attributed to the autonomous agent', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data

    const run = await pollRun(runId)
    assert.notEqual(run.status, 'running')
    assert.ok(run.endedAt)

    const messages = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`)).data.results
    const assistant = messages.find((m: any) => m.role === 'assistant')
    assert.ok(assistant, 'a run must always leave an assistant message — failure is a message, not a silence')
    assert.equal(assistant.author.kind, 'autonomous-agent')
    assert.equal(assistant.runId, runId)
    assert.equal(assistant.pending, false)
    assert.ok(assistant.seq > messages.find((m: any) => m.role === 'user').seq)
  })

  test('a message posted while the conversation is locked is queued, not dropped, and is picked up later', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data

    // Hold the lock from outside so this is deterministic. Posting two messages and hoping
    // they overlap is a race: the in-process executor usually finishes the first turn
    // before the second post lands, so the contended path would go untested.
    const locked = await admin.post('/api/test-env/lock-conversation', { conversationId: conv.id })
    assert.equal(locked.data.acquired, true)

    const first = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await new Promise(resolve => setTimeout(resolve, 300))
    const blocked = (await orgAdmin.get(`/api/autonomous-agent-runs/organization/test1/${first.runId}`)).data
    assert.equal(blocked.status, 'running', 'a run whose conversation is locked must stay queued, not be dropped or failed')
    const during = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`)).data.results
    assert.equal(during.filter((m: any) => m.role === 'assistant' && m.pending === false).length, 0)

    await admin.post('/api/test-env/unlock-conversation', { conversationId: conv.id })

    // The next post's executor acquires the freed lock and must drain BOTH pending runs,
    // the queued one first.
    await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello again' })
    const assistants = await pollAssistants(conv.id, 2)
    assert.equal(assistants.length, 2, 'the queued run must not be dropped by the lock')
    // seq is monotonic, so ordering is observable
    assert.ok(assistants[1].seq > assistants[0].seq)
    const firstRun = (await orgAdmin.get(`/api/autonomous-agent-runs/organization/test1/${first.runId}`)).data
    assert.equal(firstRun.status, 'done', 'the queued run must have been picked up, not left running')
  })

  test('a run left running by a restart is swept to interrupted, with a message', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await pollRun(runId)

    // Simulate the orphan a restart leaves behind: a run still marked running whose
    // process is gone. The boot sweep must give it an honest terminal state rather than
    // leave a conversation that appears to be thinking forever.
    await admin.post('/api/test-env/orphan-run', { runId })
    const swept = await admin.post('/api/test-env/sweep-interrupted-runs', {})
    assert.ok(swept.data.swept >= 1)

    const run = (await orgAdmin.get(`/api/autonomous-agent-runs/organization/test1/${runId}`)).data
    assert.equal(run.status, 'interrupted')
    assert.ok(run.endedAt)
    const messages = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`)).data.results
    const forRun = messages.filter((m: any) => m.role === 'assistant' && m.runId === runId)
    assert.equal(forRun.length, 1, 'the sweep must not append a second message beside the one already there')
    assert.equal(forRun[0].pending, false)
    assert.ok(forRun[0].content.length > 0)
  })

  test('a run of another account cannot be read', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await assert.rejects(
      orgAdmin.get(`/api/autonomous-agent-runs/organization/dev1/${runId}`),
      { status: 404 }
    )
  })
})
