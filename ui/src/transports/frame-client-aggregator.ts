import { Client, ToolListChangedNotificationSchema, PolyfillJsonSchemaValidator, CallToolResultSchema } from '@mcp-b/webmcp-ts-sdk'
import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import { FrameClientTransport } from './frame-client-transport'
import { formatMcpToolResult, type McpCallResult } from '~/utils/tool-result'
import Debug from 'debug'

const debug = Debug('df-agents:frame-client-aggregator')

const DEFAULT_CHANNEL_ID = 'mcp-frame'

interface FrameMessage {
  channel: string
  type: 'mcp' | 'mcp-server-ready' | 'mcp-server-stopped' | 'mcp-check-ready'
  serverId: string
}

interface ConnectedServer {
  client: Client
  transport: FrameClientTransport
  tools: Record<string, Tool>
}

interface FrameClientAggregatorOptions {
  channelId?: string
  onToolsChanged?: (tools: Record<string, Tool>) => void
}

/**
 * Aggregates tools from multiple FrameServerTransport instances.
 *
 * Listens for server-ready broadcasts on BroadcastChannel, connects to each
 * discovered server, and merges their tools into a single map.
 */
export class FrameClientAggregator {
  private _channelId: string
  private _channel: BroadcastChannel | null = null
  private _servers = new Map<string, ConnectedServer>()
  private _onToolsChanged?: (tools: Record<string, Tool>) => void
  /** tools/list_changed refreshes still in flight; see settled(). */
  private _pendingRefreshes = new Set<Promise<void>>()
  private _started = false

  constructor (options: FrameClientAggregatorOptions = {}) {
    this._channelId = options.channelId ?? DEFAULT_CHANNEL_ID
    this._onToolsChanged = options.onToolsChanged
  }

  start (): void {
    if (this._started) return
    this._started = true

    debug('start aggregator channel=%s', this._channelId)
    this._channel = new BroadcastChannel(this._channelId)
    this._channel.onmessage = (event: MessageEvent<FrameMessage>) => {
      const data = event.data
      if (!data || data.channel !== this._channelId) return

      if (data.type === 'mcp-server-ready') {
        debug('discovered server=%s', data.serverId)
        this.connectToServer(data.serverId)
      } else if (data.type === 'mcp-server-stopped') {
        debug('server stopped=%s', data.serverId)
        this.disconnectServer(data.serverId)
      }
    }
  }

  private async connectToServer (serverId: string): Promise<void> {
    if (this._servers.has(serverId)) return

    debug('connecting to server=%s', serverId)
    const transport = new FrameClientTransport({
      serverId,
      channelId: this._channelId
    })

    const client = new Client(
      { name: `frame-aggregator-${serverId}`, version: '1.0.0' },
      { capabilities: {}, jsonSchemaValidator: new PolyfillJsonSchemaValidator() }
    )

    // Set up tools/list_changed notification handler. The refresh is tracked so a tool
    // call that CAUSED the change can wait for it — see settled().
    client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
      debug('tools/list_changed from server=%s', serverId)
      await this.trackRefresh(serverId)
    })

    const server: ConnectedServer = { client, transport, tools: {} }
    this._servers.set(serverId, server)

    try {
      await client.connect(transport)
      await transport.serverReadyPromise
      debug('connected to server=%s', serverId)
      await this.refreshServerTools(serverId)
    } catch (err) {
      debug('failed to connect to server=%s %O', serverId, err)
      console.error(`Failed to connect to frame server "${serverId}":`, err)
      this._servers.delete(serverId)
    }
  }

  /**
   * Run a refresh while making it awaitable by {@link settled}.
   */
  private trackRefresh (serverId: string): Promise<void> {
    const refresh = this.refreshServerTools(serverId)
      .finally(() => { this._pendingRefreshes.delete(refresh) })
    this._pendingRefreshes.add(refresh)
    return refresh
  }

  /**
   * Resolves once every tools/list_changed refresh currently in flight has been folded
   * into the aggregate (and `onToolsChanged` fired for it).
   *
   * A host tool that registers new tools does so DURING its own execution, so the
   * notification is put on the channel before the tool's result. BroadcastChannel delivery
   * is FIFO per channel, so by the time a tools/call response resolves, the matching
   * notification has already been dispatched and its refresh is in this set — which is why
   * awaiting here is deterministic rather than a timing guess.
   */
  async settled (): Promise<void> {
    while (this._pendingRefreshes.size) await Promise.all([...this._pendingRefreshes])
  }

  private async refreshServerTools (serverId: string): Promise<void> {
    const server = this._servers.get(serverId)
    if (!server) return

    try {
      const result = await server.client.listTools()
      const toolNames = result.tools.map(t => t.name)
      debug('refreshed tools from server=%s tools=%o', serverId, toolNames)
      const tools: Record<string, Tool> = {}

      for (const t of result.tools) {
        const aiTool = tool({
          description: t.description || '',
          inputSchema: jsonSchema(t.inputSchema as any || { type: 'object', properties: {} }),
          execute: async (args: any) => {
            debug('execute tool=%s via server=%s args=%o', t.name, serverId, args)
            // Issue the tools/call request directly instead of via client.callTool().
            // callTool() additionally enforces the tool's declared outputSchema against
            // the result's `structuredContent`, throwing when it is absent or mismatched.
            // But formatMcpToolResult discards structuredContent entirely — it keeps only
            // text and image parts (the latter as a media envelope the gateway decodes) —
            // so that validation can only ever break an otherwise-usable call over a value
            // we throw away. Going through request() keeps the identical request path while
            // leaving validation coherent with the payload we actually consume.
            const callResult = await server.client.request({ method: 'tools/call', params: { name: t.name, arguments: args } }, CallToolResultSchema)
            debug('tool result=%s via server=%s result=%o', t.name, serverId, callResult)
            // If this call registered or dropped tools (opening a panel, navigating), the
            // notification is already in flight. Fold it in BEFORE handing the result back:
            // the caller starts its next model step the moment it has this value, and a
            // step built a few milliseconds too early misses the new tools for the whole
            // turn — the bug this ordering exists to prevent.
            await this.settled()
            return formatMcpToolResult(callResult as McpCallResult)
          }
        })
        const title = (t as any).annotations?.title
        if (title) (aiTool as any).title = title
        tools[t.name] = aiTool
      }

      server.tools = tools
      const aggregated = this.getAggregatedTools()
      debug('aggregated tools=%o', Object.keys(aggregated))
      this._onToolsChanged?.(aggregated)
    } catch (err) {
      debug('failed to list tools from server=%s %O', serverId, err)
      console.error(`Failed to list tools from frame server "${serverId}":`, err)
    }
  }

  private async disconnectServer (serverId: string): Promise<void> {
    const server = this._servers.get(serverId)
    if (!server) return

    debug('disconnecting server=%s', serverId)
    try {
      await server.client.close()
    } catch {
      // ignore close errors
    }
    this._servers.delete(serverId)
    const aggregated = this.getAggregatedTools()
    debug('after disconnect, aggregated tools=%o', Object.keys(aggregated))
    this._onToolsChanged?.(aggregated)
  }

  getAggregatedTools (): Record<string, Tool> {
    const tools: Record<string, Tool> = {}
    for (const server of this._servers.values()) {
      Object.assign(tools, server.tools)
    }
    return tools
  }

  async close (): Promise<void> {
    debug('closing aggregator')
    for (const serverId of [...this._servers.keys()]) {
      await this.disconnectServer(serverId)
    }
    if (this._channel) {
      this._channel.close()
      this._channel = null
    }
    this._started = false
  }
}
