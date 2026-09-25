/**
 * Connects to the MCP servers an autonomous agent is configured with, as that agent's
 * own identity, and exposes their tools as AI SDK tools.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { tool, jsonSchema, type Tool } from 'ai'
import config from '#config'
import { httpError } from '@data-fair/lib-express'
import Debug from 'debug'
import { credentialHeaders, type GlobalMcpServer } from './operations.ts'
import { formatMcpToolResult } from './tool-result.ts'
import { getAutonomousAgentSession } from '../nhi/service.ts'

const debug = Debug('agents:mcp-client')

export const connectMcpServer = async (server: GlobalMcpServer, cookieHeader?: string) => {
  const headers = credentialHeaders(server, cookieHeader)
  const transport = new StreamableHTTPClientTransport(new URL(server.url), { requestInit: { headers } })
  const client = new Client({ name: 'data-fair-agents', version: '1.0.0' })
  await client.connect(transport)
  return { client, close: async () => { await client.close() } }
}

export interface AutonomousAgentForTools {
  id: string
  nhi?: { clientId: string }
  mcpServers?: { serverId: string, toolFilter?: string[] }[]
}

/** A listed MCP tool, as returned by client.listTools(). */
export interface ListedMcpTool {
  name: string
  description?: string
  inputSchema?: unknown
  annotations?: unknown
}

/**
 * Connects, as the autonomous agent's own identity, to every MCP server it references,
 * lists each one's tools (narrowed by that reference's optional toolFilter), and calls
 * `visit` for each surviving tool — with the still-open client it was listed from —
 * before closing the connection. The shared shape behind both `listAutonomousAgentTools`
 * (executable AI SDK tools) and `listAutonomousAgentToolDescriptors` (diagnostic
 * descriptors only) — there is exactly one copy of the connect/list/filter/close loop.
 *
 * A session is obtained lazily and only once: an autonomous agent whose entries are all
 * `none`/`apiKey` performs no exchange at all.
 */
export const forEachListedTool = async (
  autonomousAgent: AutonomousAgentForTools,
  visit: (t: ListedMcpTool, server: GlobalMcpServer, client: Client) => void
): Promise<void> => {
  const catalog = config.mcpServers ?? []
  const refs = autonomousAgent.mcpServers ?? []
  const needsSession = refs.some(ref => catalog.find(s => s.id === ref.serverId)?.auth === 'nhi-session')
  const cookieHeader = needsSession ? await getAutonomousAgentSession(autonomousAgent) : undefined

  for (const ref of refs) {
    const server = catalog.find(s => s.id === ref.serverId)
    if (!server) throw httpError(400, `unknown MCP server "${ref.serverId}"`)

    // This route's entire purpose is diagnosis, so a raw connect/list failure — which
    // names nothing — is useless when an autonomous agent references several servers.
    // Wrap and rethrow naming server.id; never include the credential (cookieHeader) in
    // the message, only the underlying error text.
    let client: Client | undefined
    let close: (() => Promise<void>) | undefined
    try {
      ({ client, close } = await connectMcpServer(server, cookieHeader))
      const listed = await client.listTools()
      for (const t of listed.tools) {
        if (ref.toolFilter?.length && !ref.toolFilter.includes(t.name)) continue
        visit(t, server, client)
      }
    } catch (err: any) {
      throw httpError(502, `MCP server "${server.id}" failed: ${err.message}`)
    } finally {
      await close?.()
    }
  }
}

/**
 * The tool set for one autonomous agent: every tool of every catalog entry it
 * references, narrowed by that reference's optional toolFilter, as executable AI SDK
 * tools.
 */
export const listAutonomousAgentTools = async (autonomousAgent: AutonomousAgentForTools): Promise<Record<string, Tool>> => {
  const tools: Record<string, Tool> = {}
  await forEachListedTool(autonomousAgent, (t, server, client) => {
    // Last-write-wins on a name collision across servers, matching the browser
    // aggregator's Object.assign semantics.
    tools[t.name] = tool({
      description: t.description ?? '',
      inputSchema: jsonSchema((t.inputSchema as any) ?? { type: 'object', properties: {} }),
      execute: async (args: any) => {
        debug('call tool=%s server=%s', t.name, server.id)
        // request() rather than callTool(): the latter also validates the result's
        // structuredContent against the declared outputSchema, and formatMcpToolResult
        // discards structuredContent, so that check could only reject an otherwise
        // usable call over a value we throw away.
        const callResult = await client.request({ method: 'tools/call', params: { name: t.name, arguments: args } }, CallToolResultSchema)
        return formatMcpToolResult(callResult as any)
      }
    })
  })
  return tools
}

export interface McpToolDescriptor {
  name: string
  description: string
  server: string
  annotations?: Record<string, unknown>
}

/**
 * The tool list an autonomous agent would actually receive, as descriptors only — no
 * executable closures over a client connection that this diagnostic endpoint will never
 * call and never keeps open.
 */
export const listAutonomousAgentToolDescriptors = async (autonomousAgent: AutonomousAgentForTools): Promise<McpToolDescriptor[]> => {
  const descriptors: McpToolDescriptor[] = []
  await forEachListedTool(autonomousAgent, (t, server) => {
    descriptors.push({
      name: t.name,
      description: t.description ?? '',
      server: server.id,
      // readOnlyHint / destructiveHint drive the approval gate in P1 and are recorded
      // per call in the run; surfacing them here lets an admin see the write surface
      // before an autonomous agent is ever run.
      ...(t.annotations ? { annotations: t.annotations as Record<string, unknown> } : {})
    })
  })
  return descriptors
}
