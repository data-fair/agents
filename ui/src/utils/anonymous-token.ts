/** Margin for the clocks of the browser and of simple-directory not being exactly in step. */
export const NOT_BEFORE_MARGIN_MS = 1000

/**
 * How long before an anonymous action token is accepted. simple-directory issues it with a
 * notBefore delay on purpose (anti-bot): used earlier, it is refused as « not yet valid ».
 */
export function msUntilValid (token: string, now: number = Date.now()): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.nbf !== 'number') return 0
    return Math.max(0, payload.nbf * 1000 + NOT_BEFORE_MARGIN_MS - now)
  } catch {
    return 0
  }
}
