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

  test('each declares this service as its issuer', () => {
    // `provider` is what verifyAssertion resolves the signing keys from, via OIDC discovery against
    // our own /.well-known/openid-configuration.
    for (const user of nhiUsers) {
      assert.ok(
        user.nhi.provider.endsWith(`/${SERVICE_PATH_PART}/api/nhi`),
        `${user.id} issuer should end with /${SERVICE_PATH_PART}/api/nhi, got ${user.nhi.provider}`
      )
    }
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
      assert.doesNotMatch(user.nhi.provider, /:\d{4,5}\b/, `${user.id} should use {NGINX_PORT}, not a literal port`)
      assert.match(user.nhi.provider, /\{NGINX_PORT\}/)
    }
  })

  test('the fixtures the tests and the dev seeds use are distinct', () => {
    // clean() wipes owner.id /^test/ only, so dev fixtures must not share an identity with test
    // ones or a suite run would invalidate what a human was reviewing.
    const subjects = nhiUsers.map(user => user.nhi.subject)
    assert.equal(new Set(subjects).size, subjects.length, 'two fixtures share a subject')
  })
})
