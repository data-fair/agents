/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

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
 * The credential headers for one catalog entry.
 *
 * A cookie is used rather than a bearer token because @data-fair/lib-express reads
 * sessions from the id_token / id_token_sign cookies only and parses no Authorization
 * header — the same constraint nhi-proxy works around by relaying Set-Cookie.
 */
export function credentialHeaders (server: GlobalMcpServer, cookieHeader: string | undefined): Record<string, string> {
  if (server.auth === 'nhi-session') {
    // Refuse rather than silently omit: an unauthenticated call would run as anonymous
    // and fail at the far end as a confusing permission error instead of here.
    if (!cookieHeader) throw new Error(`MCP server "${server.id}" requires a session but none was supplied`)
    return { cookie: cookieHeader }
  }
  if (server.auth === 'apiKey') {
    if (!server.apiKeyHeader || !server.apiKey) throw new Error(`MCP server "${server.id}" is missing its apiKey configuration`)
    return { [server.apiKeyHeader]: server.apiKey }
  }
  return {}
}
