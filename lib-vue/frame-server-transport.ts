// Adapted from IframeChildTransport (postMessage → BroadcastChannel)
// https://github.com/WebMCP-org/npm-packages/blob/main/packages/transports/src/IframeChildTransport.ts

import type { JSONRPCMessage, Transport } from '@mcp-b/webmcp-ts-sdk'
import { JSONRPCMessageSchema } from '@mcp-b/webmcp-ts-sdk'

const DEFAULT_CHANNEL_ID = 'mcp-frame'
const DEFAULT_READY_RETRY_MS = 250

export interface FrameServerTransportOptions {
  serverId: string
  channelId?: string
  serverReadyRetryMs?: number
}

interface FrameMessage {
  channel: string
  type: 'mcp' | 'mcp-server-ready' | 'mcp-server-stopped' | 'mcp-check-ready'
  serverId: string
  direction?: 'server-to-client' | 'client-to-server'
  payload?: JSONRPCMessage
}

/**
 * FrameServerTransport - BroadcastChannel-based server transport.
 *
 * Any frame (parent or iframe) can use this to expose MCP tools.
 * Counterpart: FrameClientTransport connects to a specific serverId.
 */
export class FrameServerTransport implements Transport {
  private _started = false
  private _channelId: string
  private _serverId: string
  private _channel: BroadcastChannel | null = null
  private _serverReadyTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly _serverReadyRetryMs: number

  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage) => void

  constructor (options: FrameServerTransportOptions) {
    this._serverId = options.serverId
    this._channelId = options.channelId ?? DEFAULT_CHANNEL_ID
    this._serverReadyRetryMs = options.serverReadyRetryMs ?? DEFAULT_READY_RETRY_MS
  }

  async start (): Promise<void> {
    if (this._started) return
    this._started = true

    this._channel = new BroadcastChannel(this._channelId)
    this._channel.onmessage = (event: MessageEvent<FrameMessage>) => {
      const data = event.data
      if (!data || data.channel !== this._channelId) return
      if (data.serverId !== this._serverId) return

      if (data.type === 'mcp-check-ready') {
        this.broadcastServerReady()
        return
      }

      if (data.type === 'mcp' && data.direction === 'client-to-server' && data.payload) {
        const parsed = JSONRPCMessageSchema.safeParse(data.payload)
        if (parsed.success) {
          this.onmessage?.(parsed.data as JSONRPCMessage)
        } else {
          this.onerror?.(new Error(`Invalid JSON-RPC message: ${parsed.error.message}`))
        }
      }
    }

    this.broadcastServerReady()
    this.scheduleServerReadyRetry()
  }

  private broadcastServerReady (): void {
    this._channel?.postMessage({
      channel: this._channelId,
      type: 'mcp-server-ready',
      serverId: this._serverId
    } satisfies FrameMessage)
  }

  private scheduleServerReadyRetry (): void {
    this._serverReadyTimeout = setTimeout(() => {
      if (this._started) {
        this.broadcastServerReady()
        this.scheduleServerReadyRetry()
      }
    }, this._serverReadyRetryMs)
  }

  private clearServerReadyRetry (): void {
    if (this._serverReadyTimeout) {
      clearTimeout(this._serverReadyTimeout)
      this._serverReadyTimeout = null
    }
  }

  async send (message: JSONRPCMessage): Promise<void> {
    if (!this._started || !this._channel) {
      throw new Error('Transport not started')
    }
    this._channel.postMessage({
      channel: this._channelId,
      type: 'mcp',
      serverId: this._serverId,
      direction: 'server-to-client',
      payload: message
    } satisfies FrameMessage)
  }

  async close (): Promise<void> {
    this.clearServerReadyRetry()
    if (this._channel) {
      this._channel.postMessage({
        channel: this._channelId,
        type: 'mcp-server-stopped',
        serverId: this._serverId
      } satisfies FrameMessage)
      this._channel.close()
      this._channel = null
    }
    this._started = false
    this.onclose?.()
  }
}
