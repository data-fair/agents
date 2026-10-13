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

import { fetch as undiciFetch } from 'undici'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { tool, jsonSchema, type Tool } from 'ai'
import Debug from 'debug'
import { formatMcpToolResult } from '@agents/shared/tool-result'
import { toolDescription } from '@agents/shared/tool-description'
import { fileArgumentsOf, withResourceLinks, resourceLinksOf, hideLinkUris } from '../files/operations.ts'
import { publicDispatcher } from '../web/public-lookup.ts'
import { externalToolName, normalizeExternalMcpServers, EXTERNAL_MCP_SERVERS_MAX } from './operations.ts'
import { MAX_CALLS_PER_RUN } from '../web/operations.ts'
import type { SkippedServer, McpToolDescriptor, ListedMcpTool } from './client.ts'
import type { ToolSet } from '../conversations/operations.ts'
import { boundGuide, type ServerGuide, type GuideSkill } from './guides.ts'
import { MCP_CLIENT_CAPABILITIES, SKILLS_LIST_TIMEOUT_MS, listServerSkills, readServerSkill } from './skills-client.ts'

const debug = Debug('agents:mcp-external')

/**
 * A fetch that only reaches public addresses, follows no redirect and sends only what the transport sets.
 * Its dispatcher keeps connections alive, so the caller closes it with the turn: left open it would hold
 * sockets (and a server's shutdown) for as long as the keep-alive lasts.
 */
const publicFetch = (publicIps: string[]) => {
  const dispatcher = publicDispatcher(publicIps)
  const fetchImpl = ((url: string | URL, init?: RequestInit) => undiciFetch(url, { ...(init as any), dispatcher, redirect: 'error' })) as unknown as typeof fetch
  return { fetchImpl, closeDispatcher: () => dispatcher.close().catch(() => {}) }
}

/** Bound on connecting and listing one external server: a slow one must not delay every turn of the agent. */
const CONNECT_TIMEOUT_MS = 15_000

const serverId = (url: string) => new URL(url).host

const errorText = (err: any): string => err?.cause?.message ? `${err.message}: ${err.cause.message}` : String(err?.message ?? err)

