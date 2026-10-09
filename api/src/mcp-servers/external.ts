/**
 * External MCP servers: an organization's admin lists public MCP endpoints — another data-fair portal,
 * on this platform or another install, or any public MCP server — and the agent uses them ANONYMOUSLY.
 *
 * Nothing here carries a credential, and the connection reaches public addresses only (the web access
 * module's lookup), with redirects refused: an external endpoint cannot be used to reach the service's
 * own network. Its tools are named with the server's host as prefix, recorded with the host as their
 * server, and count toward a per-run budget.
 *
 * Trust: allowing a server means trusting its author to, in effect, instruct the agent — it writes the
 * tool descriptions the model reads — and every argument sent to it leaves the platform. The same model
 * as web access's allowlist, and why only an organization admin extends the list.
 *
 * Free of #config, so the unit tests can drive it; the caller passes the public-address exceptions.
 */

import { Agent, fetch as undiciFetch } from 'undici'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { tool, jsonSchema, type Tool } from 'ai'
import Debug from 'debug'
import { formatMcpToolResult } from '@agents/shared/tool-result'
import { ipList, publicLookup } from '../web/public-lookup.ts'
import { externalToolName, EXTERNAL_MAX_CALLS } from './operations.ts'
import type { SkippedServer, McpToolDescriptor, ListedMcpTool } from './client.ts'

const debug = Debug('agents:mcp-external')

/**
 * A fetch that only reaches public addresses, follows no redirect and sends only what the transport sets.
 * Its dispatcher keeps connections alive, so the caller closes it with the turn: left open it would hold
 * sockets (and a server's shutdown) for as long as the keep-alive lasts.
 */
const publicFetch = (publicIps: string[]) => {
  const dispatcher = new Agent({ connect: { lookup: publicLookup(ipList(publicIps)) as any } })
  const fetchImpl = ((url: string | URL, init?: RequestInit) => undiciFetch(url, { ...(init as any), dispatcher, redirect: 'error' })) as unknown as typeof fetch
  return { fetchImpl, closeDispatcher: () => dispatcher.close().catch(() => {}) }
}

const serverId = (url: string) => new URL(url).host

const connect = async (url: string, fetchImpl: typeof fetch) => {
  const client = new Client({ name: 'data-fair-agents', version: '1.0.0' })
  await client.connect(new StreamableHTTPClientTransport(new URL(url), { fetch: fetchImpl }))
  return client
}

const errorText = (err: any): string => err?.cause?.message ? `${err.message}: ${err.cause.message}` : String(err?.message ?? err)

export const openExternalMcpTools = async (servers: { url: string }[], opts: { publicIps: string[], maxCalls?: number }) => {
  const { fetchImpl, closeDispatcher } = publicFetch(opts.publicIps)
  const maxCalls = opts.maxCalls ?? EXTERNAL_MAX_CALLS
  const tools: Record<string, Tool> = {}
  const serverByTool = new Map<string, string>()
  const annotationsByTool = new Map<string, Record<string, unknown>>()
  const skippedServers: SkippedServer[] = []
  const clients: Client[] = []
  let used = 0

  // Connected together, and held for the turn: a turn waits for its slowest external server.
  await Promise.all(servers.map(async ({ url }) => {
    let client: Client | undefined
    try {
      client = await connect(url, fetchImpl)
      const listed = (await client.listTools()).tools as ListedMcpTool[]
      clients.push(client)
      for (const t of listed) {
        const name = externalToolName(url, t.name)
        serverByTool.set(name, serverId(url))
        if (t.annotations) annotationsByTool.set(name, t.annotations as Record<string, unknown>)
        const connected = client
        tools[name] = tool({
          description: t.description ?? '',
          inputSchema: jsonSchema((t.inputSchema as any) ?? { type: 'object', properties: {} }),
          execute: async (args: any) => {
            if (++used > maxCalls) throw new Error(`this run has used all of its ${maxCalls} external MCP calls`)
            debug('call tool=%s server=%s', t.name, url)
            const callResult = await connected.request({ method: 'tools/call', params: { name: t.name, arguments: args } }, CallToolResultSchema)
            const formatted = formatMcpToolResult(callResult as any)
            // Same rule as a catalog tool (./client.ts): a tool's own failure is a failure, not data.
            if ((callResult as { isError?: boolean }).isError) {
              throw new Error(typeof formatted === 'string' ? formatted : formatted.text ?? 'Tool execution failed')
            }
            return formatted
          }
        })
      }
    } catch (err: any) {
      // Skipped and reported, never fatal: the organization chose the server, not the operator, and it
      // lives outside the platform — its being down must not take the agent down.
      await client?.close().catch(() => {})
      debug('skipping external server=%s %s', url, errorText(err))
      skippedServers.push({ id: serverId(url), reason: errorText(err) })
    }
  }))

  return {
    tools,
    serverByTool,
    annotationsByTool,
    skippedServers,
    close: async () => {
      for (const client of clients) await client.close().catch(() => {})
      await closeDispatcher()
    }
  }
}

/** What an admin reads about the external servers: their tools as descriptors, and the ones that failed. */
export const listExternalToolDescriptors = async (servers: { url: string }[], opts: { publicIps: string[] }): Promise<{ descriptors: McpToolDescriptor[], skipped: SkippedServer[] }> => {
  const opened = await openExternalMcpTools(servers, opts)
  try {
    const descriptors = Object.entries(opened.tools).map(([name, t]) => ({
      name,
      description: (t as { description?: string }).description ?? '',
      server: opened.serverByTool.get(name)!,
      ...(opened.annotationsByTool.has(name) ? { annotations: opened.annotationsByTool.get(name) } : {})
    }))
    return { descriptors, skipped: opened.skippedServers }
  } finally {
    await opened.close()
  }
}
