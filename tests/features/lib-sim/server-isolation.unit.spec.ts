/**
 * The isolation guarantee (spec §1.2) asserted where it is actually APPLIED.
 *
 * isolation.unit.spec.ts covers the factory, which was never the risk: the
 * factory's output only matters if the call site still spreads it. Deleting the
 * `abortController` line, or replacing the spread with a bare `cwd`, used to
 * leave tsc, eslint and every test green while handing the model this
 * repository's own settings, auto-memory and 27 built-in tools.
 *
 * `createServer` therefore takes an injectable `query`, so one completion can be
 * driven end to end — real HTTP, real Conversation, real tool server — with no
 * network and no model, and the options the bridge actually hands over can be
 * read back.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import { createServer, type BridgeQuery } from '../../../lib-sim/bridge/server.ts'

type Captured = Parameters<BridgeQuery>[0]

/** Drive exactly one completion through the server and return what `query` was given. */
async function captureQueryOptions (): Promise<Captured> {
  let captured: Captured | undefined

  const fakeQuery: BridgeQuery = (args) => {
    captured = args
    return (async function * () {
      yield { type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }] } }
      yield { type: 'result', subtype: 'success', usage: { input_tokens: 1, output_tokens: 2 } }
    })()
  }

  // Port 0: an ephemeral loopback port, so the test never collides with a bridge
  // the developer already has running on the default 3194.
  const server = createServer({ port: 0, query: fakeQuery })
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })
    const { port } = server.address() as AddressInfo
    const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'haiku',
        messages: [
          { role: 'system', content: 'be brief' },
          { role: 'user', content: 'what is the weather' }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get the weather',
            parameters: { type: 'object', properties: { city: { type: 'string' } } }
          }
        }]
      })
    })
    // Drain the SSE stream so the turn completes before the assertions run.
    const body = await res.text()
    assert.equal(res.status, 200)
    assert.ok(body.includes('data: [DONE]'), `stream did not finish cleanly: ${body.slice(0, 200)}`)
  } finally {
    server.close()
  }

  assert.ok(captured, 'the server never called query')
  return captured
}

test.describe('bridge call site', () => {
  test('hands the query the full isolation options, not just a cwd', async () => {
    const { options } = await captureQueryOptions()

    // A neutral cwd outside any project: auto-memory is keyed to the project
    // directory, so the repo as cwd leaks it even with settingSources: [].
    assert.ok(
      options.cwd.startsWith(os.tmpdir()),
      `cwd ${options.cwd} must be under ${os.tmpdir()}, not a project directory`
    )
    assert.ok(!options.cwd.includes('data-fair'), 'cwd must not leak a project name')

    assert.deepEqual(options.settingSources, [], 'no project/user settings may be loaded')
    assert.deepEqual(options.tools, [], 'the SDK\'s built-in tools must not be offered')
    assert.equal(options.strictMcpConfig, true, 'only the bridge tool server may be reachable')
    // The parent Claude Code session's env must be scrubbed; the one CLAUDE_CODE_
    // variable present is the bridge's own.
    assert.deepEqual(
      Object.keys(options.env).filter(k => k.startsWith('CLAUDE_CODE_')), ['CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'],
      'the parent Claude Code session\'s env must be scrubbed'
    )

    // The CLI's global config — where it reads the operator's email from and puts it in
    // front of the model — is a private one inside the neutral cwd, with no email in it.
    const configDir = options.env.CLAUDE_CONFIG_DIR
    assert.ok(configDir, 'CLAUDE_CONFIG_DIR must be set, or the CLI reads the operator\'s own')
    assert.ok(configDir.startsWith(options.cwd + path.sep), `CLAUDE_CONFIG_DIR ${configDir} must be the neutral one`)
    const seeded = JSON.parse(fs.readFileSync(path.join(configDir, '.claude.json'), 'utf8'))
    assert.equal(seeded.oauthAccount?.emailAddress, undefined, 'the operator\'s email must not reach the CLI')
    assert.equal(options.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, '1')

    // Without this the query is unabortable and every eviction — TTL, LRU,
    // divergence, client disconnect — leaks a claude subprocess.
    assert.ok(options.abortController instanceof AbortController, 'the query must be abortable')

    // Only the request's own tools, namespaced to the bridge MCP server.
    assert.ok(options.allowedTools.length > 0, 'the request declared a tool')
    for (const name of options.allowedTools) {
      assert.ok(
        name.startsWith('mcp__bridge__'),
        `allowedTools entry ${name} must be namespaced to the bridge tool server`
      )
    }

    // Importing server.ts creates the process-wide neutral cwd at module load;
    // remove it so the suite does not leave a bridge-* dir behind per run.
    fs.rmSync(options.cwd, { recursive: true, force: true })
  })
})
