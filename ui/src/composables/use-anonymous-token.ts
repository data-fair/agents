import { $sdUrl } from '~/context'

// Module-level cache: a single anonymous-action token is reused across the app.
let cached: string | null = null
let inFlight: Promise<string> | null = null

export async function getAnonymousToken (): Promise<string> {
  if (cached) return cached
  if (inFlight) return inFlight
  inFlight = (async () => {
    const res = await fetch(`${$sdUrl}/api/auth/anonymous-action`)
    if (!res.ok) throw new Error(`failed to get anonymous action token: ${res.status}`)
    const token = (await res.text()).trim()
    // Cached as soon as issued. Callers prefetch on init so SD's notBefore window
    // has elapsed by first use; the gateway fetch also refetches once on a 401.
    cached = token
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
