import type { JSONRPCMessage, Transport } from '@mcp-b/webmcp-ts-sdk';
export interface FrameServerTransportOptions {
    serverId: string;
    channelId?: string;
    serverReadyRetryMs?: number;
}
/**
 * FrameServerTransport - BroadcastChannel-based server transport.
 *
 * Any frame (parent or iframe) can use this to expose MCP tools.
 * Counterpart: FrameClientTransport connects to a specific serverId.
 */
export declare class FrameServerTransport implements Transport {
    private _started;
    private _channelId;
    private _serverId;
    private _channel;
    private _serverReadyTimeout;
    private readonly _serverReadyRetryMs;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;
    constructor(options: FrameServerTransportOptions);
    start(): Promise<void>;
    private broadcastServerReady;
    private scheduleServerReadyRetry;
    private clearServerReadyRetry;
    send(message: JSONRPCMessage): Promise<void>;
    close(): Promise<void>;
}
