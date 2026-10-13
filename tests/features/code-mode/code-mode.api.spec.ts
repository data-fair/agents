/**
 * stateful API tests: code_mode in real turns — chaining catalog tools with structured results, nested calls
 * recorded, files from a script, gates and reserved tools out of reach, the personal assistant included.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { FIXTURE_PORT, createFilesAgent, callPart, outputOf } from '../../support/files.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const offered = (run: any): string[] => run.calls.flatMap((c: any) => c.toolNames ?? [])
const trace = (message: any) => message.parts.find((p: any) => p.type === 'data-subagent' && p.data?.name === 'code_mode')?.data
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

  test('a gated tool and a sub-agent\'s reserved tool are not in a script\'s API', async () => {
    const agent = await createFilesAgent({ approvals: { readOnly: 'allow', write: 'allow', destructive: 'approve' } })
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, script('try { await tools.wipe_everything({}) } catch (e) { return e.message }'))
    assert.match(outputOf(callPart(assistant, 'code_mode')), /Unknown tool: wipe_everything/)
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
    const { run } = await turnOverSocket(orgAdmin, { agentId: 'personal' }, 'hello')
    assert.ok(offered(run).includes('code_mode'), offered(run).join())
    assert.ok(!offered(run).includes('read_file'))
  })

  test('get_my_configuration reports code mode', async () => {
    const agent = await createFilesAgent()
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool get_my_configuration {}')
    assert.match(outputOf(callPart(assistant, 'get_my_configuration')), /## Code mode\nOn:/)
  })
})
