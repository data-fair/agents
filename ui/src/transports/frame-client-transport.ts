// Adapted from IframeParentTransport (postMessage → BroadcastChannel)
// https://github.com/WebMCP-org/npm-packages/blob/main/packages/transports/src/IframeParentTransport.ts

import type { JSONRPCMessage, Transport } from '@mcp-b/webmcp-ts-sdk'
import { JSONRPCMessageSchema } from '@mcp-b/webmcp-ts-sdk'

const DEFAULT_CHANNEL_ID = 'mcp-frame'
const DEFAULT_CHECK_READY_RETRY_MS = 250

interface FrameClientTransportOptions {
  serverId: string
  channelId?: string
  checkReadyRetryMs?: number
}

interface FrameMessage {
  channel: string
  type: 'mcp' | 'mcp-server-ready' | 'mcp-server-stopped' | 'mcp-check-ready'
  serverId: string
  direction?: 'server-to-client' | 'client-to-server'
  payload?: JSONRPCMessage
}

/**
 * FrameClientTransport - BroadcastChannel-based client transport.
 *
 * Connects to a specific FrameServerTransport by serverId.
 * Works across all same-origin contexts (parent, iframes).
 */
export class FrameClientTransport implements Transport {
  private _started = false
  private _channelId: string
  private _serverId: string
  private _channel: BroadcastChannel | null = null
  private _checkReadyTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly _checkReadyRetryMs: number

  readonly serverReadyPromise: Promise<void>
  private _serverReadyResolve!: () => void

  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage) => void

  constructor (options: FrameClientTransportOptions) {
    this._serverId = options.serverId
    this._channelId = options.channelId ?? DEFAULT_CHANNEL_ID
    this._checkReadyRetryMs = options.checkReadyRetryMs ?? DEFAULT_CHECK_READY_RETRY_MS

    this.serverReadyPromise = new Promise<void>((resolve) => {
      this._serverReadyResolve = resolve
    })
  }

  async start (): Promise<void> {
    if (this._started) return
    this._started = true

    this._channel = new BroadcastChannel(this._channelId)
    this._channel.onmessage = (event: MessageEvent<FrameMessage>) => {
      const data = event.data
      if (!data || data.channel !== this._channelId) return
      if (data.serverId !== this._serverId) return

      if (data.type === 'mcp-server-ready') {
        this.clearCheckReadyRetry()
        this._serverReadyResolve()
        return
      }

      if (data.type === 'mcp-server-stopped') {
        this.close()
        return
      }

      if (data.type === 'mcp' && data.direction === 'server-to-client' && data.payload) {
        const parsed = JSONRPCMessageSchema.safeParse(data.payload)
        if (parsed.success) {
          this.onmessage?.(parsed.data as JSONRPCMessage)
        } else {
          this.onerror?.(new Error(`Invalid JSON-RPC message: ${parsed.error.message}`))
        }
      }
    }

    this.sendCheckReady()
    this.scheduleCheckReadyRetry()
  }

  private sendCheckReady (): void {
    this._channel?.postMessage({
      channel: this._channelId,
      type: 'mcp-check-ready',
      serverId: this._serverId
    } satisfies FrameMessage)
  }

  private scheduleCheckReadyRetry (): void {
    this._checkReadyTimeout = setTimeout(() => {
      if (this._started) {
        this.sendCheckReady()
        this.scheduleCheckReadyRetry()
      }
    }, this._checkReadyRetryMs)
  }

  private clearCheckReadyRetry (): void {
    if (this._checkReadyTimeout) {
      clearTimeout(this._checkReadyTimeout)
      this._checkReadyTimeout = null
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
      direction: 'client-to-server',
      payload: message
    } satisfies FrameMessage)
  }

  async close (): Promise<void> {
    this.clearCheckReadyRetry()
    if (this._channel) {
      this._channel.close()
      this._channel = null
    }
    this._started = false
    this.onclose?.()
  }
}
