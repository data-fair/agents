/**
 * Host events: how a host page tells the chat what happened and what is true now.
 *
 * One primitive — an event — consumed two ways by the chat. A KEYED event is state-like:
 * the chat retains only the last one per key (the location, a wizard's state). An
 * unkeyed event is a transition (creation done, dialog dismissed). Nothing here ever
 * starts a model turn: the chat folds events into the next request, or into a wait the
 * agent itself declared. See docs/architecture/host-events.md.
 */
import { watch, onScopeDispose, getCurrentScope, toValue, type MaybeRefOrGetter } from 'vue'
import { getTabChannelId } from './get-tab-channel-id.js'
import Debug from './debug.js'

const debug = Debug('df-agents:host-events')

export const EVENT_DETAIL_MAX_CHARS = 1000
export const TRUNCATED_MARKER = '… [truncated]'

export interface AgentEvent {
  name: string
  detail?: string
  /** Present on state-like events: a later event with the same key supersedes this one. */
  key?: string
  at: number
}

export interface AgentEventMessage { channel: string, type: 'agent-event', event: AgentEvent }
export interface AgentStateWithdrawnMessage { channel: string, type: 'agent-state-withdrawn', key: string }
export interface AgentStateRequestMessage { channel: string, type: 'agent-state-request' }
export type HostEventMessage = AgentEventMessage | AgentStateWithdrawnMessage | AgentStateRequestMessage

/**
 * `Omit<T, K>` does not distribute over a union — it collapses the three message
 * shapes into their common `type` field, losing `event` and `key`. This does.
 */
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

/** The channel a publisher posts on, with the channel id filled in by the caller. */
export type HostEventPost = (msg: DistributiveOmit<HostEventMessage, 'channel'>) => void

/**
 * A string, or anything JSON-serialisable.
 *
 * `object` rather than `Record<string, unknown>`: TypeScript gives implicit
 * index signatures to type ALIASES only, so a host declaring its payload as an
 * `interface` — the natural way to write it — finds it is not assignable to an
 * index-signature type. Making every host restate its types as aliases, or
 * carry a `[key: string]: unknown` nothing ever reads, is a tax with nothing
 * behind it. Found by the first real integration (data-fair).
 */
export type AgentEventDetail = string | object | undefined | null

// Sentinels the chat's hidden-context/host-events/host-state wrappers use to find their
// own boundaries (ui/src/traces/hidden-context.ts, ui/src/composables/host-events.ts). A
// raw string detail is placed verbatim into a line-oriented block inside one of these
// wrappers; without neutralising them here, a host mirroring free user text (a wizard
// title, a description field — exactly what a real integration carries) could smuggle a
// closing sentinel through and terminate the wrapper early, causing whatever follows to
// be reconstructed and rendered as the user's own message. The JSON-object branch below
// is already safe: JSON.stringify escapes real newlines, so a closing tag it contains
// can never be flanked by the real newline characters the wrapper regex requires.
const CLOSING_SENTINELS = ['</hidden-context>', '</host-events>', '</host-state>']

function neutralizeSentinels (text: string): string {
  return CLOSING_SENTINELS.reduce(
    (acc, sentinel) => acc.split(sentinel).join(sentinel.replace('</', '<\\/')),
    text
  )
}

export function serializeDetail (detail: AgentEventDetail): string | undefined {
  if (detail === undefined || detail === null) return undefined
  let text = typeof detail === 'string' ? detail : JSON.stringify(detail)
  if (typeof detail === 'string') {
    // Mirror what JSON.stringify already does for the object branch (escape real
    // newlines to a literal `\n`) so a raw string detail can't break the line-oriented
    // block format, then neutralise the sentinels themselves as defense in depth.
    text = neutralizeSentinels(text.replace(/\r\n|\r|\n/g, '\\n'))
  }
  if (text.length <= EVENT_DETAIL_MAX_CHARS) return text
  return text.slice(0, EVENT_DETAIL_MAX_CHARS - TRUNCATED_MARKER.length) + TRUNCATED_MARKER
}

export function buildAgentEvent (name: string, detail?: AgentEventDetail, key?: string, at: number = Date.now()): AgentEvent {
  const event: AgentEvent = { name, at }
  const serialized = serializeDetail(detail)
  if (serialized !== undefined) event.detail = serialized
  if (key) event.key = key
  return event
}

export interface StateEmitter {
  update (value: AgentEventDetail): void
  resend (): void
  dispose (): void
}

/**
 * The pure half of useAgentState: emits a keyed event when the serialised value changes,
 * re-emits on request, withdraws on dispose. `post` is the channel; injected so the
 * behaviour is unit-testable without a BroadcastChannel.
 */
export function createStateEmitter (key: string, post: HostEventPost): StateEmitter {
  let last: string | undefined
  const emit = (detail: string) => {
    post({ type: 'agent-event', event: { name: key, detail, key, at: Date.now() } })
  }
  return {
    update (value) {
      const detail = serializeDetail(value)
      if (detail === undefined || detail === last) return
      last = detail
      emit(detail)
    },
    resend () {
      if (last !== undefined) emit(last)
    },
    dispose () {
      post({ type: 'agent-state-withdrawn', key })
    }
  }
}

// ---- Vue-facing API: the real BroadcastChannel wiring ----

let channel: BroadcastChannel | null = null
function getChannel (): BroadcastChannel {
  if (!channel) channel = new BroadcastChannel(getTabChannelId())
  return channel
}
function post (msg: DistributiveOmit<HostEventMessage, 'channel'>): void {
  debug('post %o', msg)
  getChannel().postMessage({ channel: getTabChannelId(), ...msg })
}

export function emitAgentEvent (name: string, detail?: AgentEventDetail, options?: { key?: string }): void {
  if (typeof window === 'undefined') return
  post({ type: 'agent-event', event: buildAgentEvent(name, detail, options?.key) })
}

export function useAgentState (key: string, source: MaybeRefOrGetter<AgentEventDetail>): void {
  if (typeof window === 'undefined') return
  const emitter = createStateEmitter(key, post)
  const stop = watch(() => toValue(source), value => emitter.update(value), { immediate: true, deep: true })
  const channelId = getTabChannelId()
  const ch = getChannel()
  const onMessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || data.channel !== channelId) return
    if (data.type === 'agent-state-request') emitter.resend()
  }
  ch.addEventListener('message', onMessage)
  // Guarded like useHostEvents: called outside an effect scope (a plain function, not
  // component setup), onScopeDispose logs a Vue warning and silently never registers —
  // the key would then never be withdrawn from retention.
  if (getCurrentScope()) {
    onScopeDispose(() => {
      stop()
      ch.removeEventListener('message', onMessage)
      emitter.dispose()
    })
  }
}
