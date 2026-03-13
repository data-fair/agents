/**
 * Replaces navigator.modelContext with a BrowserMcpServer connected to a
 * FrameServerTransport (BroadcastChannel). After calling this composable,
 * any tool registered via navigator.modelContext.registerTool() is
 * automatically exposed to other frames via BroadcastChannel.
 *
 * @param serverId — unique identifier for this server (e.g. 'parent', 'tools-iframe')
 */
export declare function useFrameServer(serverId: string): void;
