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
import { formatMcpToolResult } from '@agents/shared/tool-result'
import type { SessionProvider } from '../agent-identity/operations.ts'

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
 * Connects, as the autonomous agent's own identity, to every MCP server it references,
 * lists each one's tools (narrowed by that reference's optional toolFilter), and calls
 * `visit` for each surviving tool — with the still-open client it was listed from —
 * before closing the connection. The shared shape behind both `listAutonomousAgentTools`
 * (executable AI SDK tools) and `listAutonomousAgentToolDescriptors` (diagnostic
 * descriptors only) — there is exactly one copy of the connect/list/filter/close loop.
 *
 * A session is obtained lazily and only once: an agent whose entries are all `none`/`apiKey` performs
 * no exchange at all.
 *
 * WHO it acts as is injected (see ../agent-identity/service.ts) rather than derived from the agent. That
 * is the one seam a personal assistant needs: it has no non-human identity, and acts as the person using
 * it through their forwarded session. Everything else about gathering tools is identical, which is the
 * point — one loop can serve both because only this line differs.
 */
export const forEachListedTool = async (
  autonomousAgent: AutonomousAgentForTools,
  sessionProvider: SessionProvider,
  visit: (t: ListedMcpTool, server: GlobalMcpServer, client: Client) => void,
  opts?: { keepConnectionsOpen?: boolean, onServerError?: 'throw' | 'skip', skipped?: SkippedServer[] }
): Promise<() => Promise<void>> => {
  const catalog = config.mcpServers ?? []
  const refs = autonomousAgent.mcpServers ?? []
  const needsSession = refs.some(ref => catalog.find(s => s.id === ref.serverId)?.auth === 'nhi-session')
  const cookieHeader = needsSession ? await sessionProvider() : undefined

  // Connections the caller is responsible for closing (keepConnectionsOpen only).
  const held: (() => Promise<void>)[] = []
  const closeHeld = async () => { for (const close of held.splice(0)) await close().catch(() => {}) }

  try {
    for (const ref of refs) {
      const server = catalog.find(s => s.id === ref.serverId)
      if (!server) throw httpError(400, `unknown MCP server "${ref.serverId}"`)

      // A raw connect/list failure names nothing, which is useless when an autonomous
      // agent references several servers. Wrap and rethrow naming server.id; never
      // include the credential (cookieHeader) in the message, only the error text.
      let client: Client | undefined
      let close: (() => Promise<void>) | undefined
      try {
        ({ client, close } = await connectMcpServer(server, cookieHeader))
        const listed = await client.listTools()
        for (const t of listed.tools) {
          if (ref.toolFilter?.length && !ref.toolFilter.includes(t.name)) continue
          visit(t, server, client)
        }
        if (opts?.keepConnectionsOpen) {
          // Handed to the caller: an executable tool's `execute` closes over this client,
          // and closing it here would make every call reject with 'Not connected'.
          held.push(close)
          close = undefined
        }
      } catch (err: any) {
        // THROW or SKIP, and the two are different semantics rather than a tolerance knob.
        //
        // A configured agent's server selection is deliberate, so a failure is a misconfiguration and
        // must surface loudly — a toolless turn would otherwise read as a capability problem.
        //
        // The personal assistant's selection is "everything in the catalog", so the same failure is an
        // availability event: taking down the whole assistant for a server the person never chose, and
        // may not need, is the wrong trade. data-fair/mcp's own composer draws this line the same way —
        // a failing service is excluded and reported, only a bad index throws.
        if (opts?.onServerError !== 'skip') throw httpError(502, `MCP server "${server.id}" failed: ${err.message}`)
        debug('skipping server=%s %s', server.id, err.message)
        opts.skipped?.push({ id: server.id, reason: err.message })
      } finally {
        await close?.()
      }
    }
  } catch (err) {
    // A later server failing must not leak the earlier ones' open connections.
    await closeHeld()
    throw err
  }

  return closeHeld
}

/**
 * The tool set for one autonomous agent: every tool of every catalog entry it
 * references, narrowed by that reference's optional toolFilter, as executable AI SDK
 * tools.
 */
export interface OpenAutonomousAgentTools {
  tools: Record<string, Tool>
  /** Which server each tool actually came from, for provenance and audit. */
  serverByTool: Map<string, string>
  /**
   * The MCP `annotations` each tool declared — `readOnlyHint`, `destructiveHint` and the rest.
   *
   * Recorded per call on the stored message, because they are what makes a write auditable after the
   * fact and are the input P1's approval gate reads. They were listed by the diagnostic endpoint and
   * dropped on the path that actually runs a tool, which is the path where they matter.
   */
  annotationsByTool: Map<string, Record<string, unknown>>
  /** Catalog entries that could not be reached; always empty unless the caller asked to skip. */
  skippedServers: SkippedServer[]
  /** MUST be called when the turn is over: until then the connections stay open. */
  close: () => Promise<void>
}

/**
 * The executable tool set for one autonomous agent, with its connections STILL OPEN.
 *
 * The connections cannot be closed before returning: each tool's `execute` closes over the
 * client it was listed from, and the MCP SDK's close() clears the transport, so every call
 * would reject with 'Not connected'. The caller owns the returned `close` and must call it
 * when the turn ends.
 */
export const openAutonomousAgentTools = async (
  autonomousAgent: AutonomousAgentForTools,
  sessionProvider: SessionProvider,
  opts?: { onServerError?: 'throw' | 'skip' }
): Promise<OpenAutonomousAgentTools> => {
  const tools: Record<string, Tool> = {}
  const serverByTool = new Map<string, string>()
  const annotationsByTool = new Map<string, Record<string, unknown>>()
  const skippedServers: SkippedServer[] = []
  const close = await forEachListedTool(autonomousAgent, sessionProvider, (t, server, client) => {
    // Last-write-wins on a name collision across servers, matching the browser
    // aggregator's Object.assign semantics — and the provenance map follows the same
    // winner, so the recorded server is the one whose tool will actually run.
    serverByTool.set(t.name, server.id)
    if (t.annotations) annotationsByTool.set(t.name, t.annotations as Record<string, unknown>)
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
        const formatted = formatMcpToolResult(callResult as any)
        // An MCP tool reports its OWN failure with `isError`, which is not a transport error and so
        // does not reject on its own. Rethrown as one, because that is the only thing the model loop
        // treats as a failure: returned as a value, the turn recorded a failed call in the exact shape
        // of a successful one — the conflation that hid a broken tool path for a whole plan. The AI SDK
        // turns this into a `tool-error` part, so the call is stored `output-error` and the model is
        // handed it as `error-text` rather than as data.
        if ((callResult as { isError?: boolean }).isError) {
          throw new Error(typeof formatted === 'string' ? formatted : formatted.text ?? 'Tool execution failed')
        }
        return formatted
      }
    })
  }, { keepConnectionsOpen: true, onServerError: opts?.onServerError, skipped: skippedServers })
  return { tools, serverByTool, annotationsByTool, skippedServers, close }
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
export const listAutonomousAgentToolDescriptors = async (
  autonomousAgent: AutonomousAgentForTools,
  sessionProvider: SessionProvider
): Promise<McpToolDescriptor[]> => {
  const descriptors: McpToolDescriptor[] = []
  await forEachListedTool(autonomousAgent, sessionProvider, (t, server) => {
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
