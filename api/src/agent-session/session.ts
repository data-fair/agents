/**
 * One agent session: the state and the dispatch for a single connected browser.
 *
 * Deliberately free of the websocket. It is given a `send` function and returns handlers, so the whole
 * of the interesting behaviour — correlation, timeouts, what a dropped connection does to a call in
 * flight — is unit tested without a socket, a port or a dev stack. `service.ts` is the thin part that
 * owns the `ws` object.
 *
 * COLOCATION is the property that makes this simple: the loop runs in the process holding this
 * connection, so a pending browser call is an in-memory promise rather than a cross-process
 * rendezvous. That is the whole reason the reply path needs no routing, no sticky sessions and no lock.
 */

import { nanoid } from 'nanoid'
import type { BrowserToolDescriptor, ClientMessage, ServerMessage } from '@agents/shared/agent-session-protocol'
import { HostEventStore } from './host-events.ts'

/**
 * A socket's sender that can hold back what the turn broadcasts while a page is being caught up.
 *
 * A page attaching mid-turn is sent the stored history, then the turn so far, while the turn keeps
 * broadcasting to it. Sent as they came, a turn ending during the history read reached the page FIRST —
 * the settled answer, then turn-end — and the stale stored message replayed after it replaced that answer
 * with an empty pending one. Held, the broadcasts follow the replay (`direct`) in the order they were sent.
 */
export const holdingSender = (send: (message: ServerMessage) => void) => {
  let held: ServerMessage[] | undefined
  return {
    /** What the turn's broadcasts reach. */
    send: (message: ServerMessage) => { if (held) held.push(message); else send(message) },
    /** The catch-up's own frames, never held. */
    direct: send,
    hold: () => { held ??= [] },
    release: () => {
      const frames = held ?? []
      held = undefined
      for (const message of frames) send(message)
    }
  }
}

/** How long the server waits for the browser to answer a contextual tool call. */
export const BROWSER_CALL_TIMEOUT_MS = 30_000

