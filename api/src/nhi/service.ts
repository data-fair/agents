/**
 * service.ts contains stateful logic (config, mongo) built on top of operations.ts
 */

import config from '#config'
import { httpError, reqSiteUrl, type AccountKeys } from '@data-fair/lib-express'
import type { Request } from 'express'
import { SignJWT, importJWK } from 'jose'
import axios from '@data-fair/lib-node/axios.js'
import { toPublicJwk, nhiIssuerUrl, buildAssertionClaims, autonomousAgentSubject, exchangeHeaders, nhiExchangeUrl, sanitizeExchangeError, type NhiPrivateJwk, type NhiPublicJwk, ASSERTION_TTL_SECONDS } from './operations.ts'
import { siteOrigin, forwardedSiteHeaders, accountSiteOrigins } from '../sites/operations.ts'

import type { SiteCredentials } from '../mcp-servers/operations.ts'

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
const exchangeForSession = async (autonomousAgent: EnrolledAutonomousAgent, siteUrl: string): Promise<string> => {
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
    throw new Error(`${sanitizeExchangeError(err).message} (site ${site})`)
  }
  const setCookies: string[] = res.headers['set-cookie'] ?? []
  // keep only name=value, dropping attributes (Path, HttpOnly, …) — a Cookie request
  // header carries pairs only
  const pairs = setCookies.map(c => c.split(';')[0].trim()).filter(Boolean)
  if (!pairs.some(pair => pair.startsWith('id_token='))) {
    throw new Error('nhi exchange returned no id_token cookie')
  }
  return pairs.join('; ')
}

const accountSites = new Map<string, { expiresAt: number, origins: Promise<string[]> }>()

/** Forget what is known of this agent's account sites, when its enrolment changes or it is deleted. */
export const forgetAccountSites = (agentId: string) => {
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
  // Never reused across turns: a session lives ASSERTION_TTL_SECONDS, no longer than a turn may run
  // (assertSessionOutlivesRun), and the MCP transport holds the cookie for the whole turn — so a cached
  // one could expire mid-turn. A turn exchanges once per site it acts on (see agentSiteCredentials).
  // Lengthening the TTL would let sessions be reused, at the cost of a longer-lived credential handed
  // to every `nhi-session` MCP server; if the exchange rate limit ever binds, that is the lever.
  return await exchangeForSession(autonomousAgent, site)
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

/**
 * Where an autonomous agent's turn acts, and as whom. Home: the site the caller names (the conversation's
 * own, else the socket's), else the site it was enrolled on (a planned task, a chat turn nobody watches). Its own session on its account sites — an
 * exchange that fails there is an error — and no credential anywhere else.
 *
 * When the account cannot be listed (`listingFailed`), it degrades to the enrolment site alone: no portal is
 * offered, and a chat on another site runs anonymously for that turn without claiming that site is foreign.
 */
export const agentSiteCredentials = async (autonomousAgent: EnrolledAutonomousAgent & { owner: AccountKeys, mcpServers?: { serverId: string }[] }, socketSite?: string): Promise<SiteCredentials> => {
  const { siteUrl } = requireEnrolment(autonomousAgent)
  const enrolled = siteOrigin(siteUrl)
  const home = socketSite ? siteOrigin(socketSite) : enrolled
  // Listing the account costs a session exchange. An agent none of whose entries is site-bound
  // (`nhi-session`) never asks for a cookie or a portal, so it must not pay for, nor depend on, an
  // exchange it does not use: a turn on public tools stays as fast as before sites existed.
  const catalog = config.mcpServers ?? []
  if (autonomousAgent.mcpServers && !autonomousAgent.mcpServers.some(ref => catalog.find(s => s.id === ref.serverId)?.auth === 'nhi-session')) {
    return { homeSite: home, portals: [], anonymousHome: false, cookieFor: async () => undefined }
  }
  let account: string[]
  let listingFailed = false
  try {
    account = await listAccountSites(autonomousAgent)
  } catch (err: any) {
    // Its own state, not "the account is just the enrolment site": no portal can be offered, and a home
    // other than the enrolment site is UNCONFIRMED rather than known to be foreign (the prompt says so).
    console.warn(`could not list the account sites of autonomous agent ${autonomousAgent.id}: ${err.message}`)
    account = [enrolled]
    listingFailed = true
  }
  // One exchange per site for the turn these credentials serve.
  const cookies = new Map<string, Promise<string>>()
  return {
    homeSite: home,
    portals: listingFailed ? [] : account.filter(site => site !== home),
    anonymousHome: !account.includes(home),
    ...(listingFailed ? { listingFailed } : {}),
    cookieFor: site => {
      const origin = siteOrigin(site)
      if (!account.includes(origin)) return Promise.resolve(undefined)
      let cookie = cookies.get(origin)
      if (!cookie) {
        cookies.set(origin, cookie = getAutonomousAgentSession(autonomousAgent, origin))
        cookie.catch(() => { if (cookies.get(origin) === cookie) cookies.delete(origin) })
      }
      return cookie
    }
  }
}
