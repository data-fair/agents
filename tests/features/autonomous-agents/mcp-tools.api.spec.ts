/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const issuer = `http://localhost:${process.env.NGINX_PORT}/agents/api/nhi`

let fixture: McpFixture

const agentBody = (over: any = {}) => ({
  title: 'Tool probe', persona: 'x', mcpServers: [{ serverId: 'dev-public-mcp' }], toolDisclosure: 'static', enabled: true, ...over
})

test.describe('Autonomous agent tools', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean() })

  test('lists the real tools of a public MCP server', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody())
    const res = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`)
    assert.equal(res.status, 200)
    const names = res.data.results.map((t: any) => t.name).sort()
    assert.deepEqual(names, ['echo', 'get_schema', 'ignored', 'list_road_closures'])
    assert.equal(res.data.results.find((t: any) => t.name === 'echo').server, 'dev-public-mcp')
  })

  test('toolFilter narrows the set', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody({ mcpServers: [{ serverId: 'dev-public-mcp', toolFilter: ['echo'] }] }))
    const res = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`)
    assert.deepEqual(res.data.results.map((t: any) => t.name), ['echo'])
  })

  // Also the contrast that makes the session test below meaningful: a client that always sent a cookie
  // would fail HERE, on `cookie === undefined` — which is stricter than checking the cookie merely
  // lacks an id_token, so no separate test is needed for that.
  test('a public server receives no credential', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody())
    await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`)
    const headers = fixture.lastHeaders()
    assert.equal(headers.cookie, undefined)
    assert.equal(headers['x-api-key'], undefined)
  })

  test('an apiKey server receives the ops-configured header, and the secret never reaches the response', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody({ mcpServers: [{ serverId: 'dev-apikey-mcp' }] }))
    const res = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`)
    assert.equal(fixture.lastHeaders()['x-api-key'], 'dev-secret-value')
    assert.equal(JSON.stringify(res.data).includes('dev-secret-value'), false)
  })

  /**
   * The point of the whole identity design: the far end saw a session, and it is the AGENT's own.
   *
   * Previously unprovable because no NHI could be created in dev. The fixture in
   * dev/resources/users.template.json supplies one, and the agent's id is chosen so the fixture's
   * pinned subject matches — see the seam in app.ts.
   */
  test('a session server receives the autonomous agent\'s own NHI cookie', async () => {
    const siteUrl = `http://localhost:${process.env.NGINX_PORT}`
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-autonomous-agent-nhi',
      siteUrl,
      issuer,
      autonomousAgent: agentBody({ mcpServers: [{ serverId: 'dev-session-mcp' }] })
    })

    const res = await admin.get('/api/autonomous-agents/organization/test1/test-fixture/tools')
    assert.equal(res.status, 200)

    const cookie = String(fixture.lastHeaders().cookie ?? '')
    // A real simple-directory session, minted by a real exchange, presented to a real MCP server.
    assert.match(cookie, /id_token=/, `expected a session cookie at the MCP server, got: ${cookie}`)
    // and nothing that could mint another one
    assert.equal(JSON.stringify(res.data).includes('id_token'), false)
    assert.equal(cookie.includes('assertion'), false)
  })

  test('a session server with no enrolled identity is refused rather than called anonymously', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody({ mcpServers: [{ serverId: 'dev-session-mcp' }] }))
    await assert.rejects(
      admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`),
      (err: any) => { assert.equal(err.status, 400); assert.match(JSON.stringify(err.data), /non-human identity/); return true }
    )
  })

  test('a plain org member cannot read the tool list', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', agentBody())
    const orgMember = await axiosAuth('test1-user1', { org: 'test1' })
    await assert.rejects(
      orgMember.get(`/api/autonomous-agents/organization/test1/${created.data.id}/tools`),
      (err: any) => { assert.equal(err.status, 403); assert.match(JSON.stringify(err.data), /requires admin/); return true }
    )
  })
})
