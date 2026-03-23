import { Client, ToolListChangedNotificationSchema } from '@mcp-b/webmcp-ts-sdk'
import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import { FrameClientTransport } from './frame-client-transport'
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
      { capabilities: {} }
    )

    // Set up tools/list_changed notification handler
    client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
      debug('tools/list_changed from server=%s', serverId)
      await this.refreshServerTools(serverId)
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

  private async refreshServerTools (serverId: string): Promise<void> {
    const server = this._servers.get(serverId)
    if (!server) return

    try {
      const result = await server.client.listTools()
      const toolNames = result.tools.map(t => t.name)
      debug('refreshed tools from server=%s tools=%o', serverId, toolNames)
      const tools: Record<string, Tool> = {}

      for (const t of result.tools) {
        tools[t.name] = tool({
          description: t.description || '',
          inputSchema: jsonSchema(t.inputSchema as any || { type: 'object', properties: {} }),
          execute: async (args: any) => {
            debug('execute tool=%s via server=%s args=%o', t.name, serverId, args)
            const callResult = await server.client.callTool({ name: t.name, arguments: args })
            debug('tool result=%s via server=%s result=%o', t.name, serverId, callResult)
            return callResult
          }
        })
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
