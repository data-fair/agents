/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other
 * operations.ts — or a module of `shared/`, which is pure by the same rule and exists so the ui and
 * the api cannot hold two copies of a value they must agree on (see the re-export at the bottom).
 */

import crypto from 'node:crypto'

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
 * at a cost bounded by the assertion never being exposed.
 */
export const ASSERTION_TTL_SECONDS = 300

/**
 * The session an agent obtains must be able to outlive a whole turn.
 *
 * A turn acquires the session once and the MCP transport holds that cookie for the entire tool chain,
 * so if the assertion TTL is shorter than the run timeout then even a FRESHLY minted session expires
 * mid-turn and every later tool call comes back 401. The cache's headroom check cannot save that case —
 * there is no session long enough to satisfy it — so this has to be refused at boot rather than
 * discovered as intermittent tool failures in production.
 */
export function assertSessionOutlivesRun (assertionTtlSeconds: number, runTimeoutSeconds: number): void {
  if (assertionTtlSeconds < runTimeoutSeconds) {
    throw new Error(
      `invalid NHI config: the assertion TTL (${assertionTtlSeconds}s) is shorter than the autonomous ` +
      `agent run timeout (${runTimeoutSeconds}s), so an agent's session would expire mid-turn and its ` +
      'tool calls would start failing with 401. Raise the TTL or lower the run timeout.'
    )
  }
}

/**
 * Fail-fast boot validation, mirroring assertGlobalAiConfig/assertGlobalMcpConfig.
 *
 * The whole NHI feature is optional: a deployment with no signing key simply does not
 * serve the issuer routes and refuses to mint assertions. The issuer identifier is no
 * longer config — it is captured per-request from the proxied request that enrols an
 * autonomous agent (reqSiteUrl) — so this only validates the key shape itself.
 */
export function assertNhiConfig (signingKey: unknown): void {
  if (signingKey === undefined || signingKey === null) return

  if (typeof signingKey !== 'object' || Array.isArray(signingKey)) {
    throw new Error('invalid NHI config: NHI_SIGNING_KEY must be a JSON object (an ES256 private JWK)')
  }
  const key = signingKey as Partial<NhiPrivateJwk>

  if (key.kty !== 'EC') throw new Error('invalid NHI config: NHI_SIGNING_KEY must be an EC key (kty "EC")')
  if (key.crv !== 'P-256') throw new Error('invalid NHI config: NHI_SIGNING_KEY must use curve P-256 (ES256)')
  if (!key.d) throw new Error('invalid NHI config: NHI_SIGNING_KEY must be the private key (missing "d")')
  if (!key.x || !key.y) throw new Error('invalid NHI config: NHI_SIGNING_KEY is missing its public coordinates')
  // Rotation works by publishing a new kid alongside the old one and letting
  // simple-directory's createRemoteJWKSet refetch on an unknown kid. Without a kid
  // there is nothing for it to key on.
  if (!key.kid) throw new Error('invalid NHI config: NHI_SIGNING_KEY must carry a "kid"')
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
  const url = new URL(siteUrl)
  return {
    'content-type': 'application/json',
    'x-forwarded-for': DECLARED_CLIENT_IP,
    'x-forwarded-host': url.host,
    'x-forwarded-proto': url.protocol.replace(':', '')
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
  return new Error(`nhi token exchange failed: ${message}`)
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
 * Does this cached session need replacing before it is used for `minRemainingMs` of work?
 *
 * The question is whether the session outlives the WORK, not whether it is past some fraction of its
 * own lifetime. It used to refresh at 80% of the assertion TTL, which reused a session with as little as
 * 60s left — while a turn may legitimately run for the whole run timeout (300s). That matters because
 * the MCP transport is constructed once per turn with the cookie fixed in its headers and held open for
 * the duration: nothing refreshes a credential mid-chain, so every tool call after expiry comes back
 * 401 and the model reports it as a tool failure.
 *
 * Refreshing on the boundary rather than after it keeps equality off the knife edge.
 */
export function shouldRefreshSession (expiresAtMs: number, nowMs: number, minRemainingMs: number): boolean {
  return expiresAtMs - nowMs <= minRemainingMs
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
