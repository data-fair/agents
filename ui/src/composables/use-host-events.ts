import { getCurrentScope, onScopeDispose } from 'vue'
import { getTabChannelId, TRUNCATED_MARKER, type AgentEvent } from '@data-fair/lib-vue-agents'
import { CLIENT_FRAME_LIMITS } from '@agents/shared/agent-session-protocol'
import Debug from 'debug'

const debug = Debug('df-agents:use-host-events')

/**
 * Shape-guards a raw `agent-event` payload at the channel boundary: a buggy or
 * malicious host could post anything on the tab's BroadcastChannel. Without this, a
 * missing/non-numeric `at` becomes an `Invalid Date` baked into every subsequent
 * `<host-events>`/`<host-state>` block, and a non-string `key` becomes a retention key
 * (breaking the Map-keyed coalescing/eviction the rest of the store assumes a string).
 * Returns null to drop an event with no usable name rather than guess one.
 *
 * Also fitted to the socket's frame limits (CLIENT_FRAME_LIMITS): a host posting here directly skips
 * lib-vue's serializeDetail, and an event the server refuses would be lost with an error instead.
 */
export function sanitizeEvent (raw: any): AgentEvent | null {
  if (!raw || typeof raw.name !== 'string' || !raw.name || raw.name.length > CLIENT_FRAME_LIMITS.eventName) return null
  const at = Number.isFinite(raw.at) ? raw.at : Date.now()
  const event: AgentEvent = { name: raw.name, at }
  if (typeof raw.detail === 'string') {
    const max = CLIENT_FRAME_LIMITS.eventDetail
    event.detail = raw.detail.length <= max ? raw.detail : raw.detail.slice(0, max - TRUNCATED_MARKER.length) + TRUNCATED_MARKER
  }
  // A non-string key is dropped rather than coerced (stringifying it could silently
  // collide two unrelated keys); the event itself still gets through, as unkeyed.
  if (typeof raw.key === 'string' && raw.key && raw.key.length <= CLIENT_FRAME_LIMITS.eventName) event.key = raw.key
  return event
}

/**
 * Subscribe to the tab BroadcastChannel's host events, sanitized.
 *
 * The server-held loop FORWARDS these up the socket rather than feeding a local store — the store
 * lives on the far side now, and it is the same `HostEventStore` class, so forwarding raw events
 * reproduces the browser's retention and coalescing instead of reimplementing them.
 *
 * The channel protocol and `sanitizeEvent` live here because the BroadcastChannel is an untrusted boundary: a buggy or hostile host can post
 * anything on it, and a malformed `at` or a non-string `key` corrupts what the model is told.
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
