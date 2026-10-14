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

const issuer = `http://localhost:${process.env.NGINX_PORT}/agents/api/nhi`
const seedAgent = async (id: string, profiles: string[]) => {
  await admin.post('/api/test-env/autonomous-agent', {
    id,
    owner: { type: 'organization', id: 'test1' },
    clientId: 'test-autonomous-agent-nhi',
    siteUrl: `http://localhost:${process.env.NGINX_PORT}`,
    issuer,
    autonomousAgent: body([{ serverId: 'dev-profiled-mcp', profiles }])
  })
}

test.describe('profile selection at run time', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean(); fixture.withdrawProfile(undefined) })

  test('a turn lists exactly the selected profiles\' tools, and the diagnostic says which', async () => {
    await seedAgent('test-fixture', ['read'])
    const res = await admin.get(`${base}/test-fixture/tools`)
    assert.deepEqual(res.data.results.map((t: any) => t.name).sort(), ['closure_stats', 'list_road_closures'])
    assert.deepEqual(res.data.profiles, [{ server: 'dev-profiled-mcp', profiles: ['read'] }])
  })
  test('equal selections in another order give the same tools; a different selection does not', async () => {
    await seedAgent('test-fixture', ['write', 'catalog'])
    const first = (await admin.get(`${base}/test-fixture/tools`)).data.results.map((t: any) => t.name).sort()
    await seedAgent('test-fixture', ['catalog', 'write'])
    const second = (await admin.get(`${base}/test-fixture/tools`)).data.results.map((t: any) => t.name).sort()
    assert.deepEqual(first, second)
    assert.deepEqual(first, ['closure_stats', 'echo', 'import_table', 'list_road_closures'])
    await seedAgent('test-fixture', ['catalog'])
    assert.deepEqual((await admin.get(`${base}/test-fixture/tools`)).data.results.map((t: any) => t.name), ['echo'])
  })
  test('a withdrawn profile fails by name', async () => {
    await seedAgent('test-fixture', ['read'])
    fixture.withdrawProfile('read')
    const res = await admin.get(`${base}/test-fixture/tools`, { validateStatus: () => true })
    assert.equal(res.status, 502)
    assert.match(String(res.data), /MCP server "dev-profiled-mcp" failed: .*unknown profile: read/)
  })
  test('a profiled reference without profiles never lists every tool', async () => {
    // written past the save check, as a document from before profiles would be
    await seedAgent('test-fixture', ['read'])
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-autonomous-agent-nhi',
      siteUrl: `http://localhost:${process.env.NGINX_PORT}`,
      issuer,
      autonomousAgent: body([{ serverId: 'dev-profiled-mcp' }])
    })
    const res = await admin.get(`${base}/test-fixture/tools`, { validateStatus: () => true })
    assert.equal(res.status, 400)
    assert.match(String(res.data), /MCP server "dev-profiled-mcp" declares profiles and this agent selects none/)
  })
})

test.describe('profiles route', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean() })

  test('without an agent: the vocabulary and every root offered', async () => {
    const res = await admin.get(`${base}/mcp-servers/dev-profiled-mcp/profiles`)
    assert.deepEqual(res.data.profiles.map((p: any) => p.name), ['catalog', 'read', 'write', 'read_roads', 'write_roads'])
    assert.equal(res.data.role, undefined)
    assert.deepEqual(res.data.offered, ['catalog', 'read', 'write'])
  })
  test('for an enrolled agent: its identity\'s role narrows the roots (contrib: no manage)', async () => {
    await seedAgent('test-fixture', ['read'])
    const res = await admin.get(`${base}/mcp-servers/dev-profiled-mcp/profiles`, { params: { agentId: 'test-fixture' } })
    assert.equal(res.data.role, 'contrib')
    assert.deepEqual(res.data.offered, ['catalog', 'read', 'write'])
  })
  test('an identity whose session cannot be had still gets the vocabulary, every root and the reason', async () => {
    // the form must stay usable to repair that very identity
    await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-broken',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'no-such-nhi',
      siteUrl: `http://localhost:${process.env.NGINX_PORT}`,
      issuer,
      autonomousAgent: body([{ serverId: 'dev-profiled-mcp', profiles: ['read'] }])
    })
    const res = await admin.get(`${base}/mcp-servers/dev-profiled-mcp/profiles`, { params: { agentId: 'test-broken' } })
    assert.equal(res.status, 200)
    assert.equal(res.data.role, undefined)
    assert.deepEqual(res.data.offered, ['catalog', 'read', 'write'])
    assert.ok(res.data.roleError)
  })
  test('an unprofiled server is a 400', async () => {
    assert.equal((await admin.get(`${base}/mcp-servers/dev-public-mcp/profiles`, { validateStatus: () => true })).status, 400)
  })
  test('the listing says which servers are profiled', async () => {
    const res = await admin.get(`${base}/mcp-servers`)
    assert.equal(res.data.results.find((s: any) => s.id === 'dev-profiled-mcp').profiled, true)
    assert.equal(res.data.results.find((s: any) => s.id === 'dev-public-mcp').profiled, false)
  })
})
