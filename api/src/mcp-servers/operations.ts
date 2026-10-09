/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import { createHash } from 'node:crypto'
import { forwardedSiteHeaders } from '../sites/operations.ts'

/**
 * How the MCP client authenticates to a server:
 * - nhi-session: the autonomous agent's NHI session cookie is injected (stack services)
 * - none:        no credential (public or network-trusted endpoints)
 * - apiKey:      a static ops-owned header (third-party servers with their own auth)
 */
export type McpServerAuth = 'nhi-session' | 'none' | 'apiKey'

/** A catalog entry as configured by ops in the MCP_SERVERS env var. */
export interface GlobalMcpServer {
  id: string
  name: string
  description?: string
  url: string
  auth: McpServerAuth
  /** only with auth: 'apiKey' */
  apiKeyHeader?: string
  /** only with auth: 'apiKey' — a deployment secret, never returned by the API */
  apiKey?: string
}

/** The same entry as exposed to org admins: identical minus the credential. */
export interface McpServerCatalogEntry {
  id: string
  name: string
  description?: string
  url: string
  auth: McpServerAuth
}

/**
 * Fail-fast boot validation, mirroring assertGlobalAiConfig: a malformed catalog
 * crashes the process at startup rather than failing on the first autonomous agent
 * that references it.
 */
export function assertGlobalMcpConfig (servers: GlobalMcpServer[]): void {
  const ids = new Set<string>()
  for (const server of servers) {
    if (ids.has(server.id)) throw new Error(`invalid global MCP config: duplicate server id "${server.id}"`)
    ids.add(server.id)

    let url: URL
    try {
      url = new URL(server.url)
    } catch {
      throw new Error(`invalid global MCP config: server "${server.id}" has an invalid url "${server.url}"`)
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`invalid global MCP config: server "${server.id}" url must be http(s), got "${url.protocol}"`)
    }

    if (server.auth === 'apiKey') {
      if (!server.apiKeyHeader) throw new Error(`invalid global MCP config: server "${server.id}" with auth "apiKey" requires apiKeyHeader`)
      if (!server.apiKey) throw new Error(`invalid global MCP config: server "${server.id}" with auth "apiKey" requires apiKey`)
    } else if (server.apiKey || server.apiKeyHeader) {
      // A credential on a server that will never send one is a configuration mistake
      // worth naming at boot: the operator believes the endpoint is authenticated.
      throw new Error(`invalid global MCP config: server "${server.id}" with auth "${server.auth}" must not carry apiKey/apiKeyHeader`)
    }
  }
}

/** Strip the credential. The only shape the API is allowed to return. */
export function listMcpServerCatalog (servers: GlobalMcpServer[]): McpServerCatalogEntry[] {
  return servers.map(server => ({
    id: server.id,
    name: server.name,
    url: server.url,
    auth: server.auth,
    ...(server.description ? { description: server.description } : {})
  }))
}

/** The referenced server ids that have no catalog entry, for write-time validation. */
export function unknownMcpServerIds (servers: GlobalMcpServer[], refs: { serverId: string }[]): string[] {
  const known = new Set(servers.map(s => s.id))
  return refs.map(ref => ref.serverId).filter(id => !known.has(id))
}

/**
 * Where a turn's calls act, and with which credential (see SiteCredentials users in ./client.ts).
 * A configured agent's comes from its account sites (nhi/service.ts), the personal assistant's from
 * personSiteCredentials.
 */
export interface SiteCredentials {
  /** The site a call acts on when it names no portal; undefined: no site (calls carry no x-forwarded-host and no cookie). */
  homeSite?: string
  /** Other account sites a call may name with `portal`, as origins. */
  portals: string[]
  /** The home site is outside the agent's account: it acts there anonymously. */
  anonymousHome: boolean
  /** The cookie to send to a site, or undefined to call it anonymously. Rejects when an account site's exchange fails. */
  cookieFor: (siteUrl: string) => Promise<string | undefined>
}

