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
 */

import { ref, shallowRef, computed, type Ref } from 'vue'
import type { ChatActivity } from '@agents/shared/agent-activity'
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
  onDelta?: (kind: 'text' | 'reasoning', text: string) => void
  /**
   * The turn's structure as stored parts: tool calls and their states, step boundaries, reasoning.
   *
   * Rendered with `autonomousAgentMessageToChat`, the same mapper a reopened thread uses — so the live
   * transcript and the stored one cannot drift, because they are the same data through the same code.
   */
  onMessage?: (message: { seq: number, role: 'user' | 'assistant', parts: unknown[], pending: boolean }) => void
  /** What the assistant is doing, in the vocabulary `activityLabelKey` already renders. */
  onActivity?: (activity: ChatActivity | null) => void
  onTurnEnd?: (stopReason: string, detail?: string) => void
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
  let ws: WebSocket | undefined

  const send = (message: ClientMessage) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message))
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
        debug('attached to %s', message.conversationId)
        return
      case 'message':
        options.onMessage?.(message)
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
      case 'error':
        debug('server error %s', message.message)
        options.onError?.(message.message)
    }
  }

  return {
    connected,
    attached,
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
          ...(options.agentId ? { agentId: options.agentId } : {})
        })
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

    prompt (content: string) {
      send({ type: 'prompt', content })
    },

    abort () {
      send({ type: 'abort' })
    },

    close () {
      ws?.close()
      ws = undefined
    }
  }
}
