/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other
 * operations.ts — or a module of `shared/`, which is pure by the same rule and exists so the ui and
 * the api cannot hold two copies of a value they must agree on (see the re-export at the bottom).
 */

import crypto from 'node:crypto'
import { forwardedSiteHeaders } from '../sites/operations.ts'
import type { CipheredContent } from '../cipher/operations.ts'

/** The ES256 private key this deployment signs NHI assertions with. */
export interface NhiPrivateJwk {
  kty: string
  crv: string
  x: string
  y: string
  d: string
  kid: string
  alg?: string
}

/** The same key's public half, as published in the JWKS. */
export interface NhiPublicJwk {
  kty: string
  crv: string
  x: string
  y: string
  kid: string
  alg: string
  use: 'sig'
}

/**
 * Assertion lifetime, and therefore session lifetime (see buildAssertionClaims).
 * nhi-proxy uses 120s because a browser it drives holds the cookie directly; here the
 * cookie never leaves this process, so 300s cuts exchanges ~15x against the 30m cap
 * at a cost bounded by the assertion never being exposed. A turn longer than that renews
 * its sessions (sessionNeedsRenewal): the TTL bounds a credential, not a turn.
 */
export const ASSERTION_TTL_SECONDS = 300

/**
 * How long before its expiry a session is exchanged again. A turn may run longer than a session lives
 * (turnTimeoutSeconds is independent of the assertion TTL), so a site's session is renewed when it gets
 * this close to the end, and every MCP request reads the current one (connectMcpServer). A minute covers
 * a request that starts just before the renewal point and still has to be accepted upstream.
 */
export const SESSION_RENEW_MARGIN_SECONDS = 60

/** Whether a session obtained at `obtainedAt` (ms) must be renewed before use at `now`. */
export function sessionNeedsRenewal (obtainedAt: number, now: number, ttlSeconds = ASSERTION_TTL_SECONDS, marginSeconds = SESSION_RENEW_MARGIN_SECONDS): boolean {
  return now >= obtainedAt + (ttlSeconds - marginSeconds) * 1000
}

/** A signing key, newest first in the list this service keeps (see service.ts). */
export interface NhiKey {
  jwk: NhiPrivateJwk
  createdAt: Date
}

/** A key as stored, its private half ciphered. */
export interface StoredNhiKey { kid: string, jwk: CipheredContent, createdAt: Date }
export interface NhiKeysDocument { _id: string, keys: StoredNhiKey[] }

/** How long a key signs before the next one replaces it. */
export const NHI_KEY_ROTATION_DAYS = 30

/**
 * How long a new key is published before it signs. simple-directory caches our JWKS (jose's
 * createRemoteJWKSet: 10 minutes, and a refetch on an unknown kid at most every 30s), so a key used the
 * moment it is created would be refused for a while; an hour ahead it is already known everywhere.
 */
export const NHI_KEY_PUBLISH_AHEAD_SECONDS = 60 * 60

export function generateNhiKey (now: Date): NhiKey {
  const jwk = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ format: 'jwk' })
  return { jwk: { ...jwk, alg: 'ES256', kid: crypto.randomUUID() } as NhiPrivateJwk, createdAt: now }
}

/**
 * The key that signs at `now`: the newest one published long enough. The only key of a fresh deployment
 * signs at once — no verifier can hold an older copy of a JWKS that never existed.
 */
export function signingNhiKey<K extends { createdAt: Date }> (keys: K[], now: Date): K {
  return keys.find(key => now.getTime() - key.createdAt.getTime() >= NHI_KEY_PUBLISH_AHEAD_SECONDS * 1000) ?? keys[keys.length - 1]
}

export function nhiKeysNeedRotation (keys: { createdAt: Date }[], now: Date): boolean {
  return now.getTime() - keys[0].createdAt.getTime() >= NHI_KEY_ROTATION_DAYS * 24 * 60 * 60 * 1000
}

/**
 * The new key first, then the one that signs until it takes over. Older keys are dropped: past the
 * publication delay nothing signs with them, and an assertion lives minutes (ASSERTION_TTL_SECONDS).
 */
export function rotateNhiKeys<K extends { createdAt: Date }> (keys: K[], newKey: K): K[] {
  return [newKey, keys[0]]
}

/** The JWKS entry. Never returns the private scalar. */
export function toPublicJwk (privateJwk: NhiPrivateJwk): NhiPublicJwk {
  return {
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    x: privateJwk.x,
    y: privateJwk.y,
    kid: privateJwk.kid,
    alg: privateJwk.alg ?? 'ES256',
    use: 'sig'
  }
}

/**
 * This service's public mount segment. Must match createSiteMiddleware('agents') in
 * app.ts — the issuer path and the exchange path are both built from it.
 */
export const SERVICE_PATH_PART = 'agents'

/**
 * The issuer identifier for a captured site url. `siteUrl` is reqOrigin + reqSitePath
 * taken from a real proxied request, so this is a url that demonstrably resolves here.
 */
