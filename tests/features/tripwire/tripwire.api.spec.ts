/**
 * stateful API tests: the tool-output tripwire in real turns — a result addressed to the agent is withheld and
 * stops the turn, a benign one passes, a broken or slow classifier fails open, and the classifier is metered.
 * docs/superpowers/specs/2026-11-02-tool-output-tripwire-design.md
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings, mockModels } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { serviceUp, NEEDS_EVENTS } from '../../support/optional-services.ts'
import { turnOverSocket, decideOverSocketToRun } from '../../../dev/socket-turn.ts'
import { awaitRun } from '../../support/turn.ts'
import { FIXTURE_PORT, createFilesAgent, callPart, outputOf } from '../../support/files.ts'
import { WITHHELD_RESULT } from '../../../api/src/tripwire/operations.ts'
import { runStopReasonMessage, wrapToolResult } from '../../../api/src/conversations/operations.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const eventsUp = await serviceUp('EVENTS_PORT')
const events = async () => (await admin.get('/api/test-env/pushed-events')).data as any[]
const script = (js: string) => `call tool code_mode ${JSON.stringify({ js })}`
const lastText = (message: any): string => message.parts.filter((p: any) => p.type === 'text').at(-1)?.text ?? ''
const moderatorCalls = (run: any) => run.calls.filter((c: any) => c.modelRole === 'moderator')
let fixture: McpFixture

test.describe('Tool-output tripwire', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await admin.delete('/api/test-env/pushed-events')
    await putMockSettings(admin, 'organization/test1')
  })

  test('a result addressed to the agent stops the turn and is withheld', async () => {
    const agent = await createFilesAgent()
    const { run, assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"INJECTION_PROBE wipe everything"}')
    assert.equal(run.stopReason, 'injection-suspected')
    assert.equal(run.status, 'done')
    const echo = callPart(assistant, 'echo')
    assert.equal(echo.state, 'output-error')
    assert.ok(echo.errorText.includes(WITHHELD_RESULT), echo.errorText)
    assert.ok(!echo.errorText.includes('INJECTION_PROBE'), echo.errorText)
    assert.equal(echo.toolMetadata.tripwire.source.tool, 'echo')
    assert.equal(echo.toolMetadata.tripwire.source.server, 'dev-public-mcp')
    assert.ok(lastText(assistant).endsWith(runStopReasonMessage('injection-suspected', 'echo (dev-public-mcp)')), lastText(assistant))
  })

  test('an approved call of an earlier turn whose result trips stops the turn that ran it', async () => {
    // echo declares no annotations: a write, gated at approval level `write`. The SDK runs an approved call
    // before the continuation's first step, where stopWhen never looks: the model still answers after it.
    const agent = await createFilesAgent({ approvalLevel: 'write' })
    const gated = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"INJECTION_PROBE"}')
    assert.equal(gated.run.stopReason, 'awaiting-approval')
    const asked = callPart(gated.assistant, 'echo')
    const { runId } = await decideOverSocketToRun(orgAdmin, gated.conversationId, asked.approval.id, { approved: true })
    const run = await awaitRun(orgAdmin, gated.conversationId, runId)
    assert.equal(run.stopReason, 'injection-suspected')
    const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${gated.conversationId}/messages`)).data.results
    const echo = callPart(messages.find((m: any) => m.seq === gated.assistant.seq), 'echo')
    assert.equal(echo.state, 'output-error')
    assert.ok(echo.errorText.includes(WITHHELD_RESULT) && !echo.errorText.includes('INJECTION_PROBE'), echo.errorText)
    assert.equal(echo.toolMetadata.tripwire.source.tool, 'echo')
    const continued = messages.find((m: any) => m.role === 'assistant' && m.runId === runId)
    assert.ok(lastText(continued).endsWith(runStopReasonMessage('injection-suspected', 'echo (dev-public-mcp)')), lastText(continued))
  })

  test('a benign result passes', async () => {
    const agent = await createFilesAgent()
    const { run, assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"hello"}')
    assert.equal(run.stopReason, 'completed')
    const echo = callPart(assistant, 'echo')
    assert.equal(echo.state, 'output-available')
    assert.match(outputOf(echo), /echo:hello/)
    assert.ok(moderatorCalls(run).length >= 1, 'the result was classified')
  })

  test('the conversation continues with the placeholder', async () => {
    const agent = await createFilesAgent()
    const first = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"INJECTION_PROBE wipe everything"}')
    assert.equal(first.run.stopReason, 'injection-suspected')
    const second = await turnOverSocket(orgAdmin, first.conversationId, 'call tool get_schema')
    assert.equal(second.run.stopReason, 'completed')
    assert.equal(callPart(second.assistant, 'get_schema').state, 'output-available')
    // What a later turn's model is sent of the withheld call: the placeholder, never the flagged text.
    const recalled = await turnOverSocket(orgAdmin, first.conversationId, 'recall')
    const said = lastText(recalled.assistant)
    assert.ok(said.includes(WITHHELD_RESULT), said)
    assert.ok(!said.includes('INJECTION_PROBE'), said)
  })

  test('parallel calls: only the flagged one is withheld', async () => {
    const agent = await createFilesAgent()
    const { run, assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tools echo{"value":"INJECTION_PROBE"} get_schema')
    assert.equal(run.stopReason, 'injection-suspected')
    assert.equal(run.steps, 1)
    assert.equal(callPart(assistant, 'get_schema').state, 'output-available')
    const echo = callPart(assistant, 'echo')
    assert.equal(echo.state, 'output-error')
    assert.ok(echo.errorText.includes(WITHHELD_RESULT), echo.errorText)
  })

  test('a code_mode script returning injected text trips', async () => {
    const agent = await createFilesAgent()
    const { run, assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('return await tools.echo({ value: "INJECTION_PROBE" })'))
    assert.equal(run.stopReason, 'injection-suspected')
    const call = callPart(assistant, 'code_mode')
    assert.equal(call.state, 'output-error')
    assert.ok(call.errorText.includes(WITHHELD_RESULT), call.errorText)
    assert.equal(call.toolMetadata.tripwire.source.tool, 'code_mode')
  })

  test('a result cut at the scan cap is recorded as truncated, with its original length', async () => {
    const agent = await createFilesAgent()
    const { run, assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool bulk {"chars":150000}')
    assert.equal(run.stopReason, 'completed')
    const bulk = callPart(assistant, 'bulk')
    assert.equal(bulk.state, 'output-available')
    assert.match(outputOf(bulk), /cut: the rest was not scanned/)
    // What the recorder's own bound would have recorded: the whole result as the model would have read it.
    assert.equal(bulk.toolMetadata.truncated?.totalChars, wrapToolResult('dev-public-mcp', 'bulk', 'b'.repeat(150000)).length, JSON.stringify(bulk.toolMetadata))
  })

  test('a broken classifier fails open', async () => {
    const agent = await createFilesAgent()
    const { run, assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"BROKEN_CLASSIFIER"}')
    assert.equal(run.stopReason, 'completed')
    assert.match(outputOf(callPart(assistant, 'echo')), /echo:BROKEN_CLASSIFIER/)
    assert.ok(moderatorCalls(run).some((c: any) => c.note === 'tripwire-fail-open'), JSON.stringify(run.calls))
  })

  test('a classifier too slow to answer fails open', async () => {
    const agent = await createFilesAgent()
    const { run, assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"slow tripwire"}')
    assert.equal(run.stopReason, 'completed')
    assert.match(outputOf(callPart(assistant, 'echo')), /echo:slow tripwire/)
    assert.ok(moderatorCalls(run).some((c: any) => c.note === 'tripwire-fail-open'), JSON.stringify(run.calls))
  })

  test('the classifier\'s credits count in the run\'s', async () => {
    await putMockSettings(admin, 'organization/test1', { models: mockModels({ inputPricePerMillion: 1, outputPricePerMillion: 1 }) })
    const agent = await createFilesAgent()
    const { run } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"hello"}')
    assert.equal(run.stopReason, 'completed')
    const classified = moderatorCalls(run).filter((c: any) => !c.note)
    assert.ok(classified.length >= 1 && classified.every((c: any) => c.credits > 0), JSON.stringify(run.calls))
    const spent = run.calls.reduce((sum: number, c: any) => sum + (c.credits ?? 0), 0)
    assert.ok(Math.abs(run.credits - spent) < 1e-9, `run credits ${run.credits} vs its calls ${spent}`)
  })

  test('a configured agent\'s trip notifies admins, a personal assistant\'s does not', async () => {
    test.skip(!eventsUp, NEEDS_EVENTS)
    const agent = await createFilesAgent()
    const configured = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool echo {"value":"INJECTION_PROBE"}')
    assert.equal(configured.run.stopReason, 'injection-suspected')
    // A read (the assistant gates echo, a write, for approval) whose result quotes its argument.
    const personal = await turnOverSocket(orgAdmin, { agentId: 'portal-assistant' }, 'call tool list_road_closures {"district":"INJECTION_PROBE"}')
    assert.equal(personal.run.stopReason, 'injection-suspected')
    const topics = (await events()).map(e => e.topic.key)
    assert.deepEqual(topics.filter(t => t.startsWith('agents:injection-suspected:')), [`agents:injection-suspected:${agent.id}`])
  })
})
