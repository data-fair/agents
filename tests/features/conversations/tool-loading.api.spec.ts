/**
 * stateful API tests: on-demand tool loading in real turns (docs/architecture/tool-loading.md). Deferral is forced on
 * the small dev fixture by a small assistant context window: its MCP tools then exceed the deferral share. What the
 * model was offered is read from the mock (`list tools` answers the step's tool names) and from the run's record;
 * whether a tool ran, from the MCP fixture's own record of calls.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, axiosAuth, clean } from '../../support/axios.ts'
import { putMockSettings, mockModelRef } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket, decideOverSocketToRun } from '../../../dev/socket-turn.ts'
import { awaitRun } from '../../support/turn.ts'
import { FIXTURE_PORT, createFilesAgent, callPart, outputOf } from '../../support/files.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const offered = (run: any): string[] => (run.calls ?? []).flatMap((c: any) => c.toolNames ?? [])
const listed = (assistant: any): string[] => JSON.parse(assistant.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(''))
const text = (assistant: any): string => assistant.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
const script = (js: string) => `call tool code_mode ${JSON.stringify({ js })}`
// A compaction is a summarizer call recorded on the run.
const compacted = (run: any) => (run.calls ?? []).some((call: any) => call.modelRole === 'summarizer')
let fixture: McpFixture

/** A window small enough that the fixture's tools exceed 10% of it, large enough that no short conversation compacts. */
const smallWindow = { models: [{ model: mockModelRef, usage: ['assistant', 'summarizer', 'moderator'], contextWindow: 4000, inputPricePerMillion: 0, outputPricePerMillion: 0 }] }

test.describe('tool loading', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1', smallWindow)
  })

  test('a large tool set offers load_tools and a catalog, not the definitions', async () => {
    const agent = await createFilesAgent()
    const { assistant, run } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'list tools')
    const names = listed(assistant)
    for (const name of ['load_tools', 'read_file', 'code_mode']) assert.ok(names.includes(name), name)
    for (const name of ['list_road_closures', 'echo']) assert.ok(!names.includes(name), name)
    assert.match(run.systemPrompt, /- list_road_closures — /)
    assert.ok(!offered(run).includes('echo'), 'a tool never shown is not recorded as offered')
    assert.ok(!compacted(run))
  })

  test('a tool loaded by name is callable at the next step of the same turn', async () => {
    const agent = await createFilesAgent()
    const { assistant, run } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'load and call list_road_closures {"district":"riverside"}')
    assert.equal(callPart(assistant, 'list_road_closures')?.state, 'output-available', outputOf(callPart(assistant, 'load_tools')))
    assert.match(text(assistant), /loaded and called list_road_closures/)
    assert.ok(offered(run).includes('list_road_closures'))
    assert.deepEqual(fixture.invokedTools(), ['list_road_closures'])
  })

  test('a loaded tool stays offered on the next turn, from its first step, with the same prompt', async () => {
    const agent = await createFilesAgent()
    const first = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'load and call list_road_closures {"district":"riverside"}')
    const second = await turnOverSocket(orgAdmin, first.conversationId, 'list tools')
    assert.ok(listed(second.assistant).includes('list_road_closures'))
    assert.ok(!listed(second.assistant).includes('echo'))
    assert.equal(second.run.systemPrompt, first.run.systemPrompt)
    assert.ok(!compacted(second.run))
  })

  test('a tool loaded but not yet called stays offered on the next turn', async () => {
    const agent = await createFilesAgent()
    const first = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool load_tools {"names":["echo"]}')
    assert.equal(callPart(first.assistant, 'load_tools').state, 'output-available')
    const second = await turnOverSocket(orgAdmin, first.conversationId, 'list tools')
    assert.ok(listed(second.assistant).includes('echo'))
  })

  test('code_mode declares a deferred tool only once it is loaded', async () => {
    const agent = await createFilesAgent()
    const call = script('return await tools.echo({ value: "x" })')
    const before = await turnOverSocket(orgAdmin, { agentId: agent.id }, call)
    assert.equal(callPart(before.assistant, 'code_mode').state, 'output-error', outputOf(callPart(before.assistant, 'code_mode')))
    await turnOverSocket(orgAdmin, before.conversationId, 'load and call echo {"value":"y"}')
    const after = await turnOverSocket(orgAdmin, before.conversationId, call)
    const part = callPart(after.assistant, 'code_mode')
    assert.equal(part.state, 'output-available', outputOf(part))
    assert.match(outputOf(part), /echo:x/)
  })

  test('a call to a tool that is not loaded fails with a hint to load it, does not run, and does not load it', async () => {
    const agent = await createFilesAgent()
    const { assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"x"}')
    const part = callPart(assistant, 'echo')
    assert.equal(part?.state, 'output-error')
    assert.match(String(part.errorText), /load_tools/)
    assert.deepEqual(fixture.invokedTools(), [])
    // Nor does the refused call load it for the next turn: only load_tools does.
    const next = await turnOverSocket(orgAdmin, conversationId, 'list tools')
    assert.ok(!listed(next.assistant).includes('echo'))
  })

  test('a deferred write decided on a card runs under its own name', async () => {
    const agent = await createFilesAgent()
    const { run, assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'load and call delete_note {"note":"ok"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(assistant, 'delete_note')
    assert.equal(part.state, 'approval-requested')
    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, part.approval.id, { approved: true })
    const approvalRun = await awaitRun(orgAdmin, conversationId, runId)
    assert.equal(approvalRun.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['delete_note'])
  })

  test('below the threshold nothing changes', async () => {
    await putMockSettings(admin, 'organization/test1')
    const agent = await createFilesAgent()
    const { assistant, run } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'list tools')
    assert.ok(listed(assistant).includes('echo'))
    assert.ok(!listed(assistant).includes('load_tools'))
    assert.doesNotMatch(run.systemPrompt, /load_tools/)
  })
})
