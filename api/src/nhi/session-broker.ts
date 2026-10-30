/**
 * How the service spends simple-directory's exchange budget.
 *
 * simple-directory counts every NHI exchange against `authRateLimit` (5 attempts a minute) per caller IP AND per
 * client id; a success gives its point back when it ends, a failure keeps it. Every agent's exchange comes
 * from this service, under one address, so all agents of all organizations share that IP budget: exchanges in
 * flight and recent failures alike. Hence, per process:
 *
 * - a session is REUSED, across turns, until it needs renewing (`sessionNeedsRenewal`): it lives no longer than
 *   before, it is only asked for less often — at most once per agent and site every few minutes, rather than
 *   once per turn and site;
 * - concurrent asks for one session share one exchange, and at most `maxInFlight` exchanges run at once, the
 *   rest queued: planned tasks on the same schedule, or one admin page's parallel reads, no longer go over the
 *   budget together;
 * - a request simple-directory REJECTED is not asked again for `rejectionMs`: the failure is answered from here,
 *   with its reason. An identity failure (`invalid_grant`, 401, 403: the NHI deleted, its client id changed, the
 *   agent left its organization) backs off the identity on every site; any other refusal (`invalid_target`: a site
 *   outside the issuer's realm, a 404: no token endpoint) backs off that site alone — one refused portal must not
 *   take the home site down. (simple-directory also answers `invalid_grant` for a site its NHI's organization does
 *   not own; the agent only asks for sites listed as its organization's, so that is an identity failure here too);
 * - a 429 waits and retries instead of failing the turn.
 *
 * `forget` (the agent saved or deleted) drops an agent's sessions and its back-off. Pure of config and
 * mongo, so it is unit tested with a fake exchange (tests/features/autonomous-agents/nhi-session-broker.unit.spec.ts).
 */

import { sessionNeedsRenewal } from './operations.ts'

export interface SessionKey { agentId: string, clientId: string, site: string }

/** What an exchange obtained: the credential, and how long simple-directory says it lives. */
export interface IssuedSession { value: string, ttlSeconds: number }

export interface SessionBrokerOptions {
  maxInFlight?: number
  rejectionMs?: number
  /** Retries of an exchange answered 429, waiting `retryDelayMs` × the attempt number before each. */
  maxRetries?: number
  retryDelayMs?: number
  now?: () => number
  wait?: (ms: number) => Promise<void>
}

/** simple-directory's status for a failed exchange (sanitizeExchangeError); absent when it never answered. */
const statusOf = (err: unknown) => (err as { exchangeStatus?: unknown } | undefined)?.exchangeStatus
/**
 * What a failed exchange says about the future: `identity`, refused whatever the site; `site`, refused on that site;
 * undefined, not a refusal (the directory down, a 429): not remembered.
 */
export function rejectionScope (err: unknown): 'identity' | 'site' | undefined {
  const status = statusOf(err)
  if (status === 401 || status === 403) return 'identity'
  if (status === 400) return (err as { exchangeError?: unknown }).exchangeError === 'invalid_grant' ? 'identity' : 'site'
  if (status === 404) return 'site'
  return undefined
}

export const createSessionBroker = (opts: SessionBrokerOptions = {}) => {
  const maxInFlight = opts.maxInFlight ?? 2
  const rejectionMs = opts.rejectionMs ?? 5 * 60_000
  const maxRetries = opts.maxRetries ?? 3
  const retryDelayMs = opts.retryDelayMs ?? 2_000
  const now = opts.now ?? Date.now
  const wait = opts.wait ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms).unref()))

  // ttlSeconds is the token's own lifetime once it is known; a pending one renews on the default.
  const sessions = new Map<string, { value: Promise<string>, obtainedAt: number, ttlSeconds?: number }>()
  const rejections = new Map<string, { until: number, message: string, status: unknown, error?: unknown }>()

  // The gate: a slot per exchange in flight, waiters served in order.
  let inFlight = 0
  const waiting: (() => void)[] = []
  const gated = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (inFlight >= maxInFlight) await new Promise<void>(resolve => waiting.push(resolve))
    else inFlight++
    try {
      return await fn()
    } finally {
      const next = waiting.shift()
      if (next) next()
      else inFlight--
    }
  }

  const sessionId = (key: SessionKey) => `${key.agentId}\n${key.clientId}\n${key.site}`
  const identityId = (key: SessionKey) => `${key.agentId}\n${key.clientId}`

  const exchangeWithRetries = async (exchange: () => Promise<IssuedSession>): Promise<IssuedSession> => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await gated(exchange)
      } catch (err) {
        // Waited for outside the gate: a slot is not held while nothing is asked.
        if (statusOf(err) !== 429 || attempt >= maxRetries) throw err
        await wait(retryDelayMs * (attempt + 1))
      }
    }
  }

  return {
    session (key: SessionKey, exchange: () => Promise<IssuedSession>): Promise<string> {
      const id = sessionId(key)
      const rejection = [rejections.get(identityId(key)), rejections.get(id)].find(r => r && now() < r.until)
      if (rejection) {
        return Promise.reject(Object.assign(
          new Error(`${rejection.message} (not asked again before ${new Date(rejection.until).toISOString()})`),
          { exchangeStatus: rejection.status, ...(rejection.error ? { exchangeError: rejection.error } : {}) }
        ))
      }
      const held = sessions.get(id)
      if (held && !sessionNeedsRenewal(held.obtainedAt, now(), held.ttlSeconds)) return held.value
      // Timed from BEFORE the exchange, so the renewal point errs early.
      const entry: { value: Promise<string>, obtainedAt: number, ttlSeconds?: number } = { value: Promise.resolve(''), obtainedAt: now() }
      entry.value = exchangeWithRetries(exchange).then(issued => { entry.ttlSeconds = issued.ttlSeconds; return issued.value })
      sessions.set(id, entry)
      entry.value.catch(err => {
        if (sessions.get(id) === entry) sessions.delete(id)
        const scope = rejectionScope(err)
        if (scope) rejections.set(scope === 'identity' ? identityId(key) : id, { until: now() + rejectionMs, message: err instanceof Error ? err.message : String(err), status: statusOf(err), error: (err as { exchangeError?: unknown }).exchangeError })
      })
      return entry.value
    },

    forget (agentId: string) {
      for (const id of [...sessions.keys()]) if (id.startsWith(`${agentId}\n`)) sessions.delete(id)
      for (const id of [...rejections.keys()]) if (id.startsWith(`${agentId}\n`)) rejections.delete(id)
    }
  }
}
