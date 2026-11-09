/**
 * stateless unit tests of the map a code_mode script calls (api/src/code-mode/code-tools.ts): which tools are
 * in it, that a nested call is recorded under the code_mode call, that a failure keeps its message.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { experimental_runCodeMode as runCodeMode, experimental_continueCodeModeApproval as continueCodeModeApproval, experimental_unwrapCodeModeResult as unwrapCodeModeResult, experimental_isCodeModeApprovalInterrupt as isCodeModeApprovalInterrupt, experimental_setCodeModeContinuationSigningKey as setCodeModeContinuationSigningKey } from '@ai-sdk/code-mode'
import { codeCallable, SCRIPT_TRANSFER_BYTES, SCRIPT_RESUME_FAILED_MESSAGE, rejectedCallMessage, scriptPauseTooLargeMessage, turnCallsExceededMessage } from '../../../api/src/code-mode/operations.ts'
import { codeFacingTools, createCodeTrace, createScriptPauses } from '../../../api/src/code-mode/code-tools.ts'
import { createScriptTool, ScriptPausedError } from '../../../api/src/code-mode/tool.ts'
import { reviewUnavailableText, exposureOf } from '../../../api/src/approval-review/operations.ts'
import { createReviewGate } from '../../../api/src/approval-review/gate.ts'
import { resumeDecidedScripts } from '../../../api/src/conversations/script-resume.ts'
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

  test('a reviewed nested call is judged first; every call that ran is noted; no gate refuses it', async () => {
    const ran: string[] = []
    const noted: string[] = []
    const reviewed: string[] = []
    const review = { route: 'reviewer' as const, cls: 'write' as const, kind: 'action' as const }
    const fixed = {
      write: { tool: plain(async (input: any) => { ran.push(`write:${input.v}`); return 'ok' }), server: 'dev', review },
      read: { tool: plain(async () => { ran.push('read'); return 'r' }), server: 'dev' }
    }
    const t = trace()
    const tools = codeFacingTools({
      names: ['write', 'read'],
      fixed,
      page: {},
      callPath: {},
      trace: t,
      review: {
        reviewNested: async (_id, toolName, input: any) => { reviewed.push(toolName); return { outcome: input.v === 'no' ? 'deny' : 'allow', reason: 'r', code: 'judged' } as any },
        noteNested: name => { noted.push(name) }
      }
    })
    const out = await createScriptTool(tools).execute!({ js: 'await tools.read({}); await tools.write({ v: "yes" }); try { await tools.write({ v: "no" }) } catch (e) { return e.message }' }, { toolCallId: 'cm1', messages: [], context: {} })
    t.finish('cm1')
    assert.deepEqual(ran, ['read', 'write:yes'])
    assert.deepEqual(reviewed, ['write', 'write'])
    assert.deepEqual(noted, ['read', 'write'])
    assert.match(String(out), /Do not try to reach the same outcome another way/)
    const nested = traces[traces.length - 1].parts.filter((p: any) => p.type === 'dynamic-tool')
    assert.deepEqual(nested.map((p: any) => p.toolMetadata?.review?.outcome), [undefined, 'allow', 'deny'])

    const ungated = createScriptTool(codeFacingTools({ names: ['write'], fixed, page: {}, callPath: {}, trace: trace() }))
    assert.match(String(await ungated.execute!({ js: 'try { await tools.write({ v: "x" }) } catch (e) { return e.message }' }, { toolCallId: 'cm2', messages: [], context: {} })), /needs a review/)
    assert.deepEqual(ran, ['read', 'write:yes'])
  })

  test('a nested call whose review failed fails with the unavailable text, not a denial', async () => {
    const review = { route: 'reviewer' as const, cls: 'write' as const, kind: 'action' as const }
    const fixed = { write: { tool: plain(async () => 'ok'), server: 'dev', review } }
    const tools = codeFacingTools({
      names: ['write'],
      fixed,
      page: {},
      callPath: {},
      trace: trace(),
      review: {
        reviewNested: async () => ({ outcome: 'unsure', reason: 'the first stage failed: it timed out', code: 'review-failed', failure: 'timeout' }) as any,
        noteNested: () => {}
      }
    })
    const out = await createScriptTool(tools).execute!({ js: 'try { await tools.write({}) } catch (e) { return e.message }' }, { toolCallId: 'cm1', messages: [], context: {} })
    assert.equal(String(out), reviewUnavailableText())
  })

  test('the description states the reviewer\'s time only when the turn has one', () => {
    const fixed = { write: { tool: plain(async () => 'ok'), server: 'dev' } }
    const description = (reviewed: boolean) => String(createScriptTool(codeFacingTools({ names: ['write'], fixed, page: {}, callPath: {}, trace: trace() }), { reviewed }).description)
    assert.match(description(true), /checked by a reviewer before they run, a few seconds each, counted in the script's 120 s/)
    assert.doesNotMatch(description(false), /reviewer/)
  })
})

/**
 * The package's pause and resume (@ai-sdk/code-mode 1.0.116, experimental_): pinned here, with no model, because the
 * approval of a script's call rests on them (docs/architecture/code-mode.md, "A call that needs a person").
 */
