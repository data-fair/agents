// Adapted from IframeChildTransport (postMessage → BroadcastChannel)
// https://github.com/WebMCP-org/npm-packages/blob/main/packages/transports/src/IframeChildTransport.ts
import { JSONRPCMessageSchema } from '@mcp-b/webmcp-ts-sdk';
const DEFAULT_CHANNEL_ID = 'mcp-frame';
const DEFAULT_READY_RETRY_MS = 250;
/**
 * FrameServerTransport - BroadcastChannel-based server transport.
 *
 * Any frame (parent or iframe) can use this to expose MCP tools.
 * Counterpart: FrameClientTransport connects to a specific serverId.
 */
export class FrameServerTransport {
    _started = false;
    _channelId;
    _serverId;
    _channel = null;
    _serverReadyTimeout = null;
    _serverReadyRetryMs;
    onclose;
    onerror;
    onmessage;
    constructor(options) {
        this._serverId = options.serverId;
        this._channelId = options.channelId ?? DEFAULT_CHANNEL_ID;
        this._serverReadyRetryMs = options.serverReadyRetryMs ?? DEFAULT_READY_RETRY_MS;
    }
    async start() {
        if (this._started)
            return;
        this._started = true;
        this._channel = new BroadcastChannel(this._channelId);
        this._channel.onmessage = (event) => {
            const data = event.data;
            if (!data || data.channel !== this._channelId)
                return;
            if (data.serverId !== this._serverId)
                return;
            if (data.type === 'mcp-check-ready') {
                this.broadcastServerReady();
                return;
            }
            if (data.type === 'mcp' && data.direction === 'client-to-server' && data.payload) {
                const parsed = JSONRPCMessageSchema.safeParse(data.payload);
                if (parsed.success) {
                    this.onmessage?.(parsed.data);
                }
                else {
                    this.onerror?.(new Error(`Invalid JSON-RPC message: ${parsed.error.message}`));
                }
            }
        };
        this.broadcastServerReady();
        this.scheduleServerReadyRetry();
    }
    broadcastServerReady() {
        this._channel?.postMessage({
            channel: this._channelId,
            type: 'mcp-server-ready',
            serverId: this._serverId
        });
    }
    scheduleServerReadyRetry() {
        this._serverReadyTimeout = setTimeout(() => {
            if (this._started) {
                this.broadcastServerReady();
                this.scheduleServerReadyRetry();
            }
        }, this._serverReadyRetryMs);
    }
    clearServerReadyRetry() {
        if (this._serverReadyTimeout) {
            clearTimeout(this._serverReadyTimeout);
            this._serverReadyTimeout = null;
        }
    }
    async send(message) {
        if (!this._started || !this._channel) {
            throw new Error('Transport not started');
        }
        this._channel.postMessage({
            channel: this._channelId,
            type: 'mcp',
            serverId: this._serverId,
            direction: 'server-to-client',
            payload: message
        });
    }
    async close() {
        this.clearServerReadyRetry();
        if (this._channel) {
            this._channel.postMessage({
                channel: this._channelId,
                type: 'mcp-server-stopped',
                serverId: this._serverId
            });
            this._channel.close();
            this._channel = null;
        }
        this._started = false;
        this.onclose?.();
    }
}
