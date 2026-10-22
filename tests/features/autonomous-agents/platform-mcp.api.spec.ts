/**
 * stateful API tests: data-fair's MCP is built into every autonomous agent with an identity.
 *
 * `privateMcpUrl` (api/config/development.js) points at dev-mcp's `/platform/` stand-in, which serves the
 * data-returning tools prefixed `platform_`: an agent's reach there is its identity's scopes, with nothing
 * to reference in `mcpServers`.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const home = `http://localhost:${process.env.NGINX_PORT}`
const AGENTS = '/api/autonomous-agents/organization/test1'

const enrol = async () => await admin.post('/api/test-env/autonomous-agent', {
  id: 'test-fixture',
  owner: { type: 'organization', id: 'test1' },
  clientId: 'test-autonomous-agent-nhi',
  siteUrl: home,
  issuer: `${home}/agents/api/nhi`,
  autonomousAgent: { title: 'Platform probe', persona: 'x', mcpServers: [], enabled: true }
})

test.describe('The built-in data-fair server', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('an enrolled agent with no servers has data-fair\'s tools', async () => {
    await enrol()
    const { data } = await admin.get(`${AGENTS}/test-fixture/tools`)
    const closures = data.results.find((t: any) => t.name === 'platform_list_road_closures')
    assert.ok(closures, JSON.stringify(data.results.map((t: any) => t.name)))
    assert.equal(closures.server, 'data-fair')
    assert.equal(closures.kind, 'platform')
    // the stand-in serves its data tools only, all of them prefixed
    assert.deepEqual(data.results.filter((t: any) => t.server === 'data-fair').map((t: any) => t.name).sort(),
      ['platform_closure_stats', 'platform_export_closures', 'platform_export_my_profile', 'platform_list_road_closures'])
  })

  // no identity, no scopes: and data-fair is never reached with the session of whoever instructs it
  test('an agent without an identity has no data-fair tool', async () => {
    const agent = (await admin.post(AGENTS, { title: 'No identity', persona: 'x', mcpServers: [], enabled: true })).data
    const { data } = await admin.get(`${AGENTS}/${agent.id}/tools`)
    assert.deepEqual(data.results.filter((t: any) => t.server === 'data-fair'), [])
  })

  test('data-fair cannot be referenced', async () => {
    await assert.rejects(admin.post(AGENTS, { title: 'Doubled', persona: 'x', mcpServers: [{ serverId: 'data-fair' }], enabled: true }),
      (err: any) => { assert.equal(err.status, 400); return true })
  })

  test('a turn records data-fair\'s tools as platform', async () => {
    await enrol()
    const { assistant, run } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool platform_list_road_closures {"district":"city-center"}')
    const part = assistant.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'platform_list_road_closures')
    assert.equal(part?.state, 'output-available', JSON.stringify(assistant.parts))
    assert.match(JSON.stringify(part.output), /Rue de la Paix/)
    const call = run.calls.find((c: any) => c.toolSources?.platform_list_road_closures)
    assert.deepEqual(call?.toolSources.platform_list_road_closures, { kind: 'platform', server: 'data-fair' })
  })
})
