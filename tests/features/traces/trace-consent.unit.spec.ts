import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readConsent, serializeConsentCookie, CONSENT_COOKIE } from '../../../ui/src/traces/trace-consent.ts'

test.describe('trace consent (unit)', () => {
  test('reads consent value from a cookie string', () => {
    assert.equal(readConsent(`${CONSENT_COOKIE}=yes; other=1`), 'yes')
    assert.equal(readConsent('other=1'), undefined)
  })
  test('serializes a 1-year cookie', () => {
    const c = serializeConsentCookie('no')
    assert.match(c, new RegExp(`^${CONSENT_COOKIE}=no;`))
    assert.match(c, /Max-Age=31536000/)
    assert.match(c, /SameSite=Lax/)
  })
})
