/**
 * Host events: how a host page tells the chat what happened and what is true now.
 *
 * One primitive — an event — consumed two ways by the chat. A KEYED event is state-like:
 * the chat retains only the last one per key (the location, a wizard's state). An
 * unkeyed event is a transition (creation done, dialog dismissed). Nothing here ever
 * starts a model turn: the chat folds events into the next request, or into a wait the
 * agent itself declared. See docs/architecture/host-events.md.
 */
import { watch, onScopeDispose, toValue, type MaybeRefOrGetter } from 'vue'
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

export type AgentEventDetail = string | Record<string, unknown> | undefined | null

export function serializeDetail (detail: AgentEventDetail): string | undefined {
  if (detail === undefined || detail === null) return undefined
  const text = typeof detail === 'string' ? detail : JSON.stringify(detail)
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
export function createStateEmitter (key: string, post: (msg: Omit<HostEventMessage, 'channel'>) => void): StateEmitter {
  let last: string | undefined
  const emit = (detail: string) => {
    post({ type: 'agent-event', event: { name: key, detail, key, at: Date.now() } } as Omit<HostEventMessage, 'channel'>)
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
      post({ type: 'agent-state-withdrawn', key } as Omit<HostEventMessage, 'channel'>)
    }
  }
}

// ---- Vue-facing API (Task 2 fills these in) --------------------------------------------

let channel: BroadcastChannel | null = null
function getChannel (): BroadcastChannel {
  if (!channel) channel = new BroadcastChannel(getTabChannelId())
  return channel
}
function post (msg: Omit<HostEventMessage, 'channel'>): void {
  debug('post %o', msg)
  getChannel().postMessage({ channel: getTabChannelId(), ...msg })
}

export function emitAgentEvent (name: string, detail?: AgentEventDetail, options?: { key?: string }): void {
  if (typeof window === 'undefined') return
  post({ type: 'agent-event', event: buildAgentEvent(name, detail, options?.key) } as Omit<HostEventMessage, 'channel'>)
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
  onScopeDispose(() => {
    stop()
    ch.removeEventListener('message', onMessage)
    emitter.dispose()
  })
}
