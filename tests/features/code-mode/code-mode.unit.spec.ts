/**
 * stateless unit tests of the code_mode engine (api/src/code-mode): the real sandbox (QuickJS WASM through
 * @ai-sdk/code-mode), the console prelude, how a result and an error read to the model.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { CodeModeToolError } from '@ai-sdk/code-mode'
import { createScriptTool } from '../../../api/src/code-mode/tool.ts'
import { describeScriptTool, wrapScript, SCRIPT_RESULT_CHARS } from '../../../api/src/code-mode/operations.ts'

const echo = tool({
  description: 'Echoes a value',
  inputSchema: jsonSchema<{ value: string }>({ type: 'object', required: ['value'], properties: { value: { type: 'string' } } }),
  execute: async ({ value }) => `echo:${value}`
})
const slow = tool({
  description: 'Waits',
  inputSchema: jsonSchema({ type: 'object', properties: {} }),
  execute: async (_input, opts) => await new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve('late'), 5_000)
    opts?.abortSignal?.addEventListener('abort', () => { clearTimeout(t); reject(opts.abortSignal!.reason) })
  })
})
const run = (t: any, js: string, signal?: AbortSignal) => t.execute({ js }, { toolCallId: 'c1', messages: [], abortSignal: signal })

test.describe('code_mode engine', () => {
  test('plain scripting: the return value, as JSON, is what the model reads', async () => {
    const t = createScriptTool({})
    assert.equal(await run(t, 'const rows = [{n: 3}, {n: 1}]; return rows.map(r => r.n).sort()'), '[\n  1,\n  3\n]')
    assert.equal(await run(t, 'return "plain text"'), 'plain text')
    assert.equal(await run(t, 'const x = 1'), 'The script returned nothing.')
  })

  test('the sandbox has no fetch, timers, require or process', async () => {
    const t = createScriptTool({})
    assert.equal(await run(t, 'return [typeof fetch, typeof setTimeout, typeof require, typeof process].join()'), 'undefined,undefined,undefined,undefined')
  })

  test('a tool is an async function; its result is what execute returns', async () => {
    const t = createScriptTool({ echo })
    assert.equal(await run(t, 'const a = await tools.echo({ value: "a" }); return a + "!"'), 'echo:a!')
  })

  test('console output is returned after the result, never written to the server', async () => {
    const t = createScriptTool({})
    const out = await run(t, 'console.log("rows:", 2, { ok: true }); console.error("careful"); return 1')
    assert.equal(out, '1\n\nConsole output:\nrows: 2 {"ok":true}\ncareful')
  })

  test('console.log of a circular value or a BigInt does not fail the script', async () => {
    const out = await run(createScriptTool({}), 'const a = {}; a.self = a; console.log(a, 1n); return 1')
    assert.match(String(out), /^1\n\nConsole output:\n/)
  })

  test('the prelude keeps the script\'s line numbers', async () => {
    const lines = wrapScript('first\nsecond').split('\n')
    assert.ok(lines[0].endsWith('first'), 'the prelude and the script\'s first line share line 1')
    assert.equal(lines[1], 'second')
  })

  test('Papa is papaparse, for CSV: quoted fields, header rows and unparse', async () => {
    const out = await run(createScriptTool({}), [
      'const rows = Papa.parse(\'id,label\\n1,"a, b"\\n2,"say ""hi"""\\n\', { header: true, skipEmptyLines: true }).data',
      'return { rows, csv: Papa.unparse(rows.filter(r => r.id === "2")) }'
    ].join('\n'))
    assert.deepEqual(JSON.parse(out), { rows: [{ id: '1', label: 'a, b' }, { id: '2', label: 'say "hi"' }], csv: 'id,label\r\n2,"say ""hi"""' })
  })

  test('papaparse is loaded only by a script that names Papa, below the script so its lines stay the model\'s', async () => {
    assert.doesNotMatch(wrapScript('return 1'), /Papa Parse/)
    const lines = wrapScript('Papa.parse("a")\nsecond').split('\n')
    assert.ok(lines[0].endsWith('Papa.parse("a")'))
    assert.equal(lines[1], 'second')
    assert.equal(await run(createScriptTool({}), 'const rows = Papa.parse("a,b").data\nreturn rows[0].length'), '2')
  })

  test('the 64 KiB a script may be is the model\'s own, papaparse not counted', async () => {
    const filler = `// ${'x'.repeat(60 * 1024)}\n`
    assert.equal(await run(createScriptTool({}), `${filler}return Papa.parse("a,b").data[0].length`), '2')
    await assert.rejects(run(createScriptTool({}), `// ${'x'.repeat(65 * 1024)}\nreturn 1`), /longer than 64 KiB/)
  })

  test('a tool error thrown as CodeModeToolError keeps its message', async () => {
    const failing = tool({ description: 'fails', inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }), execute: async (): Promise<string> => { throw new CodeModeToolError('dataset not found') } })
    const t = createScriptTool({ failing })
    assert.equal(await run(t, 'try { await tools.failing({}) } catch (e) { return e.message }'), 'dataset not found')
    await assert.rejects(run(t, 'await tools.failing({})'), /dataset not found/)
  })

  test('a syntax error names itself', async () => {
    await assert.rejects(run(createScriptTool({}), 'const = 2'), /SyntaxError/)
  })

  test('limits are named: wall clock, an unawaited call, a result over 20,000 characters', async () => {
    const t = createScriptTool({ slow, echo }, { policy: { timeoutMs: 300 } })
    await assert.rejects(run(t, 'await tools.slow({})'), /ran for more than 0\.3 s/)
    await assert.rejects(run(createScriptTool({ echo }), 'tools.echo({ value: "x" }); return 1'), /await every tool call/)
    const big = await run(createScriptTool({}), `return "x".repeat(${SCRIPT_RESULT_CHARS + 5000})`)
    assert.match(big, /rest of this result dropped to free context — 25000 chars in total/)
  })

  test('an abort stops the script and is passed through untouched', async () => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(new Error('stopped by the person')), 100)
    await assert.rejects(run(createScriptTool({ slow }), 'await tools.slow({})', controller.signal))
    assert.ok(controller.signal.aborted)
  })

  test('the description keeps the signatures and drops the examples block', async () => {
    const t = createScriptTool({ echo })
    assert.match(String(t.description), /echo: \(input: \{/)
    assert.doesNotMatch(String(t.description), /Tool call examples/)
    assert.match(String(t.description), /can only be called directly/)
    assert.equal(describeScriptTool('Head\n\nTool call examples:\n```ts\nx\n```'), describeScriptTool('Head'))
  })
})

test('the js argument describes the script, without the examples the description no longer has', async () => {
  const schema = await (createScriptTool({ echo }).inputSchema as any).jsonSchema
  assert.deepEqual(Object.keys(schema.properties), ['js'])
  assert.deepEqual(schema.required, ['js'])
  assert.doesNotMatch(schema.properties.js.description, /example/i)
})
