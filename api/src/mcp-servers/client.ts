/**
 * Connects to the MCP servers an autonomous agent is configured with, as that agent's
 * own identity, and exposes their tools as AI SDK tools.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { tool, jsonSchema } from 'ai'
import memoize from 'memoizee'
import config from '#config'
import { fileArgumentsOf, withResourceLinks, resourceLinksOf, hideLinkUris } from '../files/operations.ts'
import { httpError } from '@data-fair/lib-express'
import Debug from 'debug'
import { callHeaders, listingKey, connectionKey, withPortalArgument, splitPortalArgument, type SiteCredentials, type GlobalMcpServer } from './operations.ts'
import { formatMcpToolResult } from '@agents/shared/tool-result'
import { toolDescription } from '@agents/shared/tool-description'
import type { ToolSet } from '../conversations/operations.ts'
import { boundGuide, visibleSkills, type ServerGuide, type GuideSkill } from './guides.ts'
import { MCP_CLIENT_CAPABILITIES, listServerSkills, readServerSkill } from './skills-client.ts'

const debug = Debug('agents:mcp-client')

/**
 * A connection to one catalog server, for one site. The credential headers are computed for EVERY request
 * rather than fixed when it connects: `cookie` is asked each time, so a session renewed during a long turn
 * (agentSiteCredentials) reaches the calls already holding this connection.
 */
export const connectMcpServer = async (server: GlobalMcpServer, siteUrl?: string, cookie: () => Promise<string | undefined> = async () => undefined) => {
  const transport = new StreamableHTTPClientTransport(new URL(server.url), {
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers)
      for (const [name, value] of Object.entries(callHeaders(server, siteUrl, await cookie()))) headers.set(name, value)
      return await fetch(url, { ...init, headers })
    }
  })
  const client = new Client({ name: 'data-fair-agents', version: '1.0.0' }, { capabilities: MCP_CLIENT_CAPABILITIES as any })
  await client.connect(transport)
  return { client, close: async () => { await client.close() } }
}

export interface AutonomousAgentForTools {
  id: string
  nhi?: { clientId: string, siteUrl?: string, issuer?: string }
  mcpServers?: { serverId: string, toolFilter?: string[] }[]
}

/** A catalog entry that could not be reached, when the caller asked to skip rather than fail. */
export interface SkippedServer {
  id: string
  reason: string
}

/** A listed MCP tool, as returned by client.listTools(). */
export interface ListedMcpTool {
  name: string
  description?: string
  inputSchema?: unknown
  annotations?: unknown
}

/**
 * The tool set for one autonomous agent: every tool of every catalog entry it
 * references, narrowed by that reference's optional toolFilter, as executable AI SDK
 * tools.
 */
export interface OpenAutonomousAgentTools {
  /**
   * Each tool with the server it actually came from and the MCP `annotations` it declared —
   * `readOnlyHint`, `destructiveHint` and the rest: recorded per call on the stored message, because they
   * are what makes a write auditable after the fact, and the input the approval gate reads.
   */
  tools: ToolSet
  /** Catalog entries that could not be reached; always empty unless the caller asked to skip. */
  skippedServers: SkippedServer[]
  /** Tools a server listed that the reference's toolFilter excluded: what the agent reads about itself. */
  filteredOut: { name: string, server: string }[]
  /** Tools that take a file, left out because files are off this turn. */
  needsFiles: { name: string, server: string }[]
  /** What each listed server says about its tools — instructions and skills — in reference order (./guides.ts). */
  guides: ServerGuide[]
  /** A skill's SKILL.md, read over this turn's connection to that server (as its tools are called). */
  readSkill: (server: string, uri: string) => Promise<string>
  /** MUST be called when the turn is over: until then the connections stay open. */
  close: () => Promise<void>
}

/** A server as one listing reads it: its tools, its instructions and its skills. Cached together (below). */
export interface ServerListing { tools: ListedMcpTool[], instructions?: string, skills: GuideSkill[] }

/**
 * How long a server's tool LISTING is reused before it is fetched again.
 *
 * Listing used to happen on every turn: connect, initialize, list, for every catalog entry the agent
 * references — the whole catalog, for the personal assistant. Measured on the dev stack it was half of
 * an unloaded turn's time to first token (65 of 135ms), and with turns starting together it was the
 * MCP SDK, zod, ajv and undici share of a CPU-bound burst. A tool set changes when a server is
 * deployed, not between two turns, so a minute of staleness is the price: a tool added upstream shows
 * up within it, and one removed fails at call time with the server's own error.
 */
