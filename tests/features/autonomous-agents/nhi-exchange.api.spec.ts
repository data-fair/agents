/**
 * stateful API tests, validate API endpoints using axios HTTP clients
 *
 * This spec exercises the real simple-directory NHI exchange. It requires the dev
 * simple-directory to run with MANAGE_NHIS=true and NHIS_ALLOW_INSECURE_ISSUERS=true.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean } from '../../support/axios.ts'

const admin = await superAdmin

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

  /**
   * The real exchange, end to end.
   *
   * What made this impossible until now was creating the NHI: simple-directory's FileStorage cannot
   * (createUser throws), and its API therefore 500s. The fixture in dev/resources/users.template.json
   * replaces that step — the identity already exists, carrying this service's issuer and the subject
   * our assertions actually sign. The agent's id is chosen through the dev seam precisely so that
   * subject matches; see the seam's comment in app.ts.
   */
  test('an enrolled autonomous agent obtains a real simple-directory session', async () => {
    const siteUrl = `http://localhost:${process.env.NGINX_PORT}`
    const created = await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture',
      owner: { type: 'organization', id: 'test1' },
      clientId: 'test-autonomous-agent-nhi',
      siteUrl,
      issuer,
      autonomousAgent: { title: 'Identity probe', persona: 'You probe identity.', mcpServers: [], toolDisclosure: 'static', enabled: true }
    })
    assert.equal(created.data.nhi.clientId, 'test-autonomous-agent-nhi')

    // The diagnostic endpoint performs the exchange and reports WHICH identity came back, without
    // ever returning the cookie. Reaching it at all proves assertion minting, the declared audience,
    // OIDC discovery against our own issuer, and JWKS verification all agree.
    const session = await admin.get('/api/autonomous-agents/organization/test1/test-fixture/session')
    assert.equal(session.status, 200)
    const described = JSON.stringify(session.data)
    assert.match(described, /test-autonomous-agent-nhi/, `expected the NHI's identity, got ${described}`)
    // and nothing that could authenticate anyone
    assert.equal(described.includes('id_token'), false, 'a session cookie must never reach a caller')
    assert.equal(described.includes('assertion'), false)
  })

  test('an empty nhi.clientId is rejected, and cannot smuggle siteUrl/issuer through', async () => {
    // Two layers are under test. The schema's minLength makes this a validation 400; and
    // even without that, the routes now strip `nhi` from the body unconditionally rather
    // than relying on a truthy clientId to trigger the rebuild. Before both, this body was
    // accepted and the attacker-supplied siteUrl/issuer persisted verbatim while enrolment
    // verification was skipped.
    await assert.rejects(
      admin.post(throughNginx('/api/autonomous-agents/organization/test1'), {
        title: 'Empty clientId probe',
        persona: 'x',
        mcpServers: [],
        toolDisclosure: 'static',
        enabled: true,
        nhi: { clientId: '', siteUrl: 'https://attacker.example', issuer: 'https://attacker.example/agents/api/nhi' }
      }),
      (err: any) => {
        assert.equal(err.status, 400)
        // a validation failure, NOT the enrolment-verification message
        assert.doesNotMatch(JSON.stringify(err.data), /could not be verified/)
        return true
      }
    )

    const list = await admin.get('/api/autonomous-agents/organization/test1')
    const stored = list.data.results.find((a: any) => a.title === 'Empty clientId probe')
    assert.equal(stored, undefined, 'nothing should have been persisted')
    assert.equal(JSON.stringify(list.data).includes('attacker.example'), false)
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
