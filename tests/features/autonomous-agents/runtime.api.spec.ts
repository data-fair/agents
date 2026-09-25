/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings, mockModels } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })

const agentBody = (over: any = {}) => ({
  title: 'Runtime probe', persona: 'You answer briefly.', mcpServers: [], toolDisclosure: 'static', enabled: true, ...over
})

const createAgent = async (over: any = {}) =>
  (await admin.post('/api/autonomous-agents/organization/test1', agentBody(over))).data

// These cover routing and the run LIFECYCLE — locking, pickup, terminal state, terminal
// message, restart sweep. The agents here are deliberately left unconfigured and unenrolled,
// so their turns refuse; that is fine, because a refusal exercises the same lifecycle. The
// 'model loop' and 'budgets' blocks below configure a model and cover successful turns.
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
    assert.notEqual(firstRun.status, 'running', 'the queued run must have been picked up, not left running')
    assert.ok(firstRun.endedAt)
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

test.describe('Autonomous agent model loop', () => {
  let fixture: McpFixture

  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    // The org needs a resolvable assistant model; the mock provider is the deterministic seam.
    await putMockSettings(admin, 'organization/test1')
  })

  /** Dev cannot complete a real enrolment (see the seam's comment), so set the field directly. */
  const enrol = async (agentId: string) => {
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  }

  const runOnce = async (agentId: string, content: string) => {
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agentId, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content })).data
    let run
    for (let i = 0; i < 100; i++) {
      run = (await orgAdmin.get(`/api/autonomous-agent-runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    const messages = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`)).data.results
    return { run, messages, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
  }

  test('a real model turn produces the model\'s answer', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'hello')
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'completed')
    // the mock model answers "hello" with "world" — proves prompt assembly, model
    // resolution, streaming and persistence all joined up
    assert.equal(assistant.content, 'world')
    assert.equal(assistant.pending, false)
    assert.ok(run.steps >= 1)
  })

  test('reasoning tokens are persisted separately from the answer', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    const { assistant } = await runOnce(agent.id, 'reason')
    assert.equal(assistant.content, 'world')
    assert.equal(assistant.reasoning, 'Let me think about it.')
  })

  test('a tool call reaches a real MCP server and is recorded with its server', async () => {
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'call tool echo {"value":"x"}')
    assert.equal(run.status, 'done')
    assert.ok(assistant.toolCalls?.length, 'expected the tool call to be recorded on the message')
    const call = assistant.toolCalls.find((c: any) => c.toolName === 'echo')
    assert.ok(call, 'expected the echo tool call')
    assert.equal(call.serverId, 'dev-public-mcp')
    // Two steps and a final answer prove the whole round trip, not merely that a call was
    // emitted: the fixture executed the tool, its wrapped result went back to the model,
    // and the model produced an answer from it. A call that never reached the server would
    // have left the turn looping or failing instead.
    assert.equal(run.stopReason, 'completed')
    assert.equal(run.steps, 2)
    assert.equal(assistant.content, 'done')
  })

  test('the repeated-call guard stops a looping turn as a truncation, not an error', async () => {
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'loop forever')
    // A guard-stopped turn did work and said so; only a throw is an error.
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'repeated-calls')
    assert.ok(run.steps > 1, 'expected several steps before the guard fired')
    assert.ok(assistant.content.length > 0, 'a truncated turn must still explain itself')
    assert.match(assistant.content, /repeating the same tool call/i)
  })

  test('an autonomous agent with no enrolled identity refuses with an actionable message', async () => {
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    // deliberately NOT enrolled
    const { run, assistant } = await runOnce(agent.id, 'hello')
    // A refusal is an error, not a completed run: asserting only "not running" would let a
    // refusal be reported as `done`.
    assert.equal(run.status, 'error')
    assert.equal(run.stopReason, 'error')
    assert.ok(assistant, 'a refusal is still a message')
    assert.match(assistant.content, /identity|enrol/i)
    assert.equal(assistant.pending, false)
  })

  test('a provider error becomes a message rather than a silent stop', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    // 'stream error' makes the mock emit an AI SDK error part, which does NOT throw on its
    // own — an unhandled one is exactly how a conversation silently dropped before.
    const { run, assistant } = await runOnce(agent.id, 'stream error')
    assert.equal(run.status, 'error')
    assert.ok(run.error, 'the run must record what went wrong')
    assert.ok(assistant, 'failure is a message, not a silence')
    assert.equal(assistant.pending, false)
    assert.ok(assistant.content.length > 0)
  })
})

