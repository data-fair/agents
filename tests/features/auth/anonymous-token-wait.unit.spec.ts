import { test, expect } from '@playwright/test'
import { msUntilValid, isReusable, REUSE_MARGIN_MS } from '../../../ui/src/utils/anonymous-token.ts'

// simple-directory issues the anonymous action token with a notBefore delay (8s), on purpose.
// A judged portal run's first chat message was sent before it, failed with « anonymous action
// token not yet valid », and the retry fetched a new token, not yet valid either.
const tokenWith = (payload: Record<string, unknown>) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`

test.describe('waiting for an anonymous action token to be valid', () => {
  test('waits until its not-before time, with a margin', () => {
    const now = 1_000_000_000_000
    const wait = msUntilValid(tokenWith({ nbf: now / 1000 + 5 }), now)
    expect(wait).toBeGreaterThanOrEqual(5000)
    expect(wait).toBeLessThan(7000)
  })

  test('does not wait for a token already valid, or without a not-before time', () => {
    const now = 1_000_000_000_000
    expect(msUntilValid(tokenWith({ nbf: now / 1000 - 5 }), now)).toBe(0)
    expect(msUntilValid(tokenWith({ anonymousAction: true }), now)).toBe(0)
    expect(msUntilValid('not a jwt', now)).toBe(0)
  })
})

// The token is valid a day and not single-use, while the endpoint issuing it shares the login routes' rate
// limit (a few calls per minute and per IP): a visitor browsing a portal quickly hit 429s when every page
// load fetched one. A kept token is reused until it nears its expiry.
test.describe('reusing an anonymous action token across page loads', () => {
  const now = 1_000_000_000_000

  test('reuses a token far from its expiry', () => {
    expect(isReusable(tokenWith({ anonymousAction: true, exp: now / 1000 + 86400 }), now)).toBe(true)
  })

  test('renews a token close to its expiry, or expired', () => {
    expect(isReusable(tokenWith({ anonymousAction: true, exp: (now + REUSE_MARGIN_MS) / 1000 - 1 }), now)).toBe(false)
    expect(isReusable(tokenWith({ anonymousAction: true, exp: now / 1000 - 1 }), now)).toBe(false)
  })

  test('renews anything that is not an anonymous action token with an expiry', () => {
    expect(isReusable(tokenWith({ exp: now / 1000 + 86400 }), now)).toBe(false)
    expect(isReusable(tokenWith({ anonymousAction: true }), now)).toBe(false)
    expect(isReusable('not a jwt', now)).toBe(false)
  })
})