export const TOOL_LISTING_TTL_MS = 60_000

/**
 * Listings by server and identity. The promise itself is cached, so turns starting together share
 * ONE listing rather than each racing its own — which is the case that mattered under load. A FAILURE
 * is not cached: the next turn tries again, so a server coming back is noticed at once, and a
 * configured agent keeps failing loudly while its server is down.
 *
 * Keyed on who asks as well as the server, because what a session-authenticated server lists may
 * depend on it (SiteCredentials.listingIdentity): two identities never share a listing. On the
 * identity, not the session cookie, which is a fresh exchange every turn for a configured agent — keyed
 * on it, its listings never hit. `cookie` is asked for only on a miss, so a cached listing costs no
 * session exchange.
 */
const listing = memoize(async (_key: string, server: GlobalMcpServer, siteUrl: string | undefined, sites: SiteCredentials): Promise<ServerListing> => {
  const { client, close } = await connectMcpServer(server, siteUrl, cookieOf(server, siteUrl, sites))
  try {
    const tools = (await client.listTools()).tools as ListedMcpTool[]
    // What the server says about its own tools comes with the same connection, so a cached listing
    // costs no extra request (docs/architecture/mcp-tools.md, "Server instructions and skills").
    const instructions = client.getInstructions()?.trim() || undefined
    return { tools, ...(instructions ? { instructions } : {}), skills: await listServerSkills(client, server.id) }
  } finally {
    await close().catch(() => {})
  }
}, { promise: true, maxAge: TOOL_LISTING_TTL_MS, max: 1000, length: 1 })

/** What a call to this server, on this site, authenticates with: the site's session for a site-bound entry, else nothing. */
const cookieOf = (server: GlobalMcpServer, siteUrl: string | undefined, sites: SiteCredentials) =>
  async () => server.auth === 'nhi-session' && siteUrl ? await sites.cookieFor(siteUrl) : undefined

/** Forget every cached listing. The test environment's reset calls it, so specs stay independent. */
export const clearToolListings = () => { listing.clear() }

/** `fresh` lists again, and keeps that answer for the next turns. */
const listServer = (server: GlobalMcpServer, siteUrl: string | undefined, sites: SiteCredentials, fresh?: boolean): Promise<ServerListing> => {
  const key = listingKey(server, siteUrl, sites.listingIdentity)
  if (fresh) listing.delete(key, server, siteUrl, sites)
  return listing(key, server, siteUrl, sites)
}

/**
 * The executable tool set for one autonomous agent: every tool of every catalog entry it references,
 * narrowed by that reference's optional toolFilter.
 *
 * WHO it acts as, and WHERE, is injected (`SiteCredentials`; see performTurn in conversations/executor.ts)
 * rather than derived from the agent. That is the one seam a personal assistant needs: it has no
 * non-human identity, and acts as the person using it through their forwarded session. Everything else
 * about gathering tools is identical, which is the point — one loop serves both.
 *
 * Listings come from the cache above; CONNECTIONS are opened lazily, on a tool's first call in the
 * turn, and shared by the turn's later calls to the same server — so a turn that calls no catalog tool
 * opens none. The caller owns the returned `close` and must call it when the turn ends: until then a
 * connection opened by a call stays open, because each tool's `execute` reuses it.
 */
