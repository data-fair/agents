/**
 * service.ts contains stateful logic (config, mongo) built on top of operations.ts
 */

import config from '#config'
import { httpError, reqSiteUrl, type AccountKeys } from '@data-fair/lib-express'
import type { Request } from 'express'
import { SignJWT, importJWK } from 'jose'
import axios from '@data-fair/lib-node/axios.js'
import { toPublicJwk, nhiIssuerUrl, buildAssertionClaims, shouldRefreshSession, autonomousAgentSubject, exchangeHeaders, nhiExchangeUrl, sanitizeExchangeError, createSessionStore, type NhiPrivateJwk, type NhiPublicJwk, ASSERTION_TTL_SECONDS } from './operations.ts'
import { siteOrigin, forwardedSiteHeaders, accountSiteOrigins } from '../sites/operations.ts'

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

export const mintAssertion = async (autonomousAgent: EnrolledAutonomousAgent, siteUrl: string): Promise<string> => {
  const key = getNhiSigningKey()
  const { issuer } = requireEnrolment(autonomousAgent)
  const claims = buildAssertionClaims({
    issuer,
    subject: autonomousAgentSubject(autonomousAgent.id),
    // The audience is the site the session is asked for, which simple-directory recomputes
    // from the headers we send below.
    audience: siteOrigin(siteUrl),
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
export const exchangeForSession = async (autonomousAgent: EnrolledAutonomousAgent, siteUrl: string): Promise<{ cookieHeader: string, expiresAtMs: number }> => {
  const { clientId } = requireEnrolment(autonomousAgent)
  const site = siteOrigin(siteUrl)
  const assertion = await mintAssertion(autonomousAgent, site)
  let res
  try {
    res = await axios.post(
      nhiExchangeUrl(config.privateDirectoryUrl, site),
      { client_id: clientId, assertion },
      { headers: exchangeHeaders(site), maxRedirects: 0 }
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
 * Per-autonomous-agent, per-site session cache. In-process and deliberately simple: sessions are
 * short-lived and non-refreshable by construction, so a lost cache costs one exchange.
 */
const sessions = createSessionStore<{ cookieHeader: string, expiresAtMs: number }>()
const accountSites = new Map<string, { expiresAt: number, origins: Promise<string[]> }>()

/** Drop every session of this agent, on every site, and what it knows of its account's sites. */
export const clearAutonomousAgentSession = (agentId: string) => {
  sessions.clear(agentId)
  accountSites.delete(agentId)
}

/**
 * A session of this agent ON ONE SITE (default: the site it was enrolled on). simple-directory refuses
 * the exchange on a site outside the agent's organization — with the same 401 as any bad assertion —
 * so callers only ask for an account site (see listAccountSites).
 */
export const getAutonomousAgentSession = async (autonomousAgent: EnrolledAutonomousAgent, siteUrl?: string): Promise<string> => {
  const { siteUrl: enrolledSite } = requireEnrolment(autonomousAgent)
  const site = siteOrigin(siteUrl ?? enrolledSite)
  const cached = sessions.get(autonomousAgent.id, site)
  // The required headroom is the RUN TIMEOUT, not a fraction of the session's own lifetime. A turn
  // acquires this cookie once, the MCP transport holds it for the whole chain, and nothing refreshes it
  // mid-turn — so a session that expires during the turn produces 401s the model reports as tool
  // failures. Requiring it to outlive the longest a turn may legitimately take removes that class.
  //
  // Consequence, accepted deliberately: with ASSERTION_TTL_SECONDS (300s) equal to the run timeout,
  // this means a fresh exchange per turn in practice. The cross-turn cache is given up on purpose. The
  // alternative — lengthening the assertion TTL so one session spans several turns — would extend the
  // life of a credential that is handed to every `nhi-session` MCP server, and the short TTL is the
  // main thing bounding that blast radius. If the per-client_id exchange rate limit ever becomes the
  // binding constraint, raising the TTL is the lever, with that trade stated.
  if (cached && !shouldRefreshSession(cached.expiresAtMs, Date.now(), config.turnTimeoutSeconds * 1000)) {
    return cached.cookieHeader
  }
  const session = await exchangeForSession(autonomousAgent, site)
  sessions.set(autonomousAgent.id, site, session)
  return session.cookieHeader
}

/** How long the list of an agent's account sites is reused: a site is created far less often than a turn starts. */
export const ACCOUNT_SITES_TTL_MS = 60_000

/**
 * The agent's authentication space as origins: its enrolment site, then the non-temporary sites
 * simple-directory lists for its organization — asked AS the agent, on its enrolment site, which is
 * always inside its account. A failure is not cached, and is the caller's to degrade.
 */
export const listAccountSites = (autonomousAgent: EnrolledAutonomousAgent & { owner: AccountKeys }): Promise<string[]> => {
  const cached = accountSites.get(autonomousAgent.id)
  if (cached && cached.expiresAt > Date.now()) return cached.origins
  const origins = (async () => {
    const { siteUrl } = requireEnrolment(autonomousAgent)
    const cookie = await getAutonomousAgentSession(autonomousAgent)
    const res = await axios.get(`${config.privateDirectoryUrl.replace(/\/+$/, '')}/simple-directory/api/sites`, {
      params: { owner: `${autonomousAgent.owner.type}:${autonomousAgent.owner.id}`, tmp: false },
      headers: { cookie, ...forwardedSiteHeaders(siteOrigin(siteUrl)) }
    })
    const hosts: string[] = (res.data?.results ?? []).map((s: { host: string }) => s.host).filter(Boolean)
    return accountSiteOrigins(siteUrl, hosts)
  })()
  origins.catch(() => { if (accountSites.get(autonomousAgent.id)?.origins === origins) accountSites.delete(autonomousAgent.id) })
  accountSites.set(autonomousAgent.id, { expiresAt: Date.now() + ACCOUNT_SITES_TTL_MS, origins })
  return origins
}
