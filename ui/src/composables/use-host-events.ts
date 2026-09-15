import { getCurrentScope, onScopeDispose } from 'vue'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import { HostEventStore } from './host-events'
import Debug from 'debug'

const debug = Debug('df-agents:use-host-events')

/**
 * Feeds a HostEventStore from the tab BroadcastChannel. Posts one agent-state-request on
 * creation so pages that mounted before this chat re-emit their keyed state (retention
 * is rebuilt; transitions that happened before the chat existed are gone by design).
 */
export function useHostEvents (store: HostEventStore = new HostEventStore()): HostEventStore {
  const channelId = getTabChannelId()
  const channel = new BroadcastChannel(channelId)
  channel.onmessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || data.channel !== channelId) return
    if (data.type === 'agent-event' && data.event) {
      debug('event %o', data.event)
      store.push(data.event)
    } else if (data.type === 'agent-state-withdrawn' && data.key) {
      debug('withdrawn %s', data.key)
      store.withdraw(data.key)
    }
  }
  channel.postMessage({ channel: channelId, type: 'agent-state-request' })
  if (getCurrentScope()) onScopeDispose(() => channel.close())
  return store
}
