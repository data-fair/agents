import { ref, onScopeDispose } from 'vue'
import type { Tool } from 'ai'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import { FrameClientAggregator } from '~/transports/frame-client-aggregator'

/**
 * Vue composable that discovers and aggregates tools from all FrameServerTransport
 * instances via BroadcastChannel.
 *
 * Use in the chat iframe to collect tools exposed by parent and sibling frames.
 */
export function useFrameTools () {
  const tools = ref<Record<string, Tool>>({})

  const aggregator = new FrameClientAggregator({
    channelId: getTabChannelId(),
    onToolsChanged: (newTools) => {
      tools.value = { ...newTools }
    }
  })

  aggregator.start()

  onScopeDispose(() => {
    aggregator.close()
  })

  return { tools }
}