test.describe('a script paused on an approval (the package)', () => {
  const counters = () => {
    const ran = { write: 0, approve: 0, approvedCallIds: [] as string[] }
    const tools = {
      write: { description: 'w', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute: async () => { ran.write++; return ran.write } },
      approve: { description: 'a', inputSchema: jsonSchema({ type: 'object', properties: { n: { type: 'number' } } }), needsApproval: true, execute: async (_input: unknown, opts: any) => { ran.approve++; ran.approvedCallIds.push(opts.toolCallId); return 'approved' } }
    } as any
    return { ran, tools }
  }
  const options = { approval: { mode: 'interrupt' as const } }
  const pause = async (js: string, tools: any) => {
    const unwrapped = unwrapCodeModeResult(await runCodeMode({ js, tools, options, toolExecutionOptions: { toolCallId: 'outer', messages: [] } as any }))
    assert.equal(unwrapped.status, 'interrupted')
    return (unwrapped as { interrupt: any }).interrupt
  }
  const decide = async (interrupt: any, approved: boolean, tools: any) =>
    unwrapCodeModeResult(await continueCodeModeApproval({ interrupt, approvalResponse: { approvalId: interrupt.interruptId, approved }, tools, options }))

  test('resumes without re-running earlier writes', async () => {
    const { ran, tools } = counters()
    const interrupt = await pause('await tools.write({}); const a = await tools.approve({ n: 1 }); const w = await tools.write({}); return { a, w }', tools)
    assert.ok(isCodeModeApprovalInterrupt(interrupt))
    assert.equal(interrupt.toolName, 'approve')
    assert.deepEqual(interrupt.input, { n: 1 })
    assert.match(interrupt.toolCallId, /^outer:tool-\d+$/)
    assert.deepEqual([ran.write, ran.approve], [1, 0])
    const resumed = await decide(interrupt, true, tools)
    assert.deepEqual(resumed, { status: 'completed', output: { a: 'approved', w: 2 } })
    assert.deepEqual([ran.write, ran.approve], [2, 1])
    // The approved call runs under the id the pause named: what a resume recognises it by.
    assert.deepEqual(ran.approvedCallIds, [interrupt.toolCallId])
  })

  test('resumes a loop of approvals one by one', async () => {
    const { ran, tools } = counters()
    let interrupt = await pause('const out = []; for (let i = 0; i < 3; i++) { await tools.write({}); out.push(await tools.approve({ n: i })) } return out', tools)
    for (let i = 0; i < 3; i++) {
      assert.deepEqual(interrupt.input, { n: i })
      const resumed = await decide(interrupt, true, tools)
      if (i < 2) {
        assert.equal(resumed.status, 'interrupted')
        interrupt = (resumed as { interrupt: any }).interrupt
      } else {
        assert.deepEqual(resumed, { status: 'completed', output: ['approved', 'approved', 'approved'] })
      }
    }
    assert.deepEqual([ran.write, ran.approve], [3, 3])
  })

  // NOT inside the script: 1.0.116 refuses a continuation holding a denial before it runs anything
  // (assertNoDeniedApproval), so a script could not catch it. A person's rejection is therefore resumed as an
  // approval whose call throws (createScriptTool, `rejected`): pinned so an upgrade that changes this is seen.
  test('a rejection fails the whole resume, before the script runs again', async () => {
    const { ran, tools } = counters()
    const interrupt = await pause('try { await tools.approve({ n: 1 }); return "ran" } catch (e) { return e.message }', tools)
    await assert.rejects(decide(interrupt, false, tools), (err: any) => err.name === 'CodeModeToolApprovalDeniedError')
    assert.equal(ran.approve, 0)
  })

  test('refuses a tampered continuation', async () => {
    const { ran, tools } = counters()
    const interrupt = await pause('await tools.approve({ n: 1 }); return await tools.write({})', tools)
    const tampered = structuredClone(interrupt)
    tampered.continuation.js = tampered.continuation.js.replace('n: 1', 'n: 2')
    await assert.rejects(decide(tampered, true, tools), (err: any) => err.name === 'CodeModeProtocolError')
    assert.deepEqual([ran.write, ran.approve], [0, 0])
  })

  test('refuses an expired continuation', async () => {
    const { ran, tools } = counters()
    setCodeModeContinuationSigningKey('a key for this test only', { maxAgeMs: 1 })
    try {
      const interrupt = await pause('await tools.approve({ n: 1 }); return 1', tools)
      await new Promise(resolve => setTimeout(resolve, 10))
      await assert.rejects(decide(interrupt, true, tools), /expired/)
      assert.equal(ran.approve, 0)
    } finally {
      setCodeModeContinuationSigningKey()
    }
  })
})

