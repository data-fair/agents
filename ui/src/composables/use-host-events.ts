import { getCurrentScope, onScopeDispose } from 'vue'
import { getTabChannelId, type AgentEvent } from '@data-fair/lib-vue-agents'
import { HostEventStore } from '@agents/shared/host-events'
import Debug from 'debug'

const debug = Debug('df-agents:use-host-events')

/**
 * Shape-guards a raw `agent-event` payload at the channel boundary: a buggy or
 * malicious host could post anything on the tab's BroadcastChannel. Without this, a
 * missing/non-numeric `at` becomes an `Invalid Date` baked into every subsequent
 * `<host-events>`/`<host-state>` block, and a non-string `key` becomes a retention key
 * (breaking the Map-keyed coalescing/eviction the rest of the store assumes a string).
 * Returns null to drop an event with no usable name rather than guess one.
 */
function sanitizeEvent (raw: any): AgentEvent | null {
  if (!raw || typeof raw.name !== 'string' || !raw.name) return null
  const at = Number.isFinite(raw.at) ? raw.at : Date.now()
  const event: AgentEvent = { name: raw.name, at }
  if (typeof raw.detail === 'string') event.detail = raw.detail
  // A non-string key is dropped rather than coerced (stringifying it could silently
  // collide two unrelated keys); the event itself still gets through, as unkeyed.
  if (typeof raw.key === 'string' && raw.key) event.key = raw.key
  return event
}

/**
 * Subscribe to the tab BroadcastChannel's host events, sanitized.
 *
 * Split out from `useHostEvents` so the server-held loop can FORWARD the same events up the socket
 * instead of feeding a local store, without a second copy of the channel protocol or of
 * `sanitizeEvent`. Two copies of a boundary guard is two places to forget to harden.
 *
 * Posts one `agent-state-request` so pages that mounted before this chat re-emit their keyed state
 * (retention is rebuilt; transitions from before the chat existed are gone by design).
 */
export function subscribeHostEvents (handlers: {
  onEvent: (event: AgentEvent) => void
  onWithdraw: (key: string) => void
}): () => void {
  const channelId = getTabChannelId()
  const channel = new BroadcastChannel(channelId)
  channel.onmessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || data.channel !== channelId) return
    if (data.type === 'agent-event' && data.event) {
      const safe = sanitizeEvent(data.event)
      if (!safe) { debug('ignoring malformed event %o', data.event); return }
      debug('event %o', safe)
      handlers.onEvent(safe)
    } else if (data.type === 'agent-state-withdrawn' && data.key) {
      debug('withdrawn %s', data.key)
      handlers.onWithdraw(data.key)
    }
  }
  channel.postMessage({ channel: channelId, type: 'agent-state-request' })
  const close = () => channel.close()
  if (getCurrentScope()) onScopeDispose(close)
  return close
}

/** Feeds a HostEventStore from the tab BroadcastChannel. The in-browser loop's consumer. */
export function useHostEvents (store: HostEventStore = new HostEventStore()): HostEventStore {
  subscribeHostEvents({
    onEvent: event => store.push(event),
    onWithdraw: key => store.withdraw(key)
  })
  return store
}
