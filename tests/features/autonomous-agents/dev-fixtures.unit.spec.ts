/**
 * stateless unit tests for the NHI fixtures of the test accounts (tests/support/sd-fixtures.ts)
 *
 * These assert a fixture CAN work, without needing the stack up. Each check corresponds to something
 * simple-directory requires of an NHI — verified in its source — where getting it wrong produces a
 * uniform 401 from the token exchange with no indication of which precondition failed.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SERVICE_PATH_PART, autonomousAgentSubject } from '../../../api/src/nhi/operations.ts'
import { sdFixtures } from '../../support/sd-fixtures.ts'

const { users, organizations } = sdFixtures({ DEV_HOST: 'localhost', NGINX_PORT: '5700' }) as { users: any[], organizations: any[] }
const nhiUsers = users.filter(user => user.nhi)

test.describe('dev NHI fixtures', () => {
  test('there is at least one, or every test built on them is silently vacuous', () => {
    assert.ok(nhiUsers.length >= 1)
  })

  test('each has an email', () => {
    // simple-directory lowercases it unguarded, so a fixture without one throws on every read of
    // it — not just on the exchange — and its test seed refuses an email out of the sub-space.
    for (const user of nhiUsers) {
      assert.equal(typeof user.email, 'string', `${user.id} needs an email`)
      assert.ok(user.email.length > 0)
    }
  })

  test('each belongs to exactly one organization', () => {
    // The exchange refuses unless `user.organizations.length === 1`, and the test seed derives that
    // from the organizations' members rather than from the user entry.
    for (const user of nhiUsers) {
      const orgs = organizations.filter(org => org.members.some((m: any) => m.id === user.id))
      assert.equal(orgs.length, 1, `${user.id} is in ${orgs.length} organizations, needs exactly 1`)
    }
  })

  test('each declares its provider as an OBJECT carrying an issuer', () => {
    // simple-directory types it as `{ issuer: string, jwks?: any }` and calls assertSafeIssuer on
    // `provider.issuer`. A bare string makes `new URL(undefined)` throw, which surfaces as the
    // exchange's uniform 401 with 'invalid issuer url' visible only in simple-directory's own log.
    for (const user of nhiUsers) {
      assert.equal(typeof user.nhi.provider, 'object', `${user.id} provider must be an object, not a string`)
      assert.equal(typeof user.nhi.provider.issuer, 'string')
    }
  })

  test('each declares this service as its issuer', () => {
    // The issuer is what verifyAssertion resolves the signing keys from, via OIDC discovery against
    // our own /.well-known/openid-configuration.
    for (const user of nhiUsers) {
      assert.ok(
        user.nhi.provider.issuer.endsWith(`/${SERVICE_PATH_PART}/api/nhi`),
        `${user.id} issuer should end with /${SERVICE_PATH_PART}/api/nhi, got ${user.nhi.provider.issuer}`
      )
    }
  })

  test('no fixture pins an inline jwks, so key rotation needs no re-enrolment', () => {
    // Discovery is deliberate: an inline jwks would freeze the keys at fixture-authoring time.
    for (const user of nhiUsers) {
      assert.equal('jwks' in user.nhi.provider, false, `${user.id} should rely on discovery`)
    }
  })

  test('every consumer pairs an NHI with the agent id that NHI\'s subject pins', () => {
    // THE coupling everything here rests on: an NHI's subject is fixed in the fixtures, our assertions
    // derive the subject from the agent's id, and simple-directory answers a mismatch with the same
    // uniform 401 as every other misconfiguration. Renaming an agent id (or editing a subject) would
    // break the specs at their first tool call with nothing pointing at the cause.
    //
    // Read from the consumers' source rather than restated, for the same reason the chat driver's
    // selectors are: a copy here would drift with them and prove nothing. (dev/fixtures.ts is not a
    // consumer: it enrols its agent's identity with the subject derived from the agent id.)
    const subjectOf = (nhiUserId: string) => {
      const user = users.find(u => u.id === nhiUserId)
      assert.ok(user, `no fixture NHI ${nhiUserId} in tests/support/sd-fixtures.ts`)
      return user.nhi?.subject
    }

    // every spec that creates an agent through the dev seam with a chosen id.
    const specs = [
      'tests/features/autonomous-agents/mcp-tools.api.spec.ts',
      'tests/features/autonomous-agents/nhi-exchange.api.spec.ts',
      'tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts'
    ]
    let checked = 0
    for (const spec of specs) {
      const source = readFileSync(spec, 'utf8')
      assert.match(source, /test-env\/autonomous-agent/, `${spec} no longer calls the seam — update this list`)
      // Each seam call names both, within a few lines of each other.
      for (const call of source.matchAll(/id:\s*'([^']+)'[\s\S]{0,400}?clientId:\s*'([^']+)'/g)) {
        const [, agentId, clientId] = call
        if (!clientId.endsWith('_nhi')) continue
        assert.equal(
          subjectOf(clientId), autonomousAgentSubject(agentId),
          `${spec} pairs ${clientId} with agent id ${agentId}, so that NHI's subject must be ${autonomousAgentSubject(agentId)}`
        )
        checked++
      }
    }
    assert.ok(checked >= specs.length, `expected a seam pairing in each of ${specs.length} specs, found ${checked}`)
  })

  test('each subject has the shape our assertions actually sign', () => {
    // The subject is pinned per NHI and ours is strictly derived from the agent id, so a fixture
    // whose subject does not follow that shape can never be matched by any agent.
    for (const user of nhiUsers) {
      const agentId = user.nhi.subject.slice(autonomousAgentSubject('').length)
      assert.ok(agentId.length > 0, `${user.id} subject carries no agent id`)
      assert.equal(user.nhi.subject, autonomousAgentSubject(agentId))
    }
  })

  test('no fixture pins an address', () => {
    // Every autonomous agent shares one egress address and the exchange declares 127.0.0.1, so
    // allowedIps/ipBinding would refuse it — or worse, appear to work and then fail elsewhere.
    for (const user of nhiUsers) {
      assert.equal('allowedIps' in user.nhi, false, `${user.id} must not pin allowedIps`)
      assert.equal('ipBinding' in user.nhi, false, `${user.id} must not pin ipBinding`)
    }
  })

  test('the issuer follows the environment, so a checkout cannot silently use the wrong port', () => {
    // a literal port would be correct in exactly one environment and wrong everywhere else
    for (const user of sdFixtures({ DEV_HOST: 'dev.example', NGINX_PORT: '1234' }).users.filter((u: any) => u.nhi) as any[]) {
      assert.equal(user.nhi.provider.issuer, `http://dev.example:1234/${SERVICE_PATH_PART}/api/nhi`)
    }
  })

  test('the identities the tests and the dev fixtures use are distinct', () => {
    // clean() wipes the test sub-space only, so the dev fixtures' agent must not share an identity
    // with the test ones or a suite run would invalidate what a human was reviewing.
    const subjects = nhiUsers.map(user => user.nhi.subject)
    assert.equal(new Set(subjects).size, subjects.length, 'two fixtures share a subject')
    const devAgentId = readFileSync('dev/fixtures.ts', 'utf8').match(/AUTONOMOUS_AGENT_ID\s*=\s*'([^']+)'/)?.[1]
    assert.ok(devAgentId, 'dev/fixtures.ts must still declare AUTONOMOUS_AGENT_ID')
    assert.ok(!subjects.includes(autonomousAgentSubject(devAgentId)), 'the dev agent shares a subject with a test fixture')
  })
})

test.describe('the dev fixtures script', () => {
  test('loads: a script nothing type-checks must at least parse', async () => {
    // dev/ is outside every tsconfig, so the script broke silently once — two top-level `conversations`
    // after a merge — and stayed broken until someone ran it. Importing it is enough to catch that: it
    // only seeds when run directly, so the import has no side effects.
    const fixtures = await import('../../../dev/fixtures.ts')
    assert.equal(typeof fixtures.seedConsumption, 'function')
  })
})