/** Ours, over the package: a chat's script pauses on a call that needs a person, and resumes from its decision. */
test.describe('a script paused for a person (createScriptTool, codeFacingTools)', () => {
  const opts = (toolCallId: string) => ({ toolCallId, messages: [], context: {} }) as any
  const setup = (fixedOver: (ran: string[]) => any, reviewNested?: (id: string, name: string, input: any) => any, keep: (id: string, interrupt: any, decisions: any[]) => Promise<boolean> = async () => true) => {
    const ran: string[] = []
    const reviewed: string[] = []
    const pauses = createScriptPauses(keep)
    const fixed = fixedOver(ran)
    const build = () => createScriptTool(codeFacingTools({
      names: Object.keys(fixed),
      fixed,
      page: {},
      callPath: {},
      trace: trace(),
      pauses,
      ...(reviewNested ? { review: { reviewNested: async (id: string, name: string, input: any) => { reviewed.push(`${name}:${input.v}`); return reviewNested(id, name, input) }, noteNested: () => {} } } : {})
    }), { pauses })
    return { ran, reviewed, pauses, build }
  }
  const gated = (ran: string[]) => ({
    read: { tool: plain(async () => { ran.push('read'); return 'r' }), server: 'dev' },
    write: { tool: { ...plain(async (input: any) => { ran.push(`write:${input.v ?? ''}`); return 'written' }), needsApproval: true }, server: 'dev' }
  })
  const js = 'await tools.read({}); try { const w = await tools.write({ v: "a" }); return "got " + w } catch (e) { return e.message }'

  test('a tool needing approval is callable where a person can decide, and pauses the script', async () => {
    assert.equal(codeCallable('wipe_everything', { needsApproval: true }, { person: true }), true)
    assert.equal(codeCallable('request_web_access', { needsApproval: true }, { person: true }), false)
    const { ran, pauses, build } = setup(gated)
    await assert.rejects(build().execute!({ js }, opts('cmP')), (err: any) => err instanceof ScriptPausedError)
    assert.deepEqual(ran, ['read'])
    const interrupt = pauses.paused.get('cmP')!
    assert.equal(interrupt.toolName, 'write')
    assert.deepEqual(interrupt.input, { v: 'a' })
    assert.match(String(build().description), /pauses the script/)
  })

  test('approved, the script resumes where it stopped; rejected, the call throws inside it', async () => {
    for (const approved of [true, false]) {
      const { ran, pauses, build } = setup(gated)
      await assert.rejects(build().execute!({ js }, opts('cmR')))
      const interrupt = pauses.paused.get('cmR')!
      pauses.paused.clear()
      pauses.resumes.set('cmR', { interrupt, decisions: [{ toolCallId: interrupt.toolCallId, approved, ...(approved ? {} : { reason: 'not today' }) }] })
      const out = String(await build().execute!({ js }, opts('cmR')))
      if (approved) {
        assert.equal(out, 'got written')
        assert.deepEqual(ran, ['read', 'write:a'])
      } else {
        assert.equal(out, rejectedCallMessage('write', 'not today'))
        assert.deepEqual(ran, ['read'])
      }
    }
  })

  test('a reviewed call: a deny fails, an allow on the reviewer route runs, unsure and reviewer+person pause; the resumed call is not reviewed again', async () => {
    const route = (r: 'reviewer' | 'reviewer+person') => ({ route: r, cls: 'write' as const, kind: 'action' as const })
    const fixed = (ran: string[]) => ({
      note: { tool: plain(async (input: any) => { ran.push(`note:${input.v}`); return 'ok' }), server: 'dev', review: route('reviewer') },
      remove: { tool: { ...plain(async (input: any) => { ran.push(`remove:${input.v}`); return 'ok' }), needsApproval: true }, server: 'dev', review: route('reviewer+person') }
    })
    const outcome = (input: any) => ({ outcome: input.v === 'no' ? 'deny' : input.v === 'maybe' ? 'unsure' : 'allow', reason: 'r', code: 'judged' })
    const { ran, reviewed, pauses, build } = setup(fixed, (_id, _name, input) => outcome(input))
    const out = await build().execute!({ js: 'try { await tools.note({ v: "no" }) } catch (e) {} await tools.note({ v: "yes" }); await tools.note({ v: "maybe" }); return "end"' }, opts('cmV'))
      .catch((err: unknown) => err)
    assert.ok(out instanceof ScriptPausedError)
    assert.deepEqual(ran, ['note:yes'])
    assert.equal(pauses.paused.get('cmV')!.toolName, 'note')
    const remove = await build().execute!({ js: 'await tools.remove({ v: "yes" }); return "end"' }, opts('cmW')).catch((err: unknown) => err)
    assert.ok(remove instanceof ScriptPausedError, 'an allow on reviewer+person asks the person')
    assert.deepEqual(reviewed, ['note:no', 'note:yes', 'note:maybe', 'remove:yes'])
    const removeInterrupt = pauses.paused.get('cmW')!
    pauses.resumes.set('cmW', { interrupt: removeInterrupt, decisions: [{ toolCallId: removeInterrupt.toolCallId, approved: true }] })
    assert.equal(await build().execute!({ js: 'await tools.remove({ v: "yes" }); return "end"' }, opts('cmW')), 'end')
    assert.deepEqual(ran, ['note:yes', 'remove:yes'])
    assert.deepEqual(reviewed, ['note:no', 'note:yes', 'note:maybe', 'remove:yes'], 'not reviewed again on resume')
  })

  test('a continuation the package refuses, and one too large to keep, are errors the model reads', async () => {
    const { pauses, build } = setup(gated)
    await assert.rejects(build().execute!({ js }, opts('cmT')))
    const tampered = structuredClone(pauses.paused.get('cmT')!)
    tampered.continuation.js = tampered.continuation.js.replace('"a"', '"b"')
    pauses.resumes.set('cmT', { interrupt: tampered, decisions: [{ toolCallId: tampered.toolCallId, approved: true }] })
    await assert.rejects(build().execute!({ js }, opts('cmT')), (err: any) => err.message === SCRIPT_RESUME_FAILED_MESSAGE)

    const full = setup(gated, undefined, async () => false)
    await assert.rejects(full.build().execute!({ js }, opts('cmL')), (err: any) => err.message === scriptPauseTooLargeMessage('write'))
    assert.equal(full.pauses.paused.size, 0)
  })

  // Parallel calls pending in one continuation: the package answers the first decision with the next pause without
  // running anything, and runs both only after the last. Each call must find its own decision then.
  const parallel = async (first: boolean, second: boolean, reviewNested?: (id: string, name: string, input: any) => any) => {
    const kept = new Map<string, any[]>()
    const fixed = (ran: string[]) => ({
      write: { tool: { ...plain(async (input: any) => { ran.push(`write:${input.v}`); return 'written' }), needsApproval: true }, server: 'dev', ...(reviewNested ? { review: { route: 'reviewer+person', cls: 'write', kind: 'action' } } : {}) }
    })
    const { ran, reviewed, pauses, build } = setup(fixed, reviewNested, async (id: string, _interrupt: any, decisions: any[]) => { kept.set(id, decisions); return true })
    const js = 'const r = await Promise.allSettled([tools.write({ v: "a" }), tools.write({ v: "b" })]); return r.map(x => x.status + ":" + (x.value ?? x.reason?.message)).join("|")'
    await assert.rejects(build().execute!({ js }, opts('cmP2')), (err: any) => err instanceof ScriptPausedError)
    const one = pauses.paused.get('cmP2')!
    pauses.paused.clear()
    assert.equal((one as any).continuation.pendingInterruptions.length, 2)
    // The first decision: the script pauses again on the second call, nothing ran.
    pauses.resumes.set('cmP2', { interrupt: one, decisions: [{ toolCallId: one.toolCallId, approved: first, ...(first ? {} : { reason: 'no' }) }] })
    await assert.rejects(build().execute!({ js }, opts('cmP2')), (err: any) => err instanceof ScriptPausedError)
    pauses.resumes.clear()
    const two = pauses.paused.get('cmP2')!
    pauses.paused.clear()
    assert.notEqual(two.toolCallId, one.toolCallId)
    assert.deepEqual(ran, [])
    // The store was handed the first decision with the second pause: what the next resume reads back.
    const earlier = kept.get('cmP2')!
    assert.deepEqual(earlier.map(d => [d.toolCallId, d.approved]), [[one.toolCallId, first]])
    pauses.resumes.set('cmP2', { interrupt: two, decisions: [...earlier, { toolCallId: two.toolCallId, approved: second }] })
    const out = String(await build().execute!({ js }, opts('cmP2')))
    return { ran, reviewed, out }
  }

  test('parallel calls: the first rejected, the second approved — only the second runs', async () => {
    const { ran, out } = await parallel(false, true)
    assert.deepEqual(ran, ['write:b'])
    assert.equal(out, `rejected:${rejectedCallMessage('write', 'no')}|fulfilled:written`)
  })

  test('parallel calls both approved: both run, neither reviewed again', async () => {
    const { ran, reviewed, out } = await parallel(true, true, () => ({ outcome: 'unsure', reason: 'r', code: 'judged' }))
    assert.deepEqual([...ran].sort(), ['write:a', 'write:b'])
    assert.equal(out, 'fulfilled:written|fulfilled:written')
    assert.deepEqual(reviewed, ['write:a', 'write:b'], 'reviewed once each, before the pause')
  })

  test('without a person (a task run), a tool needing approval stays out of the map', () => {
    const tools = codeFacingTools({ names: ['read', 'write'], fixed: gated([]), page: {}, callPath: {}, trace: trace() })
    assert.deepEqual(Object.keys(tools), ['read'])
  })
})

