/** Margin for the clocks of the browser and of simple-directory not being exactly in step. */
export const NOT_BEFORE_MARGIN_MS = 1000

/**
 * How long before an anonymous action token is accepted. simple-directory issues it with a
 * notBefore delay on purpose (anti-bot): used earlier, it is refused as « not yet valid ».
 */
export function msUntilValid (token: string, now: number = Date.now()): number {
  const payload = readPayload(token)
  if (typeof payload?.nbf !== 'number') return 0
  return Math.max(0, payload.nbf * 1000 + NOT_BEFORE_MARGIN_MS - now)
}

/**
 * How long before expiry a token stops being reused. A thread started with it lives as long as its socket,
 * but the summary and usage calls present the token again later: an hour leaves room for both.
 */
export const REUSE_MARGIN_MS = 60 * 60 * 1000

/**
 * Whether a token can still be presented, so a new page load reuses it instead of asking simple-directory
 * for another one. The token is reusable by design (valid a day, not single-use), and the endpoint that
 * issues it shares a rate limit of a few calls per minute and per IP with the login routes: fetching one
 * per page load made a visitor browsing a portal quickly hit 429s.
 */
export function isReusable (token: string, now: number = Date.now()): boolean {
  const payload = readPayload(token)
  if (payload?.anonymousAction !== true || typeof payload.exp !== 'number') return false
  return payload.exp * 1000 - REUSE_MARGIN_MS > now
}

function readPayload (token: string): Record<string, any> | undefined {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return undefined
  }
}
