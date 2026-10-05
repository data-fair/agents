import { test, expect } from '@playwright/test'
import { msUntilValid } from '../../../ui/src/utils/anonymous-token.ts'

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
