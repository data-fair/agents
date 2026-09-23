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

    // dev-apikey-mcp is the only dev-config entry that carries a credential — without
    // it, this "no credentials leak" assertion would pass trivially, since none of the
    // other entries ever had an apiKey to strip in the first place. Its `auth: "apiKey"`
    // value is expected to come through (that's the auth MODE, not the credential), so
    // check for the `apiKey`/`apiKeyHeader` KEYS and the secret's literal VALUE rather
    // than the bare substring "apiKey", which "auth":"apiKey" legitimately contains.
    const apiKeyServer = res.data.results.find((s: any) => s.id === 'dev-apikey-mcp')
    assert.ok(apiKeyServer, 'expected the dev-config apiKey MCP server')
    assert.equal(apiKeyServer.auth, 'apiKey')
    assert.equal('apiKey' in apiKeyServer, false)
    assert.equal('apiKeyHeader' in apiKeyServer, false)
    assert.equal(JSON.stringify(res.data).includes('dev-secret-value'), false)
  })

  test('a non-admin member cannot read the MCP catalog', async () => {
    await assert.rejects(orgMember.get('/api/autonomous-agents/organization/test1/mcp-servers'), { status: 403 })
  })

  // A user is always 'admin' of their own personal account (getAccountRole in
  // @data-fair/lib-common-types/session), so assertAccountRole alone never refuses
  // owner.type: 'user' — including the user's OWN personal account, with no org
  // switching needed. assertOrganizationOwner is the only thing standing in front of
  // this. Uses orgMember (test1-user1) precisely because it is otherwise a nobody —
  // a plain member of test1, not an admin of anything — yet still self-admin of its
  // own personal account.
  test('a personal account owner is refused reading the MCP catalog, even the caller\'s own', async () => {
    await assert.rejects(
      orgMember.get('/api/autonomous-agents/user/test1-user1/mcp-servers'),
      (err: any) => { assert.equal(err.status, 400); assert.match(String(err.data), /organization/); return true }
    )
  })

  test('a personal account owner is refused creating an autonomous agent, even the caller\'s own', async () => {
    await assert.rejects(
      orgMember.post('/api/autonomous-agents/user/test1-user1', validAgent()),
      (err: any) => { assert.equal(err.status, 400); assert.match(String(err.data), /organization/); return true }
    )
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

  // assertAccountRole now runs BEFORE the reqWriteSession rollout gate (see router.ts),
  // so a plain org member is refused by the role check itself, not by the gate — and
  // the two throw different messages. Asserting on the message, not just the 403,
  // is what makes this test fail if assertAccountRole were ever removed from the
  // handler: without it, orgMember would still get 403, just from reqWriteSession
  // ('super admin only') instead of assertAccountRole ('requires admin role(s)').
  test('a non-admin org member is refused POST by the role check, not merely the rollout gate', async () => {
    await assert.rejects(
      orgMember.post('/api/autonomous-agents/organization/test1', validAgent()),
      (err: any) => { assert.equal(err.status, 403); assert.match(String(err.data), /requires admin/); return true }
    )
  })

  test('an org admin can READ even while the rollout gate blocks writes', async () => {
    await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    const res = await orgAdmin.get('/api/autonomous-agents/organization/test1')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
  })

  // Cross-account isolation is exercised on the READ path, where nothing sits in front
  // of assertAccountRole. On the write path, assertAccountRole now runs before the
  // reqWriteSession rollout gate (see router.ts), so it is reachable there too — but a
  // superadmin in admin mode satisfies assertAccountRole for any account by design, so
  // that specific case still can't be exercised with the `admin` client. The
  // org-member write-path cases just below cover the role check on the write path.
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

  test('a non-admin org member is refused PUT by the role check, not merely the rollout gate', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      orgMember.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, { ...validAgent(), title: 'Nope' }),
      (err: any) => { assert.equal(err.status, 403); assert.match(String(err.data), /requires admin/); return true }
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

  test('a non-admin org member is refused DELETE by the role check, not merely the rollout gate', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', validAgent())
    await assert.rejects(
      orgMember.delete(`/api/autonomous-agents/organization/test1/${created.data.id}`),
      (err: any) => { assert.equal(err.status, 403); assert.match(String(err.data), /requires admin/); return true }
    )
  })
})
