/**
 * stateful API tests: which sites an autonomous agent acts on, and as whom.
 *
 * The organization test1 gets a second domain, dev1 gets one too. The agent's account is its
 * enrolment site plus test1's domains: dev1's is outside it.
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
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
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
const foreignPortal = portalHost('dev1-portal')
const AGENT = '/api/autonomous-agents/organization/test1/test-fixture'

const enrol = async (siteUrl = home, over: any = {}) => await admin.post('/api/test-env/autonomous-agent', {
  id: 'test-fixture',
  owner: { type: 'organization', id: 'test1' },
  clientId: 'test-autonomous-agent-nhi',
  siteUrl,
  issuer,
  autonomousAgent: { title: 'Site probe', persona: 'x', mcpServers: [], enabled: true, ...over }
})

test.describe('Sites of an autonomous agent', () => {
  const siteIds: string[] = []
  test.beforeAll(async () => {
    fixture = await startMcpFixture(Number(PORT) + 30)
    siteIds.push(await createSite(ownPortal, { type: 'organization', id: 'test1', name: 'Test 1' }))
    siteIds.push(await createSite(foreignPortal, { type: 'organization', id: 'dev1', name: 'Dev 1' }))
  })
  test.afterAll(async () => { for (const id of siteIds) await deleteSite(id); await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('its account is its enrolment site and its organization\'s sites, not another organization\'s', async () => {
    await enrol()
    const { data } = await admin.get(`${AGENT}/session`)
    assert.deepEqual(data.accountSites, [home, `http://${ownPortal}`])
  })

  test('a chat on its own site acts there, as the agent', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami')
    assert.deepEqual(whoami(assistant), { forwardedHost: `localhost:${PORT}`, userId: 'test-autonomous-agent-nhi' })
  })

  test('a portal of its organization is reached with a session for that portal', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    const { assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, `call tool whoami {"portal":"${ownPortal}"}`)
    assert.deepEqual(whoami(assistant), { forwardedHost: ownPortal, userId: 'test-autonomous-agent-nhi' })
    // and the home site again in the same conversation: no session leaks from one site to the other
    const again = await turnOverSocket(orgAdmin, conversationId, 'call tool whoami')
    assert.deepEqual(whoami(again.assistant), { forwardedHost: `localhost:${PORT}`, userId: 'test-autonomous-agent-nhi' })
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

  test('a portal that is not one of its organization\'s is refused by name', async () => {
    await enrol(home, { mcpServers: [{ serverId: 'dev-session-mcp' }] })
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, `call tool whoami {"portal":"${foreignPortal}"}`)
    const part = assistant.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'whoami')
    assert.equal(part.state, 'output-error')
    assert.match(part.errorText, /is not a portal of your organization/)
  })

  // Binding: an identity without its enrolment site is a misconfiguration to surface, never a reason to
  // quietly run anonymous. Public tools only, so this exercises the path that skips the account listing.
  test('an agent with an identity but no enrolment site is refused, not run anonymously', async () => {
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-autonomous-agent-nhi',
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

  // The pair data-fair's mcp is configured as (api/config/development.js): the platform server on the home
  // site only, its datasets server on every other site.
  const pair = { mcpServers: [{ serverId: 'dev-home-session-mcp' }, { serverId: 'dev-datasets-session-mcp' }] }
  const callOf = (assistant: any, toolName: string) => assistant.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)

  test('on its own site the home entry is listed and the paired entry is not', async () => {
    await enrol(home, pair)
    const { data } = await admin.get(`${AGENT}/tools`)
    const servers = new Set(data.results.map((t: any) => t.server))
    assert.deepEqual([...servers], ['dev-home-session-mcp', 'dev-datasets-session-mcp'])
    const homeWhoami = data.results.find((t: any) => t.name === 'whoami')
    assert.equal(homeWhoami.server, 'dev-home-session-mcp')
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami')
    assert.deepEqual(whoami(assistant), { forwardedHost: `localhost:${PORT}`, userId: 'test-autonomous-agent-nhi' })
  })

  test('a portal call goes through the paired entry with the portal\'s session', async () => {
    await enrol(home, pair)
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, `call tool datasets_whoami {"portal":"${ownPortal}"}`)
    const part = callOf(assistant, 'datasets_whoami')
    assert.equal(part?.state, 'output-available', JSON.stringify(assistant.parts))
    assert.equal(fixture.lastHeaders()['x-forwarded-host'], ownPortal)
    assert.match(String(fixture.lastHeaders().authorization), /^Bearer /, 'the portal call carries the agent\'s token for that portal')
    assert.equal(fixture.lastHeaders().cookie, undefined)
  })

  test('the agent\'s token is addressed to the site\'s MCP and issued by its enrolment site', async () => {
    await enrol(home, pair)
    await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, `call tool datasets_whoami {"portal":"${ownPortal}"}`)
    const token = String(fixture.lastHeaders().authorization).slice('Bearer '.length)
    const [header, payload] = token.split('.').slice(0, 2).map(part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8')))
    assert.equal(header.typ, 'at+jwt')
    assert.deepEqual(payload.aud, [`http://${ownPortal}/mcp-server`, `http://${ownPortal}`])
    assert.equal(payload.id, 'test-autonomous-agent-nhi')
  })

  test('the paired entry needs a portal: it never acts on the home site', async () => {
    await enrol(home, pair)
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool datasets_whoami')
    const part = callOf(assistant, 'datasets_whoami')
    assert.equal(part?.state, 'output-error', JSON.stringify(assistant.parts))
  })

  test('on another organization\'s site only the paired entry is used, anonymously', async () => {
    await enrol(home, pair)
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool datasets_whoami', { host: foreignPortal })
    assert.deepEqual(whoami({ parts: assistant.parts.map((p: any) => p.toolName === 'datasets_whoami' ? { ...p, toolName: 'whoami' } : p) }), { forwardedHost: foreignPortal, userId: null })
    assert.equal(fixture.lastHeaders().cookie, undefined)
    assert.equal(fixture.lastHeaders().authorization, undefined)
    const homeCall = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool whoami', { host: foreignPortal })
    // the home entry is not offered outside the account: the model is told the tool does not exist
    assert.match(callOf(homeCall.assistant, 'whoami')?.errorText ?? '', /unavailable tool 'whoami'/)
  })

  test('a scoped identity\'s session carries its maximum scopes to a site-bound server', async () => {
    // test-scoped-autonomous-agent-nhi holds the maximum scopes ["datasets:read"] (dev/resources/users.template.json);
    // the exchange asks for no scope, so its session is granted exactly those.
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-scoped-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-scoped-autonomous-agent-nhi',
      siteUrl: home,
      issuer,
      autonomousAgent: { title: 'Scoped probe', persona: 'x', mcpServers: [{ serverId: 'dev-session-mcp' }], enabled: true }
    })
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: 'test-scoped-fixture' }, 'call tool echo {"value":"hi"}')
    assert.equal(assistant.parts.find((p: any) => p.toolName === 'echo')?.state, 'output-available', JSON.stringify(assistant.parts))
    assert.deepEqual(credentialScopes({ bearer: String(fixture.lastHeaders().authorization).slice('Bearer '.length) }), ['datasets:read'])
  })
})
