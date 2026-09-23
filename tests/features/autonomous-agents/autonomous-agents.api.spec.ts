/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'

const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })
const admin = await superAdmin

const validAgent = () => ({
  title: 'Support triage',
  persona: 'You triage incoming support questions.',
  mcpServers: [{ serverId: 'dev-public-mcp' }],
  toolDisclosure: 'static',
  enabled: true
})

test.describe('Autonomous agents API', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('the MCP catalog lists the dev servers without credentials', async () => {
    const res = await admin.get('/api/autonomous-agents/organization/test1/mcp-servers')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, res.data.results.length)
    const publicServer = res.data.results.find((s: any) => s.id === 'dev-public-mcp')
    assert.ok(publicServer, 'expected the dev-config public MCP server')
    assert.equal(publicServer.auth, 'none')
    assert.equal(JSON.stringify(res.data).includes('apiKey'), false)
  })

  test('a non-admin member cannot read the MCP catalog', async () => {
    await assert.rejects(orgMember.get('/api/autonomous-agents/organization/test1/mcp-servers'), { status: 403 })
  })

  test('a superadmin creates an autonomous agent and reads it back', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    assert.equal(created.status, 200)
    assert.ok(created.data.id, 'expected a generated id')
    assert.equal(created.data.owner.type, 'organization')
    assert.equal(created.data.owner.id, 'test1')
    assert.ok(created.data.createdAt)

    const read = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}`)
    assert.equal(read.status, 200)
    assert.equal(read.data.title, 'Support triage')
  })

  test('listing returns only the autonomous agents of that account', async () => {
    await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    const res = await admin.get('/api/autonomous-agents/organization/test1')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
    assert.equal(res.data.results[0].title, 'Support triage')
  })

  test('an unknown serverId is refused with 400 naming the id', async () => {
    const body = { ...validAgent(), mcpServers: [{ serverId: 'no-such-server' }] }
    await assert.rejects(
      admin.post('/api/autonomous-agents/organization/test1', body),
      (err: any) => { assert.equal(err.status, 400); assert.match(String(err.data), /no-such-server/); return true }
    )
  })

  test('a body missing persona is refused with 400', async () => {
    const { persona, ...noPersona } = validAgent()
    await assert.rejects(admin.post('/api/autonomous-agents/organization/test1', noPersona), { status: 400 })
  })

  test('the rollout gate refuses an org admin who is not in admin mode', async () => {
    await assert.rejects(orgAdmin.post('/api/autonomous-agents/organization/test1', validAgent()), { status: 403 })
  })

  test('an org admin can READ even while the rollout gate blocks writes', async () => {
    await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    const res = await orgAdmin.get('/api/autonomous-agents/organization/test1')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
  })

  // Cross-account isolation is exercised on the READ path, where nothing sits in front
  // of assertAccountRole. It cannot be exercised on the write path while
  // autonomousAgentsRequireAdminMode is true: reqWriteSession rejects every
  // non-superadmin before assertAccountRole runs, and a superadmin in admin mode
  // satisfies assertAccountRole for any account by design. Add the write-path case when
  // that flag is flipped to false.
  test('an org admin is refused a cross-account list', async () => {
    await assert.rejects(orgAdmin.get('/api/autonomous-agents/organization/dev1'), { status: 403 })
  })

  test('an org admin is refused a cross-account MCP catalog read', async () => {
    await assert.rejects(orgAdmin.get('/api/autonomous-agents/organization/dev1/mcp-servers'), { status: 403 })
  })

  test('an org admin is refused a cross-account read by id', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(orgAdmin.get(`/api/autonomous-agents/organization/dev1/${created.data.id}`), { status: 403 })
  })
})
