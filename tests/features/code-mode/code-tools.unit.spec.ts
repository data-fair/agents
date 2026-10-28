/**
 * stateless unit tests of the map a code_mode script calls (api/src/code-mode/code-tools.ts): which tools are
 * in it, that a nested call is recorded under the code_mode call, that a failure keeps its message.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { codeCallable, SCRIPT_TRANSFER_BYTES } from '../../../api/src/code-mode/operations.ts'
import { codeFacingTools, createCodeTrace } from '../../../api/src/code-mode/code-tools.ts'
import { createScriptTool } from '../../../api/src/code-mode/tool.ts'
import { REQUEST_WEB_ACCESS_TOOL_NAME } from '../../../api/src/web/operations.ts'
import { REQUEST_MCP_ACCESS_TOOL_NAME, codeOutputSchemaFor } from '../../../api/src/mcp-servers/operations.ts'
import { PLANNING_TOOL_NAMES } from '../../../api/src/self-knowledge/operations.ts'
import { READ_SKILL_TOOL_NAME } from '../../../api/src/mcp-servers/read-skill.ts'
import { FILE_CODE_SIGNATURES, createFileTools } from '../../../api/src/files/tools.ts'

const plain = (execute: (input: any) => Promise<unknown>) => tool({ description: 'd', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute })
const traces: any[] = []
const trace = () => createCodeTrace(t => { traces.push(t) })

test.describe('code-facing tools', () => {
  test.beforeEach(() => { traces.length = 0 })

  test('codeCallable excludes gates, handovers, admin requests, skills and itself', () => {
    for (const name of ['wait_for_user_action', 'request_web_access', 'request_mcp_access', 'plan_task', 'update_task', 'delete_task', 'read_skill', 'code_mode']) {
      assert.equal(codeCallable(name, {}), false, name)
    }
    assert.equal(codeCallable('wipe_everything', { needsApproval: true }), false)
    for (const name of ['list_road_closures', 'read_file', 'fetch_url', 'memory', 'report_outcome', 'set_display']) assert.equal(codeCallable(name, {}), true, name)
  })

  test('a script gets codeExecute\'s data; each nested call is recorded under the code_mode call', async () => {
    const t = trace()
    const tools = codeFacingTools({
      names: ['stats'],
      fixed: { stats: { tool: plain(async () => 'text'), server: 'dev', codeExecute: async () => ({ count: 2 }) } },
      page: {},
      callPath: {},
      trace: t
    })
    const script = createScriptTool(tools)
    assert.equal(await script.execute!({ js: 'const s = await tools.stats({}); return s.count' }, { toolCallId: 'cm1', messages: [], context: {} }), '2')
    t.finish('cm1')
    const last = traces[traces.length - 1]
    assert.equal(last.parentToolCallId, 'cm1')
    assert.equal(last.name, 'code_mode')
    assert.equal(last.pending, false)
    const call = last.parts.find((p: any) => p.type === 'dynamic-tool')
    assert.equal(call.toolName, 'stats')
    assert.equal(call.state, 'output-available')
    assert.match(JSON.stringify(call.output), /count.{1,4}2/)
  })

  test('a nested tool\'s failure reaches the script with its message, and the model when uncaught', async () => {
    const t = trace()
    const tools = codeFacingTools({
      names: ['lookup'],
      fixed: { lookup: { tool: plain(async () => { throw new Error('dataset "x" not found') }), server: 'dev' } },
      page: {},
      callPath: {},
      trace: t
    })
    const script = createScriptTool(tools)
    assert.equal(await script.execute!({ js: 'try { await tools.lookup({}) } catch (e) { return e.message }' }, { toolCallId: 'cm2', messages: [], context: {} }), 'dataset "x" not found')
    await assert.rejects(script.execute!({ js: 'await tools.lookup({})' }, { toolCallId: 'cm3', messages: [], context: {} }), /dataset "x" not found/)
    t.finish('cm3')
    assert.equal(traces[traces.length - 1].parts.find((p: any) => p.type === 'dynamic-tool').state, 'output-error')
  })

  test('a page tool\'s failure is an exception like any other', async () => {
    const tools = codeFacingTools({ names: ['set_display'], fixed: {}, page: { set_display: plain(async () => { throw new Error('the page is gone') }) }, callPath: {}, trace: trace() })
    assert.equal(await createScriptTool(tools).execute!({ js: 'try { await tools.set_display({}) } catch (e) { return e.message }' }, { toolCallId: 'cm4', messages: [], context: {} }), 'the page is gone')
  })

  test('the scripts of one turn share a bound on their tool calls, across steps', async () => {
    // One script makes at most 100 calls, but a turn could run one per step: ~10,000 calls a turn.
    let made = 0
    const turnCalls = { count: 0, max: 3 }
    const page = { set_display: plain(async () => { made++; return 'ok' }) }
    // The map is rebuilt every step; the counter is the turn's.
    const step = () => createScriptTool(codeFacingTools({ names: ['set_display'], fixed: {}, page, callPath: {}, trace: trace(), turnCalls }))
    const js = 'const out = []; for (let i = 0; i < 2; i++) { try { out.push(await tools.set_display({})) } catch (e) { out.push(e.message) } } return out.join("|")'
    assert.equal(await step().execute!({ js }, { toolCallId: 'cmA', messages: [], context: {} }), 'ok|ok')
    const second = String(await step().execute!({ js }, { toolCallId: 'cmB', messages: [], context: {} }))
    assert.match(second, /^ok\|.*3 tool calls/)
    assert.equal(made, 3)
  })

  test('only the named, callable tools are in the map', () => {
    const tools = codeFacingTools({
      names: ['a', 'gated'],
      fixed: { a: { tool: plain(async () => 1), server: 'dev' }, gated: { tool: { ...plain(async () => 1), needsApproval: true }, server: 'dev' }, reserved: { tool: plain(async () => 1), server: 'dev' } },
      page: {},
      callPath: {},
      trace: trace()
    })
    assert.deepEqual(Object.keys(tools), ['a'])
  })

  test('what a script moves through its tools is budgeted: the call that would pass the budget fails in words, the earlier ones stand', async () => {
    const MiB = 1024 * 1024
    const tools = codeFacingTools({
      names: ['big'],
      fixed: { big: { tool: plain(async () => 'x'.repeat(9 * MiB)), server: 'dev' } },
      page: {},
      callPath: {},
      trace: trace()
    })
    const script = createScriptTool(tools)
    // Two 9 MiB results fit; the third would pass SCRIPT_TRANSFER_BYTES, and run's own 32 MiB record behind it.
    const out = await script.execute!({ js: 'const got = []; for (let i = 0; i < 3; i++) { try { got.push((await tools.big({})).length) } catch (e) { got.push(e.message) } } return got' }, { toolCallId: 'cm5', messages: [], context: {} })
    const got = JSON.parse(out as string)
    assert.equal(got[0], 9 * MiB)
    assert.equal(got[1], 9 * MiB)
    assert.match(got[2], new RegExp(`ran, but its result would bring .* past ${SCRIPT_TRANSFER_BYTES / MiB} MiB`))
    await assert.rejects(script.execute!({ js: 'for (let i = 0; i < 4; i++) await tools.big({})' }, { toolCallId: 'cm6', messages: [], context: {} }), /past 24 MiB/)
  })

  test('an input over the budget is refused before the tool runs', async () => {
    let ran = 0
    const MiB = 1024 * 1024
    const tools = codeFacingTools({
      names: ['big', 'sink'],
      fixed: { big: { tool: plain(async () => 'x'.repeat(9 * MiB)), server: 'dev' }, sink: { tool: plain(async () => { ran++; return 'ok' }), server: 'dev' } },
      page: {},
      callPath: {},
      trace: trace()
    })
    // 18 MiB of results spent, then a 7 MiB input: the sink must not run.
    await assert.rejects(createScriptTool(tools).execute!({ js: 'await tools.big({}); await tools.big({}); await tools.sink({ content: "y".repeat(7 * 1024 * 1024) })' }, { toolCallId: 'cm7', messages: [], context: {} }), /was not made: its input would bring/)
    assert.equal(ran, 0)
  })

  test('the direct-only names are the service\'s own constants', () => {
    for (const name of [REQUEST_WEB_ACCESS_TOOL_NAME, REQUEST_MCP_ACCESS_TOOL_NAME, ...PLANNING_TOOL_NAMES, READ_SKILL_TOOL_NAME]) assert.equal(codeCallable(name, {}), false, name)
  })
})

test.describe('the trace of a script', () => {
  test.beforeEach(() => { traces.length = 0 })

  const runScript = async (fixed: any, js: string, toolCallId: string, policy?: any) => {
    const t = trace()
    const script = createScriptTool(codeFacingTools({ names: Object.keys(fixed), fixed, page: {}, callPath: {}, trace: t }), policy ? { policy } : {})
    try {
      return { t, result: await script.execute!({ js }, { toolCallId, messages: [], context: {} }) }
    } catch (error) {
      return { t, error }
    } finally {
      t.finish(toolCallId)
    }
  }

  test('a nested call\'s input is recorded bounded: a 10 MB write_file content is cut', async () => {
    const { t } = await runScript({ write_file: { tool: plain(async () => 'ok'), server: 'files', codeExecute: async () => ({ file_path: '/big.csv', mimeType: 'text/csv', size: 10_000_000 }) } }, 'await tools.write_file({ file_path: "/big.csv", content: "x".repeat(10_000_000) }); return 1', 'cm-in')
    assert.ok(t)
    const call = traces[traces.length - 1].parts.find((p: any) => p.type === 'dynamic-tool')
    assert.equal(call.input.file_path, '/big.csv')
    assert.ok(call.input.content.length < 11_000, `content kept ${call.input.content.length} chars`)
    assert.match(call.input.content, /10000000 chars in total/)
    assert.ok(JSON.stringify(traces).length < 200_000)
  })

  test('a script stopped by its timeout: the trace is closed and nothing is emitted after the final frame', async () => {
    let settled = false
    let signal: AbortSignal | undefined
    const stubborn = tool({ description: 'd', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute: async (_input, options) => { signal = options.abortSignal; return await new Promise(resolve => setTimeout(() => { settled = true; resolve('late') }, 600)) } })
    const { error } = await runScript({ stubborn: { tool: stubborn, server: 'dev' } }, 'await tools.stubborn({})', 'cm-to', { timeoutMs: 200 })
    assert.match(String((error as Error)?.message), /ran for more than 0\.2 s/)
    assert.equal(signal?.aborted, true, 'the package aborts the nested call\'s signal on the timeout')
    const count = traces.length
    const last = traces[count - 1]
    assert.equal(last.pending, false)
    const call = last.parts.find((p: any) => p.type === 'dynamic-tool')
    assert.equal(call.state, 'output-error')
    assert.match(call.errorText, /stopped/)
    await new Promise(resolve => setTimeout(resolve, 800))
    assert.ok(settled, 'the tool did answer, late')
    assert.equal(traces.length, count, 'no frame after the final one')
  })

  test('an uncaught failure is reported as itself, not as an earlier caught one', async () => {
    const lookup = { tool: tool({ description: 'd', inputSchema: jsonSchema<{ id: string }>({ type: 'object', properties: { id: { type: 'string' } } }), execute: async ({ id }): Promise<string> => { throw new Error(`dataset "${id}" not found`) } }), server: 'dev' }
    const { error } = await runScript({ lookup }, 'try { await tools.lookup({ id: "a" }) } catch {} ; await tools.lookup({ id: "b" })', 'cm-two')
    assert.match(String((error as Error)?.message), /dataset "b" not found/)
    assert.doesNotMatch(String((error as Error)?.message), /CODE_MODE_TOOL_ERROR/)
  })

  test('pending frames are coalesced; the final frame is always sent', async () => {
    const { result } = await runScript({ quick: { tool: plain(async () => 'ok'), server: 'dev' } }, 'await Promise.all([1,2,3,4,5,6,7,8].map(() => tools.quick({}))); return 1', 'cm-many')
    assert.equal(result, '1')
    assert.ok(traces.length < 17, `${traces.length} frames for 8 calls`)
    assert.equal(traces[traces.length - 1].pending, false)
    assert.equal(traces[traces.length - 1].parts.filter((p: any) => p.state === 'output-available').length, 8)
  })

  test('the description tells a script what the file tools return', async () => {
    const fixed: any = {}
    // The MODEL's tools: paged, numbered, 1 MB. A script must read its own signature, not theirs.
    const model = createFileTools({} as any)
    for (const name of ['ls', 'read_file', 'write_file'] as const) fixed[name] = { tool: model[name], server: 'files', ...FILE_CODE_SIGNATURES[name] }
    const description = String(createScriptTool(codeFacingTools({ names: Object.keys(fixed), fixed, page: {}, callPath: {}, trace: trace() })).description)
    const readFile = description.slice(description.indexOf('read_file:'), description.indexOf('=> Promise', description.indexOf('read_file:')))
    assert.match(readFile, /file_path: string/)
    assert.doesNotMatch(readFile, /offset|limit/)
    assert.match(description, /read_file: \(input: \{[^}]*\}\) => Promise<string>/)
    assert.match(description, /whole text of one of your text files/)
    assert.match(description, /\/\*\* Read the whole text[^/]*Papa\.parse/)
    assert.match(description, /\/\*\* Create or overwrite[^/]*Papa\.unparse/)
    assert.doesNotMatch(description, /a page of lines at a time|at most 1 MB/)
    assert.match(description, /write_file: \(input: \{[^}]*content: string[^}]*\}\) => Promise<\{[^}]*file_path: string[^}]*mimeType: string[^}]*size: number/)
    assert.match(description, /ls: \(input: \{\s*\}\) => Promise<(Array<\{|\{)[^}]*expiresAt: string/)
    assert.match(description, /JSON\.parse/)
    assert.match(description, /\{ text, files/)
  })

  test('an MCP tool that declares no output schema reads as what the call path can return, files included', async () => {
    const declared = { type: 'object', properties: { count: { type: 'number' } } }
    assert.equal(codeOutputSchemaFor(declared), declared)
    const fixed: any = { export_closures: { tool: plain(async () => ''), server: 'dev', codeOutputSchema: codeOutputSchemaFor(undefined) } }
    const description = String(createScriptTool(codeFacingTools({ names: ['export_closures'], fixed, page: {}, callPath: {}, trace: trace() })).description)
    const signature = description.slice(description.indexOf('export_closures:'))
    assert.match(signature, /=> Promise<string \|/)
    assert.match(signature, /text: string/)
    assert.match(signature, /files: \{[^}]*file_path: string[^}]*sha256: string[^}]*\}\[\]/)
    assert.match(signature, /Record<string, unknown>/)
    assert.match(description, /`text` only describes the files/)
  })
})
