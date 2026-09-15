/**
 * Chat-side consumption of host events (see docs/architecture/host-events.md).
 *
 * Retention answers "what is true now" at the moments the model has no history to
 * integrate from (first turn, after reset, after compaction). The pending buffer holds
 * what the model has not been told yet; a declared wait takes the next event instead of
 * the buffer. Kept free of Vue and the `~` alias so the node unit runner can import it.
 */
import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import type { AgentEvent } from '@data-fair/lib-vue-agents'
import { isMediaToolResult } from '../utils/tool-result.ts'

export const RECENT_MAX = 10
export const HOST_EVENTS_OPEN = '<host-events>'
export const HOST_EVENTS_CLOSE = '</host-events>'
export const HOST_STATE_OPEN = '<host-state>'
export const HOST_STATE_CLOSE = '</host-state>'
export const WAIT_TOOL_NAME = 'wait_for_user_action'
export const WAIT_DEFAULT_SECONDS = 120
export const WAIT_MAX_SECONDS = 600

export type WaitOutcome = AgentEvent | 'timeout' | 'aborted'
export interface HostStateSnapshot { state: AgentEvent[], recent: AgentEvent[] }

export class HostEventStore {
  // Map keeps a key's original insertion position when its value is replaced, which is
  // the "first-seen key order" the snapshot relies on.
  private state = new Map<string, AgentEvent>()
  private recent: AgentEvent[] = []
  private pending: AgentEvent[] = []
  private waiter: ((event: AgentEvent) => void) | null = null

  push (event: AgentEvent): void {
    if (event.key) {
      this.state.set(event.key, event)
    } else {
      this.recent.push(event)
      if (this.recent.length > RECENT_MAX) this.recent.shift()
    }
    if (this.waiter) {
      const resolve = this.waiter
      this.waiter = null
      resolve(event)
      return
    }
    if (event.key) {
      const i = this.pending.findIndex(p => p.key === event.key)
      if (i >= 0) { this.pending[i] = event; return }
    }
    this.pending.push(event)
  }

  withdraw (key: string): void {
    this.state.delete(key)
  }

  snapshot (): HostStateSnapshot {
    return { state: [...this.state.values()], recent: [...this.recent] }
  }

  hasPending (): boolean { return this.pending.length > 0 }

  takePending (): AgentEvent[] {
    const pending = this.pending
    this.pending = []
    return pending
  }

  isWaiting (): boolean { return this.waiter !== null }

  waitForEvent (opts: { timeoutMs: number, signal?: AbortSignal }): Promise<WaitOutcome> {
    if (this.waiter) return Promise.reject(new Error('already-waiting'))
    if (this.pending.length) return Promise.resolve(this.pending.shift() as AgentEvent)
    return new Promise<WaitOutcome>(resolve => {
      // `timer` is assigned once, but only after `finish` (which reads it) is already
      // defined, and not at all on the early-abort path below; a `const` declared at the
      // assignment site would leave it in the temporal dead zone for that path instead.
      // eslint-disable-next-line prefer-const
      let timer: ReturnType<typeof setTimeout> | undefined
      const finish = (outcome: WaitOutcome) => {
        if (timer) clearTimeout(timer)
        opts.signal?.removeEventListener('abort', onAbort)
        this.waiter = null
        resolve(outcome)
      }
      const onAbort = () => finish('aborted')
      if (opts.signal?.aborted) { finish('aborted'); return }
      timer = setTimeout(() => finish('timeout'), opts.timeoutMs)
      opts.signal?.addEventListener('abort', onAbort, { once: true })
      this.waiter = event => finish(event)
    })
  }

  /** Reset: the model owes nothing from before; retention stays (the pages are still there). */
  clearPending (): void {
    this.pending = []
  }
}

function stamp (at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function eventLine (e: AgentEvent): string {
  return `- ${stamp(e.at)} ${e.name}${e.detail ? ': ' + e.detail : ''}`
}

export function formatHostEvents (events: AgentEvent[]): string {
  return [
    HOST_EVENTS_OPEN,
    'Reported by the application, not written by the user:',
    ...events.map(eventLine),
    HOST_EVENTS_CLOSE
  ].join('\n')
}

export function hasHostState (snapshot: HostStateSnapshot): boolean {
  return snapshot.state.length > 0 || snapshot.recent.length > 0
}

export function formatHostState (snapshot: HostStateSnapshot): string {
  const lines = [HOST_STATE_OPEN, 'Current state of the application, as reported by the application (not written by the user):']
  for (const e of snapshot.state) lines.push(`- ${e.key}: ${e.detail ?? ''}`)
  if (snapshot.recent.length) {
    lines.push('Recent actions:')
    for (const e of snapshot.recent) lines.push(eventLine(e))
  }
  lines.push(HOST_STATE_CLOSE)
  return lines.join('\n')
}

/**
 * Append drained events to a host tool's result so they land in history exactly where
 * they happened (the Playwright "action returns the resulting page" shape).
 */
export function appendHostEvents (output: unknown, events: AgentEvent[]): unknown {
  if (!events.length) return output
  const block = formatHostEvents(events)
  if (typeof output === 'string') return `${output}\n\n${block}`
  if (isMediaToolResult(output)) return { ...output, text: output.text ? `${output.text}\n\n${block}` : block }
  return `${JSON.stringify(output)}\n\n${block}`
}

export function createWaitTool (opts: {
  store: HostEventStore
  onWaiting?: (expecting: string) => void
  onDone?: () => void
}): Tool {
  const { store } = opts
  return tool({
    description: 'Pause and wait for the user to act in the application (click a button, submit a form, navigate…). ' +
      'Resolves with the next action the application reports, whatever it is — check it is what you expected before continuing; ' +
      'if the user navigated away or did something else, wrap up. Use it when you have set things up and the next step is the user\'s: ' +
      'after preparing a form for them to save, or a wizard for them to confirm. Never call it when there is nothing for the user to do.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        expecting: { type: 'string', description: 'What you are waiting for, in a few words; shown to the user.' },
        timeoutSeconds: { type: 'integer', minimum: 1, maximum: WAIT_MAX_SECONDS, description: `Seconds to wait before giving up (default ${WAIT_DEFAULT_SECONDS}, max ${WAIT_MAX_SECONDS}).` }
      },
      required: ['expecting'],
      additionalProperties: false
    }),
    execute: async (args: any, options?: { abortSignal?: AbortSignal }) => {
      if (store.isWaiting()) return 'Already waiting for the user.'
      const requested = Number(args?.timeoutSeconds)
      const seconds = Number.isFinite(requested) && requested > 0 ? Math.min(WAIT_MAX_SECONDS, Math.floor(requested)) : WAIT_DEFAULT_SECONDS
      opts.onWaiting?.(String(args?.expecting ?? ''))
      try {
        const outcome = await store.waitForEvent({ timeoutMs: seconds * 1000, signal: options?.abortSignal })
        if (outcome === 'timeout') return `No user action within ${seconds} seconds. End your reply now and let the user act; you will be told what they did when the conversation continues.`
        if (outcome === 'aborted') return 'Wait cancelled.'
        // One macrotask so the followers of the same user gesture (a keyed location event
        // posted right after a creation event) ride in the same result.
        await new Promise(resolve => setTimeout(resolve, 0))
        return formatHostEvents([outcome, ...store.takePending()])
      } finally {
        opts.onDone?.()
      }
    }
  })
}
