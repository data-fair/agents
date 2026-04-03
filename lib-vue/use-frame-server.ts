import { onScopeDispose } from 'vue'
import { BrowserMcpServer } from '@mcp-b/webmcp-ts-sdk'
import { FrameServerTransport } from './frame-server-transport.js'
import { getTabChannelId } from './get-tab-channel-id.js'
import Debug from './debug.js'

const debug = Debug('df-agents:use-frame-server')

/**
 * Replaces navigator.modelContext with a BrowserMcpServer connected to a
 * FrameServerTransport (BroadcastChannel). After calling this composable,
 * any tool registered via navigator.modelContext.registerTool() is
 * automatically exposed to other frames via BroadcastChannel.
 *
 * @param serverId — unique identifier for this server (e.g. 'parent', 'tools-iframe')
 */
export function useFrameServer (serverId: string) {
  const channelId = getTabChannelId()
  debug('init server=%s channel=%s', serverId, channelId)

  const transport = new FrameServerTransport({ serverId, channelId })
  const server = new BrowserMcpServer(
    { name: `frame-${serverId}`, version: '1.0.0' },
    // Wrap the existing polyfill so already-registered tools are preserved
    { native: navigator.modelContext }
  )

  debug('connecting BrowserMcpServer to transport')
  server.connect(transport)

  // Replace navigator.modelContext so the standard API routes through our server
  const originalModelContext = navigator.modelContext
  Object.defineProperty(navigator, 'modelContext', {
    value: server,
    writable: true,
    configurable: true
  })
  debug('navigator.modelContext replaced with BrowserMcpServer')

  onScopeDispose(() => {
    debug('disposing server=%s', serverId)
    transport.close()
    server.close()
    Object.defineProperty(navigator, 'modelContext', {
      value: originalModelContext,
      writable: true,
      configurable: true
    })
  })
}
