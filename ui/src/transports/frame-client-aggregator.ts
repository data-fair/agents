import { Client, ToolListChangedNotificationSchema } from '@mcp-b/webmcp-ts-sdk'
import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import { FrameClientTransport } from './frame-client-transport'

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

    this._channel = new BroadcastChannel(this._channelId)
    this._channel.onmessage = (event: MessageEvent<FrameMessage>) => {
      const data = event.data
      if (!data || data.channel !== this._channelId) return

      if (data.type === 'mcp-server-ready') {
        this.connectToServer(data.serverId)
      } else if (data.type === 'mcp-server-stopped') {
        this.disconnectServer(data.serverId)
      }
    }
  }

  private async connectToServer (serverId: string): Promise<void> {
    if (this._servers.has(serverId)) return

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
      await this.refreshServerTools(serverId)
    })

    const server: ConnectedServer = { client, transport, tools: {} }
    this._servers.set(serverId, server)

    try {
      await client.connect(transport)
      await transport.serverReadyPromise
      await this.refreshServerTools(serverId)
    } catch (err) {
      console.error(`Failed to connect to frame server "${serverId}":`, err)
      this._servers.delete(serverId)
    }
  }

  private async refreshServerTools (serverId: string): Promise<void> {
    const server = this._servers.get(serverId)
    if (!server) return

    try {
      const result = await server.client.listTools()
      const tools: Record<string, Tool> = {}

      for (const t of result.tools) {
        tools[t.name] = tool({
          description: t.description || '',
          inputSchema: jsonSchema(t.inputSchema as any || { type: 'object', properties: {} }),
          execute: async (args: any) => {
            const callResult = await server.client.callTool({ name: t.name, arguments: args })
            return callResult
          }
        })
      }

      server.tools = tools
      this._onToolsChanged?.(this.getAggregatedTools())
    } catch (err) {
      console.error(`Failed to list tools from frame server "${serverId}":`, err)
    }
  }

  private async disconnectServer (serverId: string): Promise<void> {
    const server = this._servers.get(serverId)
    if (!server) return

    try {
      await server.client.close()
    } catch {
      // ignore close errors
    }
    this._servers.delete(serverId)
    this._onToolsChanged?.(this.getAggregatedTools())
  }

  getAggregatedTools (): Record<string, Tool> {
    const tools: Record<string, Tool> = {}
    for (const server of this._servers.values()) {
      Object.assign(tools, server.tools)
    }
    return tools
  }

  async close (): Promise<void> {
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
