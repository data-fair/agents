/**
 * unit tests of external MCP servers: what an admin may list, how their tools are named, and that the
 * client reaches public addresses only. The local MCP fixture plays the external server; localhost is
 * declared public to the client where a test needs to reach it, as SSRF_PUBLIC_IPS does for dev-api.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { normalizeExternalMcpServers, externalToolPrefix, externalToolName } from '../../../api/src/mcp-servers/operations.ts'
import { openExternalMcpTools, createRequestMcpAccessTool } from '../../../api/src/mcp-servers/external.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

test.describe('normalizeExternalMcpServers', () => {
  test('https assumed, host lowercased, duplicates dropped, an explicit http kept', () => {
    assert.deepEqual(
      normalizeExternalMcpServers([{ url: 'OpenData.Example.org/mcp-server/mcp' }, { url: 'https://opendata.example.org/mcp-server/mcp' }, { url: 'http://localhost:5000/mcp' }]),
      [{ url: 'https://opendata.example.org/mcp-server/mcp' }, { url: 'http://localhost:5000/mcp' }]
    )
  })
  test('refuses an IP address, credentials, and other protocols, naming the entry', () => {
    assert.throws(() => normalizeExternalMcpServers([{ url: 'https://10.0.0.1/mcp' }]), /10\.0\.0\.1/)
    assert.throws(() => normalizeExternalMcpServers([{ url: 'https://[::1]/mcp' }]), /::1/)
    assert.throws(() => normalizeExternalMcpServers([{ url: 'https://u:p@a.example.org/mcp' }]), /credentials/)
    assert.throws(() => normalizeExternalMcpServers([{ url: 'ftp://a.example.org/mcp' }]), /http/)
  })
})

test.describe('external tool names', () => {
  test('prefixed by the server host, within the 64 characters a provider accepts', () => {
    assert.equal(externalToolPrefix('https://opendata.koumoul.com/mcp-server/mcp'), 'opendata_koumoul_com')
    assert.equal(externalToolName('https://opendata.koumoul.com/mcp-server/mcp', 'search_data'), 'opendata_koumoul_com__search_data')
    const long = externalToolName('https://a-very-long-subdomain-name.of-some-open-data-portal.example.org/mcp', 'a_tool_with_a_rather_long_name_too')
    assert.ok(long.length <= 64, long)
    assert.match(long, /^[a-zA-Z0-9_-]+$/)
  })
})

test.describe('openExternalMcpTools', () => {
  let fixture: McpFixture
  const port = 41000 + Math.floor(Math.random() * 1000)
  const url = `http://localhost:${port}/mcp`
  test.beforeAll(async () => { fixture = await startMcpFixture(port) })
  test.afterAll(async () => { await fixture.close() })

  test('lists the server\'s tools under its prefix, and calls them with no credential', async () => {
    const opened = await openExternalMcpTools([{ url }], { publicIps: ['127.0.0.1', '::1'] })
    try {
      const name = externalToolName(url, 'echo')
      assert.ok(opened.tools[name], Object.keys(opened.tools).join())
      assert.equal(opened.tools[name].server, `localhost:${port}`)
      const result = await opened.tools[name].tool.execute!({ value: 'hi' }, { toolCallId: 'c1', messages: [] } as any)
      assert.match(JSON.stringify(result), /echo:hi/)
      assert.equal(fixture.lastHeaders().cookie, undefined)
    } finally { await opened.close() }
  })

  test('a call\'s abort signal reaches the request, from the model\'s tool and a script\'s', async () => {
    const opened = await openExternalMcpTools([{ url }], { publicIps: ['127.0.0.1', '::1'] })
    try {
      const sourced = opened.tools[externalToolName(url, 'echo')]
      const stopped = AbortSignal.abort(new Error('stopped by the person'))
      await assert.rejects(sourced.tool.execute!({ value: 'hi' }, { toolCallId: 'c1', messages: [], abortSignal: stopped } as any), /stopped by the person/)
      await assert.rejects(sourced.codeExecute!({ value: 'hi' }, { toolCallId: 'c2', messages: [], abortSignal: stopped } as any), /stopped by the person/)
    } finally { await opened.close() }
  })

  test('a slow skills/list costs the server its skills, never its tools', async () => {
    fixture.delaySkillsList(6000)
    try {
      const opened = await openExternalMcpTools([{ url }], { publicIps: ['127.0.0.1', '::1'], timeoutMs: 4000 })
      try {
        assert.deepEqual(opened.skippedServers, [])
        assert.ok(opened.tools[externalToolName(url, 'echo')])
        assert.deepEqual(opened.guides.map(g => g.skills.length), [0])
        assert.match(opened.guides[0].instructions ?? '', /Road closures/)
      } finally { await opened.close() }
    } finally { fixture.delaySkillsList(0) }
  })

  test('a server on a non public address is skipped, with the reason', async () => {
    const opened = await openExternalMcpTools([{ url }], { publicIps: [] })
    assert.deepEqual(Object.keys(opened.tools), [])
    assert.equal(opened.skippedServers[0].id, `localhost:${port}`)
    assert.match(opened.skippedServers[0].reason, /not a public address/)
  })

  test('stops a run at its external call budget', async () => {
    const opened = await openExternalMcpTools([{ url }], { publicIps: ['127.0.0.1', '::1'], maxCalls: 1 })
    try {
      const echo = opened.tools[externalToolName(url, 'echo')].tool
      await echo.execute!({ value: 'a' }, { toolCallId: 'c1', messages: [] } as any)
      await assert.rejects(echo.execute!({ value: 'b' }, { toolCallId: 'c2', messages: [] } as any) as Promise<unknown>, /all of its 1 external MCP calls/)
    } finally { await opened.close() }
  })

  test('a server that never answers is skipped once the timeout passes, naming it', async () => {
    const hanging = http.createServer(() => { /* never answers */ })
    await new Promise<void>(resolve => hanging.listen(0, '127.0.0.1', resolve))
    const hangingUrl = `http://localhost:${(hanging.address() as any).port}/mcp`
    try {
      const started = Date.now()
      const opened = await openExternalMcpTools([{ url: hangingUrl }], { publicIps: ['127.0.0.1', '::1'], timeoutMs: 300 })
      assert.ok(Date.now() - started < 3000)
      assert.deepEqual(Object.keys(opened.tools), [])
      assert.match(opened.skippedServers[0].reason, /timed? out/i)
      await opened.close()
    } finally {
      hanging.closeAllConnections()
      await new Promise(resolve => hanging.close(resolve))
    }
  })
})

test.describe('createRequestMcpAccessTool', () => {
  const run = (tool: any, url: string) => tool.execute({ url, reason: 'x' }, { toolCallId: 't', messages: [] })

  test('refuses to exceed the maximum, without saving', async () => {
    const servers = Array.from({ length: 50 }, (_, i) => ({ url: `https://s${i}.example.org/mcp` }))
    let saved = 0
    const tool = createRequestMcpAccessTool({ servers, save: async () => { saved++ } })
    await assert.rejects(run(tool, 'https://extra.example.org/mcp'), /maximum of 50 external MCP servers/)
    assert.equal(saved, 0)
  })

  test('a URL already listed does not grow the list', async () => {
    const servers = Array.from({ length: 50 }, (_, i) => ({ url: `https://s${i}.example.org/mcp` }))
    let saved: any
    const tool = createRequestMcpAccessTool({ servers, save: async s => { saved = s } })
    await run(tool, 'S3.example.org/mcp')
    assert.equal(saved.length, 50)
  })
})
