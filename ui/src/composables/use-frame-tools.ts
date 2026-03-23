import { ref, onScopeDispose } from 'vue'
import type { Tool } from 'ai'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import { FrameClientAggregator } from '~/transports/frame-client-aggregator'
import Debug from 'debug'

const debug = Debug('df-agents:use-frame-tools')

/**
 * Vue composable that discovers and aggregates tools from all FrameServerTransport
 * instances via BroadcastChannel.
 *
 * Use in the chat iframe to collect tools exposed by parent and sibling frames.
 */
export function useFrameTools () {
  const tools = ref<Record<string, Tool>>({})

  const channelId = getTabChannelId()
  debug('init channelId=%s', channelId)

  const aggregator = new FrameClientAggregator({
    channelId,
    onToolsChanged: (newTools) => {
      debug('tools changed, count=%d names=%o', Object.keys(newTools).length, Object.keys(newTools))
      tools.value = { ...newTools }
    }
  })

  aggregator.start()

  onScopeDispose(() => {
    debug('disposing')
    aggregator.close()
  })

  return { tools }
}