test.describe('Autonomous agent budgets, quotas and abort', () => {
  let fixture: McpFixture
  const SECRET = 'secretlimits' // matches api/config/development.js, as tests/features/limits does

  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  const enrol = async (agentId: string) => { await admin.post('/api/test-env/enrol-autonomous-agent', { agentId }) }

  const startTurn = async (agentId: string, content: string) => {
    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agentId, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content })).data
    return { conv, runId }
  }

  const awaitRun = async (runId: string, tries = 120) => {
    for (let i = 0; i < tries; i++) {
      const run = (await orgAdmin.get(`/api/autonomous-agent-runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') return run
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('run never reached a terminal status')
  }

  const messagesOf = async (conversationId: string) =>
    (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conversationId}/messages`)).data.results

  test('an exhausted account credit cap refuses the turn before any model call', async () => {
    await orgAdmin.post(`/api/v1/limits/organization/test1?key=${SECRET}`, {
      name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 10, consumption: 10 }
    })
    const agent = await createAgent()
    await enrol(agent.id)
    const { conv, runId } = await startTurn(agent.id, 'hello')
    const run = await awaitRun(runId)

    assert.equal(run.status, 'error')
    // credits and steps at zero are what prove the refusal landed BEFORE the model ran.
    // The MCP fixture cannot prove it: it records headers for the tool LISTING too, so a
    // header there would not distinguish listing from invoking.
    assert.equal(run.credits ?? 0, 0)
    assert.equal(run.steps ?? 0, 0)

    const assistant = (await messagesOf(conv.id)).find((m: any) => m.role === 'assistant')
    assert.ok(assistant, 'a refusal is still a message')
    assert.match(assistant.content, /could not run/i)
    assert.match(assistant.content, /limit/i)
    assert.equal(assistant.pending, false)
  })

  test('usage is recorded against the autonomous agent, not the instructing user', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    // Non-zero prices, otherwise a mock turn costs 0 credits and records nothing at all.
    await putMockSettings(admin, 'organization/test1', { models: mockModels({ inputPricePerMillion: 1000, outputPricePerMillion: 1000 }) })
    const { runId } = await startTurn(agent.id, 'hello')
    const run = await awaitRun(runId)
    assert.equal(run.status, 'done')
    assert.ok(run.credits > 0, 'a priced turn must record what it cost')

    const usage = (await orgAdmin.get('/api/usage/organization/test1/history?scope=users&days=7')).data
    const flat = JSON.stringify(usage)
    assert.match(flat, new RegExp(`autonomous-agent:${agent.id}`), 'spend must be keyed on the agent')
    assert.doesNotMatch(flat, /test1-admin1/, 'the instructing user must not be billed for an autonomous run')
  })

  test('the per-run credit budget stops a turn that would otherwise keep calling tools', async () => {
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    // Priced so a single step blows the global per-run budget, which must then cut the loop
    // in fewer steps than the repeated-call guard would have taken.
    await putMockSettings(admin, 'organization/test1', { models: mockModels({ inputPricePerMillion: 100_000_000, outputPricePerMillion: 100_000_000 }) })
    const { conv, runId } = await startTurn(agent.id, 'loop forever')
    const run = await awaitRun(runId)

    assert.equal(run.stopReason, 'budget')
    assert.ok(run.steps < 5, `expected the budget to stop the turn before the repeated-call guard, got ${run.steps} steps`)
    const assistant = (await messagesOf(conv.id)).find((m: any) => m.role === 'assistant')
    assert.match(assistant.content, /credit budget/i)
  })

  test('a turn can be aborted, and says so', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    // 'stall' holds the response open for 30s — far longer than this test waits — so the
    // abort is what ends it.
    const { conv, runId } = await startTurn(agent.id, 'stall')
    await new Promise(resolve => setTimeout(resolve, 300))

    const res = await orgAdmin.post(`/api/autonomous-agent-runs/organization/test1/${runId}/abort`, {})
    assert.equal(res.data.aborted, true, 'the process holding the turn must report that it aborted it')

    const run = await awaitRun(runId)
    assert.equal(run.status, 'aborted')
    assert.equal(run.stopReason, 'aborted')
    const assistant = (await messagesOf(conv.id)).find((m: any) => m.role === 'assistant')
    assert.match(assistant.content, /stopped/i)
    assert.equal(assistant.pending, false)
  })

  test('aborting requires the same grant as instructing', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    const { runId } = await startTurn(agent.id, 'hello')
    await awaitRun(runId)

    // an unlisted org member cannot stop this autonomous agent
    await assert.rejects(
      orgMember.post(`/api/autonomous-agent-runs/organization/test1/${runId}/abort`, {}),
      { status: 403 }
    )

    // a listed instructor can: anyone who can start a turn can stop one
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, {
      title: agent.title,
      persona: agent.persona,
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true,
      instructors: [{ userId: 'test1-user1', userName: 'Test User' }]
    })
    const allowed = await orgMember.post(`/api/autonomous-agent-runs/organization/test1/${runId}/abort`, {})
    assert.equal(allowed.status, 200)
  })
})
