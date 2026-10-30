/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { isIP } from 'node:net'

const admin = await superAdmin
const issuer = `http://localhost:${process.env.NGINX_PORT}/agents/api/nhi`

let fixture: McpFixture

const agentBody = (over: any = {}) => ({
  title: 'Tool probe', persona: 'x', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over
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
    assert.deepEqual(names, ['bulk', 'bulk_update', 'closure_stats', 'echo', 'explode', 'export_closures', 'export_my_profile', 'get_schema', 'ignored', 'import_table', 'list_road_closures', 'slow_lookup', 'slow_update', 'snapshot', 'whoami', 'wipe_everything'])
    assert.equal(res.data.results.find((t: any) => t.name === 'echo').server, 'dev-public-mcp')
    // The write surface, visible before the agent is ever run. Same annotations the runtime records per
    // call, so an admin and an auditor read the same thing.
    const destructive = res.data.results.find((t: any) => t.name === 'wipe_everything')
    assert.equal(destructive.annotations.destructiveHint, true)
    assert.equal(res.data.results.find((t: any) => t.name === 'echo').annotations, undefined)
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
    assert.equal(headers.authorization, undefined)
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
  test('a session server receives the autonomous agent\'s own bearer token', async () => {
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

    const authorization = String(fixture.lastHeaders().authorization ?? '')
    // A real simple-directory access token, issued by a real token request, presented to a real MCP server.
    assert.match(authorization, /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/, `expected a bearer token at the MCP server, got: ${authorization}`)
    assert.equal(fixture.lastHeaders().cookie, undefined, 'no cookie beside it')
    assert.equal(fixture.lastHeaders()['x-forwarded-host'], `localhost:${process.env.NGINX_PORT}`)
    // and nothing that could mint another one
    assert.equal(JSON.stringify(res.data).includes(authorization.slice(7)), false)
    assert.equal(authorization.includes('assertion'), false)
    // the diagnostic is no chat turn: there is no person, so no client IP is forwarded
    assert.equal(fixture.lastHeaders()['x-forwarded-for'], undefined)
  })

  test('a chat turn forwards the person\'s IP to a site-bound server', async () => {
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-autonomous-agent-nhi',
      siteUrl: `http://localhost:${process.env.NGINX_PORT}`,
      issuer,
      autonomousAgent: agentBody({ mcpServers: [{ serverId: 'dev-session-mcp' }] })
    })
    const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
    await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami {}')
    // the socket came through the dev nginx, which sets X-Forwarded-For to the test client's address
    const forwarded = String(fixture.lastHeaders()['x-forwarded-for'] ?? '')
    assert.ok(isIP(forwarded), `expected the person's IP at the MCP server, got: ${forwarded}`)
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
