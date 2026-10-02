/**
 * stateless unit tests for reading trace consent off a Cookie header.
 *
 * This is a consent gate, so the failure that matters is it returning true when it should not. The
 * gateway asked the question as an `x-trace-consent` header per request; the server-held loop reads
 * the same cookie off the websocket upgrade. Same question, same answer, different transport — and a
 * parser that is loose about what counts as "yes" is how a gate stops gating.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { hasTraceConsent, CONSENT_COOKIE, CONSENT_YES } from '@agents/shared/trace-consent'

test.describe('hasTraceConsent', () => {
  test('an explicit yes is consent', () => {
    assert.equal(hasTraceConsent(`${CONSENT_COOKIE}=${CONSENT_YES}`), true)
  })

  test('it is found among other cookies, whatever the position or spacing', () => {
    assert.equal(hasTraceConsent(`sid=abc; ${CONSENT_COOKIE}=yes; other=1`), true)
    assert.equal(hasTraceConsent(`${CONSENT_COOKIE}=yes;sid=abc`), true)
    assert.equal(hasTraceConsent(`sid=abc;   ${CONSENT_COOKIE}=yes`), true)
  })

  test('an explicit NO is not consent', () => {
    // The one that a truthy check would get wrong: "no" is a non-empty string.
    assert.equal(hasTraceConsent(`${CONSENT_COOKIE}=no`), false)
  })

  test('absent, empty and unparseable all mean no', () => {
    // The right default for a question nobody answered.
    assert.equal(hasTraceConsent(undefined), false)
    assert.equal(hasTraceConsent(''), false)
    assert.equal(hasTraceConsent('sid=abc'), false)
    assert.equal(hasTraceConsent(`${CONSENT_COOKIE}=`), false)
    assert.equal(hasTraceConsent(`${CONSENT_COOKIE}=%E0%A4%A`), false, 'a malformed escape is not consent')
  })

  test('a cookie whose NAME merely contains the consent name does not count', () => {
    // `agent-chat-trace-consent-pending=yes` is a different cookie and must not answer for this one.
    assert.equal(hasTraceConsent(`${CONSENT_COOKIE}-pending=yes`), false)
    assert.equal(hasTraceConsent(`x-${CONSENT_COOKIE}=yes`), false)
  })

  test('a value that merely contains yes does not count', () => {
    assert.equal(hasTraceConsent(`${CONSENT_COOKIE}=yesterday`), false)
    assert.equal(hasTraceConsent(`${CONSENT_COOKIE}=maybe-yes`), false)
  })
})
