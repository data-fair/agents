/**
 * The browser half of the agent session: declare this page's contextual tools, and serve the calls the
 * server-side loop makes against them.
 *
 * The cut is at the `Record<string, Tool>` the FrameClientAggregator already produces — the same value
 * `use-agent-chat` hands its in-browser loop today. Everything below that line is untouched: WebMCP
 * registration in `lib-vue`, the frame transports, the aggregator, the per-page tool surface. What
 * changes is who CALLS them, which is why moving the loop does not touch the WebMCP integration story.
 *
 * The descriptors go up; the implementations stay here. A page tool's `execute` is the page's, and it
 * never leaves the browser.
 *
 * WHY THIS IS SEPARATE from `use-session-chat`, its only consumer: this module imports nothing
 * through the `~` alias, and that is a requirement rather than an accident. It is compiled by the
 * ROOT tsc as well as by the ui one, because a unit test imports `toDescriptors` from it, and `~`
 * does not resolve there. The adapter has eight `~` imports — context, trace consent, the frame
 * aggregator — and cannot be reached from a unit test at all.
 *
 * So the layering is: alias-free and unit-testable here, Vue and app wiring there. A review of this
 * code proposed merging them as "two layers with one consumer". They are two layers with two
 * COMPILATION CONTEXTS, and merging them would put the socket protocol out of reach of the unit
 * suite.
 */

import { ref, shallowRef, computed, type Ref } from 'vue'
import type { ChatActivity } from '@agents/shared/agent-activity'
import type { MessagePart } from '@agents/shared/message-parts'
import type { Tool } from 'ai'
import Debug from 'debug'
import {
  parseServerMessageForClient,
  type BrowserToolDescriptor,
  type ClientMessage,
  type ServerMessage
} from '@agents/shared/agent-session-protocol'

const debug = Debug('df-agents:agent-session')

export interface AgentSessionClientOptions {
  /** Where the socket lives. Derived from the page's own origin by the caller, never configured. */
  url: string
  /** This page's contextual tools, as the aggregator produces them. */
  tools: Ref<Record<string, Tool>>
  conversationId?: string
  agentId?: string
  /**
   * For an ANONYMOUS visitor only: the account to talk to, and their anonymous action token. The
   * server creates their thread from these on `hello` (see the frame), since they cannot create one
   * over HTTP. A function, because the token is fetched — and refreshed for a reset — after setup.
   */
  anonymous?: { account: { type: 'user' | 'organization', id: string }, token: () => string | undefined }
  onDelta?: (kind: 'text' | 'reasoning', text: string) => void
  /**
   * The turn's structure as stored parts: tool calls and their states, step boundaries, reasoning.
   *
   * Rendered with `autonomousAgentMessageToChat`, the same mapper a reopened thread uses — so the live
   * transcript and the stored one cannot drift, because they are the same data through the same code.
   */
  onMessage?: (message: { seq: number, role: 'user' | 'assistant', parts: MessagePart[], pending: boolean }) => void
  /**
   * A sub-agent's transcript, as it runs, keyed by the delegating tool call.
   *
   * Separate from `onMessage` because it is not a message of the conversation: it belongs INSIDE the
   * assistant turn that delegated, which is also how it renders (a panel under the tool call).
   */
  onSubAgent?: (frame: { parentToolCallId: string, name: string, parts: MessagePart[], pending: boolean }) => void
  /** What the assistant is doing, in the vocabulary `activityLabelKey` already renders. */
  onActivity?: (activity: ChatActivity | null) => void
  onTurnEnd?: (stopReason: string, detail?: string) => void
  /** What the conversation has cost so far, in credits — sent once attached and before each turn-end. */
  onCost?: (conversationCost: number) => void
  onError?: (message: string) => void
}

/**
 * What an AI SDK tool advertises, without its implementation.
 *
 * `inputSchema` is unwrapped from the SDK's schema wrapper: `jsonSchema(x)` exposes the raw document on
 * a `jsonSchema` getter, and that raw document is what the wire — and ultimately the model's provider —
 * needs. Sending the wrapper would serialise to an object with none of the schema in it.
 */