export interface AgentSessionOptions {
  send: (message: ServerMessage) => void
  /**
   * The cookie header from this connection's upgrade request.
   *
   * This is the personal assistant's whole identity: it acts as the person whose browser opened the
   * socket. Held per connection, never stored, never logged, never in a prompt — the same rule the NHI
   * session follows. Its useful life is the socket's, because only the browser can renew it.
   */
  sessionCookie?: string
  /**
   * The site this socket was opened through (its upgrade request's forwarded host), as an origin. Where
   * a chat turn acts, and the only site the person's cookie is valid on: sessions are host-only.
   */
  siteUrl?: string
  /**
   * The IP of the person behind this socket, from its upgrade request (lib-express reqIp): forwarded to
   * the stack's servers so they limit that person as if they called directly. Undefined for a socket
   * that did not come through the reverse proxy.
   */
  clientIp?: string
  /**
   * Whether this account offers personal-assistant review at all — advertised to the client on `attached`.
   *
   * It is what makes the chat show its consent sheet, so without it nobody can ever answer and the server-side consent gate
   * fails closed permanently.
   */
  reviewOffered?: boolean
  /** Whether the socket has no signed-in person behind it — echoed on `attached`. */
  anonymous?: boolean
  // The callbacks may return a promise, which `handle` returns: the socket handles its frames one at a
  // time, each once the previous one's work is done (see startAgentSessions).
  /** Called on a `prompt`. The loop lands here; until then a session is a transport. */
  onPrompt?: (content: string, hiddenContext?: string) => void | Promise<void>
  onAbort?: (dismissWait: boolean) => void | Promise<void>
  /** Called on an `approval`: the person's decision on a call the approval gate stopped. */
  onApproval?: (approvalId: string, approved: boolean, reason?: string) => void | Promise<void>
  /** Called after the page reported something — what may answer a pending wait. */
  onHostEvents?: () => void | Promise<void>
  /**
   * Called whenever the connection's thread changes: a `hello` naming one, a `hello` naming none
   * (undefined: the next prompt creates one), or `bind` once that prompt did. The registry is wired here.
   */
  onAttach?: (conversationId: string | undefined) => void | Promise<void>
  callTimeoutMs?: number
  /** Injectable for tests; the real one is setTimeout. */
  setTimer?: (fn: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
}

interface PendingCall {
  resolve: (result: unknown) => void
  reject: (err: Error) => void
  timer: unknown
  name: string
}

export interface AgentSession {
  /** Dispatch one parsed client message; resolves once the work it started is done. */
  handle: (message: ClientMessage) => void | Promise<void>
  /** Send a server frame. Used by the loop to stream, and by the registry to report a displacement. */
  send: (message: ServerMessage) => void
  /** The forwarded session of the person on the other end, for tools that want one. */
  sessionCookie: () => string | undefined
  /** The site this socket was opened through, see AgentSessionOptions. */
  siteUrl: () => string | undefined
  /** The IP of the person behind this socket, see AgentSessionOptions. */
  clientIp: () => string | undefined
  /**
   * Whether this person agreed to admin review of their conversations, as the browser last said (`hello`,
   * `review-consent`). It exists because the chat's privacy model has two layers: the conversation is
   * stored so the person can come back to it and is NOT visible to org admins, while a reviewable one is
   * admin-visible and therefore needs the person's explicit yes.
   */
  reviewConsent: () => boolean
  /** Bind the connection to the thread its first prompt just created, and tell the browser which. */
  bind: (conversationId: string) => void | Promise<void>
  /**
   * What the page has reported: retained state, and what the person has done.
   *
   * The page feeds it over the socket, and `createWaitTool` works against it.
   */
  hostEvents: HostEventStore
  /**
   * Ask the browser to run one of its contextual tools.
   *
   * Rejects on timeout, on a browser-reported error, and when the connection closes — never hangs,
   * because a hung tool call would hold a turn open until the run deadline and the person on the other
   * end is the only thing that could have answered.
   */
  callBrowserTool: (name: string, input: unknown) => Promise<unknown>
  /** The page's current contextual tools. Replaced wholesale by `tools-changed`. */
  tools: () => BrowserToolDescriptor[]
  attached: () => boolean
  /** Fail everything in flight. Called when the socket closes. */
  close: (reason: string) => void
}

/**
 * How long consecutive deltas are merged into one frame.
 *
 * A frame per token was a JSON encoding and a socket write per token: with many turns streaming, the
 * process spent its time writing tiny frames (measured: the largest single native cost after the
 * streams themselves). Below a display frame, so text still arrives as it is produced.
 */
export const DELTA_FLUSH_MS = 25

export function createAgentSession (options: AgentSessionOptions): AgentSession {
  const timeoutMs = options.callTimeoutMs ?? BROWSER_CALL_TIMEOUT_MS
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = options.clearTimer ?? ((handle) => { clearTimeout(handle as ReturnType<typeof setTimeout>) })

  const hostEvents = new HostEventStore()
  // Said by `hello` and updated by a `review-consent` frame, so answering the sheet takes effect on the
  // NEXT TURN rather than on the next page load. No answer is no consent.
  let reviewConsent = false
  let boundTo: string | undefined
  let tools: BrowserToolDescriptor[] = []
  let attached = false
  let closed: string | undefined
  const pending = new Map<string, PendingCall>()

  // The delta being gathered, and when it goes out. Any other frame flushes it first, so the order
  // the browser sees is the order things happened in.
  let pendingDelta: { kind: 'text' | 'reasoning', text: string } | undefined
  let deltaTimer: ReturnType<typeof setTimeout> | undefined
  const flushDelta = () => {
    if (deltaTimer) clearTimeout(deltaTimer)
    deltaTimer = undefined
    if (!pendingDelta) return
    const { kind, text } = pendingDelta
    pendingDelta = undefined
    options.send({ type: 'delta', kind, text })
  }
  const send = (message: ServerMessage) => {
    if (message.type !== 'delta') {
      flushDelta()
      options.send(message)
      return
    }
    if (pendingDelta && pendingDelta.kind !== message.kind) flushDelta()
    if (pendingDelta) pendingDelta.text += message.text
    else pendingDelta = { kind: message.kind, text: message.text }
    deltaTimer ??= setTimeout(flushDelta, DELTA_FLUSH_MS)
  }

  const bind = (conversationId: string | undefined) => {
    // Closed while the thread was being created: registering a dead session as its watcher would leak.
    if (closed) return
    boundTo = conversationId
    const attaching = options.onAttach?.(conversationId)
    // Names the thread, so a client that sent none learns the one it got.
    send({
      type: 'attached',
      ...(conversationId ? { conversationId } : {}),
      anonymous: options.anonymous === true,
      reviewOffered: options.reviewOffered === true
    })
    return attaching
  }

  const settle = (callId: string): PendingCall | undefined => {
    const call = pending.get(callId)
    if (!call) return undefined
    pending.delete(callId)
    clearTimer(call.timer)
    return call
  }

  return {
    send,
    hostEvents,
    tools: () => [...tools],
    attached: () => attached,
    sessionCookie: () => options.sessionCookie,
    siteUrl: () => options.siteUrl,
    clientIp: () => options.clientIp,
    reviewConsent: () => reviewConsent,
    // Not a rebind: what the page reported before its first message belongs to the thread that message
    // starts, so nothing pending is dropped.
    bind,

    handle (message) {
      if (closed) return
      switch (message.type) {
        case 'hello':
          // Idempotent rather than an error: a reconnecting client re-says hello, and the tool set it
          // declares is the authority for the page it is on now.
          tools = message.tools
          attached = true
          if (message.reviewConsent !== undefined) reviewConsent = message.reviewConsent
          // A re-hello naming a DIFFERENT conversation, or none (a fresh thread), is a reset. The retained
          // page state stays — it is still true of the page — but anything buffered for a model that will
          // never see it is dropped, or the first turn of the new thread would open with events from the
          // old one.
          if (!message.conversationId || message.conversationId !== boundTo) hostEvents.clearPending()
          return bind(message.conversationId)
        case 'tools-changed':
          tools = message.tools
          return
        case 'prompt':
          if (!attached) {
            send({ type: 'error', status: 400, message: 'say hello before prompting' })
            return
          }
          return options.onPrompt?.(message.content, message.hiddenContext)
        case 'tool-result': {
          const call = settle(message.callId)
          // An unknown callId is reported, not ignored: it means a timeout already fired, the client is
          // confused, or something is replaying answers — all worth seeing rather than discarding.
          if (!call) {
            send({ type: 'error', status: 404, message: `no tool call is waiting for callId ${message.callId}` })
            return
          }
          if (message.error !== undefined) call.reject(new Error(message.error))
          else call.resolve(message.result)
          return
        }
        case 'abort':
          return options.onAbort?.(message.dismissWait === true)
        case 'approval':
          return options.onApproval?.(message.approvalId, message.approved, message.reason)
        case 'review-consent':
          reviewConsent = message.consented
          return
        case 'host-state':
          // Keyed facts, pushed as state-like events so the store's own retention rules apply. A key
          // whose value is absent is a WITHDRAWAL: the page is saying that fact is no longer true,
          // which is a different statement from never having reported it.
          for (const [key, detail] of Object.entries(message.state)) {
            if (detail === null || detail === undefined) hostEvents.withdraw(key)
            else hostEvents.push({ name: key, key, detail: String(detail), at: Date.now() })
          }
          return options.onHostEvents?.()
        case 'host-events':
          for (const event of message.events) hostEvents.push(event)
          return options.onHostEvents?.()
      }
    },

    async callBrowserTool (name, input) {
      if (closed) throw new Error(`the agent session is closed (${closed})`)
      // Only what the page actually advertises. A model that invents a tool name, or a tool that was
      // removed by a navigation between the model's decision and this call, must fail here rather than
      // be sent to a browser that will never answer.
      if (!tools.some(tool => tool.name === name)) {
        throw new Error(`the page does not offer a tool named ${name}`)
      }
      const callId = nanoid()
      return await new Promise<unknown>((resolve, reject) => {
        const timer = setTimer(() => {
          pending.delete(callId)
          reject(new Error(`the page did not answer ${name} within ${timeoutMs}ms`))
        }, timeoutMs)
        pending.set(callId, { resolve, reject, timer, name })
        send({ type: 'tool-call', callId, name, input })
      })
    },

    close (reason) {
      closed = reason
      // Nobody to read it now.
      if (deltaTimer) clearTimeout(deltaTimer)
      deltaTimer = undefined
      pendingDelta = undefined
      attached = false
      for (const callId of [...pending.keys()]) {
        const call = settle(callId)
        call?.reject(new Error(`the agent session closed before ${call.name} answered (${reason})`))
      }
    }
  }
}