/**
 * What a script used before its pause, across the pause: the package answers the calls made before it from its
 * record, through none of our wrappers, so the turn that resumes it is handed what the paused one counted.
 */
test.describe('a paused script\'s usage across its pause (resumeDecidedScripts)', () => {
  const review = { route: 'reviewer' as const, cls: 'write' as const, kind: 'action' as const }
  const MiB = 1024 * 1024
  const fixed = {
    // Scanned: no annotations, so open world.
    read: { tool: plain(async () => 'outside content'), server: 'dev' },
    big: { tool: plain(async () => 'x'.repeat(9 * MiB)), server: 'dev', annotations: { openWorldHint: false } },
    approve: { tool: { ...plain(async () => 'approved'), needsApproval: true }, server: 'dev', annotations: { openWorldHint: false } },
    write: { tool: plain(async () => 'written'), server: 'dev', review }
  }
  const kept = new Map<string, any>()
  // One turn's script tool over a real review gate, as model-loop.ts assembles it.
  const turn = (max?: number) => {
    const exposures: Array<{ toolName: string, exposed: boolean, tools: string[] }> = []
    const pauses = createScriptPauses(async (id, interrupt, decisions, spent) => { kept.set(id, { interrupt, decisions, spent: structuredClone(spent) }); return true })
    const gate = createReviewGate({
      tools: () => Object.fromEntries(Object.entries(fixed).map(([name, sourced]) => [name, { server: 'dev', ...((sourced as any).annotations ? { annotations: (sourced as any).annotations } : {}), ...((sourced.tool as any).needsApproval ? { needsApproval: true } : {}), ...((sourced as any).review ? { review } : {}) }])),
      history: [],
      surface: 'chat',
      review: async (call, exposure) => { exposures.push({ toolName: call.toolName, ...exposure }); return { outcome: 'allow', reason: 'fine', code: 'judged', exposed: exposure.exposed, at: new Date().toISOString() } as any },
      exposure: messages => exposureOf(messages, fixed as Record<string, { annotations?: Record<string, unknown> }>, { webhookPayloads: false })
    })
    const turnCalls = { count: 0, ...(max ? { max } : {}) }
    const tool = createScriptTool(codeFacingTools({ names: Object.keys(fixed), fixed, page: {}, callPath: {}, trace: trace(), turnCalls, pauses, review: gate }), { pauses })
    return { pauses, gate, turnCalls, tool, exposures }
  }
  const pauseThenResume = async (js: string, max?: number) => {
    const first = turn(max)
    await assert.rejects(first.tool.execute!({ js }, { toolCallId: 'cmS', messages: [], context: {} } as any), (err: any) => err instanceof ScriptPausedError)
    const { interrupt, spent } = kept.get('cmS')
    const second = turn(max)
    let settled: any
    const part = { type: 'dynamic-tool', toolName: 'code_mode', toolCallId: 'cmS', input: { js }, state: 'approval-responded', approval: { id: interrupt.interruptId, approved: true }, toolMetadata: { nested: { toolName: 'approve', input: {} } } } as any
    await resumeDecidedScripts({
      store: { decided: async () => [{ part, interrupt, earlierDecisions: [], trace: [], spent }], store: async () => true, repause: async () => {}, storeTrace: async () => {}, drop: async () => {} },
      pauses: second.pauses,
      turnCalls: second.turnCalls,
      noteNested: name => second.gate.noteNested(name),
      codeTool: () => second.tool,
      history: [],
      abortSignal: new AbortController().signal,
      earlierTraces: new Map(),
      settlement: (_id, s) => s,
      settle: async (_id, s) => { settled = s },
      cardMetadata: async () => ({}),
      traceWrites: async () => {}
    })
    return { first, second, spent, settled }
  }

  test('a scanned read before the pause makes a write after it exposed', async () => {
    const { first, second, spent, settled } = await pauseThenResume('await tools.read({}); await tools.approve({}); return await tools.write({})')
    assert.deepEqual(spent.ran, ['read'])
    assert.equal(first.exposures.length, 0)
    assert.equal(settled.state, 'output-available', JSON.stringify(settled))
    assert.deepEqual(second.exposures, [{ toolName: 'write', exposed: true, tools: ['read'] }])
  })

  test('the calls made before the pause count against the turn\'s bound after it', async () => {
    const { spent, settled, second } = await pauseThenResume('await tools.read({}); await tools.approve({}); try { await tools.write({}); return "wrote" } catch (e) { return e.message }', 2)
    assert.equal(spent.calls, 1)
    assert.equal(settled.output, turnCallsExceededMessage(2))
    assert.equal(second.turnCalls.count, 2)
  })

  test('what the script moved before the pause counts against its transfer budget after it', async () => {
    const { spent, settled } = await pauseThenResume('await tools.big({}); await tools.big({}); await tools.approve({}); try { await tools.big({}); return "moved" } catch (e) { return e.message }')
    assert.ok(spent.bytes >= 18 * MiB)
    assert.match(String(settled.output), new RegExp(`past ${SCRIPT_TRANSFER_BYTES / MiB} MiB`))
  })
})
