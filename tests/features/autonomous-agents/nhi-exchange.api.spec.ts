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
    // therefore overwrite both from reqSiteUrl(req) on every write, BEFORE enrolment
    // verification (Task 5) ever looks at them. Without this test the only thing
    // standing between an admin and an attacker-chosen issuer is a comment.
    // Sent through nginx because the body carries nhi.clientId.
    //
    // Since Task 5, this POST is rejected before insert: 'nhi-whatever' is not a real
    // enrolment, so assertEnrolmentWorks's exchange fails and the autonomous agent is
    // never created. That rejection is itself part of the proof this test makes: the
    // server verifies against the CAPTURED issuer/subject, never the attacker-supplied
    // ones, and nothing attacker-controlled is ever persisted or echoed back.
    // Deliberately a hard assert.rejects rather than a `.catch((err) => err)` /
    // `if (stored)` pattern — that is exactly what let this test decay into zero
    // assertions before, and it is the failure mode this branch keeps producing.
    await assert.rejects(
      admin.post(throughNginx('/api/autonomous-agents/organization/test1'), {
        title: 'Injection probe',
        persona: 'x',
        mcpServers: [],
        toolDisclosure: 'static',
        enabled: true,
        nhi: { clientId: 'nhi-whatever', siteUrl: 'https://attacker.example', issuer: 'https://attacker.example/agents/api/nhi' }
      }),
      (err: any) => {
        assert.equal(err.status, 400)
        const errText = JSON.stringify(err.data)
        assert.match(errText, /could not be verified/)
        // the identity named in the error is the SERVER-captured one, never the
        // attacker-supplied siteUrl/issuer
        assert.match(errText, /\/agents\/api\/nhi/)
        assert.equal(errText.includes('attacker.example'), false)
        return true
      }
    )

    // and no autonomous agent with that title was persisted
    const list = await admin.get('/api/autonomous-agents/organization/test1')
    const stored = list.data.results.find((a: any) => a.title === 'Injection probe')
    assert.equal(stored, undefined)
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

  test('saving a bogus nhi.clientId is refused at configuration time', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Bad enrolment', persona: 'x', mcpServers: [], toolDisclosure: 'static', enabled: true
    })
    // Sent through nginx: the body carries nhi.clientId, so the PUT handler calls
    // reqSiteUrl(req) to capture siteUrl/issuer before verification runs, and that
    // throws under the direct client (see the top-of-file comment / throughNginx above).
    await assert.rejects(
      admin.put(throughNginx(`/api/autonomous-agents/organization/test1/${created.data.id}`), {
        title: 'Bad enrolment',
        persona: 'x',
        mcpServers: [],
        toolDisclosure: 'static',
        enabled: true,
        nhi: { clientId: 'nhi-doesnotexist' }
      }),
      (err: any) => { assert.equal(err.status, 400); assert.match(JSON.stringify(err.data), /could not be verified/); return true }
    )
  })

  // NOTE: the brief also specifies a test proving an UNCHANGED nhi.clientId is not
  // re-verified on every save (protecting the per-client_id rate-limited exchange
  // budget). That test can only be written by first completing a REAL, successful
  // enrolment (create the autonomous agent, register a working NHI in simple-directory,
  // PUT it in so the first save's verification succeeds) and then proving a second save
  // with the same clientId does not repeat that exchange. This dev stack cannot do the
  // first half: simple-directory runs STORAGE_TYPE=file, whose FileStorage.createUser
  // throws 'Method not implemented.', so no NHI can ever be created here (see the
  // skipped test above) and therefore no enrolment can ever succeed. Per this task's
  // explicit instructions, no test requiring a successful enrolment is added. The
  // changed-only guard itself is implemented in assertEnrolmentWorks's caller (see
  // router.ts: `updated.nhi.clientId !== existing.nhi?.clientId`) and documented there;
  // closing this test gap needs the same environment fix as the skipped test above.

  test('a save with no nhi at all is unaffected by enrolment verification', async () => {
    const created = await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'No nhi', persona: 'x', mcpServers: [], toolDisclosure: 'static', enabled: true
    })
    // No nhi.clientId anywhere in the body, so assertEnrolmentWorks must never be
    // invoked and this ordinary edit must succeed without attempting any exchange.
    const updated = await admin.put(`/api/autonomous-agents/organization/test1/${created.data.id}`, {
      title: 'No nhi renamed', persona: 'x', mcpServers: [], toolDisclosure: 'static', enabled: true
    })
    assert.equal(updated.status, 200)
    assert.equal(updated.data.title, 'No nhi renamed')
    assert.equal(updated.data.nhi, undefined)
  })
})
