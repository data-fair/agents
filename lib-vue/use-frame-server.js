import { onScopeDispose } from 'vue';
import { BrowserMcpServer } from '@mcp-b/webmcp-ts-sdk';
import { FrameServerTransport } from './frame-server-transport.js';
/**
 * Replaces navigator.modelContext with a BrowserMcpServer connected to a
 * FrameServerTransport (BroadcastChannel). After calling this composable,
 * any tool registered via navigator.modelContext.registerTool() is
 * automatically exposed to other frames via BroadcastChannel.
 *
 * @param serverId — unique identifier for this server (e.g. 'parent', 'tools-iframe')
 */
export function useFrameServer(serverId) {
    const transport = new FrameServerTransport({ serverId });
    const server = new BrowserMcpServer({ name: `frame-${serverId}`, version: '1.0.0' }, 
    // Wrap the existing polyfill so already-registered tools are preserved
    { native: navigator.modelContext });
    server.connect(transport);
    // Replace navigator.modelContext so the standard API routes through our server
    const originalModelContext = navigator.modelContext;
    Object.defineProperty(navigator, 'modelContext', {
        value: server,
        writable: true,
        configurable: true
    });
    onScopeDispose(() => {
        transport.close();
        server.close();
        Object.defineProperty(navigator, 'modelContext', {
            value: originalModelContext,
            writable: true,
            configurable: true
        });
    });
}
