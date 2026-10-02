/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings, mockModels, mockModelRef } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { openWsClient, type WsClient } from '../../support/ws.ts'
import { conversationChannel } from '@agents/shared/conversation-channel'
import { partsText } from '../../../api/src/conversations/operations.ts'

/**
 * The tool calls of a stored turn, read out of its ordered parts.
 *
 * ONE part per call, holding its answer and its outcome too — the AI SDK's model. There is no separate
 * result part to look up by id any more.
 */
const toolCalls = (message: any) => (message.parts ?? []).filter((p: any) => p.type === 'dynamic-tool')

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })

const agentBody = (over: any = {}) => ({
  title: 'Runtime probe', persona: 'You answer briefly.', mcpServers: [], enabled: true, ...over
})

/** api/config/default.js autonomousAgentRunCredits — the per-run ceiling this test must NOT trip. */
const PER_RUN_CREDIT_BUDGET = 500

const createAgent = async (over: any = {}) =>
  (await admin.post('/api/autonomous-agents/organization/test1', agentBody(over))).data

// These cover routing and the run LIFECYCLE — locking, pickup, terminal state, terminal
// message, restart sweep. The agents here are deliberately left unconfigured and unenrolled,
// so their turns refuse; that is fine, because a refusal exercises the same lifecycle. The
// 'model loop' and 'budgets' blocks below configure a model and cover successful turns.
test.describe('Autonomous agent conversations', () => {
  // Conversations this spec locked through the dev seam. The dev-api holds the lock under its
  // OWN pid, and lib-node's Locks refreshes its own pid's locks every 30s forever, so a test
  // failing between lock and unlock would wedge that conversation for the life of the process
  // — surfacing later as an unrelated test timing out. Released unconditionally here.
  const lockedConversations: string[] = []

  test.beforeEach(async () => { await clean() })
  test.afterEach(async () => {
    for (const conversationId of lockedConversations.splice(0)) {
      await admin.post('/api/test-env/unlock-conversation', { conversationId }).catch(() => {})
    }
  })

  test('an org admin creates a thread and lists it', async () => {
    const agent = await createAgent()
    const created = await orgAdmin.post('/api/conversations/organization/test1', {
      agentId: agent.id, title: 'First thread'
    })
    assert.equal(created.status, 200)
    assert.ok(created.data.id)
    assert.equal(created.data.messageSeq, 0)

    const list = await orgAdmin.get(`/api/conversations/organization/test1?agentId=${agent.id}`)
    assert.equal(list.data.count, 1)
    assert.equal(list.data.results[0].title, 'First thread')
  })

  test('a listed instructor who is not an admin can create a thread', async () => {
    const agent = await createAgent({ instructors: [{ userId: 'test1-user1', userName: 'Test User' }] })
    const created = await orgMember.post('/api/conversations/organization/test1', {
      agentId: agent.id, title: 'Instructor thread'
    })
    assert.equal(created.status, 200)
  })

  test('a plain org member who is NOT listed is refused', async () => {
    const agent = await createAgent()
    await assert.rejects(
      orgMember.post('/api/conversations/organization/test1', { agentId: agent.id, title: 'Nope' }),
      (err: any) => { assert.equal(err.status, 403); assert.match(JSON.stringify(err.data), /instruct/i); return true }
    )
  })

  test('a thread for an unknown autonomous agent is refused 404', async () => {
    await assert.rejects(
      orgAdmin.post('/api/conversations/organization/test1', { agentId: 'no-such-agent', title: 'x' }),
      { status: 404 }
    )
  })

  test('listing threads without naming an autonomous agent is refused', async () => {
    // agentId is what the instruct check resolves against, so it cannot be
    // optional: without it there is no agent whose instructors list can be consulted.
    await assert.rejects(
      orgAdmin.get('/api/conversations/organization/test1'),
      { status: 400 }
    )
  })

  test('posting a message appends it, bumps the seq, and returns a runId', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data

    const posted = await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })
    assert.equal(posted.status, 200)
    assert.ok(posted.data.runId, 'expected a runId so the caller can poll or abort')

    const messages = await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)
    const user = messages.data.results.find((m: any) => m.role === 'user')
    assert.ok(user)
    assert.equal(user.seq, 1)
    assert.equal(partsText(user.parts), 'hello')
    // attribution is mandatory on a shared timeline
    assert.equal(user.author.kind, 'user')
    assert.equal(user.author.userId, 'test1-admin1')
  })

  test('a conversation belongs to ONE person, and another instructor cannot read it', async () => {
    // This replaces a test that asserted the opposite — two instructors sharing one timeline — which
    // was the capability this design deliberately drops. What survives is the agent-level grant: a
    // listed instructor may still START their own conversation with the agent, because that grant is
    // about borrowing the agent's permissions, which has not changed.
    const agent = await createAgent({ instructors: [{ userId: 'test1-user1', userName: 'Test User' }] })
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    assert.equal(conv.userId, 'test1-admin1', 'a conversation records the one person it belongs to')

    // The listed instructor may use the agent...
    const theirs = await orgMember.post('/api/conversations/organization/test1', { agentId: agent.id, title: 'mine' })
    assert.equal(theirs.status, 200)

    // ...but not read, write or erase the admin's thread.
    await assert.rejects(orgMember.get(`/api/conversations/organization/test1/${conv.id}/messages`), { status: 403 })
    await assert.rejects(
      orgMember.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' }),
      { status: 403 }
    )
    await assert.rejects(orgMember.delete(`/api/conversations/organization/test1/${conv.id}`), { status: 403 })

    // And listing shows each person only their own.
    const mine = (await orgAdmin.get(`/api/conversations/organization/test1?agentId=${agent.id}`)).data
    assert.deepEqual(mine.results.map((c: any) => c.id), [conv.id])
    const theirList = (await orgMember.get(`/api/conversations/organization/test1?agentId=${agent.id}`)).data
    assert.deepEqual(theirList.results.map((c: any) => c.id), [theirs.data.id])
  })

  test('an empty message is refused rather than starting a run', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    await assert.rejects(
      orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: '   ' }),
      { status: 400 }
    )
  })

  test('sinceSeq returns only newer messages, so a poller can page forward', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    // Wait for the turn to finish first: the executor appends its own message, so without
    // this the assistant message can land between the two reads below and the assertion
    // becomes a race.
    await pollRun(runId)

    const all = await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)
    const highest = Math.max(...all.data.results.map((m: any) => m.seq))
    const since = await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages?sinceSeq=${highest}`)
    assert.equal(since.data.results.length, 0)
  })

  test('a conversation of another account cannot be reached', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    // 404, NOT the 403 Plan A's admin-only routes give: these routes cannot call
    // assertAccountRole on the owner at all, because a listed instructor may legitimately
    // come from another account (the cross-account instruct grant). Owner scoping is
    // therefore enforced by the lookup itself, which simply does not find it.
    await assert.rejects(
      orgAdmin.get(`/api/conversations/organization/dev1/${conv.id}/messages`),
      { status: 404 }
    )
  })

  test('a personal-account owner is refused, as autonomous agents are org-only', async () => {
    await assert.rejects(
      orgAdmin.post('/api/conversations/user/test1-admin1', { agentId: 'x', title: 'y' }),
      { status: 400 }
    )
  })

  // The executor is asynchronous and there is no websocket yet, so these poll rather
  // than sleep a fixed time.
  const pollRun = async (runId: string) => {
    for (let i = 0; i < 60; i++) {
      const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') return run
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('run never reached a terminal status')
  }

  const pollAssistants = async (conversationId: string, atLeast: number) => {
    for (let i = 0; i < 80; i++) {
      const messages = (await orgAdmin.get(`/api/conversations/organization/test1/${conversationId}/messages`)).data.results
      const done = messages.filter((m: any) => m.role === 'assistant' && m.pending === false)
      if (done.length >= atLeast) return done
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`fewer than ${atLeast} finished assistant messages`)
  }

  test('a run reaches a terminal status and the assistant message is attributed to the autonomous agent', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data

    const run = await pollRun(runId)
    assert.notEqual(run.status, 'running')
    assert.ok(run.endedAt)

    const messages = (await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)).data.results
    const assistant = messages.find((m: any) => m.role === 'assistant')
    assert.ok(assistant, 'a run must always leave an assistant message — failure is a message, not a silence')
    assert.equal(assistant.author.kind, 'autonomous-agent')
    assert.equal(assistant.runId, runId)
    assert.equal(assistant.pending, false)
    assert.ok(assistant.seq > messages.find((m: any) => m.role === 'user').seq)
  })

  test('a message posted while the conversation is locked is queued, not dropped, and is picked up later', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data

    // Hold the lock from outside so this is deterministic. Posting two messages and hoping
    // they overlap is a race: the in-process executor usually finishes the first turn
    // before the second post lands, so the contended path would go untested.
    const locked = await admin.post('/api/test-env/lock-conversation', { conversationId: conv.id })
    assert.equal(locked.data.acquired, true)
    lockedConversations.push(conv.id)

    const first = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await new Promise(resolve => setTimeout(resolve, 300))
    const blocked = (await orgAdmin.get(`/api/runs/organization/test1/${first.runId}`)).data
    assert.equal(blocked.status, 'running', 'a run whose conversation is locked must stay queued, not be dropped or failed')
    const during = (await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)).data.results
    assert.equal(during.filter((m: any) => m.role === 'assistant' && m.pending === false).length, 0)

    await admin.post('/api/test-env/unlock-conversation', { conversationId: conv.id })

    // The next post's executor acquires the freed lock and must drain BOTH pending runs,
    // the queued one first.
    await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello again' })
    const assistants = await pollAssistants(conv.id, 2)
    assert.equal(assistants.length, 2, 'the queued run must not be dropped by the lock')
    // seq is monotonic, so ordering is observable
    assert.ok(assistants[1].seq > assistants[0].seq)
    const firstRun = (await orgAdmin.get(`/api/runs/organization/test1/${first.runId}`)).data
    assert.notEqual(firstRun.status, 'running', 'the queued run must have been picked up, not left running')
    assert.ok(firstRun.endedAt)
  })

  test('a run left running by a restart is swept to interrupted, with a message', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await pollRun(runId)

    // Simulate the orphan a restart leaves behind: a run still marked running whose
    // process is gone. The boot sweep must give it an honest terminal state rather than
    // leave a conversation that appears to be thinking forever.
    await admin.post('/api/test-env/orphan-run', { runId })
    const swept = await admin.post('/api/test-env/recover-ownerless-runs', {})
    assert.ok(swept.data.interrupted >= 1)

    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    assert.equal(run.status, 'interrupted')
    assert.ok(run.endedAt)
    const messages = (await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)).data.results
    const forRun = messages.filter((m: any) => m.role === 'assistant' && m.runId === runId)
    assert.equal(forRun.length, 1, 'the sweep must not append a second message beside the one already there')
    assert.equal(forRun[0].pending, false)
    assert.ok(partsText(forRun[0].parts).length > 0)
  })

  test('a run that already STARTED is never resumed, only interrupted', async () => {
    // The whole point of recovery having one rule. runTurn appends the assistant message before
    // performTurn opens the agent's tools, so "has an assistant message" means the turn began and its
    // tool calls may already have fired. Resuming such a run re-executes them — at-least-once side
    // effects on a catalog that may contain writes — and appends a SECOND assistant message, breaking
    // the invariant that a run leaves exactly one.
    //
    // Two mechanisms used to disagree about this population: the boot sweep marked it `interrupted`
    // while a 30s reaper resumed it.
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await pollRun(runId)

    await admin.post('/api/test-env/orphan-run', { runId })
    await admin.post('/api/test-env/recover-ownerless-runs', {})
    // Long enough that a resume would have produced its message by now.
    await new Promise(resolve => setTimeout(resolve, 1500))

    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    assert.equal(run.status, 'interrupted', 'a started run must be interrupted, never resumed')
    const forRun = (await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)).data.results
      .filter((m: any) => m.role === 'assistant' && m.runId === runId)
    assert.equal(forRun.length, 1, 'resuming would append a second assistant message for the same run')
    assert.equal(forRun[0].pending, false, 'and would leave the first one pending for ever')
  })

  test('a run that NEVER started is resumed, because nothing can have fired yet', async () => {
    // The other half of the rule, and why recovery cannot simply interrupt everything: a process that
    // died between createRun and appendMessage left a run that has done nothing. Interrupting it would
    // lose a turn the instructor is waiting for, and resuming it is safe precisely because no tool call
    // can have happened — the message is created before the tools are opened.
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await pollRun(runId)

    // Enrolled, so the resumed turn can actually reach a model and produce an answer — otherwise it
    // refuses for lack of an identity and 'error' would be mistaken for "resume does not work".
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    await admin.post('/api/test-env/orphan-run', { runId, dropMessage: true })
    await admin.post('/api/test-env/recover-ownerless-runs', {})

    const run = await pollRun(runId)
    assert.equal(run.status, 'done', 'a never-started run must be run, not written off')
    const forRun = (await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)).data.results
      .filter((m: any) => m.role === 'assistant' && m.runId === runId)
    assert.equal(forRun.length, 1)
    assert.equal(partsText(forRun[0].parts), 'world', 'the resumed turn really ran')
  })

  test('a run whose conversation lock is HELD is left alone, on both branches', async () => {
    // The branch that decides a `running` run is NOT ownerless. Untested until now, and the failure is
    // destructive rather than inert: another instance is streaming that turn, and recovery would append
    // "interrupted by a restart" into a live conversation and — because finishRun is conditional on
    // status 'running' — make the real turn's completion a silent no-op, so the run reports interrupted
    // for a turn that actually succeeded.
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await pollRun(runId)

    await admin.post('/api/test-env/orphan-run', { runId })
    await admin.post('/api/test-env/lock-conversation', { conversationId: conv.id })
    try {
      const res = await admin.post('/api/test-env/recover-ownerless-runs', {})
      assert.equal(res.data.interrupted, 0, 'a lock-held run must not be interrupted')
      assert.equal(res.data.resumed, 0, 'nor resumed')
      assert.ok(res.data.skipped >= 1, 'it must be reported as skipped, so the reason is visible')
      const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      assert.equal(run.status, 'running', 'the live holder keeps ownership')
    } finally {
      await admin.post('/api/test-env/unlock-conversation', { conversationId: conv.id })
    }
  })

  test('a resumed run that cannot succeed still ends terminal with exactly one message', async () => {
    // The harder half of "a run always leaves exactly one assistant message", under the recovery rule.
    // This used to assert that recovery WROTE the message itself for a message-less orphan; it now
    // resumes instead, so the invariant has to hold through a turn that refuses. The agent is
    // deliberately NOT enrolled, so the resumed turn declines for lack of an identity.
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await pollRun(runId)

    await admin.post('/api/test-env/orphan-run', { runId, dropMessage: true })
    const recovered = await admin.post('/api/test-env/recover-ownerless-runs', {})
    assert.equal(recovered.data.resumed, 1, 'a message-less orphan is resumed, not written off')

    const run = await pollRun(runId)
    assert.ok(run.endedAt, 'it must not be left running for ever')
    const forRun = (await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)).data.results
      .filter((m: any) => m.role === 'assistant' && m.runId === runId)
    assert.equal(forRun.length, 1, 'exactly one, even when the turn could not run')
    assert.ok(partsText(forRun[0].parts).length > 0, 'and it explains itself rather than being blank')
    assert.equal(forRun[0].pending, false)
  })

  test('a stored conversation satisfies its own schema', async () => {
    // The schema has additionalProperties: false, and the service $sets updatedAt on every version bump
    // and every appended message — but never declared it. So every live document violated its schema and
    // the generated type lacked a field the collection always has. Nothing validates on write, so only a
    // test comparing the document to the declared properties catches it.
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })

    const stored = (await orgAdmin.get(`/api/conversations/organization/test1?agentId=${agent.id}`))
      .data.results.find((c: any) => c.id === conv.id)
    const schema = (await import('../../../api/types/conversation/schema.js')).default
    const declared = new Set(Object.keys(schema.properties))
    const undeclared = Object.keys(stored).filter(k => !declared.has(k))
    assert.deepEqual(undeclared, [], `stored keys not in the schema: ${undeclared.join(', ')}`)
    assert.ok(declared.has('updatedAt') && stored.updatedAt, 'updatedAt is written, so it must be declared')
  })

  test('a run of another account cannot be read', async () => {
    const agent = await createAgent()
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    await assert.rejects(
      orgAdmin.get(`/api/runs/organization/dev1/${runId}`),
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
    fixture.resetInvokedTools()
    // The org needs a resolvable assistant model; the mock provider is the deterministic seam.
    await putMockSettings(admin, 'organization/test1')
  })

  /** Dev cannot complete a real enrolment (see the seam's comment), so set the field directly. */
  const enrol = async (agentId: string) => {
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  }

  /** One turn in an EXISTING conversation, so a test can assert what a later turn sees. */
  const runTurn = async (conversationId: string, content: string) => {
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conversationId}/messages`, { content })).data
    let run
    for (let i = 0; i < 100; i++) {
      run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    const messages = (await orgAdmin.get(`/api/conversations/organization/test1/${conversationId}/messages`)).data.results
    return { run, messages, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
  }

  const runOnce = async (agentId: string, content: string) => {
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId, title: 't' })).data
    return runTurn(conv.id, content)
  }

  test('a real model turn produces the model\'s answer', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'hello')
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'completed')
    // the mock model answers "hello" with "world" — proves prompt assembly, model
    // resolution, streaming and persistence all joined up
    assert.equal(partsText(assistant.parts), 'world')
    assert.equal(assistant.pending, false)
    assert.ok(run.steps >= 1)
  })

  test('reasoning tokens are persisted separately from the answer', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    const { assistant } = await runOnce(agent.id, 'reason')
    assert.equal(partsText(assistant.parts), 'world')
    // Reasoning is its own part, kept out of the visible text — and never replayed to a provider.
    assert.deepEqual(
      assistant.parts.filter((p: any) => p.type === 'reasoning'),
      [{ type: 'reasoning', text: 'Let me think about it.' }]
    )
  })

  test('a tool call reaches a real MCP server and is recorded with its server', async () => {
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'call tool echo {"value":"x"}')
    assert.equal(run.status, 'done')
    assert.ok(toolCalls(assistant).length, 'expected the tool call to be recorded on the message')
    const call = toolCalls(assistant).find((c: any) => c.toolName === 'echo')
    assert.ok(call, 'expected the echo tool call')
    assert.equal(call.toolMetadata.serverId, 'dev-public-mcp')
    // GROUND TRUTH from the MCP server itself. Asserting on the model's behaviour cannot
    // prove the tool ran: the mock answers 'done' to any tool-role message, an execution
    // ERROR included, so steps/content look identical whether or not the call ever reached
    // the server. This assertion is the one that fails if the client is closed too early.
    assert.deepEqual(fixture.invokedTools(), ['echo'], 'the MCP server must have actually executed the tool')
    // What it was ASKED to do, not merely that it was called — the difference that makes a write
    // auditable and an injection visible after the fact.
    assert.deepEqual(call.input, { value: 'x' }, 'the message must record the arguments the agent sent')
    assert.equal(run.stopReason, 'completed')
    assert.equal(run.steps, 2)
    assert.equal(partsText(assistant.parts), 'done')

    // The RESULT is stored, which is what makes this conversation revivable: without it a later turn
    // would replay a call with no answer — a history providers reject — so the call had to be dropped
    // too, and the model resumed seeing neither the data nor the fact that it had acted. It is the
    // SAME part as the call, which is what keeps the two from being stored or dropped independently.
    assert.equal(call.state, 'output-available', 'the call must be settled, and settled as a success')
    // Stored as the model received it, provenance envelope included.
    assert.match(call.output, /echo:x/, 'the stored result must be what the tool actually returned')
    assert.match(call.output, /<tool-result server="dev-public-mcp" tool="echo">/)
  })

  test('a tool that FAILS is recorded as a failure, not as a result', async () => {
    // The conflation this shape exists to make impossible, and the assertion that was unwritable until
    // the fixture had a tool that could fail: every fixture tool succeeded, so a failed call stored in
    // the exact shape of a successful one looked correct. The MCP tool reports `isError` rather than
    // throwing — the case the client used to return as ordinary data.
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'call tool explode {}')
    assert.deepEqual(fixture.invokedTools(), ['explode'], 'the tool must actually have been reached')
    const call = toolCalls(assistant).find((c: any) => c.toolName === 'explode')
    assert.ok(call, 'expected the failed call to be recorded at all')
    assert.equal(call.state, 'output-error', 'a failure is the part\'s STATE, so nothing downstream can drop it')
    assert.match(call.errorText, /nothing to explode/, 'and it carries what the tool said')
    // INSIDE the provenance envelope, like any other tool output. A failure carries the tool's own
    // words, so the failure path was the one place the model was handed unattributed, tool-authored
    // text — exactly what the envelope exists to prevent.
    assert.match(call.errorText, /<tool-result server="dev-public-mcp" tool="explode">/)
    // A failed tool does not stop the turn: the model is handed the error and keeps going.
    assert.equal(run.status, 'done')
    assert.ok(partsText(assistant.parts).length > 0, 'the turn still answers rather than going blank')
  })

  test("a tool's MCP annotations are recorded on the call", async () => {
    // readOnlyHint / destructiveHint are what make a write auditable after the fact, and they are the
    // input P1's approval gate reads. They were listed by the diagnostic endpoint and dropped on the
    // path that actually runs a tool — the one path where they matter.
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const { assistant } = await runOnce(agent.id, 'call tool wipe_everything {}')
    const call = toolCalls(assistant).find((c: any) => c.toolName === 'wipe_everything')
    assert.ok(call)
    assert.equal(call.toolMetadata.annotations.destructiveHint, true)
    assert.equal(call.toolMetadata.annotations.readOnlyHint, false)
  })

  test("a later turn sees the PREVIOUS turn's tool result, replayed from the store", async () => {
    // The property the whole storage model exists for, asserted end to end for the first time. Every
    // other test reads what was WRITTEN; this reads what the model was later SENT. The previous shape
    // stored a call without its result, so a second turn replayed a call with no answer — and the mock
    // answered from the last user message alone, which is why losing the result was invisible.
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    await runTurn(conv.id, 'call tool echo {"value":"remembered"}')

    const { run, assistant } = await runTurn(conv.id, 'recall')
    assert.equal(run.status, 'done')
    assert.match(partsText(assistant.parts), /remembered/, 'the tool result of turn 1 must have reached the model on turn 2')
  })

  test('a stored message that no longer matches the message model fails the turn, loudly', async () => {
    // The stored `parts` schema is loose on purpose — the state machine belongs to the library — so
    // nothing on the write path would catch a document the library no longer accepts. The read-side
    // validation is the only guard, and its whole point is to fail with an explanation rather than let
    // a half-reconstructed history reach the provider as a 400.
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    await runTurn(conv.id, 'hello')
    await admin.post('/api/test-env/corrupt-message', {
      conversationId: conv.id,
      seq: 1,
      parts: [{ type: 'dynamic-tool', toolCallId: 'c1', toolName: 'echo', state: 'finished-probably' }]
    })

    const { run, assistant } = await runTurn(conv.id, 'hello')
    assert.equal(run.status, 'error')
    // The invariant: a failure is a message, not a silence.
    assert.ok(partsText(assistant.parts).length > 0, 'a blank bubble is the silent stop this forbids')
    assert.match(partsText(assistant.parts), /replay/i)
  })

  test('recovering a started run does NOT re-execute its tool calls', async () => {
    // The property the recovery rule exists for, asserted on GROUND TRUTH from the MCP server rather
    // than on a proxy like the message count. A run that already called a tool must never be resumed:
    // MCP tools are not required to be idempotent, and the operator catalog may contain writes, so
    // re-running a turn is at-least-once execution of real side effects.
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'call tool echo {"value":"x"}' })).data
    for (let i = 0; i < 100; i++) {
      const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.deepEqual(fixture.invokedTools(), ['echo'], 'the turn must have called the tool once')

    // Now manufacture the orphan a dead holder leaves: the run is `running` again, its assistant
    // message is back to pending, and no lock is held.
    await admin.post('/api/test-env/orphan-run', { runId })
    const recovered = await admin.post('/api/test-env/recover-ownerless-runs', {})
    assert.equal(recovered.data.resumed, 0, 'a started run must not be resumed')
    assert.ok(recovered.data.interrupted >= 1)
    // Generous, so a resume would have had time to reach the server.
    await new Promise(resolve => setTimeout(resolve, 1500))

    assert.deepEqual(fixture.invokedTools(), ['echo'], 'the tool must NOT have run a second time')
  })

  test('with two MCP servers, provenance names the server the tool actually came from', async () => {
    // Both dev servers point at the same fixture and need no session, so the tool names
    // collide and last-write-wins picks the SECOND. Mapping every tool to mcpServers[0] —
    // which is what a per-server loop over all names does — would name the first, so this
    // distinguishes a correct mapping from a plausible-looking guess.
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }, { serverId: 'dev-apikey-mcp' }] })
    await enrol(agent.id)
    const { assistant } = await runOnce(agent.id, 'call tool echo {"value":"x"}')
    const call = toolCalls(assistant).find((c: any) => c.toolName === 'echo')
    assert.ok(call)
    assert.equal(call.toolMetadata.serverId, 'dev-apikey-mcp')
    assert.equal(call.state, 'output-available', 'the tool must have returned a usable result')
  })

  test('a disabled autonomous agent refuses to act', async () => {
    const agent = await createAgent({ enabled: false })
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'hello')
    // enabled is the kill switch; if it does not stop a turn it stops nothing at all.
    assert.equal(run.status, 'error')
    assert.notEqual(partsText(assistant.parts), 'world')
    assert.match(partsText(assistant.parts), /disabled/i)
  })

  test('an empty completion does not render as a blank, successful turn', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'empty')
    assert.ok(partsText(assistant.parts).trim().length > 0, 'a blank bubble is the silent stop this forbids')
    assert.notEqual(run.stopReason, 'completed')
    assert.equal(assistant.pending, false)
  })

  test('the repeated-call guard stops a looping turn as a truncation, not an error', async () => {
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const { run, assistant } = await runOnce(agent.id, 'loop forever')
    // A guard-stopped turn did work and said so; only a throw is an error.
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'repeated-calls')
    assert.ok(run.steps > 1, 'expected several steps before the guard fired')
    assert.ok(partsText(assistant.parts).length > 0, 'a truncated turn must still explain itself')
    assert.match(partsText(assistant.parts), /repeating the same tool call/i)
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
    assert.match(partsText(assistant.parts), /identity|enrol/i)
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
    assert.ok(partsText(assistant.parts).length > 0)
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
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content })).data
    return { conv, runId }
  }

  const awaitRun = async (runId: string, tries = 120) => {
    for (let i = 0; i < tries; i++) {
      const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') return run
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('run never reached a terminal status')
  }

  const messagesOf = async (conversationId: string) =>
    (await orgAdmin.get(`/api/conversations/organization/test1/${conversationId}/messages`)).data.results

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
    assert.match(partsText(assistant.parts), /could not run/i)
    assert.match(partsText(assistant.parts), /limit/i)
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
    assert.match(partsText(assistant.parts), /credit budget/i)
  })

  test('the account credit cap stops a turn that crosses it MID-RUN', async () => {
    // enforceQuotas ran once, before the loop, and the only in-turn ceiling was the per-run budget
    // (500 credits). The conversation lock serialises turns within ONE conversation, but nothing caps
    // conversations or concurrent runs — so N conversations posted at once all pass the same pre-spend
    // check and each may then spend a full per-run budget past an exhausted account cap. Overshoot was
    // N x 500 credits of real provider spend before the cap bit on the next turn.
    //
    // Re-checking the account cap between steps bounds that to roughly one step per concurrent run.
    // This asserts the single-run half of it, which is the mechanism: the cap is crossed during the
    // turn and must stop it, rather than the turn running on to its own budget.
    await orgAdmin.post(`/api/v1/limits/organization/test1?key=${SECRET}`, {
      name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 200, consumption: 0 }
    })
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    // Priced so ONE step costs ~110 credits. That is deliberately under the 500-credit per-run budget:
    // if a step blew that first, this test would pass on the wrong ceiling and prove nothing. Two steps
    // then cross the 200 account cap.
    await putMockSettings(admin, 'organization/test1', {
      models: mockModels({ inputPricePerMillion: 4_000, outputPricePerMillion: 4_000 })
    })
    const { conv, runId } = await startTurn(agent.id, 'loop forever')
    const run = await awaitRun(runId)

    assert.ok(run.endedAt, 'the turn must end rather than run on')
    const assistant = (await messagesOf(conv.id)).find((m: any) => m.role === 'assistant')
    assert.match(partsText(assistant.parts), /account credit limit/i, 'and must say the ACCOUNT cap stopped it, not its own budget')

    // The overshoot is what this bounds: spend past the cap must be about one step, not a whole
    // per-run budget.
    const { consumption } = (await orgAdmin.get('/api/v1/limits/organization/test1' + `?key=${SECRET}`)).data.ai_credits
    assert.ok(consumption > 200, 'the cap is crossed — that is the premise')
    assert.ok(consumption < 200 + PER_RUN_CREDIT_BUDGET, `overshoot must be bounded by roughly one step, got ${consumption}`)
  })

  test('a turn can be aborted, and says so', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    // 'stall' holds the response open for 30s — far longer than this test waits — so the
    // abort is what ends it.
    const { conv, runId } = await startTurn(agent.id, 'stall')
    await new Promise(resolve => setTimeout(resolve, 300))

    const res = await orgAdmin.post(`/api/runs/organization/test1/${runId}/abort`, {})
    assert.equal(res.data.aborted, true, 'the process holding the turn must report that it aborted it')

    const run = await awaitRun(runId)
    assert.equal(run.status, 'aborted')
    assert.equal(run.stopReason, 'aborted')
    const assistant = (await messagesOf(conv.id)).find((m: any) => m.role === 'assistant')
    assert.match(partsText(assistant.parts), /stopped/i)
    assert.equal(assistant.pending, false)
  })

  test('disabling an autonomous agent stops the turn it is already running', async () => {
    // The kill switch was read only at the START of a turn, so disabling an agent left whatever it was
    // already doing running to completion — tool calls included. For a control whose entire purpose is
    // "make it stop", the gap between "stop" and "stops eventually" is the defect.
    const agent = await createAgent()
    await enrol(agent.id)
    // 'stall' holds the response open for 30s, far longer than this test waits, so only the disable can
    // end it.
    const { conv, runId } = await startTurn(agent.id, 'stall')
    await new Promise(resolve => setTimeout(resolve, 300))

    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, {
      title: agent.title, persona: agent.persona, mcpServers: [], enabled: false
    })

    const run = await awaitRun(runId)
    assert.equal(run.status, 'aborted', 'the live turn must have been stopped by the disable')
    assert.ok(run.endedAt)
    const assistant = (await messagesOf(conv.id)).find((m: any) => m.role === 'assistant')
    assert.ok(partsText(assistant.parts).length > 0, 'and it still explains itself rather than going blank')
    assert.equal(assistant.pending, false)
  })

  test('deleting an autonomous agent erases its conversations, messages and runs', async () => {
    // These used to be left behind for ever, with no route that could reach them: every read path
    // resolves through the agent, and the agent was gone. Orphaned data an admin can neither see,
    // export nor erase is not a defensible state for a store that now holds whole tool results.
    const agent = await createAgent()
    await enrol(agent.id)
    const { conv, runId } = await startTurn(agent.id, 'hello')
    await awaitRun(runId)
    assert.ok((await messagesOf(conv.id)).length >= 2, 'the thread has to exist before deleting proves anything')

    await admin.delete(`/api/autonomous-agents/organization/test1/${agent.id}`)

    // Nothing resolves through the deleted agent any more, so the only honest check is the store — read
    // through the dev seam rather than through a route that now 404s for the wrong reason.
    const left = (await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data
    assert.deepEqual(left, { conversations: 0, messages: 0, runs: 0 })
  })

  test('the person a thread belongs to can erase it without deleting the autonomous agent', async () => {
    // The means to comply with an erasure request while the agent stays in use. The actor is now the
    // thread's OWNER rather than any instructor of the agent — erasure follows ownership, like reading.
    const agent = await createAgent({ instructors: [{ userId: 'test1-user1', userName: 'Test User' }] })
    await enrol(agent.id)
    const { conv, runId } = await startTurn(agent.id, 'hello')
    await awaitRun(runId)
    const other = await startTurn(agent.id, 'hello')
    await awaitRun(other.runId)

    const res = await orgAdmin.delete(`/api/conversations/organization/test1/${conv.id}`)
    assert.equal(res.status, 204)

    const left = (await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data
    assert.equal(left.conversations, 1, 'only the named thread is erased')
    // And the messages went with it, rather than being left unreachable behind a deleted conversation.
    const remaining = await messagesOf(other.conv.id)
    assert.ok(remaining.length >= 2)
    assert.equal(left.messages, remaining.length)
    await assert.rejects(orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`), { status: 404 })
  })

  test('erasing someone else\'s thread is refused, even for a listed instructor', async () => {
    // Being allowed to USE the agent is not being allowed to touch another person's conversation with
    // it — the distinction the ownership model introduces.
    const agent = await createAgent({ instructors: [{ userId: 'test1-user1', userName: 'Test User' }] })
    await enrol(agent.id)
    const { conv } = await startTurn(agent.id, 'hello')
    await assert.rejects(
      orgMember.delete(`/api/conversations/organization/test1/${conv.id}`),
      { status: 403 }
    )
  })

  test('aborting follows OWNERSHIP of the thread, not the agent grant', async () => {
    // It used to follow the agent grant, which meant any listed instructor could stop anyone else's
    // turn — and read their run's status and spend. With one person per conversation that is a
    // cross-user action, so it follows ownership like reading and erasing.
    const agent = await createAgent({ instructors: [{ userId: 'test1-user1', userName: 'Test User' }] })
    await enrol(agent.id)
    const live = await startTurn(agent.id, 'stall')
    await new Promise(resolve => setTimeout(resolve, 300))

    // A listed instructor of the agent, but not this thread's owner.
    await assert.rejects(
      orgMember.post(`/api/runs/organization/test1/${live.runId}/abort`, {}),
      { status: 403 }
    )
    // Reading the run is refused for the same reason: it carries status and spend.
    await assert.rejects(
      orgMember.get(`/api/runs/organization/test1/${live.runId}`),
      { status: 403 }
    )

    // The owner can. Asserted against a LIVE turn — aborting a finished run returns 200 with
    // {aborted:false}, which would pass while proving only that the 403 is gone.
    const allowed = await orgAdmin.post(`/api/runs/organization/test1/${live.runId}/abort`, {})
    assert.equal(allowed.status, 200)
    assert.equal(allowed.data.aborted, true, 'the thread\'s owner must be able to stop a turn in flight')
    assert.equal((await awaitRun(live.runId)).status, 'aborted')
  })
})

test.describe('Autonomous agent conversation events', () => {
  // Every client is closed here: a leaked socket holds a dev-api connection open and surfaces
  // later as an unrelated test timing out.
  const clients: WsClient[] = []
  const open = async (cookie?: string) => {
    const client = await openWsClient(cookie)
    clients.push(client)
    return client
  }
  const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })
  test.afterEach(() => { for (const client of clients.splice(0)) client.close() })

  const newConversation = async (agentId: string) =>
    (await orgAdmin.post('/api/conversations/organization/test1', { agentId, title: 't' })).data

  test('an admin of the owning org may subscribe to its conversation', async () => {
    const agent = await createAgent()
    const conv = await newConversation(agent.id)
    const client = await open(await cookieOf(orgAdmin))
    const res = await client.subscribe(conversationChannel(conv.id))
    assert.equal(res.type, 'subscribe-confirm')
    assert.equal(res.channel, conversationChannel(conv.id))
  })

  test('a listed instructor may subscribe, and an unlisted member may not', async () => {
    // The same rule as the HTTP routes, through the same canInstruct — which is the point of
    // routing both through it. A superadmin is deliberately NOT tested here: ws-server skips
    // canSubscribe entirely for a session in admin mode, so it would prove nothing.
    const agent = await createAgent()
    const conv = await newConversation(agent.id)

    const refused = await open(await cookieOf(orgMember))
    const refusal = await refused.subscribe(conversationChannel(conv.id))
    assert.equal(refusal.type, 'error')
    assert.equal(refusal.status, 403)

    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, {
      title: agent.title,
      persona: agent.persona,
      mcpServers: [],
      enabled: true,
      instructors: [{ userId: 'test1-user1', userName: 'Test User' }]
    })
    const allowed = await open(await cookieOf(orgMember))
    assert.equal((await allowed.subscribe(conversationChannel(conv.id))).type, 'subscribe-confirm')
  })

  test('a channel naming no conversation is refused', async () => {
    const client = await open(await cookieOf(orgAdmin))
    assert.equal((await client.subscribe(conversationChannel('no-such-conversation'))).status, 403)
  })

  test('a channel with extra segments is refused rather than widened', async () => {
    const agent = await createAgent()
    const conv = await newConversation(agent.id)
    const client = await open(await cookieOf(orgAdmin))
    assert.equal((await client.subscribe(`${conversationChannel(conv.id)}/messages`)).status, 403)
  })

  test('an anonymous client is refused', async () => {
    const agent = await createAgent()
    const conv = await newConversation(agent.id)
    const client = await open()
    assert.equal((await client.subscribe(conversationChannel(conv.id))).status, 403)
  })
})

test.describe('Autonomous agent live conversation notifications', () => {
  const clients: WsClient[] = []
  const open = async (cookie?: string) => {
    const client = await openWsClient(cookie)
    clients.push(client)
    return client
  }
  const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })
  test.afterEach(() => { for (const client of clients.splice(0)) client.close() })

  const enrol = async (agentId: string) => { await admin.post('/api/test-env/enrol-autonomous-agent', { agentId }) }
  const messagesSince = async (conversationId: string, sinceVersion?: number) => {
    const query = sinceVersion === undefined ? '' : `?sinceVersion=${sinceVersion}`
    return (await orgAdmin.get(`/api/conversations/organization/test1/${conversationId}/messages${query}`)).data
  }

  /** Subscribe, post, and collect notifications until the run reaches a terminal state. */
  const watchTurn = async (content: string, agentOver: any = {}) => {
    const agent = await createAgent(agentOver)
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const client = await open(await cookieOf(orgAdmin))
    const channel = conversationChannel(conv.id)
    assert.equal((await client.subscribe(channel)).type, 'subscribe-confirm')

    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content })).data

    const notifications: any[] = []
    for (let i = 0; i < 400; i++) {
      const msg = await client.next(8000)
      if (msg.channel !== channel) continue
      notifications.push(msg.data)
      const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') break
    }
    return { agent, conv, runId, notifications, client, channel }
  }

  test('a notification carries only the conversation and its version — no content', async () => {
    const { notifications } = await watchTurn('hello')
    assert.ok(notifications.length >= 1)
    for (const notification of notifications) {
      // The whole point of the redesign: nothing that could leak to a subscriber whose grant was
      // revoked while its socket stayed open, and nothing that can outgrow ws-emitter's 100 KB
      // capped queue.
      assert.deepEqual(Object.keys(notification).sort(), ['conversationId', 'version'])
      assert.equal(typeof notification.version, 'number')
    }
  })

  test('versions are monotonic, so a client can hold one cursor', async () => {
    const { notifications } = await watchTurn('hello')
    const versions = notifications.map((n: any) => n.version)
    assert.deepEqual(versions, [...versions].sort((a, b) => a - b))
    assert.equal(new Set(versions).size, versions.length, 'a version must never be reused')
  })

  test('sinceVersion fetches an IN-PLACE update, which sinceSeq structurally cannot', async () => {
    // This is the gap that made the notification design need a version at all: the assistant
    // message is created empty and pending, then filled in at the SAME seq.
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const client = await open(await cookieOf(orgAdmin))
    await client.subscribe(conversationChannel(conv.id))

    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data
    // Catch up once, early, then wait for the turn to finish. The assistant message is created by
    // the executor, which the POST does not await, so wait for it to appear rather than assuming
    // it is there the instant the POST returns.
    let early: any
    for (let i = 0; i < 100; i++) {
      early = await messagesSince(conv.id)
      if (early.results.some((m: any) => m.role === 'assistant')) break
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    const assistantEarly = early.results.find((m: any) => m.role === 'assistant')
    assert.ok(assistantEarly, 'the assistant message must exist from the start of the turn')
    const cursor = early.version
    const highestSeq = Math.max(...early.results.map((m: any) => m.seq))

    for (let i = 0; i < 100; i++) {
      const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const bySeq = await messagesSince(conv.id)
    assert.equal(bySeq.results.filter((m: any) => m.seq > highestSeq).length, 0, 'no NEW message was added by finishing the turn')

    const byVersion = await messagesSince(conv.id, cursor)
    const refreshed = byVersion.results.find((m: any) => m.role === 'assistant')
    assert.ok(refreshed, 'the finished assistant message must come back through sinceVersion')
    assert.equal(refreshed.pending, false)
    assert.equal(partsText(refreshed.parts), 'world')
    assert.ok(byVersion.version > cursor, 'the response carries the cursor to store next')
  })

  test('the partial answer is PERSISTED as it streams, so a mid-turn fetch shows real text', async () => {
    // Publishing the text instead would have made a mid-turn refetch return an empty message and
    // visibly lose what the reader was just shown.
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'long answer' })).data

    let sawPartial = false
    for (let i = 0; i < 100; i++) {
      const messages = (await messagesSince(conv.id)).results
      const assistant = messages.find((m: any) => m.role === 'assistant')
      if (assistant?.pending === true && partsText(assistant.parts).length > 0) { sawPartial = true; break }
      const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    assert.ok(sawPartial, 'a pending assistant message must carry the text produced so far')
  })

  test('a long answer produces far fewer notifications than characters', async () => {
    const { conv, notifications } = await watchTurn('long answer')
    const finished = (await messagesSince(conv.id)).results.find((m: any) => m.role === 'assistant')
    assert.ok(partsText(finished.parts).length > 200, 'this test needs a long answer to be meaningful')
    assert.ok(
      notifications.length < partsText(finished.parts).length / 10,
      `expected throttling, got ${notifications.length} notifications for ${partsText(finished.parts).length} chars`
    )
  })

  test('a FAILING turn notifies its finalised message before the run closes', async () => {
    // The ordering regression this pins: a client that stops at the terminal run state must
    // already have been told about the finalised message, or it shows one stuck pending forever.
    const { conv, runId } = await watchTurn('stream error')
    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    assert.equal(run.status, 'error')
    const assistant = (await messagesSince(conv.id)).results.find((m: any) => m.role === 'assistant')
    assert.equal(assistant.pending, false, 'a failed turn must not leave its message pending')
    assert.ok(partsText(assistant.parts).length > 0)
    assert.ok(assistant.version < run.version, 'the message must reach its final version BEFORE the run closes')
  })

  test('an aborted turn also finalises its message before the run closes', async () => {
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content: 'stall' })).data
    await new Promise(resolve => setTimeout(resolve, 300))
    await orgAdmin.post(`/api/runs/organization/test1/${runId}/abort`, {})

    let run: any
    for (let i = 0; i < 100; i++) {
      run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.equal(run.status, 'aborted')
    const assistant = (await messagesSince(conv.id)).results.find((m: any) => m.role === 'assistant')
    assert.equal(assistant.pending, false)
    assert.ok(assistant.version < run.version)
  })
})

test.describe('Autonomous agent run traces', () => {
  // The fixture is needed even though these tests are about traces: an agent referencing an MCP
  // server whose endpoint is down fails when the tool set is gathered, which is BEFORE any model
  // call — and a turn that never reaches the model records no trace at all.
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean() })

  const enrol = async (agentId: string) => { await admin.post('/api/test-env/enrol-autonomous-agent', { agentId }) }

  const runTurnFor = async (agentOver: any = {}, content = 'hello') => {
    const agent = await createAgent(agentOver)
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content })).data
    let settled = false
    for (let i = 0; i < 100; i++) {
      const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') { settled = true; break }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    // Without this, a run that never finished would make "no trace was stored" pass for entirely
    // the wrong reason.
    assert.ok(settled, 'the run never reached a terminal status')
    return { agent, conv, runId }
  }

  /**
   * The run's per-call telemetry, which replaced the `trace-requests` collection.
   *
   * Read off the run rather than a second store, because that is the whole change: a turn is N model
   * calls and the conversation keeps one message for the whole turn, so per-call detail needs a home;
   * everything else that collection held WAS the conversation.
   */
  const callsOf = async (runId: string) =>
    (await admin.get(`/api/runs/organization/test1/${runId}`)).data.calls ?? []

  /** Every assistant call of a conversation, newest history-bound last. */
  const assistantCallsOf = async (conversationId: string) => {
    const runs = (await admin.get(`/api/conversations/organization/test1/${conversationId}/runs`)).data.results
    const calls = runs.flatMap((run: any) => run.calls ?? [])
    return calls
      .filter((call: any) => call.modelRole === 'assistant')
      .sort((a: any, b: any) => (a.historyUpToSeq ?? 0) - (b.historyUpToSeq ?? 0))
  }

  test('a turn records its model call on the run', async () => {
    const { runId } = await runTurnFor()

    const calls = await callsOf(runId)
    assert.ok(calls.length >= 1, 'a turn must record the model call it made')
    const assistant = calls.find((c: any) => c.modelRole === 'assistant')
    assert.ok(assistant, 'expected an assistant call')
    assert.equal(assistant.model, 'mock-model')
    assert.ok(assistant.provider, 'the provider that answered must be recorded')
    assert.ok(assistant.durationMs >= 0)
  })

  test('telemetry is recorded whether or not the org enabled review', async () => {
    // The gate moved to what it actually governs. `storeTraces` used to decide whether the exchange
    // was COPIED into a second collection; there is no copy any more, and a model id with a token
    // count is the account's own operational record of its own spend, not content about a person.
    // What the setting gates now is whether an admin may READ THE CONVERSATION.
    await putMockSettings(admin, 'organization/test1', { storeTraces: false })
    const { runId } = await runTurnFor()
    assert.ok((await callsOf(runId)).length >= 1, 'spend must be attributable even with review off')
  })

  test('the run also records the instructions the model was given', async () => {
    // What a reviewer needs that the conversation does not contain. `reconstruct-trace` used to dig
    // it out of a stored request body by filtering for a system-role message.
    const { runId } = await runTurnFor()
    const run = (await admin.get(`/api/runs/organization/test1/${runId}`)).data
    assert.ok(typeof run.systemPrompt === 'string' && run.systemPrompt.length > 0)
    assert.match(run.systemPrompt, /tool result/i, 'the standing injection warning must be in it')
  })

  test('a compaction is BILLED — to the account ledger and to the run', async () => {
    // compactHistory calls generateText against the summarizer and recorded only a trace, which is
    // itself gated on storeTraces (off by default). So summarizer tokens reached no ledger at all: not
    // the run budget, not the account credit cap, not the usage histogram. That contradicts the rule
    // stated for the assistant path a hundred lines above it — "a turn stopped by the budget or the
    // clock must still bill what it actually consumed".
    //
    // Non-zero prices, or computeCreditBreakdown returns 0 and `if (total > 0)` skips the recording,
    // which would make this pass for the wrong reason. A tiny context window forces the compaction.
    await putMockSettings(admin, 'organization/test1', {
      storeTraces: false,
      models: [{
        model: mockModelRef,
        usage: ['assistant', 'tools', 'summarizer', 'moderator'],
        contextWindow: 200,
        inputPricePerMillion: 400_000,
        outputPricePerMillion: 400_000
      }]
    })
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data

    const turn = async (content: string) => {
      const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content })).data
      for (let i = 0; i < 100; i++) {
        const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
        if (run.status !== 'running') return run
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      throw new Error('run never settled')
    }

    await turn('long answer')
    const second = await turn('long answer')

    // 1. the account ledger knows the summarizer ran.
    const today = new Date().toISOString().slice(0, 10)
    const byRole = await admin.get('/api/usage/organization/test1/history?scope=account-daily&days=7&dimension=modelRole')
    const breakdown = byRole.data.entries.find((e: any) => e.label === today)?.breakdown ?? {}
    assert.ok(breakdown.summarizer > 0, `compaction must reach the usage ledger, got ${JSON.stringify(breakdown)}`)

    // 2. and the run it happened during carries the cost, so the per-run budget can see it.
    assert.ok(second.credits > 0)
    const conversation = (await orgAdmin.get(`/api/conversations/organization/test1?agentId=${agent.id}`))
      .data.results.find((c: any) => c.id === conv.id)
    assert.ok(conversation.compaction, 'this test is only meaningful if a compaction actually happened')
  })

  test('a conversation brought back under budget by CLEARING alone makes no summarizer call', async () => {
    // The saving the tier ordering exists for, asserted directly rather than assumed. Clearing old tool
    // payloads is free; summarising them is a blocking, billed model call. Before this, the summarizer
    // was the only lever, so a tool-heavy conversation paid for one on every turn past the threshold.
    //
    // `bulk` returns a big result from a tiny request, so the history is dominated by clearable payload —
    // which is what a real MCP conversation looks like, and what makes this provable without tuning the
    // budget to a knife edge.
    await putMockSettings(admin, 'organization/test1', {
      // On, so the model's OWN reported input size can be compared against the stored conversation —
      // the only way to show the context really shrank rather than never having grown.
      storeTraces: true,
      models: [{
        model: mockModelRef,
        usage: ['assistant', 'tools', 'summarizer', 'moderator'],
        // Big enough that the 3 most recent results plus every instruction fit with margin; small enough
        // that adding the older payloads on top crosses it, which happens around the fifth turn.
        contextWindow: 8000,
        inputPricePerMillion: 400_000,
        outputPricePerMillion: 400_000
      }]
    })
    const agent = await createAgent({ mcpServers: [{ serverId: 'dev-public-mcp' }] })
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data

    const turn = async (content: string) => {
      const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content })).data
      for (let i = 0; i < 100; i++) {
        const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
        if (run.status !== 'running') return run
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      throw new Error('run never settled')
    }
    for (let i = 0; i < 8; i++) await turn('call tool bulk {"chars":4000}')

    const conversation = (await orgAdmin.get(`/api/conversations/organization/test1?agentId=${agent.id}`))
      .data.results.find((c: any) => c.id === conv.id)
    assert.equal(conversation.compaction, undefined, 'clearing must have sufficed, so no recap should exist')

    // And nothing reached the summarizer's ledger, which is the cost this avoids.
    const today = new Date().toISOString().slice(0, 10)
    const byRole = await admin.get('/api/usage/organization/test1/history?scope=account-daily&days=7&dimension=modelRole')
    const breakdown = byRole.data.entries.find((e: any) => e.label === today)?.breakdown ?? {}
    assert.ok(!breakdown.summarizer, `no summarizer spend expected, got ${JSON.stringify(breakdown)}`)

    // The conversation itself is untouched: clearing only ever changes what the MODEL is sent, so every
    // payload is still in the store and the thread still replays in full.
    const messages = (await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)).data.results
    const payloads = messages.flatMap((m: any) => (m.parts ?? [])
      .filter((p: any) => p.type === 'dynamic-tool' && p.toolName === 'bulk')
      .map((p: any) => String(p.output ?? '')))
    assert.equal(payloads.length, 8, 'every call is still recorded')
    assert.ok(payloads.every((text: string) => text.includes('bbbbbbbbbb')), 'and every payload is still whole in the store')

    // THE CROSSING, which "no compaction" alone does not prove: a conversation that never grew past the
    // budget would also leave no recap. The mock reports its input size, so the last turn's trace says
    // how much context actually reached the model — and it must be far below the stored conversation,
    // because the old payloads were replaced by placeholders on the way in.
    const storedChars = JSON.stringify(messages).length
    const assistantCalls = await assistantCallsOf(conv.id)
    const lastTurn = assistantCalls[assistantCalls.length - 1]
    assert.ok(lastTurn, 'expected the last turn to have recorded its call')
    const sentTokens = lastTurn.inputTokens
    assert.ok(
      sentTokens < storedChars / 4 * 0.7,
      `the cleared context must be materially smaller than the stored conversation: sent ${sentTokens} tokens for ~${Math.round(storedChars / 4)} stored`
    )
    // And it has to have been over the budget before clearing, or there was nothing to save.
    assert.ok(storedChars / 4 > 8000 * 70 / 100, 'this test is only meaningful if the history crossed the budget')
  })

  test('the compaction recap is PERSISTED and reused, not recomputed every turn', async () => {
    // Compaction used to re-summarise from scratch on every turn once a conversation crossed the
    // budget — permanently, because nothing was persisted: the next turn loaded the whole history
    // again and was over budget again. Storing tool results made that bite far sooner, since one
    // result can be a quarter of the budget.
    //
    // A tiny context window forces the threshold with a couple of short turns.
    await putMockSettings(admin, 'organization/test1', {
      storeTraces: true,
      // A COMPLETE entry: overrides deep-merge, and an array element is replaced wholesale rather than
      // merged, so a partial one loses the required model/usage/price fields and the PUT 400s.
      models: [{
        model: mockModelRef,
        usage: ['assistant', 'tools', 'summarizer', 'moderator'],
        contextWindow: 200,
        inputPricePerMillion: 0,
        outputPricePerMillion: 0
      }]
    })
    const agent = await createAgent()
    await enrol(agent.id)
    const conv = (await orgAdmin.post('/api/conversations/organization/test1', { agentId: agent.id, title: 't' })).data

    const turn = async (content: string) => {
      const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conv.id}/messages`, { content })).data
      for (let i = 0; i < 100; i++) {
        const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
        if (run.status !== 'running') return run
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      throw new Error('run never settled')
    }

    await turn('long answer')
    await turn('long answer')
    await turn('long answer')

    // Via the list route: there is no single-conversation GET, and the list returns the full document.
    const conversation = (await orgAdmin.get(`/api/conversations/organization/test1?agentId=${agent.id}`))
      .data.results.find((c: any) => c.id === conv.id)
    assert.ok(conversation.compaction, 'a compaction must leave a persisted recap behind')
    assert.ok(conversation.compaction.summary.length > 0)
    assert.ok(conversation.compaction.generation >= 1)

    // The recap covers a STORED MESSAGE boundary, never mid-turn — otherwise the model context could
    // not be rebuilt identically from [recap, ...messages after it].
    const messages = (await orgAdmin.get(`/api/conversations/organization/test1/${conv.id}/messages`)).data.results
    const seqs = messages.map((m: any) => m.seq)
    assert.ok(seqs.includes(conversation.compaction.coversUpToSeq), 'coversUpToSeq must name a real stored message')

    // THE POINT: the covered prefix is no longer sent. The turn's traced messageCount counts
    // [recap, ...tail], so it must be below the number of stored messages the conversation now holds.
    const assistantCalls = await assistantCallsOf(conv.id)
    const latest = assistantCalls[assistantCalls.length - 1]
    assert.ok(
      latest.messageCount < messages.length,
      `the recap must replace the prefix it covers: sent ${latest.messageCount} for ${messages.length} stored messages`
    )
  })

  test('telemetry carries NO content at all — not the history, not a tool payload', async () => {
    // Stronger than the property the trace collection had to work for, and now true by construction
    // rather than by discipline: there is no field for content to go in. A trace document held the
    // response text and the tool-call arguments, so it had to be audited for what it duplicated and
    // what it leaked; this holds a model id, token counts and a duration.
    const { runId } = await runTurnFor({ mcpServers: [{ serverId: 'dev-public-mcp' }] }, 'call tool echo {"value":"x"}')
    const flat = JSON.stringify(await callsOf(runId))
    assert.equal(flat.includes('echo:x'), false, 'no tool payload')
    assert.equal(flat.includes('hello'), false, 'no prompt text')
    assert.equal(flat.includes('world'), false, 'no answer text')
  })

  test('a traced turn carries the cache token detail, so its cost matches what was billed', async () => {
    // priceTokens reads noCacheTokens/cacheReadTokens/cacheWriteTokens. Passing only
    // inputTokens/outputTokens makes a trace price cache reads at the full input tariff and
    // contradict what was actually charged — the regression traces/operations.ts records having
    // already fixed once in its own copy of the formula.
    //
    // Non-zero prices, or the cost is 0 either way and the assertion proves nothing. `cache <n>`
    // is a mock directive matched against the whole prompt; `hello` stays on the last line so the
    // answer is still 'world'.
    await putMockSettings(admin, 'organization/test1', {
      models: mockModels({ inputPricePerMillion: 1000, outputPricePerMillion: 1000, cachedInputPricePerMillion: 0 })
    })
    const { runId } = await runTurnFor({}, 'cache 1000\nhello')

    const assistant = (await callsOf(runId)).find((c: any) => c.modelRole === 'assistant')
    assert.ok(assistant, 'expected an assistant call')
    assert.ok(assistant.cacheReadTokens > 0, 'the cache read detail must reach the telemetry')
    // With a zero cache tariff, the credits charged must be strictly less than pricing every input
    // token at the full rate — which is only possible if the detail survived into the pricing.
    // The INPUT portion, not the total: output is priced too, so a total would exceed input-only
    // pricing whether or not the cache detail survived.
    const pricedAtFullRate = (assistant.inputTokens / 1_000_000) * 1000
    assert.ok(
      assistant.creditsInput < pricedAtFullRate,
      `cache reads were billed at the full input tariff: ${assistant.creditsInput} vs ${pricedAtFullRate}`
    )
  })

  test('telemetry carries no MCP credential', async () => {
    // dev-apikey-mcp is the only dev entry with a credential; without it this would pass trivially.
    const { runId } = await runTurnFor({ mcpServers: [{ serverId: 'dev-apikey-mcp' }] }, 'call tool echo {"value":"x"}')
    const flat = JSON.stringify(await callsOf(runId))
    assert.equal(flat.includes('dev-secret-value'), false, 'no MCP credential may reach the run record')
  })
})