export const openAutonomousAgentTools = async (
  autonomousAgent: AutonomousAgentForTools,
  sites: SiteCredentials,
  opts?: { onServerError?: 'throw' | 'skip', fresh?: boolean, files?: boolean }
): Promise<OpenAutonomousAgentTools> => {
  const filesOn = opts?.files ?? !!config.files
  const needsFiles: { name: string, server: string }[] = []
  const tools: ToolSet = {}
  const skippedServers: SkippedServer[] = []
  const filteredOut: { name: string, server: string }[] = []

  const catalog = config.mcpServers ?? []
  const refs = autonomousAgent.mcpServers ?? []
  const home = sites.homeSite
  const portalByHost = new Map(sites.portals.map(origin => [new URL(origin).host, origin]))
  const portalHosts = [...portalByHost.keys()]

  // This turn's connections, opened by the first call to each server — and each SITE, for a
  // site-bound server: the site is the connection's; its session is read again on every request.
  const connections = new Map<string, ReturnType<typeof connectMcpServer>>()
  const clientFor = async (server: GlobalMcpServer, siteUrl: string | undefined) => {
    const key = connectionKey(server, siteUrl)
    let connection = connections.get(key)
    if (!connection) {
      // The promise is stored before connecting, so two concurrent first calls to the same site share one
      // connection (and one exchange: cookieFor shares it too) instead of each connecting.
      connection = connectMcpServer(server, siteUrl, cookieOf(server, siteUrl, sites))
      connections.set(key, connection)
      // A failed connect is forgotten, so the next call retries rather than replaying the failure.
      connection.catch(() => { if (connections.get(key) === connection) connections.delete(key) })
    }
    try {
      return (await connection).client
    } catch (err: any) {
      // Named, like a listing failure: "fetch failed" alone does not say which of several servers.
      throw new Error(`MCP server "${server.id}" failed: ${err.message}`)
    }
  }

  // Listed together: a turn waits for its slowest server, not for the sum of them.
  const listed = await Promise.all(refs.map(async ref => {
    const server = catalog.find(s => s.id === ref.serverId)
    if (!server) throw httpError(400, `unknown MCP server "${ref.serverId}"`)
    try {
      return { ref, server, listing: await listServer(server, server.auth === 'nhi-session' ? home : undefined, sites, opts?.fresh) }
    } catch (err: any) {
      // THROW or SKIP — see forEachListedTool, whose rule this is.
      if (opts?.onServerError !== 'skip') throw httpError(502, `MCP server "${server.id}" failed: ${err.message}`)
      debug('skipping server=%s %s', server.id, err.message)
      skippedServers.push({ id: server.id, reason: err.message })
      return undefined
    }
  }))

  // In reference order, so a name collision resolves exactly as before.
  for (const entry of listed) {
    if (!entry) continue
    const { ref, server } = entry
    for (const t of entry.listing.tools) {
      if (ref.toolFilter?.length && !ref.toolFilter.includes(t.name)) {
        filteredOut.push({ name: t.name, server: server.id })
        continue
      }
      // Last-write-wins on a name collision across servers, matching the browser
      // aggregator's Object.assign semantics — the provenance travels with the tool, so the recorded
      // server is the one whose tool will actually run.
      const siteBound = server.auth === 'nhi-session'
      const { schema: portalSchema, injected } = siteBound ? withPortalArgument(t.inputSchema, portalHosts) : { schema: (t.inputSchema as any) ?? { type: 'object', properties: {} }, injected: false }
      // A file argument is a path of the turn's files (api/src/files/call-path.ts). Without files the model
      // could not fill it — the MCP server fetches only our signed URLs — so the tool is not offered (spec §2).
      const { schema, fileArgs } = fileArgumentsOf(portalSchema)
      if (fileArgs.length && !filesOn) {
        needsFiles.push({ name: t.name, server: server.id })
        continue
      }
      const callMcp = async (rawArgs: any) => {
        const { portal, args } = splitPortalArgument(rawArgs, injected)
        const site = portal === undefined ? home : portalByHost.get(portal)
        if (portal !== undefined && !site) throw new Error(`"${portal}" is not a portal of your organization (${portalHosts.join(', ') || 'none'})`)
        debug('call tool=%s server=%s site=%s', t.name, server.id, siteBound ? site : '-')
        const client = await clientFor(server, siteBound ? site : undefined)
        // request() rather than callTool(): the latter also validates the result's structuredContent against
        // the declared outputSchema, and a server without one (openapi-mcp emits structured content without)
        // or with a drifting one would reject an otherwise usable call. The model's text form discards
        // structuredContent; a script gets it (codeExecute below), and an outputSchema validation of a value
        // only scripts read would add a failure mode, not a guarantee.
        const callResult = await client.request({ method: 'tools/call', params: { name: t.name, arguments: args } }, CallToolResultSchema)
        const formatted = formatMcpToolResult(callResult as any)
        // An MCP tool reports its OWN failure with `isError`, which is not a transport error and so
        // does not reject on its own. Rethrown as one, because that is the only thing the model loop
        // treats as a failure: returned as a value, the turn recorded a failed call in the exact shape
        // of a successful one — the conflation that hid a broken tool path for a whole plan. The AI SDK
        // turns this into a `tool-error` part, so the call is stored `output-error` and the model is
        // handed it as `error-text` rather than as data.
        if ((callResult as { isError?: boolean }).isError) {
          throw new Error(hideLinkUris(typeof formatted === 'string' ? formatted : formatted.text ?? 'Tool execution failed', callResult as any))
        }
        // Links stay links until the call path (api/src/files/call-path.ts) stores them; it needs to know the
        // call came from the catalog and which site it was bound to — the credential rule (spec §4.2).
        return { callResult, formatted, origin: { catalog: true, ...(siteBound && site ? { site } : {}) } }
      }
      const mcpTool = tool({
        description: t.description ?? '',
        inputSchema: jsonSchema(schema as any),
        execute: async (rawArgs: any) => {
          const { callResult, formatted, origin } = await callMcp(rawArgs)
          return withResourceLinks(formatted, callResult as any, origin)
        }
      })
      // A script gets the data (spec §6.4): structuredContent when the server sent one — data-fair's MCP does —
      // its text otherwise. A result with links is the text, so the call path stores them (records, for code).
      // A media result reaches a script as its text only: the images are for the model, not for code.
      const codeExecute = async (rawArgs: any) => {
        const { callResult, formatted, origin } = await callMcp(rawArgs)
        const text = typeof formatted === 'string' ? formatted : formatted.text ?? ''
        const structured = (callResult as { structuredContent?: unknown }).structuredContent
        return resourceLinksOf(callResult as any).length || structured === undefined ? withResourceLinks(text, callResult as any, origin) : structured
      }
      tools[t.name] = { tool: mcpTool, codeExecute, server: server.id, ...(t.annotations ? { annotations: t.annotations as Record<string, unknown> } : {}), ...(fileArgs.length ? { fileArgs } : {}) }
    }
  }

  const close = async () => {
    const open = [...connections.values()]
    connections.clear()
    for (const connection of open) await connection.then(c => c.close()).catch(() => {})
  }
  // What each server says about its tools, in reference order; a skill whose every tool the reference's
  // toolFilter removed is hidden, as the agent could not follow it (./guides.ts, visibleSkills).
  const guides: ServerGuide[] = listed.flatMap(entry => {
    if (!entry) return []
    const kept = (name: string) => !entry.ref.toolFilter?.length || entry.ref.toolFilter.includes(name)
    const guide = boundGuide({ server: entry.server.id, ...(entry.listing.instructions ? { instructions: entry.listing.instructions } : {}), skills: visibleSkills(entry.listing.skills, kept) })
    return guide.instructions || guide.skills.length ? [guide] : []
  })

  const readSkill = async (serverId: string, uri: string): Promise<string> => {
    const entry = listed.find(e => e?.server.id === serverId)
    if (!entry) throw new Error(`"${serverId}" is not one of your tool servers this turn`)
    const client = await clientFor(entry.server, entry.server.auth === 'nhi-session' ? home : undefined)
    return await readServerSkill(client, entry.listing.skills, uri)
  }

  return { tools, skippedServers, filteredOut, needsFiles, guides, readSkill, close }
}

export interface McpToolDescriptor {
  name: string
  description: string
  server: string
  annotations?: Record<string, unknown>
}

/**
 * The tool list an autonomous agent would actually receive, as descriptors, listed FRESH: an admin
 * checking a fix wants the servers' answer now, not up to a minute old. A failing server is an error,
 * as it is for the agent's turns. The annotations let an admin see the write surface — what the
 * approval gate reads — before the agent ever runs.
 */
export const listAutonomousAgentToolDescriptors = async (
  autonomousAgent: AutonomousAgentForTools,
  sites: SiteCredentials
): Promise<McpToolDescriptor[]> => {
  const { tools, close } = await openAutonomousAgentTools(autonomousAgent, sites, { fresh: true })
  await close()
  return Object.entries(tools).map(([name, { tool, server, annotations }]) => ({
    name,
    description: toolDescription(tool),
    server: server!,
    ...(annotations ? { annotations } : {})
  }))
}
