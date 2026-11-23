/**
 * stateful API tests: which sites an autonomous agent acts on, and as whom.
 *
 * The organization test_agents_org1 gets a second domain, test_agents_org2 gets one too. The agent's account is its
 * enrolment site plus test_agents_org1's domains: test_agents_org2's is outside it.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { createSite, deleteSite, portalHost } from '../../support/sites.ts'
import { credentialScopes } from '../../../api/src/nhi/operations.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test_agents_org1_admin', { org: 'test_agents_org1' })
let fixture: McpFixture

const whoami = (assistant: any) => {
  const part = assistant.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'whoami')
  assert.ok(part, `no whoami call in ${JSON.stringify(assistant.parts)}`)
  assert.equal(part.state, 'output-available', JSON.stringify(part))
  const text = JSON.stringify(part.output)
  const forwardedHost = /forwardedHost\\?":\\?"([^"\\]+)/.exec(text)?.[1] ?? null
  const userId = /userId\\?":\\?"([^"\\]+)/.exec(text)?.[1] ?? null
  return { forwardedHost, userId }
}
const PORT = process.env.NGINX_PORT
const home = `http://localhost:${PORT}`
const issuer = `${home}/agents/api/nhi`
const ownPortal = portalHost('test1-portal')
const foreignPortal = portalHost('test2-portal')
// test_agents_org1's too, but its own sign-in realm: no token for it from the platform issuer
const ssoPortal = portalHost('test1-sso')
const AGENT = '/api/autonomous-agents/organization/test_agents_org1/test-fixture'

const enrol = async (siteUrl = home, over: any = {}) => await admin.post('/api/test-env/autonomous-agent', {
  id: 'test-fixture',
  owner: { type: 'organization', id: 'test_agents_org1' },
  clientId: 'test_agents_org1_agent_nhi',
  siteUrl,
  issuer,
  autonomousAgent: { title: 'Site probe', persona: 'x', mcpServers: [], enabled: true, ...over }
})

test.describe('Sites of an autonomous agent', () => {
  const siteIds: string[] = []
  test.beforeAll(async () => {
    fixture = await startMcpFixture(Number(process.env.MCP_FIXTURE_PORT))
    siteIds.push(await createSite(ownPortal, { type: 'organization', id: 'test_agents_org1', name: 'Test 1' }))
    siteIds.push(await createSite(foreignPortal, { type: 'organization', id: 'test_agents_org2', name: 'Test Org 2' }))
    siteIds.push(await createSite(ssoPortal, { type: 'organization', id: 'test_agents_org1', name: 'Test 1' }, { authMode: 'ssoBackOffice' }))
  })
  test.afterAll(async () => { for (const id of siteIds) await deleteSite(id); await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test_agents_org1')
  })

  test('its account is its enrolment site and its organization\'s sites, not another organization\'s', async () => {
    await enrol()
    const { data } = await admin.get(`${AGENT}/session`)
    assert.deepEqual(data.accountSites, [home, `http://${ownPortal}`])
    assert.deepEqual(data.unreachableSites, [`http://${ssoPortal}`])
  })

  test('a site of its organization outside its issuer\'s realm is not one of its portals, and a chat there is anonymous', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    const { data } = await admin.get(`${AGENT}/session`)
    assert.deepEqual(data.accountSites, [home, `http://${ownPortal}`])
    assert.deepEqual(data.unreachableSites, [`http://${ssoPortal}`])
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami', { host: ssoPortal })
    assert.deepEqual(whoami(assistant), { forwardedHost: ssoPortal, userId: null })
  })

  test('a chat on its own site acts there, as the agent', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami')
    assert.deepEqual(whoami(assistant), { forwardedHost: `localhost:${PORT}`, userId: 'test_agents_org1_agent_nhi' })
  })

  test('a chat on a portal of its organization acts there, as the agent', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami', { host: ownPortal })
    assert.deepEqual(whoami(assistant), { forwardedHost: ownPortal, userId: 'test_agents_org1_agent_nhi' })
  })

  test('a chat on another organization\'s site acts there anonymously, and the agent is told', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    const { assistant, run } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami', { host: foreignPortal })
    assert.deepEqual(whoami(assistant), { forwardedHost: foreignPortal, userId: null })
    assert.match(run.systemPrompt, new RegExp(`acting anonymously on ${foreignPortal.replace(/\./g, '\\.')}`))
  })

  test('a conversation keeps the site it was started on, whatever socket continues it', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    const first = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami', { host: foreignPortal })
    assert.deepEqual(whoami(first.assistant), { forwardedHost: foreignPortal, userId: null })
    // continued through the default host: still the foreign site, still anonymous
    const again = await turnOverSocket(orgAdmin, first.conversationId, 'call tool whoami')
    assert.deepEqual(whoami(again.assistant), { forwardedHost: foreignPortal, userId: null })
  })

  // Binding: an identity without its enrolment site is a misconfiguration to surface, never a reason to
  // quietly run anonymous. Public tools only, so this exercises the path that skips the account listing.
  test('an agent with an identity but no enrolment site is refused, not run anonymously', async () => {
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test_agents_org1' },
      clientId: 'test_agents_org1_agent_nhi',
      autonomousAgent: { title: 'Half enrolled', persona: 'x', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true }
    })
    await assert.rejects(admin.get(`${AGENT}/tools`), (err: any) => {
      assert.equal(err.status, 400)
      assert.match(JSON.stringify(err.data ?? err.message), /non-human identity/)
      return true
    })
    const { run } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'hello')
    assert.equal(run.status, 'error')
    assert.match(run.error, /no enrolled non-human identity/)
  })

  test('a call on a portal carries the agent\'s token for that portal, addressed to the site\'s MCP and issued by its enrolment site', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami', { host: ownPortal })
    assert.equal(fixture.lastHeaders()['x-forwarded-host'], ownPortal)
    assert.equal(fixture.lastHeaders().cookie, undefined)
    const token = String(fixture.lastHeaders().authorization).slice('Bearer '.length)
    const [header, payload] = token.split('.').slice(0, 2).map(part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8')))
    assert.equal(header.typ, 'at+jwt')
    assert.deepEqual(payload.aud, [`http://${ownPortal}/mcp-server`, `http://${ownPortal}`])
    assert.equal(payload.id, 'test_agents_org1_agent_nhi')
  })

  test('a scoped identity\'s session carries its maximum scopes to a site-bound server', async () => {
    // test_agents_org1_scoped_agent_nhi holds the maximum scopes ["datasets:read"] (tests/support/sd-fixtures.ts);
    // the exchange asks for no scope, so its session is granted exactly those.
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-scoped-fixture',
      owner: { type: 'organization', id: 'test_agents_org1' },
      clientId: 'test_agents_org1_scoped_agent_nhi',
      siteUrl: home,
      issuer,
      autonomousAgent: { title: 'Scoped probe', persona: 'x', mcpServers: [{ serverId: 'dev-session-mcp' }], enabled: true }
    })
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-scoped-fixture' }, 'call tool echo {"value":"hi"}')
    assert.equal(assistant.parts.find((p: any) => p.toolName === 'echo')?.state, 'output-available', JSON.stringify(assistant.parts))
    assert.deepEqual(credentialScopes({ bearer: String(fixture.lastHeaders().authorization).slice('Bearer '.length) }), ['datasets:read'])
  })
})
