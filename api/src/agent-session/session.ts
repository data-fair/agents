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
  /** Called on a `prompt`. The loop lands here; until then a session is a transport. */
  onPrompt?: (content: string) => void
  onAbort?: () => void
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
  /** The forwarded session of the person on the other end, for tools that want one. */
  sessionCookie: () => string | undefined
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
    tools: () => [...tools],
    attached: () => attached,
    sessionCookie: () => options.sessionCookie,

    handle (message) {
      if (closed) return
      switch (message.type) {
        case 'hello':
          // Idempotent rather than an error: a reconnecting client re-says hello, and the tool set it
          // declares is the authority for the page it is on now.
          tools = message.tools
          attached = true
          // conversationId is echoed back so a client that sent none learns the one it got. The
          // conversation itself is §4.4's work; until then the session reports what it was given.
          options.send({
            type: 'attached',
            conversationId: message.conversationId ?? 'pending',
            anonymous: false
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
          options.onPrompt?.(message.content)
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