/**
 * The personal assistant acts as the person, through the cookie of their socket — which is valid on
 * the site they opened it on, and nowhere else: sessions are host-only.
 */
export function personSiteCredentials (socketSite: string | undefined, cookie: string | undefined): SiteCredentials {
  return { homeSite: socketSite, portals: [], anonymousHome: false, cookieFor: async site => site === socketSite ? cookie : undefined }
}

/**
 * The headers of one call. A site-bound entry (`nhi-session`: a stack service) is told which site it
 * acts on, and carries the session of THAT site when there is one — absent, it is called anonymously,
 * which is what acting outside the account means. A cookie never travels without its site.
 *
 * A cookie rather than a bearer token: @data-fair/lib-express reads sessions from the id_token /
 * id_token_sign cookies only and parses no Authorization header.
 */
export function callHeaders (server: GlobalMcpServer, siteUrl: string | undefined, cookieHeader: string | undefined): Record<string, string> {
  if (server.auth === 'nhi-session') {
    if (!siteUrl) return {}
    return { ...forwardedSiteHeaders(siteUrl), ...(cookieHeader ? { cookie: cookieHeader } : {}) }
  }
  if (server.auth === 'apiKey') {
    if (!server.apiKeyHeader || !server.apiKey) throw new Error(`MCP server "${server.id}" is missing its apiKey configuration`)
    return { [server.apiKeyHeader]: server.apiKey }
  }
  return {}
}

/**
 * A cached tool listing's key. What a site-bound server lists may depend on the site and on who asks,
 * so both are in it — the credential as a hash, never itself.
 */
export function listingKey (server: GlobalMcpServer, siteUrl: string | undefined, cookieHeader: string | undefined): string {
  if (server.auth !== 'nhi-session') return server.id
  const who = cookieHeader ? createHash('sha256').update(cookieHeader).digest('hex') : 'anonymous'
  return `${server.id}\0${siteUrl ?? ''}\0${who}`
}

/** One open connection of a turn per server, and per site for a site-bound one: its headers are fixed at connect. */
export function connectionKey (server: GlobalMcpServer, siteUrl: string | undefined): string {
  return server.auth === 'nhi-session' ? `${server.id}\0${siteUrl ?? ''}` : server.id
}

/** The argument a site-bound tool takes to act on another site of the agent's organization. */
export const PORTAL_ARGUMENT = 'portal'

/**
 * A site-bound tool's input schema, with an optional `portal` naming another account site. Not added
 * when there is none, nor over a `portal` the tool declares itself — that one is the tool's own and is
 * passed through untouched (see splitPortalArgument).
 */
export function withPortalArgument (inputSchema: unknown, portalHosts: string[]): { schema: Record<string, any>, injected: boolean } {
  const schema = (inputSchema && typeof inputSchema === 'object' ? inputSchema : { type: 'object', properties: {} }) as Record<string, any>
  if (!portalHosts.length || schema.type !== 'object' || schema.properties?.[PORTAL_ARGUMENT]) return { schema, injected: false }
  return {
    injected: true,
    schema: {
      ...schema,
      properties: {
        ...schema.properties,
        [PORTAL_ARGUMENT]: {
          type: 'string',
          enum: portalHosts,
          description: 'Run this on another portal of your organization instead of the site you are working on. Omit it for the current site.'
        }
      }
    }
  }
}

/** The call's own arguments, and the portal it names when the argument is ours. */
export function splitPortalArgument (args: Record<string, unknown> | undefined, injected: boolean): { portal?: string, args: Record<string, unknown> } {
  const all = { ...(args ?? {}) }
  if (!injected) return { args: all }
  const portal = all[PORTAL_ARGUMENT]
  delete all[PORTAL_ARGUMENT]
  return typeof portal === 'string' ? { portal, args: all } : { args: all }
}
