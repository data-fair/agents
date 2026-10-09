/**
 * stateful API tests: an autonomous agent with an external MCP server. A second MCP fixture plays a
 * portal of another install; dev config declares localhost public to the external client.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { externalToolName } from '../../../api/src/mcp-servers/operations.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const AGENTS = '/api/autonomous-agents/organization/test1'
const externalUrl = `http://localhost:${Number(process.env.NGINX_PORT) + 32}/mcp`
let external: McpFixture

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post(AGENTS, { title: 'Interop', persona: 'x', mcpServers: [], enabled: true, externalMcpServers: [{ url: externalUrl }], ...over })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

test.describe('External MCP servers', () => {
  test.beforeAll(async () => { external = await startMcpFixture(Number(process.env.NGINX_PORT) + 32) })
  test.afterAll(async () => { await external.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
    external.resetInvokedTools()
  })

  test('the list is stored as it is connected to, and an IP address is refused', async () => {
    const agent = await createAgent({ externalMcpServers: [{ url: externalUrl }, { url: externalUrl }] })
    assert.deepEqual(agent.externalMcpServers, [{ url: externalUrl }])
    await assert.rejects(admin.post(AGENTS, { title: 'x', persona: 'x', mcpServers: [], enabled: true, externalMcpServers: [{ url: 'https://10.0.0.1/mcp' }] }), { status: 400 })
  })

  test('its tools are listed under the server\'s prefix', async () => {
    const agent = await createAgent()
    const { data } = await admin.get(`${AGENTS}/${agent.id}/tools`)
    const echo = data.results.find((t: any) => t.name === externalToolName(externalUrl, 'echo'))
    assert.ok(echo, data.results.map((t: any) => t.name).join())
    assert.equal(echo.server, new URL(externalUrl).host)
    assert.deepEqual(data.skipped, [])
  })

  test('the agent calls them anonymously', async () => {
    const agent = await createAgent()
    const name = externalToolName(externalUrl, 'echo')
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, `call tool ${name} {"value":"from afar"}`)
    const part = assistant.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === name)
    assert.equal(part.state, 'output-available', JSON.stringify(part))
    assert.deepEqual(external.invokedTools(), ['echo'])
    assert.equal(external.lastHeaders().cookie, undefined)
    assert.equal(external.lastHeaders()['x-api-key'], undefined)
  })

  test('a server that cannot be reached is reported, not fatal', async () => {
    const agent = await createAgent({ externalMcpServers: [{ url: 'http://localhost:1/mcp' }] })
    const { data } = await admin.get(`${AGENTS}/${agent.id}/tools`)
    assert.equal(data.skipped[0].id, 'localhost:1')
    const { run } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'hello')
    assert.equal(run.status, 'done')
  })
})
