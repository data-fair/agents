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
import { HostEventStore } from '@agents/shared/host-events'

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
   * Whether the person consented to their conversation being stored for admin review.
   *
   * Read from the same cookie the gateway read as a header, at upgrade. It exists because the chat's
   * privacy model has two layers: the conversation is stored so the person can come back to it and is
   * NOT visible to org admins, while a trace is admin-visible and therefore needs the person's
   * explicit yes. Moving the loop server-side did not change what is being disclosed to whom, so it
   * must not change who gets asked.
   */
  traceConsent?: boolean
  /**
   * Whether this account stores traces at all — advertised to the client on `attached`.
   *
   * Replaces the gateway's `x-trace-storage: available` response header. It is what makes the chat
   * show its consent sheet, so without it nobody can ever answer and the server-side consent gate
   * fails closed permanently.
   */
  traceStorage?: boolean
  /** Whether the socket has no signed-in person behind it — echoed on `attached`. */
  anonymous?: boolean
  /** Called on a `prompt`. The loop lands here; until then a session is a transport. */
  onPrompt?: (content: string, hiddenContext?: string) => void
  onAbort?: () => void
  /** Called when a `hello` binds this connection to a conversation. The registry is wired here. */
  onAttach?: (conversationId: string) => void
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
  /** Dispatch one parsed client message. */
  handle: (message: ClientMessage) => void
  /** Send a server frame. Used by the loop to stream, and by the registry to report a displacement. */
  send: (message: ServerMessage) => void
  /** The forwarded session of the person on the other end, for tools that want one. */
  sessionCookie: () => string | undefined
  /** Whether this person agreed to admin-visible trace storage. */
  traceConsent: () => boolean
  /**
   * What the page has reported: retained state, and what the person has done.
   *
   * The SAME store the browser loop uses — `shared/host-events.ts` turned out to be free of Vue and of
   * every browser API, so moving host events server-side was a move rather than a rewrite. The page now
   * feeds it over the socket instead of directly, and `createWaitTool` works against it unchanged.
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

export function createAgentSession (options: AgentSessionOptions): AgentSession {
  const timeoutMs = options.callTimeoutMs ?? BROWSER_CALL_TIMEOUT_MS
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = options.clearTimer ?? ((handle) => { clearTimeout(handle as ReturnType<typeof setTimeout>) })

  const hostEvents = new HostEventStore()
  // Seeded from the upgrade's cookie and updated by a `trace-consent` frame, so answering the sheet
  // takes effect on the NEXT TURN rather than on the next page load.
  let traceConsent = options.traceConsent === true
  let boundTo: string | undefined
  let tools: BrowserToolDescriptor[] = []
  let attached = false
  let closed: string | undefined
  const pending = new Map<string, PendingCall>()

  const settle = (callId: string): PendingCall | undefined => {
    const call = pending.get(callId)
    if (!call) return undefined
    pending.delete(callId)
    clearTimer(call.timer)
    return call
  }

  return {
    send: options.send,
    hostEvents,
    tools: () => [...tools],
    attached: () => attached,
    sessionCookie: () => options.sessionCookie,
    traceConsent: () => traceConsent,

    handle (message) {
      if (closed) return
      switch (message.type) {
        case 'hello':
          // Idempotent rather than an error: a reconnecting client re-says hello, and the tool set it
          // declares is the authority for the page it is on now.
          tools = message.tools
          attached = true
          // A re-hello naming a DIFFERENT conversation is a reset. The retained page state stays — it
          // is still true of the page — but anything buffered for a model that will never see it is
          // dropped, or the first turn of the new thread would open with events from the old one.
          if (message.conversationId && message.conversationId !== boundTo) hostEvents.clearPending()
          boundTo = message.conversationId
          if (message.conversationId) options.onAttach?.(message.conversationId)
          // conversationId is echoed back so a client that sent none learns the one it got. The
          // conversation itself is §4.4's work; until then the session reports what it was given.
          options.send({
            type: 'attached',
            conversationId: message.conversationId ?? 'pending',
            anonymous: options.anonymous === true,
            traceStorage: options.traceStorage === true
          })
          return
        case 'tools-changed':
          tools = message.tools
          return
        case 'prompt':
          if (!attached) {
            options.send({ type: 'error', message: 'say hello before prompting' })
            return
          }
          options.onPrompt?.(message.content, message.hiddenContext)
          return
        case 'tool-result': {
          const call = settle(message.callId)
          // An unknown callId is reported, not ignored: it means a timeout already fired, the client is
          // confused, or something is replaying answers — all worth seeing rather than discarding.
          if (!call) {
            options.send({ type: 'error', message: `no tool call is waiting for callId ${message.callId}` })
            return
          }
          if (message.error !== undefined) call.reject(new Error(message.error))
          else call.resolve(message.result)
          return
        }
        case 'abort':
          options.onAbort?.()
          return
        case 'trace-consent':
          traceConsent = message.consented
          return
        case 'host-state':
          // Keyed facts, pushed as state-like events so the store's own retention rules apply. A key
          // whose value is absent is a WITHDRAWAL: the page is saying that fact is no longer true,
          // which is a different statement from never having reported it.
          for (const [key, detail] of Object.entries(message.state)) {
            if (detail === null || detail === undefined) hostEvents.withdraw(key)
            else hostEvents.push({ name: key, key, detail: String(detail), at: Date.now() })
          }
          return
        case 'host-events':
          for (const event of message.events) hostEvents.push(event)
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
        options.send({ type: 'tool-call', callId, name, input })
      })
    },

    close (reason) {
      closed = reason
      attached = false
      for (const callId of [...pending.keys()]) {
        const call = settle(callId)
        call?.reject(new Error(`the agent session closed before ${call.name} answered (${reason})`))
      }
    }
  }
}
