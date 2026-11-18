/**
 * stateless unit tests: on-demand tool loading (api/src/conversations/tool-loading.ts) — which MCP tools are deferred,
 * the catalog the system prompt lists them in, load_tools, and the loaded set read back from a history.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema, type ModelMessage } from 'ai'
import {
  LOAD_TOOLS_TOOL_NAME, TOOL_CATALOG_SUMMARY_MAX, deferrableNames, definitionsTokens, shouldDefer, summaryOf, catalogEntries,
  renderToolCatalog, createLoadTools, loadedToolNames, loadedInSteps, isHeldBack, toolOrderFor, notLoadedMessage
} from '../../../api/src/conversations/tool-loading.ts'
import type { ToolSet } from '../../../api/src/conversations/operations.ts'

const plain = (description: string) => tool({ description, inputSchema: jsonSchema({ type: 'object', properties: { q: { type: 'string' } } }), execute: async () => 'ok' })
const set: ToolSet = {
  a: { tool: plain('Tool a.'), server: 'platform' },
  b: { tool: plain('Tool b.'), server: 'platform' },
  c: { tool: plain('Tool c.'), server: 'ext.example.com' },
  write_file: { tool: plain('Write a file.') }
}
const origins = { a: 'platform', b: 'catalog', c: 'external' } as const
const execute = async (t: any, input: unknown) => await t.execute(input, { toolCallId: 'x', messages: [] })

test.describe('tool loading', () => {
  test('only MCP tools are deferrable, and never one a page tool shadows', () => {
    assert.deepEqual(deferrableNames(set, origins, new Set(['b'])), ['a', 'c'])
    assert.deepEqual(deferrableNames(set, undefined, new Set()), [])
  })

  test('the definitions are measured in estimated tokens', async () => {
    const tokens = await definitionsTokens(set, ['a', 'c'])
    assert.ok(tokens > 0)
    assert.ok(tokens < await definitionsTokens(set, ['a', 'b', 'c']))
  })

  test('deferral applies strictly above the share of the context window', () => {
    assert.equal(shouldDefer(1001, 10_000, 10), true)
    assert.equal(shouldDefer(1000, 10_000, 10), false)
  })

  test('a summary is the first sentence of the description, bounded', () => {
    assert.equal(summaryOf('List closures. Paged by 20.'), 'List closures.')
    assert.equal(summaryOf('Line one\nline two'), 'Line one')
    const long = summaryOf('x'.repeat(300))
    assert.equal(long.length, TOOL_CATALOG_SUMMARY_MAX)
    assert.ok(long.endsWith('…'))
    assert.equal(summaryOf(undefined), '')
  })

  test('the catalog is a flat list per server, full names, in the given order', () => {
    const entries = catalogEntries(set, ['c', 'a', 'b'])
    assert.deepEqual(entries.map(e => [e.server, e.name]), [['ext.example.com', 'c'], ['platform', 'a'], ['platform', 'b']])
    const text = renderToolCatalog(entries)!
    assert.match(text, /load_tools/)
    assert.equal(text.split('platform').length - 1, 1, 'each server label once')
    assert.ok(text.indexOf('- a — Tool a.') < text.indexOf('- b — Tool b.'))
    assert.match(text, /- c — Tool c\./)
    assert.equal(renderToolCatalog([]), undefined)
  })

  test('load_tools loads known names once, reports the others, fails when it loads nothing', async () => {
    const load = createLoadTools(new Set(['list_road_closures', 'closure_stats']))
    assert.deepEqual(await execute(load, { names: ['closure_stats', 'list_road_closures'] }), { loaded: ['closure_stats', 'list_road_closures'] })
    assert.deepEqual(await execute(load, { names: ['list_road_closures', 'foo', 'list_road_closures', 'write_file'] }), { loaded: ['list_road_closures'], unknown: ['foo', 'write_file'] })
    await assert.rejects(execute(load, { names: ['foo'] }), /foo/)
  })

  test('the active tools are all of them but the deferrable ones not loaded', () => {
    assert.deepEqual(new Set(toolOrderFor(['a', 'b', 'c', LOAD_TOOLS_TOOL_NAME], new Set(['b', 'c']), new Set(['c']))), new Set(['a', 'c', 'load_tools']))
  })

  test('the tools are sent always-on first, then the loaded ones in the order they were loaded, so a load appends', () => {
    // The map lists the MCP tools first (a, b, c), the service's after (write_file, load_tools).
    const all = ['a', 'b', 'c', 'write_file', 'load_tools']
    assert.deepEqual(toolOrderFor(all, new Set(['a', 'b', 'c']), new Set(['c', 'a'])), ['write_file', 'load_tools', 'c', 'a'])
    // A page tool shadowing a deferrable name is always on.
    assert.deepEqual(toolOrderFor(all, new Set(['a', 'b', 'c']), new Set(['a']), new Set(['b'])), ['b', 'write_file', 'load_tools', 'a'])
  })

  test('the loaded set keeps the order the history loaded the tools in', () => {
    const history: ModelMessage[] = [
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: '1', toolName: 'load_tools', output: { type: 'json', value: { loaded: ['c'] } } }] },
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: '2', toolName: 'a', input: {} }] }
    ]
    assert.deepEqual([...loadedToolNames(history)], ['c', 'a'])
  })

  test('a page tool is active even when it takes a deferred MCP tool\'s name, as one registered mid-turn does', () => {
    assert.deepEqual(toolOrderFor(['a', 'b', 'c'], new Set(['b', 'c']), new Set(), new Set(['c'])), ['a', 'c'])
    assert.equal(isHeldBack('c', new Set(['b', 'c']), new Set(), new Set(['c'])), false)
    assert.equal(isHeldBack('b', new Set(['b', 'c']), new Set(), new Set(['c'])), true)
    assert.equal(isHeldBack('b', new Set(['b', 'c']), new Set(['b']), new Set()), false)
  })

  test('the loaded set is read back from the history: tools called and tools loaded, ignoring failed loads', () => {
    const history: ModelMessage[] = [
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: '1', toolName: 'echo', input: {} }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: '1', toolName: 'echo', output: { type: 'text', value: 'x' } }] },
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: '2', toolName: 'load_tools', input: { names: ['closure_stats'] } }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: '2', toolName: 'load_tools', output: { type: 'json', value: { loaded: ['closure_stats'] } } }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: '3', toolName: 'load_tools', output: { type: 'text', value: 'x' } }] },
      // As a stored turn replays it: the result was recorded as its JSON text.
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: '5', toolName: 'load_tools', output: { type: 'text', value: '{"loaded":["bulk"],"unknown":["foo"]}' } }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: '4', toolName: 'load_tools', output: { type: 'error-text', value: 'x' } }] },
      { role: 'user', content: 'hello' }
    ]
    assert.deepEqual(loadedToolNames(history), new Set(['echo', 'load_tools', 'closure_stats', 'bulk']))
  })

  test('a call refused because its tool was not loaded does not load it', () => {
    const history: ModelMessage[] = [
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: '1', toolName: 'echo', input: {} }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: '1', toolName: 'echo', output: { type: 'error-text', value: `Error repairing tool call: ${notLoadedMessage('echo')}` } }] },
      // A call still waiting on an approval has no result yet: it counts.
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: '2', toolName: 'delete_note', input: {} }] },
      // Any other failure is a call the tool did run, or was offered for: it counts.
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: '3', toolName: 'bulk', input: {} }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: '3', toolName: 'bulk', output: { type: 'error-text', value: 'too big' } }] }
    ]
    assert.deepEqual(loadedToolNames(history), new Set(['delete_note', 'bulk']))
  })

  test('this turn\'s loads are read from its steps', () => {
    const steps = [
      { toolResults: [{ toolName: 'load_tools', output: { loaded: ['a', 'b'] } }] },
      { toolResults: [{ toolName: 'echo', output: 'x' }, { toolName: 'load_tools', output: 'not an object' }] }
    ]
    assert.deepEqual(loadedInSteps(steps), new Set(['a', 'b']))
  })

  test('the message for a call to a tool not loaded names load_tools', () => {
    assert.match(notLoadedMessage('echo'), /echo/)
    assert.match(notLoadedMessage('echo'), /load_tools/)
  })
})
