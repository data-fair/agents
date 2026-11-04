/**
 * stateful API tests for the approval reviewer in a configured agent's turn
 * (docs/superpowers/specs/2026-11-03-auto-approval-design.md). The mock reviewer answers from the proposed call's
 * arguments (api/src/models/mock-model.ts): REVIEW_DENY, REVIEW_UNSURE, REVIEW_BROKEN, otherwise allow. Whether a
 * tool ran is read from the MCP fixture's own record of calls (`invokedTools`), never from what the model says.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { awaitRun, awaitAgentRun } from '../../support/turn.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { createEnrolledAgent } from '../../support/agents.ts'
import { decideOverSocketToRun, turnOverSocket } from '../../../dev/socket-turn.ts'
import { reviewerDenialText, reviewUnavailableText } from '../../../api/src/approval-review/operations.ts'
import { serviceUp } from '../../support/optional-services.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const eventsUp = await serviceUp('EVENTS_PORT')
const events = async () => (await admin.get('/api/test-env/pushed-events')).data as any[]
const poll = async <T>(read: () => Promise<T>, done: (value: T) => boolean, ms = 10_000): Promise<T> => {
  const until = Date.now() + ms
  let value = await read()
  while (!done(value) && Date.now() < until) {
    await new Promise(resolve => setTimeout(resolve, 200))
    value = await read()
  }
  return value
}

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Review probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

// A task run calls data-fair's built-in server as the agent: it needs a real identity (tests/support/agents.ts).
const createTaskAgent = () => createEnrolledAgent({ title: 'Review probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true })

const turn = async (target: string | { agentId: string }, content: string) => {
  const { runId, conversationId, run, messages } = await turnOverSocket(orgAdmin, target, content)
  return { conversationId, run, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
}

const callPart = (message: any, toolName: string) =>
  message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)
const messageAt = async (conversationId: string, seq: number) =>
  (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results.find((m: any) => m.seq === seq)
const offered = (run: any): string[] => (run.calls ?? []).flatMap((c: any) => c.toolNames ?? [])
const script = (js: string) => `call tool code_mode ${JSON.stringify({ js })}`
const nestedCalls = (message: any) =>
  (message.parts.find((p: any) => p.type === 'data-trace' && p.data?.name === 'code_mode')?.data.parts ?? []).filter((p: any) => p.type === 'dynamic-tool')
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const runTask = async (agentId: string, prompt: string) => {
  const base = `/api/autonomous-agents/organization/test1/${agentId}/tasks`
  const task = (await admin.post(base, { title: 'Probe', prompt, scheduling: [daily] })).data
  const runId = (await admin.post(`${base}/${task.id}/run`)).data.runId as string
  return await awaitAgentRun(orgAdmin, agentId, runId)
}
const reviewCalls = (run: any) => (run.calls ?? []).filter((c: any) => c.modelRole === 'moderator' && c.note === 'review')

test.describe('The approval reviewer', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.MCP_FIXTURE_PORT)) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a reviewed write runs without a card', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool set_note {"note":"ok"}')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['set_note'])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'set_note')
    assert.equal(part.state, 'output-available')
    assert.equal(part.toolMetadata.review.outcome, 'allow')
    assert.equal(reviewCalls(run).length, 1, JSON.stringify(run.calls))
  })

  test('a later turn\'s review sees the earlier turns\' refused calls', async () => {
    const agent = await createAgent()
    const first = await turn({ agentId: agent.id }, 'call tool set_note {"note":"REVIEW_DENY"}')
    assert.equal(callPart(await messageAt(first.conversationId, first.assistant.seq), 'set_note').state, 'output-denied')
    // The mock reviewer denies this note only when the earlier calls it is shown hold a refusal.
    const second = await turn(first.conversationId, 'call tool set_note {"note":"REVIEW_IF_REFUSED_BEFORE"}')
    const part = callPart(await messageAt(first.conversationId, second.assistant.seq), 'set_note')
    assert.equal(part.state, 'output-denied')
    assert.equal(part.toolMetadata.review.reason, 'mock deny: refused before')
    // Control: the same call in a conversation with no refusal runs.
    const fresh = await turn({ agentId: agent.id }, 'call tool set_note {"note":"REVIEW_IF_REFUSED_BEFORE"}')
    assert.equal(fresh.run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['set_note'])
  })

  test('a denied write does not run, and the model is told why', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool set_note {"note":"REVIEW_DENY"}')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'set_note')
    assert.equal(part.state, 'output-denied', JSON.stringify(part))
    assert.equal(part.approval.approved, false)
    // The model is told the reason and not to work around it; the reviewer's own words stay on the record.
    assert.equal(part.approval.reason, reviewerDenialText('mock deny'))
    assert.ok(part.approval.reason.includes('Do not try to reach the same outcome another way'))
    assert.equal(part.toolMetadata.review.outcome, 'deny')
    assert.equal(part.toolMetadata.review.reason, 'mock deny')
    // A later turn replays the denial: nothing runs, and a stored denial is never reviewed again.
    const next = await turn(conversationId, 'hello')
    assert.equal(next.run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), [])
    assert.deepEqual(reviewCalls(next.run), [])
  })

  test('an unsure write asks the person, with the concern on the card', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool set_note {"note":"REVIEW_UNSURE"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'set_note')
    assert.equal(part.state, 'approval-requested')
    assert.equal(part.toolMetadata.review.outcome, 'unsure')
    assert.equal(part.toolMetadata.review.code, 'judged')
  })

  test('a destructive call is reviewed, then put to the person', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool delete_note {"note":"ok"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'delete_note')
    assert.equal(part.state, 'approval-requested')
    assert.equal(part.toolMetadata.review.outcome, 'allow')
    assert.equal(part.toolMetadata.review.code, 'judged')
    assert.equal(part.approval.requestReason, 'mock allow')

    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, part.approval.id, { approved: true })
    const approvalRun = await awaitRun(orgAdmin, conversationId, runId)
    assert.equal(approvalRun.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['delete_note'])
    assert.equal(callPart(await messageAt(conversationId, assistant.seq), 'delete_note').state, 'output-available')
    assert.deepEqual(reviewCalls(approvalRun), [], 'the person-approved call is not reviewed again')
  })

  test('a broken reviewer asks the person in a chat', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool set_note {"note":"REVIEW_BROKEN"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'set_note')
    assert.equal(part.state, 'approval-requested')
    assert.equal(part.toolMetadata.review.code, 'review-failed')
    assert.equal(part.toolMetadata.review.outcome, 'unsure')
  })

  test('a denied call and a carded call in one step', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tools set_note{"note":"REVIEW_DENY"} delete_note{"note":"ok"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const stored = await messageAt(conversationId, assistant.seq)
    const denied = callPart(stored, 'set_note')
    assert.equal(denied.state, 'output-denied', JSON.stringify(denied))
    assert.equal(denied.approval.reason, reviewerDenialText('mock deny'))
    assert.equal(denied.toolMetadata.review.outcome, 'deny')
    const carded = callPart(stored, 'delete_note')
    assert.equal(carded.state, 'approval-requested')
    assert.equal(carded.toolMetadata.review.outcome, 'allow')

    // Deciding the card runs it once; the denied call stays denied and never runs.
    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, carded.approval.id, { approved: true })
    const approvalRun = await awaitRun(orgAdmin, conversationId, runId)
    assert.equal(approvalRun.stopReason, 'completed')
    assert.deepEqual(reviewCalls(approvalRun), [], 'neither the approved nor the denied call is reviewed again')
    assert.deepEqual(fixture.invokedTools(), ['delete_note'])
    const after = await messageAt(conversationId, assistant.seq)
    assert.equal(callPart(after, 'set_note').state, 'output-denied')
    assert.equal(callPart(after, 'set_note').approval.reason, reviewerDenialText('mock deny'))
    assert.equal(callPart(after, 'delete_note').state, 'output-available')
  })

  // A capability grant: reviewer first, then the admin. request_web_access is offered in a chat an admin started.
  const webAgent = () => createAgent({ web: { enabled: true, allowedUrls: ['https://github.com/data-fair'] } })
  const requestWeb = (url: string) => `call tool request_web_access ${JSON.stringify({ add: [url], reason: 'the task needs it' })}`

  test('a grant the reviewer denies is settled without a card', async () => {
    const agent = await webAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, requestWeb('https://REVIEW_DENY.example.org'))
    assert.equal(run.stopReason, 'completed')
    const part = callPart(await messageAt(conversationId, assistant.seq), 'request_web_access')
    assert.equal(part.state, 'output-denied', JSON.stringify(part))
    assert.equal(part.approval.reason, reviewerDenialText('mock deny'))
    assert.equal(part.toolMetadata.review.outcome, 'deny')
    const stored = (await admin.get(`/api/autonomous-agents/organization/test1/${agent.id}`)).data
    assert.deepEqual(stored.web.allowedUrls, ['https://github.com/data-fair'])
  })

  test('a grant the reviewer allows still goes to the admin, with the review on the card', async () => {
    const agent = await webAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, requestWeb('https://www.data.gouv.fr'))
    assert.equal(run.stopReason, 'awaiting-approval')
    const part = callPart(await messageAt(conversationId, assistant.seq), 'request_web_access')
    assert.equal(part.state, 'approval-requested')
    assert.equal(part.toolMetadata.review.outcome, 'allow')
    assert.equal(part.toolMetadata.review.code, 'judged')
  })

  test('three denials in a row stop the turn', async () => {
    const agent = await createAgent()
    const deny = 'set_note{"note":"REVIEW_DENY"}'
    const { run } = await turn({ agentId: agent.id }, `call tools ${deny} ${deny} ${deny}`)
    assert.equal(run.stopReason, 'review-denied')
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('a task run keeps reviewer-routed writes and runs an allowed one', async () => {
    const agent = await createTaskAgent()
    const run = await runTask(agent.id, 'call tool set_note {"note":"ok"}')
    assert.notEqual(run.status, 'error', JSON.stringify(run))
    assert.deepEqual(fixture.invokedTools(), ['set_note'])
    const part = callPart(run.messages[1], 'set_note')
    assert.equal(part.state, 'output-available', JSON.stringify(part))
    assert.equal(part.toolMetadata.review.outcome, 'allow')
  })

  test('a task run\'s unsure is a deny', async () => {
    const agent = await createTaskAgent()
    const run = await runTask(agent.id, 'call tool set_note {"note":"REVIEW_UNSURE"}')
    assert.notEqual(run.status, 'error', JSON.stringify(run))
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(run.messages[1], 'set_note')
    assert.equal(part.state, 'output-denied', JSON.stringify(part))
    assert.equal(part.toolMetadata.review.outcome, 'unsure')
  })

  test('a task run\'s failed review is not made, the model is told it could not be reviewed, and admins are notified', async () => {
    const agent = await createTaskAgent()
    const run = await runTask(agent.id, 'call tool set_note {"note":"REVIEW_BROKEN"}')
    assert.notEqual(run.status, 'error', JSON.stringify(run))
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(run.messages[1], 'set_note')
    assert.equal(part.state, 'output-denied', JSON.stringify(part))
    // Not a denial the model could argue with: the raw failure stays on the record, for the admin.
    assert.equal(part.approval.reason, reviewUnavailableText())
    assert.equal(part.toolMetadata.review.code, 'review-failed')
    assert.ok(part.toolMetadata.review.reason, JSON.stringify(part.toolMetadata.review))
    if (!eventsUp) return
    const topics = await poll(async () => (await events()).map(e => e.topic.key), t => t.includes(`agents:review-failed:${agent.id}`))
    assert.deepEqual(topics.filter(t => t.startsWith('agents:review-failed:')), [`agents:review-failed:${agent.id}`])
  })

  test('a task run is not offered reviewer+person tools', async () => {
    const agent = await createTaskAgent()
    const run = await runTask(agent.id, 'hello')
    assert.ok(offered(run).includes('set_note'), offered(run).join())
    assert.ok(!offered(run).includes('delete_note'), offered(run).join())
  })

  test('three denials in a script stop the turn', async () => {
    const agent = await createAgent()
    // A fourth call, which the reviewer would allow, after the breaker tripped: neither reviewed nor run.
    const { run, assistant } = await turn({ agentId: agent.id }, script('for (let i = 0; i < 3; i++) { try { await tools.set_note({ note: "REVIEW_DENY" }) } catch (e) {} } try { await tools.set_note({ note: "ok" }) } catch (e) {} return "done"'))
    assert.equal(run.stopReason, 'review-denied')
    assert.deepEqual(fixture.invokedTools(), [])
    const nested = nestedCalls(assistant)
    assert.deepEqual(nested.map((p: any) => [p.toolMetadata?.review?.outcome, p.toolMetadata?.review?.code]), [['deny', 'judged'], ['deny', 'judged'], ['deny', 'judged'], ['deny', 'breaker-tripped']])
    // A judged deny is two reviewer calls (stage 1, stage 2), the fourth none.
    assert.equal(reviewCalls(run).length, 6, JSON.stringify(run.calls))
  })

  test('a script\'s reviewed write runs; a denied one fails inside the script', async () => {
    const agent = await createAgent()
    const { run, assistant } = await turn({ agentId: agent.id }, script('await tools.set_note({ note: "ok" }); try { await tools.set_note({ note: "REVIEW_DENY" }); return "ran" } catch (e) { return e.message }'))
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['set_note'])
    const call = callPart(assistant, 'code_mode')
    assert.equal(call.state, 'output-available', JSON.stringify(call))
    const output = JSON.stringify(call.output)
    assert.ok(output.includes('mock deny'), output)
    assert.ok(output.includes('Do not try to reach the same outcome another way'), output)
    // Each nested review is on its trace entry.
    const nested = nestedCalls(assistant)
    assert.deepEqual(nested.map((p: any) => p.toolMetadata?.review?.outcome), ['allow', 'deny'])
    assert.equal(nested[1].state, 'output-error')
  })
})
