/**
 * stateless unit tests for the NHI registration body the UI sends to simple-directory
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { autonomousAgentNhiBody, autonomousAgentSubject } from '@agents/shared/autonomous-agent-identity'
import { enrolmentErrorMessage } from '../../../ui/src/utils/autonomous-agent-enrolment-error.ts'

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
