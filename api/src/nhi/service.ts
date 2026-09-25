/**
 * service.ts contains stateful logic (config, mongo) built on top of operations.ts
 */

import config from '#config'
import { httpError, reqSiteUrl } from '@data-fair/lib-express'
import type { Request } from 'express'
import { SignJWT, importJWK } from 'jose'
import axios from '@data-fair/lib-node/axios.js'
import { toPublicJwk, nhiIssuerUrl, buildAssertionClaims, shouldRefreshSession, autonomousAgentSubject, exchangeHeaders, nhiExchangeUrl, sanitizeExchangeError, type NhiPrivateJwk, type NhiPublicJwk } from './operations.ts'

/** The whole NHI feature is off when no signing key is configured. */
export const nhiEnabled = () => !!config.nhiSigningKey

// 501 rather than 404: the caller asked for a coherent capability this deployment has
// not enabled. Composes off nhiEnabled() so there is a single encoding of "is this
// configured" rather than two independent ones drifting apart.
const requireNhi = (): NhiPrivateJwk => {
  if (!nhiEnabled()) throw httpError(501, 'the autonomous agent non-human-identity feature is not configured on this deployment')
  return config.nhiSigningKey as NhiPrivateJwk
}

export const getNhiSigningKey = (): NhiPrivateJwk => requireNhi()

/**
 * Built from the request rather than config, so the `issuer` we echo is always exactly
 * the url simple-directory fetched — it rejects a discovery document that claims a
 * different issuer, and a config value could drift from reality.
 */
export const getNhiDiscovery = (req: Request): { issuer: string, jwks_uri: string } => {
  requireNhi()
  const issuer = nhiIssuerUrl(reqSiteUrl(req))
  return { issuer, jwks_uri: `${issuer}/jwks` }
}

export const getNhiJwks = (): { keys: NhiPublicJwk[] } => ({ keys: [toPublicJwk(requireNhi())] })

/**
 * Assertion lifetime, and therefore session lifetime (see buildAssertionClaims).
 * nhi-proxy uses 120s because a browser it drives holds the cookie directly; here the
 * cookie never leaves this process, so 300s cuts exchanges ~15x against the 30m cap
 * at a cost bounded by the assertion never being exposed.
 */
export const ASSERTION_TTL_SECONDS = 300

/** The shape the exchange needs off an autonomous agent document. */
export interface EnrolledAutonomousAgent {
  id: string
  nhi?: { clientId: string, siteUrl?: string, issuer?: string }
}

/**
 * An autonomous agent can only be exchanged for a session once all three captured values
 * are present. siteUrl/issuer are written by the write routes from reqSiteUrl(req); an
 * agent enrolled before that capture existed would have clientId alone, so check all three
 * rather than assuming.
 */
const requireEnrolment = (autonomousAgent: EnrolledAutonomousAgent) => {
  const nhi = autonomousAgent.nhi
  if (!nhi?.clientId || !nhi.siteUrl || !nhi.issuer) {
    throw httpError(400, `autonomous agent ${autonomousAgent.id} has no enrolled non-human identity`)
  }
  return { clientId: nhi.clientId, siteUrl: nhi.siteUrl, issuer: nhi.issuer }
}

export const mintAssertion = async (autonomousAgent: EnrolledAutonomousAgent): Promise<string> => {
  const key = getNhiSigningKey()
  const { siteUrl, issuer } = requireEnrolment(autonomousAgent)
  const claims = buildAssertionClaims({
    issuer,
    subject: autonomousAgentSubject(autonomousAgent.id),
    // The audience is the stored site url, which is exactly reqOrigin + reqSitePath as
    // simple-directory recomputes it from the headers and path we send below.
    audience: siteUrl,
    ttlSeconds: ASSERTION_TTL_SECONDS,
    nowSeconds: Math.floor(Date.now() / 1000)
  })
  return await new SignJWT({ jti: claims.jti })
    .setProtectedHeader({ alg: 'ES256', kid: key.kid })
    .setIssuer(claims.iss)
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .setIssuedAt(claims.iat)
    .setExpirationTime(claims.exp)
    .sign(await importJWK(key, 'ES256'))
}

/**
 * Exchange the assertion for a session, over the PRIVATE directory url so the call never
 * leaves the internal network. We keep the Set-Cookie pairs rather than the returned
 * access_token because @data-fair/lib-express reads sessions from the id_token /
 * id_token_sign COOKIES only and parses no Authorization header — the same reason
 * nhi-proxy relays Set-Cookie to its client.
 */
export const exchangeForSession = async (autonomousAgent: EnrolledAutonomousAgent): Promise<{ cookieHeader: string, expiresAtMs: number }> => {
  const { clientId, siteUrl } = requireEnrolment(autonomousAgent)
  const assertion = await mintAssertion(autonomousAgent)
  let res
  try {
    res = await axios.post(
      nhiExchangeUrl(config.privateDirectoryUrl, siteUrl),
      { client_id: clientId, assertion },
      { headers: exchangeHeaders(siteUrl), maxRedirects: 0 }
    )
  } catch (err) {
    // lib-node's axios interceptor attaches the request body (which carries the
    // assertion) to the rejected error — see sanitizeExchangeError. Never let the raw
    // error escape this call.
    throw sanitizeExchangeError(err)
  }
  const setCookies: string[] = res.headers['set-cookie'] ?? []
  // keep only name=value, dropping attributes (Path, HttpOnly, …) — a Cookie request
  // header carries pairs only
  const pairs = setCookies.map(c => c.split(';')[0].trim()).filter(Boolean)
  if (!pairs.some(pair => pair.startsWith('id_token='))) {
    throw new Error('nhi exchange returned no id_token cookie')
  }
  const expiresIn = typeof res.data?.expires_in === 'number' ? res.data.expires_in : ASSERTION_TTL_SECONDS
  return { cookieHeader: pairs.join('; '), expiresAtMs: Date.now() + expiresIn * 1000 }
}

/**
 * Per-autonomous-agent session cache. In-process and deliberately simple: sessions are
 * short-lived and non-refreshable by construction, so a lost cache costs one exchange.
 */
const sessions = new Map<string, { cookieHeader: string, expiresAtMs: number }>()

export const clearAutonomousAgentSession = (autonomousAgentId: string) => { sessions.delete(autonomousAgentId) }

export const getAutonomousAgentSession = async (autonomousAgent: EnrolledAutonomousAgent): Promise<string> => {
  requireEnrolment(autonomousAgent)
  const cached = sessions.get(autonomousAgent.id)
  // ASSERTION_TTL_SECONDS stands in for "the session's lifetime" here (shouldRefreshSession's
  // doc comment) only because simple-directory caps the session at min(assertion.exp, 30m)
  // and ASSERTION_TTL_SECONDS (300s) is always well under that 30m cap — so the assertion
  // ttl we requested IS the session's real lifetime, not merely an estimate of it. Passing
  // ASSERTION_TTL_SECONDS would be wrong the moment either side of that inequality changed.
  if (cached && !shouldRefreshSession(cached.expiresAtMs, Date.now(), ASSERTION_TTL_SECONDS * 1000)) {
    return cached.cookieHeader
  }
  const session = await exchangeForSession(autonomousAgent)
  sessions.set(autonomousAgent.id, session)
  return session.cookieHeader
}
