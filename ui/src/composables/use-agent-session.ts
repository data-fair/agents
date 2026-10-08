/**
 * The browser half of the agent session: declare this page's contextual tools, and serve the calls the
 * server-side loop makes against them.
 *
 * The cut is at the `Record<string, Tool>` the FrameClientAggregator produces; WebMCP registration in
 * `lib-vue`, the frame transports, the aggregator and the per-page tool surface sit below that line.
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

/**
 * What a `hello` binds the connection to: an existing thread, or a fresh one with this agent, which the
 * first prompt creates on the server (see the frame).
 */
export type HelloTarget = { conversationId: string } | { agentId: string }

export interface AgentSessionClientOptions {
  /** Where the socket lives. Derived from the page's own origin by the caller, never configured. */
  url: string
  /** This page's contextual tools, as the aggregator produces them. */
  tools: Ref<Record<string, Tool>>
  /** The account a fresh thread is started on. */
  account: { type: 'user' | 'organization', id: string }
  /**
   * The title of a fresh thread, sent with the prompt that creates it — computed then, so a default
   * stamped with the time says when the conversation started rather than when the chat was opened.
   */
  newThreadTitle?: () => string
  /**
   * For an ANONYMOUS visitor only: their anonymous action token, which a fresh thread needs. A function,
   * because the token is fetched — and refreshed for a reset — after setup.
   */
  anonymousToken?: () => string | undefined
  /** The person's current answer to the consent sheet, undefined while they have not given one. */
  traceConsent?: () => boolean | undefined
  /** Every `attached` frame: the thread the connection is bound to now, undefined while none is. */
  onAttached?: (conversationId: string | undefined) => void
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
  /** A sub-agent panel's phase line, keyed by the delegating call. Never the main activity line. */
  onSubAgentActivity?: (parentToolCallId: string, activity: ChatActivity | null) => void
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
  /** Whether this account stores traces at all, as advertised on `attached`. */
  const traceStorage = ref(false)
  let ws: WebSocket | undefined
  /** What the next `hello` binds to — the latest asked for, even when asked before the socket opened. */
  let target: HelloTarget | undefined
  /** The thread the server says this connection is bound to; undefined while the next prompt creates one. */
  let boundTo: string | undefined

  /**
   * Say hello for the current target. It carries the tool set as it is NOW, and the consent answer as
   * the browser holds it now.
   */
  const hello = () => {
    if (!target) return
    const token = options.anonymousToken?.()
    const consent = options.traceConsent?.()
    send({
      type: 'hello',
      tools: toDescriptors(options.tools.value),
      ...('conversationId' in target
        ? { conversationId: target.conversationId }
        : { account: options.account, agentId: target.agentId }),
      ...(token ? { anonymousToken: token } : {}),
      ...(consent !== undefined ? { traceConsent: consent } : {})
    })
  }

  /**
   * Frames asked for before the socket was open.
   *
   * This queue is not a nicety. `send` used to drop anything that arrived before OPEN, silently — and
   * the window is wide: the page renders, the composer enables, and the latest thread still has to be
   * looked up before the socket is even constructed. Someone typing immediately lost their first
   * message with no error anywhere, which is the failure mode that is hardest to report and easiest to
   * blame on the model.
   */
  let outbox: ClientMessage[] = []

  const send = (message: ClientMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      return
    }
    // `hello` is never queued: `onopen` sends one for the latest target, and a queued copy would be a
    // second one arriving behind it and rebinding the connection.
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
        boundTo = message.conversationId
        options.onAttached?.(message.conversationId)
        // Drives the consent sheet.
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
        // A PANEL's phase line is its own: it used to land in the main activity line, so a worker's
        // "thinking" overwrote — and its end cleared — what the lead was doing.
        if (message.parentToolCallId) {
          options.onSubAgentActivity?.(message.parentToolCallId, message.activity)
          return
        }
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

    /** Open the socket and say hello for this target — or for a later one asked before it opened. */
    connect (initial: HelloTarget) {
      target = initial
      ws = new WebSocket(options.url)
      ws.onopen = () => {
        connected.value = true
        hello()
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
     * Rebind the same socket: to an existing thread, which replays its history, or to a fresh one with
     * an agent, which the next prompt creates. Nothing else is needed — the server's own state for a
     * thread is new by construction, which is why a reset needs no frame of its own.
     */
    reset (next: HelloTarget) {
      // The label belonged to the thread being left — a pending wait above all. The new one's is sent
      // on attach when it has one.
      activity.value = null
      target = next
      boundTo = undefined
      hello()
    },

    prompt (content: string, hiddenContext?: string) {
      // Only a prompt that may create the thread carries its title; the server ignores it otherwise.
      const title = !boundTo && target && !('conversationId' in target) ? options.newThreadTitle?.() : undefined
      send({ type: 'prompt', content, ...(hiddenContext ? { hiddenContext } : {}), ...(title ? { title } : {}) })
    },

    /**
     * What is true on the page right now. Replaces the previous report wholesale; a key whose value is
     * null WITHDRAWS that fact rather than reporting it empty.
     */
    reportHostState (state: Record<string, string | null>) {
      send({ type: 'host-state', state })
    },

    /** What the person just did. Buffered server-side until the model is told. */
    reportHostEvents (events: Array<{ name: string, key?: string, detail?: string, at: number }>) {
      if (!events.length) return
      send({ type: 'host-events', events })
    },

    /** The person's decision on a call the approval gate stopped. */
    decideApproval (approvalId: string, approved: boolean, reason?: string) {
      send({ type: 'approval', approvalId, approved, ...(reason ? { reason } : {}) })
    },

    /**
     * Stop the turn in flight. `dismissWait` also declines a pending handover — only the person's own
     * Stop means that; leaving a thread must not answer its wait.
     */
    abort (opts?: { dismissWait?: boolean }) {
      send({ type: 'abort', ...(opts?.dismissWait ? { dismissWait: true } : {}) })
    },

    /** Tell the server the person's new answer about trace storage: it applies from the next turn. */
    reportTraceConsent (consented: boolean) {
      send({ type: 'trace-consent', consented })
    },

    close () {
      ws?.close()
      ws = undefined
    }
  }
}
