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

/**
 * The tool set for one autonomous agent: every tool of every catalog entry it
 * references, narrowed by that reference's optional toolFilter.
 *
 * A session is obtained lazily and only once: an autonomous agent whose entries are all
 * `none`/`apiKey` performs no exchange at all.
 */
export const listAutonomousAgentTools = async (autonomousAgent: {
  id: string
  nhi?: { clientId: string }
  mcpServers?: { serverId: string, toolFilter?: string[] }[]
}): Promise<Record<string, Tool>> => {
  const catalog = config.mcpServers ?? []
  const refs = autonomousAgent.mcpServers ?? []
  const needsSession = refs.some(ref => catalog.find(s => s.id === ref.serverId)?.auth === 'nhi-session')
  const cookieHeader = needsSession ? await getAutonomousAgentSession(autonomousAgent) : undefined

  const tools: Record<string, Tool> = {}
  for (const ref of refs) {
    const server = catalog.find(s => s.id === ref.serverId)
    if (!server) throw httpError(400, `unknown MCP server "${ref.serverId}"`)

    const { client, close } = await connectMcpServer(server, cookieHeader)
    try {
      const listed = await client.listTools()
      for (const t of listed.tools) {
        if (ref.toolFilter?.length && !ref.toolFilter.includes(t.name)) continue
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
      }
    } finally {
      await close()
    }
  }
  return tools
}
