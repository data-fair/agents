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

  test('PUT replaces the writable fields and preserves the server-owned ones', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())

    const updated = await admin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, {
      ...validAgent(),
      title: 'Renamed',
      instructions: 'Answer in French.',
      instructors: [{ userId: 'test1-user1', userName: 'Test User' }]
    })

    assert.equal(updated.status, 200)
    assert.equal(updated.data.title, 'Renamed')
    assert.equal(updated.data.instructions, 'Answer in French.')
    assert.deepEqual(updated.data.instructors, [{ userId: 'test1-user1', userName: 'Test User' }])
    assert.equal(updated.data.id, created.data.id)
    assert.equal(updated.data.createdAt, created.data.createdAt)
    assert.notEqual(updated.data.updatedAt, created.data.createdAt)
  })

  test('PUT drops a field that is absent from the new body', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', { ...validAgent(), instructions: 'Initial.' })
    const updated = await admin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, validAgent())
    assert.equal('instructions' in updated.data, false)
  })

  test('PUT refuses an unknown serverId', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      admin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, { ...validAgent(), mcpServers: [{ serverId: 'no-such-server' }] }),
      (err: any) => { assert.equal(err.status, 400); assert.match(String(err.data), /no-such-server/); return true }
    )
  })

  test('PUT on an unknown autonomous agent is a 404', async () => {
    await assert.rejects(
      admin.put('/api/autonomous-agents/organization/test1/no-such-agent', validAgent()),
      { status: 404 }
    )
  })

  test('the rollout gate refuses a PUT from an org admin not in admin mode', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      orgAdmin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, { ...validAgent(), title: 'Nope' }),
      { status: 403 }
    )
  })

  test('DELETE removes it and a second DELETE is a 404', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())

    const deleted = await admin.delete(`/api/autonomous-agents/organization/test1/${created.data.id}`)
    assert.equal(deleted.status, 204)

    await assert.rejects(
      admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}`),
      { status: 404 }
    )
    await assert.rejects(
      admin.delete(`/api/autonomous-agents/organization/test1/${created.data.id}`),
      { status: 404 }
    )
  })

  test('an autonomous agent of another account cannot be reached by id', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      admin.get(`/api/autonomous-agents/organization/dev1/${created.data.id}`),
      { status: 404 }
    )
  })

  test('DELETE is scoped by owner — a foreign account path does not delete it', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())

    // The superadmin satisfies assertAccountRole for any account, so the mongo filter's
    // owner clauses are the ONLY protection here. Unlike PUT, DELETE does no
    // owner-scoped fetch first, so dropping them would silently allow a cross-account
    // delete that every other test in this file would still pass.
    await assert.rejects(
      admin.delete(`/api/autonomous-agents/organization/dev1/${created.data.id}`),
      { status: 404 }
    )

    const stillThere = await admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}`)
    assert.equal(stillThere.status, 200)
    assert.equal(stillThere.data.id, created.data.id)
  })

  test('the rollout gate refuses a DELETE from an org admin not in admin mode', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      orgAdmin.delete(`/api/autonomous-agents/organization/test1/${created.data.id}`),
      { status: 403 }
    )
  })
})
