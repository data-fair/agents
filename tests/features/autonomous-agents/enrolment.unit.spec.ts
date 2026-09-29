/**
 * stateless unit tests for the NHI registration body the UI sends to simple-directory
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { autonomousAgentNhiBody, autonomousAgentSubject } from '@agents/shared/autonomous-agent-identity'

const issuer = 'https://example.test/agents/api/nhi'

test.describe('autonomousAgentNhiBody', () => {
  test('binds the identity to the agent through the subject', () => {
    // The one value that must match exactly: simple-directory pins it per identity and the server
    // signs assertions with it.
    const body = autonomousAgentNhiBody({ autonomousAgentId: 'abc123', title: 'Support triage', issuer })
    assert.equal(body.subject, autonomousAgentSubject('abc123'))
    assert.equal(body.subject, 'autonomous-agent:abc123')
  })

  test('passes the issuer through untouched, never rebuilding it', () => {
    // The caller reads it from this service's own discovery document, which is what the server will
    // declare when it signs. Deriving it here from a browser location would be a second source of
    // truth able to drift from the one that matters.
    assert.deepEqual(autonomousAgentNhiBody({ autonomousAgentId: 'a', title: 't', issuer }).provider, { issuer })
  })

  test('defaults to the least privilege simple-directory will accept', () => {
    // An org with no custom roles has only ['admin', 'user'], so 'contrib' would be rejected with a
    // 400 — and 'user' is the least an agent can hold anyway.
    assert.equal(autonomousAgentNhiBody({ autonomousAgentId: 'a', title: 't', issuer }).role, 'user')
  })

  test('an explicit role overrides the default', () => {
    assert.equal(autonomousAgentNhiBody({ autonomousAgentId: 'a', title: 't', issuer, role: 'admin' }).role, 'admin')
  })

  test('names the identity so it is recognisable in simple-directory own list', () => {
    const body = autonomousAgentNhiBody({ autonomousAgentId: 'abc123', title: 'Support triage', issuer })
    assert.match(body.name, /Support triage/)
    assert.match(body.name, /autonomous agent/i)
  })

  test('carries no inline jwks, so key rotation needs no re-enrolment', () => {
    assert.equal('jwks' in autonomousAgentNhiBody({ autonomousAgentId: 'a', title: 't', issuer }).provider, false)
  })

  test('sends nothing simple-directory would reject as an unknown property', () => {
    // Its post-req schema is strict; an extra key is a 400 the admin would see as an unexplained
    // enrolment failure.
    assert.deepEqual(
      Object.keys(autonomousAgentNhiBody({ autonomousAgentId: 'a', title: 't', issuer })).sort(),
      ['name', 'provider', 'role', 'subject']
    )
  })
})
