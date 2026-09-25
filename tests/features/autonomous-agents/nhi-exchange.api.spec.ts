/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 *
 * This spec exercises the real simple-directory NHI exchange. It requires the dev
 * simple-directory to run with MANAGE_NHIS=true and NHIS_ALLOW_INSECURE_ISSUERS=true.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const publicUrl = `http://localhost:${process.env.NGINX_PORT}/agents`
const issuer = `${publicUrl}/api/nhi`

// `admin` addresses the API directly on DEV_API_PORT (see tests/support/axios.ts), which
// carries no x-forwarded-host. A write that stores nhi.clientId now calls reqSiteUrl(req)
// to capture siteUrl/issuer, which throws under that direct client. So any request whose
// body carries nhi.clientId is sent as an ABSOLUTE url on the nginx-fronted public origin
// instead — `admin`'s session cookie is scoped to that same origin (simple-directory sits
// behind the same nginx port), so the cookie still applies; only the request path changes.
const throughNginx = (path: string) => `${publicUrl}${path}`

test.describe('NHI exchange', () => {
  test.beforeEach(async () => { await clean() })

  // SKIPPED: not provable in this dev stack, for an environment reason rather than a code one.
  // simple-directory runs STORAGE_TYPE=file (as every data-fair dev stack does), and
  // FileStorage.createUser throws 'Method not implemented.', so POST /api/organizations/:id/nhis
  // 500s and no NHI can be created. The alternatives are all worse than the gap: switching to
  // mongo storage deletes every test identity (users.json/organizations.json are FileStorage-only,
  // read via readFileSync at boot) and breaks the whole suite until seeding exists; and a committed
  // fixture NHI cannot work because dev/init-env.sh randomises NGINX_PORT, so the issuer's port
  // differs per checkout and in CI.
  // In staging and production this path is exercised normally: simple-directory runs mongo storage
  // and an org admin creates the NHI through the UI. The declare/sign invariant that would most
  // plausibly break here is covered at unit level in nhi.unit.spec.ts.
  // Closing this properly needs its own change — see the plan's outstanding section.
  test.skip('an enrolled autonomous agent obtains a real simple-directory session', async () => {
    // 1. create the autonomous agent
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Identity probe',
      persona: 'You probe identity.',
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true
    })
    const agentId = created.data.id

    // 2. an org admin registers the NHI in simple-directory, bound to this service's
    //    issuer and the agent's namespaced subject. Discovery is used rather than an
    //    inline jwks, so rotation needs no re-enrolment. `role` is required by
    //    simple-directory's post-req schema; 'user' is one of the default org roles
    //    (config.roles.defaults = ['admin', 'user']) and test1 defines no custom roles.
    const nhi = await orgAdmin.post(`${directoryUrl}/api/organizations/test1/nhis`, {
      name: `autonomous-agent-${agentId}`,
      role: 'user',
      provider: { issuer },
      subject: `autonomous-agent:${agentId}`
    })
    assert.equal(nhi.status, 201)
    const clientId = nhi.data.id
    assert.match(clientId, /^nhi-/)

    // 3. store the client id on the autonomous agent. Goes through nginx (see
    //    throughNginx above) because the body carries nhi.clientId, which makes the PUT
    //    handler call reqSiteUrl(req) to capture siteUrl/issuer.
    const updated = await admin.put(throughNginx(`/api/autonomous-agents/organization/test1/${agentId}`), {
      title: 'Identity probe',
      persona: 'You probe identity.',
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true,
      nhi: { clientId }
    })
    assert.equal(updated.data.nhi.clientId, clientId)
    assert.equal(updated.data.nhi.siteUrl, `http://localhost:${process.env.NGINX_PORT}`)
    assert.equal(updated.data.nhi.issuer, issuer)

    // 4. the service exchanges an assertion for a session, and reports the identity it
    //    obtained. This is the first end-to-end proof that the issuer, the JWKS, the
    //    assertion claims and the audience all line up.
    const session = await admin.get(`/api/autonomous-agents/organization/test1/${agentId}/session`)
    assert.equal(session.status, 200)
    assert.equal(session.data.userId, clientId)
    assert.equal(session.data.organization, 'test1')
    assert.equal(session.data.nhi, true)
    assert.ok(session.data.expiresIn > 0 && session.data.expiresIn <= 300, 'session capped by the assertion ttl')
    // the cookie itself must never be returned
    assert.equal(JSON.stringify(session.data).includes('id_token'), false)
  })

  test('a client-supplied nhi.siteUrl / nhi.issuer is discarded, not trusted', async () => {
    // readOnly is only a form hint: ajv does not enforce it, and these are KNOWN keys so
    // additionalProperties: false does not reject them either. The write routes must
    // therefore overwrite both from reqSiteUrl(req) on every write. Without this test the
    // only thing standing between an admin and an attacker-chosen issuer is a comment.
    // Sent through nginx because the body carries nhi.clientId.
    await admin.post(throughNginx('/api/autonomous-agents/organization/test1'), {
      title: 'Injection probe',
      persona: 'x',
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true,
      nhi: { clientId: 'nhi-whatever', siteUrl: 'https://attacker.example', issuer: 'https://attacker.example/agents/api/nhi' }
    }).catch((err: any) => err)

    // The POST may legitimately fail enrolment verification (Task 5) for the bogus
    // clientId; what must NOT happen is the attacker values being persisted. Read back
    // whichever agent exists and assert the captured values won.
    const list = await admin.get('/api/autonomous-agents/organization/test1')
    const stored = list.data.results.find((a: any) => a.title === 'Injection probe')
    // Deliberately a hard assertion rather than `if (stored)`. Task 5 adds enrolment
    // verification, which will reject this bogus clientId before insert — at which point
    // this test MUST fail loudly so whoever does Task 5 converts it to assert the
    // rejection path, rather than it silently decaying into zero assertions.
    assert.ok(stored, 'expected the autonomous agent to have been created; if Task 5 now rejects the bogus clientId, convert this test to assert the rejection path instead of deleting it')
    assert.equal(stored.nhi?.siteUrl, `http://localhost:${process.env.NGINX_PORT}`)
    assert.match(stored.nhi?.issuer ?? '', /\/agents\/api\/nhi$/)
    assert.equal(JSON.stringify(stored).includes('attacker.example'), false)
  })

  test('an autonomous agent with no enrolled identity is refused', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'No identity',
      persona: 'x',
      mcpServers: [],
      toolDisclosure: 'static',
      enabled: true
    })
    await assert.rejects(
      admin.get(`/api/autonomous-agents/organization/test1/${created.data.id}/session`),
      (err: any) => { assert.equal(err.status, 400); assert.match(JSON.stringify(err.data), /non-human identity/); return true }
    )
  })
})
