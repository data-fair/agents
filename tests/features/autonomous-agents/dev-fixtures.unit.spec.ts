/**
 * stateless unit tests for the dev NHI fixtures
 *
 * These assert a fixture CAN work, without needing the stack up. Each check corresponds to something
 * simple-directory requires of an NHI — verified in its source — where getting it wrong produces a
 * uniform 401 from the token exchange with no indication of which precondition failed.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SERVICE_PATH_PART, autonomousAgentSubject } from '../../../api/src/nhi/operations.ts'

const users = JSON.parse(readFileSync('dev/resources/users.template.json', 'utf8')) as any[]
const organizations = JSON.parse(readFileSync('dev/resources/organizations.json', 'utf8')) as any[]
const nhiUsers = users.filter(user => user.nhi)

test.describe('dev NHI fixtures', () => {
  test('there is at least one, or every test built on them is silently vacuous', () => {
    assert.ok(nhiUsers.length >= 1)
  })

  test('each has an email', () => {
    // simple-directory's FileStorage.cleanUser does `res.email.toLowerCase()` unguarded, so a
    // fixture without one throws on every read of it — not just on the exchange.
    for (const user of nhiUsers) {
      assert.equal(typeof user.email, 'string', `${user.id} needs an email`)
      assert.ok(user.email.length > 0)
    }
  })

  test('each belongs to exactly one organization', () => {
    // The exchange refuses unless `user.organizations.length === 1`, and FileStorage derives that
    // from organizations.json membership rather than from the user entry.
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
    // THE coupling everything here rests on, and the one nothing pinned: an NHI's subject is fixed in
    // the template, our assertions derive the subject from the agent's id, and simple-directory
    // answers a mismatch with the same uniform 401 as every other misconfiguration. Renaming
    // AUTONOMOUS_AGENT_ID (or editing a subject) therefore broke `npm run dev-fixtures` and the specs
    // at their first tool call with nothing pointing at the cause, while every test still passed —
    // AGENTS.md claimed this file enforced it, and it only checked the SHAPE, deriving the agent id
    // from the subject it was checking.
    //
    // Read from the consumers' source rather than restated, for the same reason the chat driver's
    // selectors are: a copy here would drift with them and prove nothing.
    const subjectOf = (nhiUserId: string) => {
      const user = users.find(u => u.id === nhiUserId)
      assert.ok(user, `no fixture NHI ${nhiUserId} in users.template.json`)
      return user.nhi?.subject
    }

    // 1. dev/fixtures.ts — the pair `npm run dev-fixtures` uses.
    const fixtures = readFileSync('dev/fixtures.ts', 'utf8')
    const devAgentId = fixtures.match(/AUTONOMOUS_AGENT_ID\s*=\s*'([^']+)'/)?.[1]
    const devNhi = fixtures.match(/AUTONOMOUS_AGENT_NHI\s*=\s*'([^']+)'/)?.[1]
    assert.ok(devAgentId && devNhi, 'dev/fixtures.ts must still declare AUTONOMOUS_AGENT_ID and AUTONOMOUS_AGENT_NHI')
    assert.equal(
      subjectOf(devNhi), autonomousAgentSubject(devAgentId),
      `dev/fixtures.ts pairs ${devNhi} with agent id ${devAgentId}, so that NHI's subject must be ${autonomousAgentSubject(devAgentId)}`
    )

    // 2. every spec that creates an agent through the dev seam with a chosen id.
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
        if (!clientId.endsWith('-autonomous-agent-nhi')) continue
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

  test('the template hardcodes no port, so a checkout cannot silently use the wrong one', () => {
    // dev/init-env.sh randomises every port, so a literal one would be correct in exactly one
    // checkout and wrong everywhere else, including CI.
    for (const user of nhiUsers) {
      assert.doesNotMatch(user.nhi.provider.issuer, /:\d{4,5}\b/, `${user.id} should use {NGINX_PORT}, not a literal port`)
      assert.match(user.nhi.provider.issuer, /\{NGINX_PORT\}/)
    }
  })

  test('the fixtures the tests and the dev seeds use are distinct', () => {
    // clean() wipes owner.id /^test/ only, so dev fixtures must not share an identity with test
    // ones or a suite run would invalidate what a human was reviewing.
    const subjects = nhiUsers.map(user => user.nhi.subject)
    assert.equal(new Set(subjects).size, subjects.length, 'two fixtures share a subject')
  })
})