export function toDescriptors (tools: Record<string, Tool>): BrowserToolDescriptor[] {
  return Object.entries(tools).map(([name, tool]) => {
    const schema = (tool.inputSchema as { jsonSchema?: unknown } | undefined)?.jsonSchema
    return {
      name,
      description: tool.description ?? '',
      ...(schema !== undefined ? { inputSchema: schema } : {})
    }
  })
}

export function useAgentSession (options: AgentSessionClientOptions) {
  const connected = ref(false)
  const attached = ref(false)
  /**
   * The current activity, and the answer to `isWaitingForUser` — which is simply
   * `kind === 'waiting'`, rather than a second piece of state that could disagree with this one.
   */
  const activity = shallowRef<ChatActivity | null>(null)
  const conversationId = shallowRef<string | undefined>(options.conversationId)
  /** Whether this account stores traces at all, as advertised on `attached`. */
  const traceStorage = ref(false)
  let ws: WebSocket | undefined

  /** What an anonymous visitor's hello adds. An anonymous reset passes no id: the server starts a thread. */
  const anonymousHello = () => {
    if (!options.anonymous) return {}
    const token = options.anonymous.token()
    return { account: options.anonymous.account, ...(token ? { anonymousToken: token } : {}) }
  }

  /**
   * Frames asked for before the socket was open.
   *
   * This queue is not a nicety. `send` used to drop anything that arrived before OPEN, silently — and
   * the window is wide: the page renders, the composer enables, and the conversation still has to be
   * created over HTTP before the socket is even constructed. Someone typing immediately lost their
   * first message with no error anywhere, which is the failure mode that is hardest to report and
   * easiest to blame on the model.
   */
  let outbox: ClientMessage[] = []

  const send = (message: ClientMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      return
    }
    // `hello` is never queued: it is sent from `onopen`, and a queued copy would be a second one
    // arriving behind the first and rebinding the connection.
    if (message.type === 'hello') return
    debug('queued a %s frame until the socket is open', message.type)
    outbox.push(message)
  }

  /** Flush after `hello`, so the server has bound the connection before anything references it. */
  const flush = () => {
    const queued = outbox
    outbox = []
    for (const message of queued) send(message)
  }

  /**
   * Run one of this page's tools and answer.
   *
   * A failure is sent as `error`, never as a result: the server side distinguishes the two by which
   * field arrives, and collapsing them is how a failed tool came to be indistinguishable from a
   * successful one elsewhere in this codebase.
   */
  const serveCall = async (callId: string, name: string, input: unknown) => {
    const tool = options.tools.value[name]
    if (!tool?.execute) {
      send({ type: 'tool-result', callId, error: `this page has no tool named ${name}` })
      return
    }
    try {
      // The second argument is the AI SDK's tool-execution options. The loop is server-side now, so
      // there is no abort signal to pass down: a cancelled turn is handled by the server giving up on
      // the call, and the page finishing a local action anyway is harmless.
      const result = await tool.execute(input as never, { toolCallId: callId, messages: [] })
      send({ type: 'tool-result', callId, result })
    } catch (err) {
      send({ type: 'tool-result', callId, error: err instanceof Error ? err.message : String(err) })
    }
  }

  const handle = (message: ServerMessage) => {
    switch (message.type) {
      case 'attached':
        attached.value = true
        conversationId.value = message.conversationId
        // Drives the consent sheet. The gateway advertised the same fact as a response header.
        //
        // Exposed as state rather than written to ~/traces/trace-consent from here: this module is
        // also compiled by the root tsc (a unit test imports toDescriptors from it), where the ~
        // alias does not resolve. The ui-only adapter wires it.
        if (message.traceStorage) traceStorage.value = true
        debug('attached to %s', message.conversationId)
        return
      case 'message':
        options.onMessage?.(message)
        return
      case 'subagent':
        options.onSubAgent?.(message)
        return
      case 'activity':
        activity.value = message.activity
        options.onActivity?.(message.activity)
        return
      case 'tool-call':
        // Not awaited: the socket must keep reading while the page works, so several calls of one
        // parallel step can run at once. The catch is the backstop — serveCall answers its own
        // failures, so anything reaching here is the send itself failing, which must not become an
        // unhandled rejection.
        serveCall(message.callId, message.name, message.input)
          .catch(err => { debug('failed to answer %s: %O', message.name, err) })
        return
      case 'delta':
        options.onDelta?.(message.kind, message.text)
        return
      case 'turn-end':
        options.onTurnEnd?.(message.stopReason, message.detail)
        return
      case 'cost':
        options.onCost?.(message.conversationCost)
        return
      case 'error':
        debug('server error %s', message.message)
        options.onError?.(message.message)
    }
  }

  return {
    connected,
    attached,
    traceStorage,
    activity,
    isWaitingForUser: computed(() => activity.value?.kind === 'waiting'),
    conversationId,

    /**
     * Open the socket and say hello.
     *
     * The conversation id is an argument as well as an option, because a page typically creates the
     * conversation over HTTP and only then knows which one to bind to.
     */
    connect (conversationId?: string) {
      const bindTo = conversationId ?? options.conversationId
      ws = new WebSocket(options.url)
      ws.onopen = () => {
        connected.value = true
        // `hello` carries the tool set as it is NOW. A reconnect re-declares, because the page may have
        // navigated while the socket was down and the server's copy would otherwise describe a page
        // that no longer exists.
        send({
          type: 'hello',
          tools: toDescriptors(options.tools.value),
          ...(bindTo ? { conversationId: bindTo } : {}),
          ...(options.agentId ? { agentId: options.agentId } : {}),
          ...anonymousHello()
        })
        flush()
      }
      ws.onmessage = event => {
        const message = parseServerMessageForClient(String(event.data))
        if (!message) {
          // A frame this client does not understand is a newer server, not a bug to crash on.
          debug('ignored an unrecognised server frame')
          return
        }
        handle(message)
      }
      ws.onclose = () => {
        connected.value = false
        attached.value = false
      }
    },

    /** Called when the aggregator's set changes — a navigation, or a frame appearing or going away. */
    toolsChanged () {
      send({ type: 'tools-changed', tools: toDescriptors(options.tools.value) })
    },

    /**
     * Start a fresh conversation on the same socket.
     *
     * The caller creates the conversation and passes its id — or, for an anonymous visitor, passes
     * none and the server creates it, because this composable owns the socket
     * and not the HTTP surface. Nothing else is needed: re-attaching rebinds the registry, replays an
     * empty history, and the server's own state for the thread is new by construction — which is why
     * `reset` needs no frame of its own.
     */
    reset (conversationId?: string) {
      send({
        type: 'hello',
        tools: toDescriptors(options.tools.value),
        ...(conversationId ? { conversationId } : {}),
        ...(options.agentId ? { agentId: options.agentId } : {}),
        ...anonymousHello()
      })
    },

    prompt (content: string, hiddenContext?: string) {
      send({ type: 'prompt', content, ...(hiddenContext ? { hiddenContext } : {}) })
    },

    /**
     * What is true on the page right now. Replaces the previous report wholesale; a key whose value is
     * null WITHDRAWS that fact rather than reporting it empty.
     */
    reportHostState (state: Record<string, string | null>) {
      send({ type: 'host-state', state })
    },

    /** What the person just did. Buffered server-side until the model is told. */
    reportHostEvents (events: Array<{ name: string, detail?: string, at: number }>) {
      if (!events.length) return
      send({ type: 'host-events', events })
    },

    abort () {
      send({ type: 'abort' })
    },

    /**
     * Tell the server what the person answered about trace storage.
     *
     * Sent as well as written to the cookie: the cookie is only read at upgrade, so without this the
     * answer would not take effect until the page reloaded.
     */
    reportTraceConsent (consented: boolean) {
      send({ type: 'trace-consent', consented })
    },

    close () {
      ws?.close()
      ws = undefined
    }
  }
}
