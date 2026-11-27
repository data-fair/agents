import { $sdUrl } from '~/context'
import { msUntilValid, isReusable } from '~/utils/anonymous-token'

// Kept in localStorage, so the page loads and tabs of a visitor share one token until it nears its expiry
// (see isReusable). The in-memory copy covers a browser where storage is unavailable.
const STORAGE_KEY = 'df-agents-anonymous-action-token'
let cached: string | null = null
let inFlight: Promise<string> | null = null

const readStored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const store = (token: string | null) => {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export async function getAnonymousToken (): Promise<string> {
  const known = cached ?? readStored()
  if (known && isReusable(known)) {
    cached = known
    const wait = msUntilValid(known)
    if (wait) await new Promise(resolve => setTimeout(resolve, wait))
    return known
  }
  cached = null
  if (inFlight) return inFlight
  inFlight = (async () => {
    const res = await fetch(`${$sdUrl}/api/auth/anonymous-action`)
    if (!res.ok) throw new Error(`failed to get anonymous action token: ${res.status}`)
    const token = (await res.text()).trim()
    // Cached as soon as issued, returned once valid: SD issues it with a notBefore delay, and
    // a judged run's first message, sent before it, failed with « not yet valid » — as did the
    // retry, with a new token as young.
    cached = token
    store(token)
    await new Promise(resolve => setTimeout(resolve, msUntilValid(token)))
    return token
  })()
  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

/** Forget the token, for a caller whose token was refused: the next getAnonymousToken fetches a new one. */
export function resetAnonymousToken (): void {
  // Only clear the cached value. An in-flight fetch clears itself in
  // getAnonymousToken's finally block, so nulling it here would risk breaking
  // de-duplication for concurrent callers.
  cached = null
  store(null)
}
