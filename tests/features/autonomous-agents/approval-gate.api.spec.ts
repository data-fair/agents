/**
 * stateful API tests for the approval gate. Whether a tool ran is read from the MCP fixture's own
 * record of calls (`invokedTools`), never from what the model says.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { openAgentSession } from '../../support/ws.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const BASE = '/api/conversations/organization/test1'

export const createGatedAgent = async (over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Gate probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

export const awaitRun = async (runId: string) => {
  for (let i = 0; i < 120; i++) {
    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}

export const turn = async (conversationId: string, content: string) => {
  const { runId } = (await orgAdmin.post(`${BASE}/${conversationId}/messages`, { content })).data
  const run = await awaitRun(runId)
  const messages = (await orgAdmin.get(`${BASE}/${conversationId}/messages`)).data.results
  return { run, messages, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
}

export const callPart = (message: any, toolName: string) =>
  message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)

test.describe('The approval gate', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a destructive call is stopped by default: the turn ends awaiting approval and nothing ran', async () => {
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run, assistant } = await turn(conv.id, 'call tool wipe_everything {}')
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'awaiting-approval')
    const part = callPart(assistant, 'wipe_everything')
    assert.equal(part.state, 'approval-requested')
    assert.ok(part.approval?.id, 'the request carries its approval id')
    assert.deepEqual(fixture.invokedTools(), [], 'the tool must not have run')
  })

  test('allow runs the call as before', async () => {
    const agent = await createGatedAgent({ approvals: { destructive: 'allow' } })
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run } = await turn(conv.id, 'call tool wipe_everything {}')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
  })

  test('deny removes the tool from what the model is offered', async () => {
    const agent = await createGatedAgent({ approvals: { write: 'deny' } })
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { run } = await turn(conv.id, 'call tool echo {"value":"x"}')
    const offered = run.calls.flatMap((c: any) => c.toolNames ?? [])
    assert.ok(!offered.includes('echo'), 'a denied write tool is never offered')
    assert.ok(offered.includes('wipe_everything'), 'the destructive one, still on approve, is offered')
    assert.deepEqual(fixture.invokedTools(), [])
  })

  const pendingApproval = async () => {
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { assistant } = await turn(conv.id, 'call tool wipe_everything {}')
    return { agent, conv, approvalId: callPart(assistant, 'wipe_everything').approval.id as string, seq: assistant.seq as number }
  }
  const decide = (conversationId: string, approvalId: string, body: any) =>
    orgAdmin.post(`${BASE}/${conversationId}/approvals/${approvalId}`, body)
  const messageAt = async (conversationId: string, seq: number) =>
    (await orgAdmin.get(`${BASE}/${conversationId}/messages`)).data.results.find((m: any) => m.seq === seq)

  test('approving runs the call exactly once, settled on its original message', async () => {
    const { conv, approvalId, seq } = await pendingApproval()
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    const run = await awaitRun(runId)
    assert.equal(run.trigger, 'approval')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-available', 'the result is settled on the call\'s own part')
    assert.equal(part.toolMetadata.decision.userId, 'test1-admin1')
    // The SDK executes an approved call on replay without announcing it again, so the continuation's own
    // message carries no second part for it.
    const continuation = (await orgAdmin.get(`${BASE}/${conv.id}/messages`)).data.results.find((m: any) => m.runId === runId)
    assert.equal(callPart(continuation, 'wipe_everything'), undefined, 'no duplicate call part')

    // A further turn replays an approved call WITH its result, so it must not run again.
    await turn(conv.id, 'hello')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'], 'the double-execution guard')
  })

  test('a second decision is refused, and the tool still ran once', async () => {
    const { conv, approvalId } = await pendingApproval()
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    await assert.rejects(decide(conv.id, approvalId, { approved: true }), { status: 409 })
    await awaitRun(runId)
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
  })

  test('rejecting tells the model why, and nothing runs', async () => {
    const { conv, approvalId, seq } = await pendingApproval()
    const { runId } = (await decide(conv.id, approvalId, { approved: false, reason: 'not today' })).data
    await awaitRun(runId)
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-denied')
    assert.equal(part.approval.reason, 'not today')
  })

  test('a new message rejects a pending approval before it is answered', async () => {
    const { conv, seq } = await pendingApproval()
    await turn(conv.id, 'hello')
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-denied')
    assert.equal(part.approval.reason, 'The person sent a new message instead of deciding.')
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('only the person whose conversation it is decides', async () => {
    const { conv, approvalId } = await pendingApproval()
    const member = await axiosAuth('test1-user1', { org: 'test1' })
    await assert.rejects(member.post(`${BASE}/${conv.id}/approvals/${approvalId}`, { approved: true }), { status: 403 })
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('a reason is bounded', async () => {
    const { conv, approvalId } = await pendingApproval()
    await assert.rejects(decide(conv.id, approvalId, { approved: false, reason: 'x'.repeat(1001) }), { status: 400 })
  })

  test('an autonomous agent disabled before the decision does not run the approved call', async () => {
    const { agent, conv, approvalId, seq } = await pendingApproval()
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: agent.title, persona: agent.persona, mcpServers: agent.mcpServers, enabled: false })
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    await awaitRun(runId)
    assert.deepEqual(fixture.invokedTools(), [])
    // Settled as an error rather than left approved with no result, which every later replay would carry.
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-error')
    assert.match(part.errorText, /^Approved, but the turn could not run: This autonomous agent is currently disabled/)

    // Re-enabled, a further turn replays the call WITH that result, so it does not run late.
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: agent.title, persona: agent.persona, mcpServers: agent.mcpServers, enabled: true })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { run } = await turn(conv.id, 'hello')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), [])
  })

  // If the SDK throws on replaying an approved call whose tool is gone (rather than emitting a
  // `tool-error`), catch that in runModelLoop's stream handling and settle the part with
  // settleStoredToolPart(…, { state: 'output-error', errorText: 'this tool is no longer available' }).
  test('a tool no longer offered when approved ends as an error on its own part', async () => {
    const { agent, conv, approvalId, seq } = await pendingApproval()
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: agent.title, persona: agent.persona, mcpServers: agent.mcpServers, enabled: true, approvals: { destructive: 'deny' } })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    await awaitRun(runId)
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-error')
    assert.equal(part.errorText, 'this tool is no longer available')
  })

  const twoPending = async () => {
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { assistant } = await turn(conv.id, 'call tools wipe_everything wipe_everything')
    const [first, second] = assistant.parts.filter((p: any) => p.state === 'approval-requested')
    assert.ok(first && second, 'two calls stopped in one step')
    return { conv, seq: assistant.seq as number, first, second }
  }

  test('a decision flips only the call it names', async () => {
    const { conv, seq, first, second } = await twoPending()
    assert.deepEqual((await decide(conv.id, first.approval.id, { approved: false })).data, { pending: 1 })
    const parts = (await messageAt(conv.id, seq)).parts
    assert.equal(parts.find((p: any) => p.toolCallId === first.toolCallId).state, 'output-denied')
    assert.equal(parts.find((p: any) => p.toolCallId === second.toolCallId).state, 'approval-requested')
  })

  test('calls stopped in one step continue once all are decided, each running once', async () => {
    const { conv, seq, first, second } = await twoPending()
    assert.deepEqual((await decide(conv.id, first.approval.id, { approved: true })).data, { pending: 1 })
    const runs = (await orgAdmin.get(`${BASE}/${conv.id}/runs`)).data.results
    assert.ok(!runs.some((r: any) => r.trigger === 'approval'), 'no continuation while a call is undecided')
    assert.deepEqual(fixture.invokedTools(), [])

    const { runId } = (await decide(conv.id, second.approval.id, { approved: true })).data
    const run = await awaitRun(runId)
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything', 'wipe_everything'])
    const parts = (await messageAt(conv.id, seq)).parts
    assert.equal(parts.find((p: any) => p.toolCallId === first.toolCallId).state, 'output-available')
    assert.equal(parts.find((p: any) => p.toolCallId === second.toolCallId).state, 'output-available')

    await turn(conv.id, 'hello')
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything', 'wipe_everything'], 'neither runs again')
  })

  const noApprovedCallLeft = async (conversationId: string) => {
    const messages = (await orgAdmin.get(`${BASE}/${conversationId}/messages`)).data.results
    assert.ok(!messages.some((m: any) => (m.parts ?? []).some((p: any) => p.state === 'approval-responded' || p.state === 'approval-requested')),
      'no approved or pending call left without a result')
  }

  test('writing before a step is fully decided settles the call already approved', async () => {
    const { conv, seq, first, second } = await twoPending()
    assert.deepEqual((await decide(conv.id, first.approval.id, { approved: true })).data, { pending: 1 })
    await turn(conv.id, 'hello')
    const parts = (await messageAt(conv.id, seq)).parts
    const approved = parts.find((p: any) => p.toolCallId === first.toolCallId)
    assert.equal(approved.state, 'output-error')
    assert.equal(approved.errorText, 'Approved, but the person sent a new message before every call of the step was decided, so it did not run.')
    assert.equal(parts.find((p: any) => p.toolCallId === second.toolCallId).state, 'output-denied')
    assert.deepEqual(fixture.invokedTools(), [])
    await noApprovedCallLeft(conv.id)

    const { run } = await turn(conv.id, 'hello')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('an approval run that fails before the model settles the approved call as an error', async () => {
    const { agent, conv, approvalId, seq } = await pendingApproval()
    // The autonomous agent now reaches its tools through a catalog entry never listed in this test (so
    // no cached listing), on the fixture's address, with the fixture down: gathering its tools throws.
    await fixture.close()
    try {
      await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: agent.title, persona: agent.persona, mcpServers: [{ serverId: 'dev-apikey-mcp' }], enabled: true })
      await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
      const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
      const run = await awaitRun(runId)
      assert.equal(run.status, 'error')
      const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
      assert.equal(part.state, 'output-error')
      assert.match(part.errorText, /^Approved, but its outcome is unknown: the turn ended before it reported \(.*dev-apikey-mcp.*\)\.$/)
      assert.deepEqual(fixture.invokedTools(), [])
      await noApprovedCallLeft(conv.id)
    } finally {
      fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30)
    }
  })

  test('a decision is refused while the turn that asked is still finishing, and taken once it has', async () => {
    // The SDK asks for the approval before the step's other calls return, so the request is stored while
    // the run still owns the message. A decision landing then was overwritten by the run's own last
    // writes — the call never ran, and the record of who approved it was erased.
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`${BASE}/${conv.id}/messages`, { content: 'call tools slow_lookup wipe_everything' })).data
    let asking: any
    for (let i = 0; i < 100 && !asking; i++) {
      const messages = (await orgAdmin.get(`${BASE}/${conv.id}/messages`)).data.results
      const message = messages.find((m: any) => m.runId === runId)
      if (message && callPart(message, 'wipe_everything')?.state === 'approval-requested') asking = message
      else await new Promise(resolve => setTimeout(resolve, 50))
    }
    assert.ok(asking, 'the approval request is stored while the step still runs')
    assert.equal(asking.pending, true, 'and the message asking is still being written')
    const approvalId = callPart(asking, 'wipe_everything').approval.id
    await assert.rejects(decide(conv.id, approvalId, { approved: true }), (err: any) => {
      assert.equal(err.status, 409)
      assert.match(JSON.stringify(err.data), /still finishing/)
      return true
    })

    const asked = await awaitRun(runId)
    assert.equal(asked.stopReason, 'awaiting-approval')
    assert.equal((await messageAt(conv.id, asking.seq)).pending, false)
    const { runId: continuation } = (await decide(conv.id, approvalId, { approved: true })).data
    assert.equal((await awaitRun(continuation)).stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools().sort(), ['slow_lookup', 'wipe_everything'])
    const part = callPart(await messageAt(conv.id, asking.seq), 'wipe_everything')
    assert.equal(part.state, 'output-available')
    assert.equal(part.toolMetadata.decision.userId, 'test1-admin1', 'who approved is on the record')
  })

  test('an approval run cut by a restart settles its approved call, and the conversation goes on', async () => {
    const { conv, approvalId, seq } = await pendingApproval()
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    await awaitRun(runId)
    // The state a process dying mid-run leaves: the run still `running`, the approved call with no result.
    await admin.post('/api/test-env/orphan-run', { runId, reopenApproved: true })
    assert.equal(callPart(await messageAt(conv.id, seq), 'wipe_everything').state, 'approval-responded')
    fixture.resetInvokedTools()
    await admin.post('/api/test-env/recover-ownerless-runs', {})

    assert.equal((await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data.status, 'interrupted')
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-error')
    // Unknown, not "did not run": the process may have died after the tool did its work.
    assert.equal(part.errorText, 'Approved, but its outcome is unknown: the turn ended before it reported (interrupted by a restart).')
    await noApprovedCallLeft(conv.id)

    const { run } = await turn(conv.id, 'hello')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), [], 'and it is never run late')
  })

  test('an approved call the continuation never reached is settled as not run', async () => {
    // The continuation is held back (the conversation locked) while the person writes, so its replay
    // ends on their message: the SDK executes approvals from the last message only, and this one never runs.
    const { conv, approvalId, seq } = await pendingApproval()
    await admin.post('/api/test-env/lock-conversation', { conversationId: conv.id })
    let continuation: string
    let next: string
    try {
      continuation = (await decide(conv.id, approvalId, { approved: true })).data.runId
      next = (await orgAdmin.post(`${BASE}/${conv.id}/messages`, { content: 'hello' })).data.runId
    } finally {
      await admin.post('/api/test-env/unlock-conversation', { conversationId: conv.id })
    }
    await admin.post('/api/test-env/recover-ownerless-runs', {})
    assert.equal((await awaitRun(continuation)).stopReason, 'completed')
    await awaitRun(next)
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-error')
    assert.equal(part.errorText, 'Approved, but it did not run: the turn continuing from the decision ended without reaching it.')
    assert.deepEqual(fixture.invokedTools(), [])
    await noApprovedCallLeft(conv.id)
  })

  test('an approval whose signature fails verification is settled as not run', async () => {
    // The SDK verifies the signature before executing anything (a secret rotated between the request and
    // the decision fails it the same way), so this one is certain — not "outcome unknown".
    const { conv, approvalId, seq } = await pendingApproval()
    const asking = await messageAt(conv.id, seq)
    const parts = asking.parts.map((p: any) => p.type === 'dynamic-tool' && p.approval?.id === approvalId ? { ...p, approval: { ...p.approval, signature: 'forged' } } : p)
    await admin.post('/api/test-env/corrupt-message', { conversationId: conv.id, seq, parts })
    const { runId } = (await decide(conv.id, approvalId, { approved: true })).data
    assert.equal((await awaitRun(runId)).status, 'error')
    const part = callPart(await messageAt(conv.id, seq), 'wipe_everything')
    assert.equal(part.state, 'output-error')
    assert.match(part.errorText, /^Approved, but it did not run: the approval could not be verified \(.*signature.*\)\.$/)
    assert.deepEqual(fixture.invokedTools(), [])
    await noApprovedCallLeft(conv.id)
  })

  test('an approved call\'s result cut at the bound says so on its own part', async () => {
    // Approval-run results are precisely the audited writes: a review must be able to tell one was cut.
    const agent = await createGatedAgent({ approvals: { write: 'approve' } })
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const { assistant } = await turn(conv.id, 'call tool bulk {"chars":150000}')
    const { runId } = (await decide(conv.id, callPart(assistant, 'bulk').approval.id, { approved: true })).data
    await awaitRun(runId)
    const part = callPart(await messageAt(conv.id, assistant.seq), 'bulk')
    assert.equal(part.state, 'output-available')
    assert.ok(part.toolMetadata.truncated?.totalChars > 150000, 'the size it had before the cut')
    assert.equal(part.toolMetadata.decision.userId, 'test1-admin1', 'beside the decision, not instead of it')
  })
})

test.describe('Deciding over the socket', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean(); fixture.resetInvokedTools(); await putMockSettings(admin, 'organization/test1') })

  const collectUntil = async (socket: any, done: (frames: any[]) => boolean) => {
    const frames: any[] = []
    for (let i = 0; i < 3000; i++) { frames.push(await socket.next(20_000)); if (done(frames)) return frames }
    throw new Error('never happened')
  }

  test('the frame decides; a socket bound to another conversation cannot', async () => {
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const other = (await orgAdmin.post(BASE, { agentId: agent.id, title: 'other' })).data
    const socket = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    socket.send({ type: 'hello', tools: [], conversationId: conv.id })
    await socket.next()
    socket.send({ type: 'prompt', content: 'call tool wipe_everything {}' })
    const frames = await collectUntil(socket, fs => fs.some(f => f.type === 'turn-end'))
    assert.ok(frames.some(f => f.type === 'activity' && f.activity?.kind === 'approval'))
    const approvalId = frames.filter(f => f.type === 'message' && f.role === 'assistant').at(-1)
      .parts.find((p: any) => p.state === 'approval-requested').approval.id

    const stranger = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    stranger.send({ type: 'hello', tools: [], conversationId: other.id })
    await stranger.next()
    stranger.send({ type: 'approval', approvalId, approved: true })
    // Past the history the attach sends (a `cost` frame, for this empty thread), the refusal.
    const refused = await collectUntil(stranger, fs => fs.some(f => f.type === 'error' || f.type === 'turn-end'))
    assert.equal(refused.at(-1).type, 'error')
    assert.deepEqual(fixture.invokedTools(), [])

    socket.send({ type: 'approval', approvalId, approved: true })
    await collectUntil(socket, fs => fs.some(f => f.type === 'turn-end'))
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
    socket.close(); stranger.close()
  })

  test('acting on the page a wait handed over rejects a call stopped beside it', async () => {
    // The handover wins the step, so the turn ends `waiting` with a call awaiting approval beside the
    // wait. The person acting on the page continues without it — as writing would — rather than leave a
    // card that, approved later, could never run.
    const agent = await createGatedAgent()
    const conv = (await orgAdmin.post(BASE, { agentId: agent.id, title: 't' })).data
    const socket = await openAgentSession(await orgAdmin.cookieJar.getCookieString(directoryUrl))
    socket.send({ type: 'hello', tools: [], conversationId: conv.id })
    await socket.next()
    socket.send({ type: 'prompt', content: 'wait and call wipe_everything' })
    const asked = await collectUntil(socket, fs => fs.some(f => f.type === 'turn-end'))
    assert.equal(asked.find(f => f.type === 'turn-end').stopReason, 'waiting')
    const pending = asked.filter(f => f.type === 'message' && f.role === 'assistant').at(-1)
    assert.equal(pending.parts.find((p: any) => p.toolName === 'wipe_everything').state, 'approval-requested')

    socket.send({ type: 'host-events', events: [{ name: 'clicked Create', detail: 'the wizard', at: Date.now() }] })
    const woke = await collectUntil(socket, fs => fs.some(f => f.type === 'turn-end'))
    assert.equal(woke.find(f => f.type === 'turn-end').stopReason, 'completed')
    const messages = (await orgAdmin.get(`${BASE}/${conv.id}/messages`)).data.results
    const part = messages.find((m: any) => m.seq === pending.seq).parts.find((p: any) => p.toolName === 'wipe_everything')
    assert.equal(part.state, 'output-denied')
    assert.equal(part.approval.reason, 'The person acted on the page instead of deciding.')
    assert.ok(!messages.some((m: any) => (m.parts ?? []).some((p: any) => p.state === 'approval-requested' || p.state === 'approval-responded')))
    assert.deepEqual(fixture.invokedTools(), [])
    socket.close()
  })
})
