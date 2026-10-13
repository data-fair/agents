/**
 * stateless unit tests of the map a code_mode script calls (api/src/code-mode/code-tools.ts): which tools are
 * in it, that a nested call is recorded under the code_mode call, that a failure keeps its message.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { codeCallable } from '../../../api/src/code-mode/operations.ts'
import { codeFacingTools, createCodeTrace } from '../../../api/src/code-mode/code-tools.ts'
import { createScriptTool } from '../../../api/src/code-mode/tool.ts'
import { REQUEST_WEB_ACCESS_TOOL_NAME } from '../../../api/src/web/operations.ts'
import { REQUEST_MCP_ACCESS_TOOL_NAME } from '../../../api/src/mcp-servers/operations.ts'
import { PLANNING_TOOL_NAMES } from '../../../api/src/self-knowledge/operations.ts'
import { READ_SKILL_TOOL_NAME } from '../../../api/src/mcp-servers/read-skill.ts'
import { SUBAGENT_PREFIX } from '../../../api/src/agent-session/sub-agents.ts'

const plain = (execute: (input: any) => Promise<unknown>) => tool({ description: 'd', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute })
const traces: any[] = []
const trace = () => createCodeTrace(t => { traces.push(t) })

test.describe('code-facing tools', () => {
  test.beforeEach(() => { traces.length = 0 })

  test('codeCallable excludes gates, handovers, admin requests, skills, delegations and itself', () => {
    for (const name of ['wait_for_user_action', 'request_web_access', 'request_mcp_access', 'plan_task', 'update_task', 'delete_task', 'read_skill', 'subagent_search', 'code_mode']) {
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

  test('the direct-only names are the service\'s own constants', () => {
    for (const name of [REQUEST_WEB_ACCESS_TOOL_NAME, REQUEST_MCP_ACCESS_TOOL_NAME, ...PLANNING_TOOL_NAMES, READ_SKILL_TOOL_NAME, `${SUBAGENT_PREFIX}x`]) assert.equal(codeCallable(name, {}), false, name)
  })
})
