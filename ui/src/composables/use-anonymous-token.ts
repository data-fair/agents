import { $sdUrl } from '~/context'
import { msUntilValid } from '~/utils/anonymous-token'

// Module-level cache: a single anonymous-action token is reused across the app.
let cached: string | null = null
let inFlight: Promise<string> | null = null

export async function getAnonymousToken (): Promise<string> {
  if (cached) {
    const wait = msUntilValid(cached)
    if (wait) await new Promise(resolve => setTimeout(resolve, wait))
    return cached
  }
  if (inFlight) return inFlight
  inFlight = (async () => {
    const res = await fetch(`${$sdUrl}/api/auth/anonymous-action`)
    if (!res.ok) throw new Error(`failed to get anonymous action token: ${res.status}`)
    const token = (await res.text()).trim()
    // Cached as soon as issued, returned once valid: SD issues it with a notBefore delay, and
    // a judged run's first message, sent before it, failed with « not yet valid » — as did the
    // retry, with a new token as young. Callers prefetch on init, so the wait is usually over.
    cached = token
    await new Promise(resolve => setTimeout(resolve, msUntilValid(token)))
    return token
  })()
  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

export function resetAnonymousToken (): void {
  // Only clear the cached value. An in-flight fetch clears itself in
  // getAnonymousToken's finally block, so nulling it here would risk breaking
  // de-duplication for concurrent callers.
  cached = null
}
