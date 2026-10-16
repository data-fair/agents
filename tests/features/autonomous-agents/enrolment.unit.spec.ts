/**
 * stateless unit tests for the NHI registration body the UI sends to simple-directory
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { autonomousAgentNhiBody, autonomousAgentNhiName, autonomousAgentSubject, identityPatch } from '@agents/shared/autonomous-agent-identity'
import { enrolmentErrorMessage } from '../../../ui/src/utils/autonomous-agent-enrolment-error.ts'
import { buildNhi } from '../../../api/src/autonomous-agents/operations.ts'

const issuer = 'https://example.test/agents/api/nhi'

test.describe('autonomousAgentNhiBody', () => {
  test('binds the identity to the agent through the subject', () => {
    // The one value that must match exactly: simple-directory pins it per identity and the server
    // signs assertions with it.
    const body = autonomousAgentNhiBody({ agentId: 'abc123', title: 'Support triage', issuer })
    assert.equal(body.subject, autonomousAgentSubject('abc123'))
    assert.equal(body.subject, 'autonomous-agent:abc123')
  })

  test('passes the issuer through untouched, never rebuilding it', () => {
    // The caller reads it from this service's own discovery document, which is what the server will
    // declare when it signs. Deriving it here from a browser location would be a second source of
    // truth able to drift from the one that matters.
    assert.deepEqual(autonomousAgentNhiBody({ agentId: 'a', title: 't', issuer }).provider, { issuer })
  })

  test('defaults to the least privilege simple-directory will accept', () => {
    // An org with no custom roles has only ['admin', 'user'], so 'contrib' would be rejected with a
    // 400 — and 'user' is the least an agent can hold anyway.
    assert.equal(autonomousAgentNhiBody({ agentId: 'a', title: 't', issuer }).role, 'user')
  })

  test('an explicit role overrides the default', () => {
    assert.equal(autonomousAgentNhiBody({ agentId: 'a', title: 't', issuer, role: 'admin' }).role, 'admin')
  })

  test('names the identity so it is recognisable in simple-directory own list', () => {
    const body = autonomousAgentNhiBody({ agentId: 'abc123', title: 'Support triage', issuer })
    assert.match(body.name, /Support triage/)
    assert.match(body.name, /autonomous agent/i)
  })

  test('carries no inline jwks, so key rotation needs no re-enrolment', () => {
    assert.equal('jwks' in autonomousAgentNhiBody({ agentId: 'a', title: 't', issuer }).provider, false)
  })

  test('sends nothing simple-directory would reject as an unknown property', () => {
    // Its post-req schema is strict; an extra key is a 400 the admin would see as an unexplained
    // enrolment failure.
    assert.deepEqual(
      Object.keys(autonomousAgentNhiBody({ agentId: 'a', title: 't', issuer })).sort(),
      ['name', 'provider', 'role', 'subject']
    )
  })
})

test.describe('enrolmentErrorMessage', () => {
  // The dialog renders this behind `v-if`, so an EMPTY result is indistinguishable from a button that
  // silently did nothing — the exact failure the error reporting exists to rule out.
  test('never returns an empty string, whatever the error carries', () => {
    for (const err of [
      {},
      { data: '' },
      { data: '', status: 500 },
      { data: {} },
      { data: { message: '' } },
      { message: '' },
      { message: '   ' },
      null,
      undefined,
      'a string that is not an error object'
    ]) {
      const message = enrolmentErrorMessage(err)
      assert.equal(typeof message, 'string')
      assert.ok(message.trim().length > 0, `empty message for ${JSON.stringify(err)}`)
    }
  })

  test("an empty body falls through to the error's own message rather than blanking it", () => {
    // This is the regression: simple-directory answers the file-storage NHI creation with a 500 whose
    // body yields `data: ''`, and `err.data?.message ?? err.data ?? err.message` returns that empty
    // string — `??` only skips null/undefined. The dialog then showed nothing at all.
    const message = enrolmentErrorMessage({
      data: '',
      status: 500,
      message: '[POST] "/simple-directory/api/organizations/test1/nhis": 500 Internal Server Error'
    })
    assert.match(message, /500 Internal Server Error/)
  })

  test('prefers what the directory actually said', () => {
    assert.match(enrolmentErrorMessage({ data: { message: 'nhi already exists' }, status: 409 }), /nhi already exists/)
    assert.match(enrolmentErrorMessage({ data: 'Method not implemented.', status: 500 }), /Method not implemented/)
  })

  test('reports the status when there is nothing else to say', () => {
    assert.match(enrolmentErrorMessage({ status: 403 }), /403/)
  })
})

test.describe('buildNhi', () => {
  const capture = () => ({ siteUrl: 'https://portal.example.org', issuer: 'https://portal.example.org/agents/api/nhi' })
  const existing = { clientId: 'nhi-1', siteUrl: 'https://admin.example.org', issuer: 'https://admin.example.org/agents/api/nhi' }

  test('no client id, no identity', () => {
    assert.equal(buildNhi(undefined, existing, capture), undefined)
    assert.equal(buildNhi('', existing, capture), undefined)
  })
  test('a first enrolment captures the site it is saved from', () => {
    assert.deepEqual(buildNhi('nhi-1', undefined, capture), { clientId: 'nhi-1', ...capture() })
  })
  test('a save from another host keeps the captured site', () => {
    assert.deepEqual(buildNhi('nhi-1', existing, () => { throw new Error('must not capture') }), existing)
  })
  test('a new client id is a new enrolment', () => {
    assert.deepEqual(buildNhi('nhi-2', existing, capture), { clientId: 'nhi-2', ...capture() })
  })
  test('an existing identity missing its capture is captured now', () => {
    assert.deepEqual(buildNhi('nhi-1', { clientId: 'nhi-1' }, capture), { clientId: 'nhi-1', ...capture() })
  })
})

test.describe('identityPatch', () => {
  test('is null when neither the title nor the role changed', () => {
    assert.equal(identityPatch({ title: 'A', role: 'user' }, { title: 'A', role: 'user' }), null)
  })

  test('a title change renames the identity', () => {
    assert.deepEqual(identityPatch({ title: 'A', role: 'user' }, { title: 'B', role: 'user' }), { name: 'B (autonomous agent)' })
  })

  test('a role change carries the role only', () => {
    assert.deepEqual(identityPatch({ title: 'A', role: 'user' }, { title: 'A', role: 'admin' }), { role: 'admin' })
  })

  test('an undefined role counts as user', () => {
    assert.equal(identityPatch({ title: 'A' }, { title: 'A', role: 'user' }), null)
  })

  test('the registration body and the rename use the same name', () => {
    const body = autonomousAgentNhiBody({ agentId: 'a', title: 'Support', issuer, role: undefined })
    assert.equal(body.name, autonomousAgentNhiName('Support'))
  })
})