export const openExternalMcpTools = async (servers: { url: string }[], opts: { publicIps: string[], maxCalls?: number, timeoutMs?: number }) => {
  const { fetchImpl, closeDispatcher } = publicFetch(opts.publicIps)
  const maxCalls = opts.maxCalls ?? MAX_CALLS_PER_RUN
  const timeoutMs = opts.timeoutMs ?? CONNECT_TIMEOUT_MS
  const tools: ToolSet = {}
  const skippedServers: SkippedServer[] = []
  const clients: Client[] = []
  // What each connected server says about its tools, by host (the label its tools are recorded under).
  const described = new Map<string, { client: Client, instructions?: string, skills: GuideSkill[] }>()
  let used = 0

  // Connected together, and held for the turn: a turn waits for its slowest external server.
  await Promise.all(servers.map(async ({ url }) => {
    const client = new Client({ name: 'data-fair-agents', version: '1.0.0' }, { capabilities: MCP_CLIENT_CAPABILITIES as any })
    const signal = AbortSignal.timeout(timeoutMs)
    let timer: NodeJS.Timeout | undefined
    try {
      // One bound on connect + list; tool calls later are not under it. The race is the guarantee (a
      // server that accepts the connection and never answers); the request options also abort the
      // pending fetches so nothing stays hanging after the skip.
      const connecting = (async () => {
        await client.connect(new StreamableHTTPClientTransport(new URL(url), { fetch: fetchImpl }), { signal, timeout: timeoutMs })
        const tools = (await client.listTools({}, { signal, timeout: timeoutMs })).tools as ListedMcpTool[]
        const instructions = client.getInstructions()?.trim() || undefined
        described.set(serverId(url), { client, ...(instructions ? { instructions } : {}), skills: await listServerSkills(client, serverId(url), Math.min(SKILLS_LIST_TIMEOUT_MS, Math.floor(timeoutMs / 2))) })
        return tools
      })()
      connecting.catch(() => {})
      const timedOut = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms connecting to the server`)), timeoutMs)
      })
      const listed = await Promise.race([connecting, timedOut])
      clients.push(client)
      for (const t of listed) {
        // A tool taking a file is never offered from an external server: files.publicUrl is where the
        // platform's own servers reach this API (in a cluster, an internal address), so it could not succeed.
        if (fileArgumentsOf(t.inputSchema).fileArgs.length) { debug('skip tool=%s server=%s: it takes a file', t.name, url); continue }
        const name = externalToolName(url, t.name)
        const connected = client
        // The call cap is spent here, once per call, whichever form (the model's or a script's) runs it.
        const callExternal = async (args: any) => {
          if (++used > maxCalls) throw new Error(`this run has used all of its ${maxCalls} external MCP calls`)
          debug('call tool=%s server=%s', t.name, url)
          const callResult = await connected.request({ method: 'tools/call', params: { name: t.name, arguments: args } }, CallToolResultSchema)
          const formatted = formatMcpToolResult(callResult as any)
          // Same rule as a catalog tool (./client.ts): a tool's own failure is a failure, not data.
          if ((callResult as { isError?: boolean }).isError) {
            throw new Error(hideLinkUris(typeof formatted === 'string' ? formatted : formatted.text ?? 'Tool execution failed', callResult as any))
          }
          return { callResult, formatted }
        }
        const externalTool = tool({
          description: t.description ?? '',
          inputSchema: jsonSchema((t.inputSchema as any) ?? { type: 'object', properties: {} }),
          execute: async (args: any) => {
            const { callResult, formatted } = await callExternal(args)
            return withResourceLinks(formatted, callResult as any, { catalog: false })
          }
        })
        // A script gets structuredContent when the server sent one, else the text (as a catalog tool, ./client.ts);
        // a media result, its text only.
        const codeExecute = async (args: any) => {
          const { callResult, formatted } = await callExternal(args)
          const text = typeof formatted === 'string' ? formatted : formatted.text ?? ''
          const structured = (callResult as { structuredContent?: unknown }).structuredContent
          return resourceLinksOf(callResult as any).length || structured === undefined ? withResourceLinks(text, callResult as any, { catalog: false }) : structured
        }
        tools[name] = { tool: externalTool, codeExecute, server: serverId(url), ...(t.annotations ? { annotations: t.annotations as Record<string, unknown> } : {}) }
      }
    } catch (err: any) {
      // Skipped and reported, never fatal: the organization chose the server, not the operator, and it
      // lives outside the platform — its being down must not take the agent down.
      await Promise.race([client.close().catch(() => {}), new Promise(resolve => setTimeout(resolve, 1000).unref())])
      debug('skipping external server=%s %s', url, errorText(err))
      skippedServers.push({ id: serverId(url), reason: signal.aborted ? `timed out after ${timeoutMs} ms connecting to the server` : errorText(err) })
    } finally {
      clearTimeout(timer)
    }
  }))

  return {
    tools,
    skippedServers,
    // In the agent's order, not connection order, so the prompt block is stable from turn to turn.
    guides: servers.flatMap(({ url }): ServerGuide[] => {
      const held = described.get(serverId(url))
      if (!held || !clients.includes(held.client)) return []
      const guide = boundGuide({ server: serverId(url), ...(held.instructions ? { instructions: held.instructions } : {}), skills: held.skills })
      return guide.instructions || guide.skills.length ? [guide] : []
    }),
    readSkill: async (server: string, uri: string): Promise<string> => {
      const held = described.get(server)
      if (!held || !clients.includes(held.client)) throw new Error(`"${server}" is not one of your tool servers this turn`)
      return await readServerSkill(held.client, held.skills, uri)
    },
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
    const descriptors = Object.entries(opened.tools).map(([name, { tool, server, annotations }]) => ({
      name,
      description: toolDescription(tool),
      server: server!,
      ...(annotations ? { annotations } : {})
    }))
    return { descriptors, skipped: opened.skippedServers }
  } finally {
    await opened.close()
  }
}

export interface RequestMcpAccessInput { url: string, reason: string }

/**
 * Asking to connect an external MCP server — typically one web access discovered on a site it reads.
 * Always stops on an approval card, and only an administrator of the organization may approve it
 * (conversations/approvals.ts). Approved, it saves the extended list; the server's tools are offered
 * from the agent's next turn, when its tools are gathered.
 */
export const createRequestMcpAccessTool = (opts: { servers: { url: string }[], save: (servers: { url: string }[]) => Promise<void> }): Tool => tool({
  description: 'Ask an administrator of the organization to connect an external MCP server to you, such as the MCP server of another data portal, which you then use anonymously. The conversation stops until they decide. Say why the task needs it.',
  inputSchema: jsonSchema<RequestMcpAccessInput>({
    type: 'object',
    additionalProperties: false,
    required: ['url', 'reason'],
    properties: {
      url: { type: 'string', description: 'The MCP endpoint URL' },
      reason: { type: 'string', maxLength: 1000, description: 'Why the task needs it, for the administrator who decides' }
    }
  }),
  needsApproval: true,
  execute: async ({ url }: RequestMcpAccessInput) => {
    const updated = normalizeExternalMcpServers([...opts.servers, { url }])
    if (updated.length > EXTERNAL_MCP_SERVERS_MAX) throw new Error(`this agent already has the maximum of ${EXTERNAL_MCP_SERVERS_MAX} external MCP servers`)
    await opts.save(updated)
    return { externalMcpServers: updated, note: 'Its tools are available from your next turn.' }
  }
})