export function nhiIssuerUrl (siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, '')}/${SERVICE_PATH_PART}/api/nhi`
}

/**
 * Where to POST the exchange. Two constraints, both because simple-directory calls
 * createSiteMiddleware('simple-directory') with NO options:
 *  - the path must contain a `/simple-directory` segment, or the middleware throws
 *    404 'URL path does not contain service prefix' before the route runs;
 *  - the site path prefix must be preserved ahead of it, or simple-directory resolves a
 *    different site (and therefore a different audience).
 * We target the PRIVATE directory url so the call never leaves the internal network.
 */
export function nhiExchangeUrl (privateDirectoryUrl: string, siteUrl: string): string {
  const sitePath = new URL(siteUrl).pathname.replace(/\/+$/, '')
  return `${privateDirectoryUrl.replace(/\/+$/, '')}${sitePath}/simple-directory/api/auth/nhi-token`
}

/**
 * Declared, not real. Its only readers are simple-directory's per-IP rate-limit bucket
 * and its audit log line; every autonomous agent shares one egress address anyway. This
 * is also why allowedIps/ipBinding must never be set on an autonomous agent's NHI.
 */
export const DECLARED_CLIENT_IP = '127.0.0.1'

/**
 * The exchange is server-to-server, so no reverse proxy sets x-forwarded-* and the route
 * needs all three: x-forwarded-for (read before any lookup, so a broken proxy chain
 * rejects every caller identically), x-forwarded-host (resolves the site and, through
 * reqSiteUrl, IS the audience) and x-forwarded-proto (reqOrigin throws without it).
 */
export function exchangeHeaders (siteUrl: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-forwarded-for': DECLARED_CLIENT_IP,
    ...forwardedSiteHeaders(siteUrl)
  }
}

/**
 * Re-exported from the shared home: the UI registers the NHI carrying this subject and the server
 * signs assertions with it, so the two cannot be allowed to drift.
 */
export { autonomousAgentSubject } from '@agents/shared/autonomous-agent-identity'

/**
 * The lib-node axios interceptor attaches the REQUEST BODY to the error it rejects with
 * (`error.response.config.data`, merged onto the thrown AxiosRequestError). The exchange's
 * body carries a live assertion — a short-lived credential that can mint a session — so the
 * raw error must never reach a caller, a log or an error handler. Only the already-scrubbed
 * message survives; `config` and `response` are dropped entirely.
 */
export function sanitizeExchangeError (err: unknown): Error {
  const message = typeof (err as any)?.message === 'string' ? (err as any).message : 'unknown error'
  // simple-directory's status survives (a number, nothing of the request): the session broker tells a rejected
  // identity from a 429 or an outage by it. As `exchangeStatus`, not `status`: it is simple-directory's answer to
  // this service, and as `status` it would become this service's answer to its own caller (a 401 to an admin
  // reads as "you are not signed in").
  const status = (err as any)?.status ?? (err as any)?.response?.status
  const sanitized = new Error(`nhi token exchange failed: ${message}`)
  return typeof status === 'number' ? Object.assign(sanitized, { exchangeStatus: status }) : sanitized
}

/**
 * The assertion's claims. Signature, iss, sub, aud and exp/nbf are all checked by
 * simple-directory in one jwtVerify call, with requiredClaims ['exp', 'sub', 'iat'].
 *
 * ttlSeconds is load-bearing beyond replay risk: the issued session lives
 * min(assertion.exp, now + 30m), so a short ttl shortens the session too.
 */
export function buildAssertionClaims (opts: {
  issuer: string
  subject: string
  audience: string
  ttlSeconds: number
  nowSeconds: number
}): { iss: string, sub: string, aud: string, iat: number, exp: number, jti: string } {
  return {
    iss: opts.issuer,
    sub: opts.subject,
    aud: opts.audience,
    iat: opts.nowSeconds,
    exp: opts.nowSeconds + opts.ttlSeconds,
    jti: crypto.randomUUID()
  }
}

/**
 * simple-directory splits the session JWT across two cookies: `id_token` carries
 * `header.payload` and `id_token_sign` the signature (hence the cookie list in
 * lib-express's unsetCookies). So the claims are the SECOND dot-separated segment of
 * `id_token`, base64url-encoded.
 *
 * Deliberately does NOT verify the signature, and nothing may be authorized on the
 * strength of what it returns: this process just obtained the token from
 * simple-directory itself, and this is a diagnostic read of claims we already hold.
 */
export function decodeSessionClaims (cookieHeader: string): Record<string, any> {
  const pair = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('id_token='))
  if (!pair) throw new Error('no id_token cookie in the session')
  const segments = pair.slice('id_token='.length).split('.')
  if (segments.length < 2) throw new Error('id_token cookie is not a header.payload pair')
  return JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'))
}

/**
 * The scopes a session was granted (its `scope` claim, space-separated), or undefined when it is
 * unrestricted or there is no readable session. Never throws: it describes, it does not authenticate.
 */
export function sessionScopes (cookieHeader: string | undefined): string[] | undefined {
  if (!cookieHeader) return undefined
  try {
    const scope = decodeSessionClaims(cookieHeader).scope
    return typeof scope === 'string' && scope.trim() ? scope.trim().split(/\s+/) : undefined
  } catch {
    return undefined
  }
}
