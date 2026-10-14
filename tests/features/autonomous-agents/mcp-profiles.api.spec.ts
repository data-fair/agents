/**
 * Profile selection on a profiled catalog server (docs/superpowers/specs/2026-10-14-mcp-profile-selection-design.md).
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean } from '../../support/axios.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const base = '/api/autonomous-agents/organization/test1'
const body = (mcpServers: any[]) => ({ title: 'Profiles', persona: 'x', mcpServers, enabled: true })
const status = async (mcpServers: any[]) => (await admin.post(base, body(mcpServers), { validateStatus: () => true }))

let fixture: McpFixture

test.describe('profile selection at save', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean(); fixture.withdrawProfile(undefined) })

  test('accepts declared profiles, catalog with others included', async () => {
    const res = await status([{ serverId: 'dev-profiled-mcp', profiles: ['catalog', 'write'] }])
    assert.equal(res.status, 200)
    assert.deepEqual(res.data.mcpServers, [{ serverId: 'dev-profiled-mcp', profiles: ['catalog', 'write'] }])
  })
  test('refuses an undeclared profile, naming it and the server', async () => {
    const res = await status([{ serverId: 'dev-profiled-mcp', profiles: ['read', 'nope'] }])
    assert.equal(res.status, 400)
    assert.match(res.data, /MCP server "dev-profiled-mcp" has no profile "nope"/)
  })
  test('refuses toolFilter, a missing selection and a second reference on a profiled server', async () => {
    assert.equal((await status([{ serverId: 'dev-profiled-mcp', profiles: ['read'], toolFilter: ['echo'] }])).status, 400)
    assert.equal((await status([{ serverId: 'dev-profiled-mcp' }])).status, 400)
    assert.equal((await status([{ serverId: 'dev-profiled-mcp', profiles: ['read'] }, { serverId: 'dev-profiled-mcp', profiles: ['write'] }])).status, 400)
  })
  test('refuses profiles on a server that declares none', async () => {
    const res = await status([{ serverId: 'dev-public-mcp', profiles: ['read'] }])
    assert.equal(res.status, 400)
    assert.match(res.data, /declares no profiles/)
  })
  test('an unreadable vocabulary refuses the save with a 502 naming the server', async () => {
    await fixture.close()
    try {
      const res = await status([{ serverId: 'dev-profiled-mcp', profiles: ['read'] }])
      assert.equal(res.status, 502)
      assert.match(res.data, /profile vocabulary of MCP server "dev-profiled-mcp" could not be read/)
    } finally {
      fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30)
    }
  })
  test('updates are checked the same way', async () => {
    const created = await admin.post(base, body([{ serverId: 'dev-profiled-mcp', profiles: ['read'] }]))
    const res = await admin.put(`${base}/${created.data.id}`, body([{ serverId: 'dev-profiled-mcp', profiles: ['nope'] }]), { validateStatus: () => true })
    assert.equal(res.status, 400)
  })
})
