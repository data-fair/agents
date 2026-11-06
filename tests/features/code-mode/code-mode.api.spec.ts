/**
 * stateful API tests: code_mode in real turns — chaining catalog tools with structured results, nested calls
 * recorded, files from a script, a call needing a person pausing the script until the decision, reserved tools out
 * of reach, the personal assistant included.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, defaultQuotas } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket, decideOverSocketToRun } from '../../../dev/socket-turn.ts'
import { awaitRun } from '../../support/turn.ts'
import { FIXTURE_PORT, createFilesAgent, callPart, outputOf } from '../../support/files.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
// Not a member of user/test-standalone1: 'external' there.
const outsider = await axiosAuth('test1-user1')
const offered = (run: any): string[] => run.calls.flatMap((c: any) => c.toolNames ?? [])
const trace = (message: any) => message.parts.find((p: any) => p.type === 'data-trace' && p.data?.name === 'code_mode')?.data
const script = (js: string) => `call tool code_mode ${JSON.stringify({ js })}`
let fixture: McpFixture

test.describe('code_mode', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a script chains two catalog tools and gets structuredContent; each nested call is recorded', async () => {
    const agent = await createFilesAgent()
    const { assistant, run } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('const s = await tools.closure_stats({ district: "city-center" }); const e = await tools.echo({ value: String(s.count) }); return { count: s.count, echoed: e }'))
    assert.ok(offered(run).includes('code_mode'))
    const call = callPart(assistant, 'code_mode')
    assert.equal(call.state, 'output-available', outputOf(call))
    assert.equal(call.toolMetadata.serverId, 'code-mode')
    assert.match(outputOf(call), /<tool-result server="code-mode" tool="code_mode">/)
    assert.match(outputOf(call), /"echoed": "echo:\d+"/)
    const nested = trace(assistant).parts.filter((p: any) => p.type === 'dynamic-tool')
    assert.deepEqual(nested.map((p: any) => p.toolName), ['closure_stats', 'echo'])
    assert.equal(trace(assistant).parentToolCallId, call.toolCallId)
  })

  test('a script reads, transforms and writes files, then passes one to a tool that takes a file', async () => {
    const agent = await createFilesAgent()
    const first = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool write_file {"file_path":"/in.csv","content":"street,days\\nRue A,3\\nRue B,12\\n"}')
    const { assistant } = await turnOverSocket(orgAdmin, first.conversationId, script('const rows = (await tools.read_file({ file_path: "/in.csv" })).trim().split("\\n"); const kept = [rows[0], ...rows.slice(1).filter(r => Number(r.split(",")[1]) > 7)]; const f = await tools.write_file({ file_path: "/out.csv", content: kept.join("\\n") + "\\n" }); const imported = await tools.import_table({ file: f.file_path, title: "Long" }); return { file: f, imported }'))
    const call = callPart(assistant, 'code_mode')
    assert.equal(call.state, 'output-available', outputOf(call))
    assert.match(outputOf(call), /"file_path": "\/out\.csv"/)
    assert.match(outputOf(call), /sha256/)
    assert.doesNotMatch(JSON.stringify(assistant), /sig=/, 'no signed URL in the record')
  })

  test('a gated tool pauses a chat\'s script on a card: nothing runs before the decision', async () => {
    const agent = await createFilesAgent()
    const { run, assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('try { await tools.wipe_everything({}) } catch (e) { return e.message }'))
    assert.equal(run.stopReason, 'awaiting-approval')
    const call = callPart(assistant, 'code_mode')
    assert.equal(call.state, 'approval-requested')
    assert.equal(call.toolMetadata.nested.toolName, 'wipe_everything')
    assert.deepEqual(fixture.invokedTools().filter((n: string) => n === 'wipe_everything'), [])
  })

  test('a script\'s error reaches the model as the tool\'s error', async () => {
    const agent = await createFilesAgent()
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('await tools.explode({})'))
    const call = callPart(assistant, 'code_mode')
    assert.equal(call.state, 'output-error')
    assert.doesNotMatch(outputOf(call), /Host tool failed/)
  })

  test('the personal assistant is offered code_mode, without file tools', async () => {
    const { run } = await turnOverSocket(orgAdmin, { agentId: 'portal-assistant' }, 'hello')
    assert.ok(offered(run).includes('code_mode'), offered(run).join())
    assert.ok(!offered(run).includes('read_file'))
  })

  test('someone outside the account is not offered code_mode', async () => {
    // Scripts run on a small per-process worker pool shared by every tenant: an orchestration tool, which a
    // visitor or an outsider does not need, and which a few waiting scripts could hold for everyone.
    await putMockSettings(admin, 'user/test-standalone1', { quotas: { ...defaultQuotas, external: { unlimited: true, monthlyLimit: 0 }, untrusted: { unlimited: true, monthlyLimit: 0 } } })
    const { run } = await turnOverSocket(outsider, { agentId: 'portal-assistant' }, 'hello', { owner: 'user/test-standalone1' })
    assert.equal(run.triggeredByRole, 'external')
    assert.ok(offered(run).length, 'the turn ran and offered tools')
    assert.ok(!offered(run).includes('code_mode'), offered(run).join())
  })

  // A configured agent's write routed to a person: the script pauses on it, the person gets a card, and the decision
  // resumes the script where it stopped — the read before the pause is not made again.
  test('a script\'s call that needs a person pauses the script until the decision', async () => {
    fixture.resetInvokedTools()
    const agent = await createFilesAgent({ approvalRoutes: { write: 'reviewer+person' } })
    const { run, assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('const c = await tools.list_road_closures({ district: "city-center" }); const u = await tools.slow_update({}); return { read: typeof c, updated: u }'))
    assert.equal(run.stopReason, 'awaiting-approval')
    const call = callPart(assistant, 'code_mode')
    assert.equal(call.state, 'approval-requested', JSON.stringify(call))
    assert.equal(call.toolMetadata.nested.toolName, 'slow_update')
    assert.equal(call.toolMetadata.review.outcome, 'allow')
    assert.deepEqual(fixture.invokedTools(), ['list_road_closures'])

    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, call.approval.id, { approved: true })
    const approvalRun = await awaitRun(orgAdmin, conversationId, runId)
    assert.equal(approvalRun.stopReason, 'completed', JSON.stringify(approvalRun))
    const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
    const settled = callPart(messages.find((m: any) => m.seq === assistant.seq), 'code_mode')
    assert.equal(settled.state, 'output-available', outputOf(settled))
    assert.match(outputOf(settled), /"updated": "updated slowly"/)
    assert.deepEqual(fixture.invokedTools(), ['list_road_closures', 'slow_update'])
    // The whole script's calls under its chip: the read before the pause, the approved write after it.
    assert.deepEqual(trace(messages.find((m: any) => m.seq === assistant.seq)).parts.filter((p: any) => p.type === 'dynamic-tool').map((p: any) => p.toolName), ['list_road_closures', 'slow_update'])
  })

  const messageAt = async (conversationId: string, seq: number) =>
    (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results.find((m: any) => m.seq === seq)

  test('a rejected call throws inside the resumed script, which may catch it', async () => {
    fixture.resetInvokedTools()
    const agent = await createFilesAgent({ approvalRoutes: { write: 'reviewer+person' } })
    const { assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('await tools.list_road_closures({ district: "city-center" }); try { await tools.slow_update({}); return "ran" } catch (e) { return "caught: " + e.message }'))
    const call = callPart(assistant, 'code_mode')
    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, call.approval.id, { approved: false, reason: 'not today' })
    assert.equal((await awaitRun(orgAdmin, conversationId, runId)).stopReason, 'completed')
    const settled = callPart(await messageAt(conversationId, assistant.seq), 'code_mode')
    assert.equal(settled.state, 'output-available', outputOf(settled))
    assert.match(outputOf(settled), /caught: slow_update was not run: the person rejected it \(their reason: not today\)/)
    assert.equal(settled.toolMetadata.decision.approved, false)
    assert.deepEqual(fixture.invokedTools(), ['list_road_closures'])
  })

  test('a script pausing in a loop asks again after each decision, then settles', async () => {
    fixture.resetInvokedTools()
    const agent = await createFilesAgent({ approvalRoutes: { write: 'reviewer+person' } })
    const { assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('const out = []; for (let i = 0; i < 2; i++) { await tools.list_road_closures({ district: "city-center" }); out.push(await tools.slow_update({})) } return out'))
    let call = callPart(assistant, 'code_mode')
    const first = call.approval.id
    const second = await awaitRun(orgAdmin, conversationId, (await decideOverSocketToRun(orgAdmin, conversationId, first, { approved: true })).runId)
    assert.equal(second.stopReason, 'awaiting-approval')
    call = callPart(await messageAt(conversationId, assistant.seq), 'code_mode')
    assert.equal(call.state, 'approval-requested', JSON.stringify(call))
    assert.notEqual(call.approval.id, first)
    assert.equal(call.toolMetadata.decision, undefined, 'the new card is undecided')
    assert.deepEqual(fixture.invokedTools(), ['list_road_closures', 'slow_update', 'list_road_closures'])
    const last = await awaitRun(orgAdmin, conversationId, (await decideOverSocketToRun(orgAdmin, conversationId, call.approval.id, { approved: true })).runId)
    assert.equal(last.stopReason, 'completed')
    const settled = callPart(await messageAt(conversationId, assistant.seq), 'code_mode')
    assert.equal(settled.state, 'output-available', outputOf(settled))
    assert.match(outputOf(settled), /"updated slowly",\s*"updated slowly"/)
    assert.deepEqual(fixture.invokedTools(), ['list_road_closures', 'slow_update', 'list_road_closures', 'slow_update'])
  })

  // Two calls pending at once (Promise.allSettled): one card, then the other; each call keeps its own decision.
  test('parallel calls pausing together: the rejected one does not run, the approved one does', async () => {
    fixture.resetInvokedTools()
    const agent = await createFilesAgent({ approvalRoutes: { write: 'reviewer+person' } })
    const { assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('const r = await Promise.allSettled([tools.slow_update({}), tools.set_note({ note: "ok" })]); return r.map(x => x.status).join("|")'))
    const first = callPart(assistant, 'code_mode')
    assert.equal(first.state, 'approval-requested', JSON.stringify(first))
    const firstTool = first.toolMetadata.nested.toolName
    const again = await awaitRun(orgAdmin, conversationId, (await decideOverSocketToRun(orgAdmin, conversationId, first.approval.id, { approved: false, reason: 'not this one' })).runId)
    assert.equal(again.stopReason, 'awaiting-approval')
    const second = callPart(await messageAt(conversationId, assistant.seq), 'code_mode')
    assert.equal(second.state, 'approval-requested')
    const secondTool = second.toolMetadata.nested.toolName
    assert.deepEqual([firstTool, secondTool].sort(), ['set_note', 'slow_update'])
    assert.deepEqual(second.toolMetadata.earlierDecisions.map((d: any) => [d.approved, d.nested.toolName]), [[false, firstTool]])
    assert.deepEqual(fixture.invokedTools(), [], 'nothing runs before the last decision')
    const last = await awaitRun(orgAdmin, conversationId, (await decideOverSocketToRun(orgAdmin, conversationId, second.approval.id, { approved: true })).runId)
    assert.equal(last.stopReason, 'completed')
    const settled = callPart(await messageAt(conversationId, assistant.seq), 'code_mode')
    assert.equal(settled.state, 'output-available', outputOf(settled))
    assert.deepEqual(fixture.invokedTools(), [secondTool])
    assert.match(outputOf(settled), firstTool === 'slow_update' ? /rejected\|fulfilled/ : /fulfilled\|rejected/)
  })

  test('a new message cancels a paused script: nothing after the pause runs', async () => {
    fixture.resetInvokedTools()
    const agent = await createFilesAgent({ approvalRoutes: { write: 'reviewer+person' } })
    const { assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('await tools.list_road_closures({ district: "city-center" }); await tools.slow_update({}); return "done"'))
    const next = await turnOverSocket(orgAdmin, conversationId, 'hello')
    assert.equal(next.run.stopReason, 'completed')
    const cancelled = callPart(await messageAt(conversationId, assistant.seq), 'code_mode')
    assert.equal(cancelled.state, 'output-denied')
    assert.equal(cancelled.approval.reason, 'The person sent a new message instead of deciding.')
    assert.deepEqual(fixture.invokedTools(), ['list_road_closures'])
  })

  test('get_my_configuration reports code mode', async () => {
    const agent = await createFilesAgent()
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool get_my_configuration {}')
    assert.match(outputOf(callPart(assistant, 'get_my_configuration')), /## Code mode\nOn:/)
  })
})
