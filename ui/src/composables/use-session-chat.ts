/**
 * The real chat, running on the server-held loop.
 *
 * This is the SWAP: it presents the surface `AgentChat.vue` already consumes — messages, status,
 * error, activity, tools, sendMessage, abort, reset — over `useAgentSession` instead of over the
 * in-browser loop in `use-agent-chat`. The component barely changes, which is the point: if pointing
 * the real chat at the server required rewriting the chat, the architecture would not be a drop-in
 * and §7's judgment would have to account for that.
 *
 * What it is NOT is a second loop. There is no model call here, no tool orchestration, no history
 * management, no compaction — those are the server's now. This file is assembly: it turns a stream of
 * frames into the reactive transcript the renderer wants, and turns the renderer's actions into frames.
 * That asymmetry is the whole measurement: compare this file's length to the 1229 lines it replaces.
 *
 * ONE THING IT DOES NOT SUPPORT, deliberately and visibly: `setToolExploration` /
 * `setFlattenSubAgents`. Tool exploration is shelved, and sub-agent flattening is a server decision
 * now. They are absent from the returned object rather than present as no-ops, so a caller that needs
 * them fails to type-check instead of silently toggling nothing.
 *
 * An anonymous visitor is served too (`anonymous`), on a thread that lives as long as the socket.
 */

import { ref, shallowRef, computed, watch, onScopeDispose, type Ref } from 'vue'
import type { Tool } from 'ai'
import type { ChatActivity } from '@agents/shared/agent-activity'
import { splitHiddenContext } from '@agents/shared/hidden-context'
import Debug from 'debug'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import { FrameClientAggregator } from '~/transports/frame-client-aggregator'
import { useAgentSession } from '~/composables/use-agent-session'
import { subscribeHostEvents } from '~/composables/use-host-events'
import { autonomousAgentMessageToChat } from '~/utils/autonomous-agent-chat-message'
import { resolveToolsPartition, type DebugToolsPartition } from '~/utils/tools-partition'
import type { ChatMessage } from '~/utils/chat-message'
import { $apiPath, $fetch } from '~/context'
import { traceStorageAvailable, consentRef } from '~/traces/trace-consent'
import { getAnonymousToken, resetAnonymousToken } from '~/composables/use-anonymous-token'

const debug = Debug('df-agents:use-session-chat')

export interface UseSessionChatOptions {
  accountType: string
  accountId: string
  /** Which standard agent to talk to. Defaults to the personal assistant. */
  agentId?: string
  /** Shown before anything has been said. Never sent anywhere. */
  initialMessages?: ChatMessage[]
  /** The title the conversation is created with. */
  title?: string
  /**
   * No signed-in person: the thread is created by the server on the socket's hello and lives as long
   * as the socket (see the `hello` frame), and the caller proves it is a browser with
   * simple-directory's anonymous action token.
   */
  anonymous?: boolean
  /**
   * The person-facing sentence for a refusal the server recorded (a quota, moderation), in the chat's
   * own language. The server stores English text beside a structured `data-refusal` part (see
   * api/src/conversations/turn-gates.ts); return undefined to keep the English.
   */
  formatRefusal?: (refusal: RefusalInfo) => string | undefined
}

/** The structured half of a server refusal — mirrors `RefusalInfo` in api/src/conversations/turn-gates.ts. */
export type RefusalInfo =
  | { kind: 'moderation' }
  | { kind: 'quota', scope: string, period: 'daily' | 'weekly' | 'monthly', resetsAt: string }

/** One entry of the transcript, plus the sequence number the server keys it by. */
interface Turn {
  seq: number
  message: ChatMessage
}

export function useSessionChat (options: UseSessionChatOptions) {
  // Matches `useAgentChat`'s contract so `AgentChat.vue`'s `if (!chatResult) throw` still guards SSR.
  if (typeof window === 'undefined') return undefined

  const turns = ref<Turn[]>([])
  // What this conversation has cost, as the server reports it (the `cost` frame), and a counter the
  // Consumption tab watches to refetch the caller's quota windows after each turn.
  const conversationCost = ref(0)
  const usageVersion = ref(0)
  const status = ref<'ready' | 'streaming' | 'error'>('ready')
  const error = ref<string | null>(null)
  const tools = ref<Record<string, Tool>>({})
  const toolsVersion = ref(0)
  const resolvedPartition = ref<DebugToolsPartition>({ mainTools: [], subAgents: [] })

  /**
   * Sub-agent transcripts, keyed by the delegating tool call id.
   *
   * Held OUTSIDE the turns, and merged in when the transcript is read. A `message` frame replaces a
   * turn wholesale (it is the authoritative stored form), so panels written into the turn itself would
   * be wiped by the next frame — which is exactly how they first disappeared mid-run.
   */
  const subAgentPanels = shallowRef<Record<string, { messages: ChatMessage[] }>>({})

  /**
   * The transcript the renderer reads.
   *
   * `initialMessages` show only while nothing real has arrived — a welcome message must not survive
   * into a conversation that has started.
   */
  const messages = computed<ChatMessage[]>(() => {
    if (!turns.value.length) return options.initialMessages ?? []
    return turns.value.map(turn => {
      const panels = (turn.message.toolInvocations ?? [])
        .filter(invocation => subAgentPanels.value[invocation.toolCallId])
        .reduce<Record<string, { messages: ChatMessage[] }>>((acc, invocation) => {
          acc[invocation.toolCallId] = subAgentPanels.value[invocation.toolCallId]
          return acc
        }, {})
      return Object.keys(panels).length ? { ...turn.message, subAgentPanels: panels } : turn.message
    })
  })

  let aggregator: FrameClientAggregator | null = null
  let resolveGeneration = 0

  const repartition = async () => {
    const gen = ++resolveGeneration
    const partition = await resolveToolsPartition(tools.value)
    // A tool set that changed while a sub-agent's roster was being read must win over the stale answer.
    if (gen !== resolveGeneration) return
    resolvedPartition.value = partition
  }

  /**
   * Find or create the turn a frame belongs to.
   *
   * Keyed by `seq`, which the server assigns — so a reconnect replaying the transcript updates the
   * turns it already has rather than appending a second copy of the conversation.
   */
  const turnFor = (seq: number): Turn => {
    const existing = turns.value.find(turn => turn.seq === seq)
    if (existing) return existing
    const created: Turn = { seq, message: { role: 'assistant', content: '' } }
    // Inserted in sequence order, because history frames are not guaranteed to arrive sorted and a
    // transcript rendered out of order is worse than one that is briefly short.
    const at = turns.value.findIndex(turn => turn.seq > seq)
    if (at === -1) turns.value.push(created)
    else turns.value.splice(at, 0, created)
    return created
  }

  const agent = useAgentSession({
    url: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${$apiPath}/agent-session`,
    tools,
    ...(options.agentId ? { agentId: options.agentId } : {}),
    ...(options.anonymous
      ? { anonymous: { account: { type: options.accountType as 'user' | 'organization', id: options.accountId }, token: () => anonymousToken } }
      : {}),

    /**
     * A token arrived. Appended to the streaming turn for immediate feedback.
     *
     * Deltas are a RENDERING optimisation, not the record: the next `message` frame carries the full
     * text and replaces this. Appending to the last turn when it is a pending assistant is safe for
     * the same reason — if the frame has not arrived yet, there is nothing authoritative to contradict.
     */
    onDelta: (kind, text) => {
      const last = turns.value[turns.value.length - 1]
      if (kind === 'reasoning') {
        if (last && last.message.role === 'assistant') {
          last.message = { ...last.message, reasoning: (last.message.reasoning ?? '') + text }
        }
        return
      }
      if (last && last.message.role === 'assistant') {
        last.message = { ...last.message, content: last.message.content + text }
      } else {
        // No seq yet: the first token can beat the first frame. Given seq -1 so the real frame, which
        // carries the true seq, lands as its own turn and this placeholder is dropped below.
        turns.value.push({ seq: -1, message: { role: 'assistant', content: text } })
      }
    },

    onMessage: frame => {
      // The placeholder a leading delta may have created. Dropped as soon as a real frame exists,
      // rather than merged: the frame is the authoritative form of the same text.
      const placeholder = turns.value.findIndex(turn => turn.seq === -1)
      if (placeholder !== -1 && frame.role === 'assistant') turns.value.splice(placeholder, 1)

      const turn = turnFor(frame.seq)
      const chat = autonomousAgentMessageToChat({
        seq: frame.seq,
        role: frame.role,
        parts: frame.parts,
        pending: frame.pending
      })
      // A user turn is STORED wrapped when an action button supplied hidden context. The person must
      // see what they asked, not the context the page added on their behalf.
      // A refusal is stored as English text plus a structured part; the chat says it in its own
      // language when it can (main's #74 did this for quotas in the browser loop).
      const refusal = frame.parts.find((part: any) => part?.type === 'data-refusal') as { data?: RefusalInfo } | undefined
      const localized = refusal?.data ? options.formatRefusal?.(refusal.data) : undefined
      turn.message = frame.role === 'user'
        ? { ...chat, content: splitHiddenContext(chat.content).visible }
        : localized ? { ...chat, content: localized } : chat
    },

    onSubAgent: frame => {
      const chat = autonomousAgentMessageToChat({
        seq: 0,
        role: 'assistant',
        parts: frame.parts,
        pending: frame.pending
      })
      // Replaced, not appended: each frame is the worker's transcript so far, so appending would
      // render the same partial answer once per update.
      subAgentPanels.value = { ...subAgentPanels.value, [frame.parentToolCallId]: { messages: [chat] } }
    },

    onCost: cost => { conversationCost.value = cost },

    onTurnEnd: (stopReason, detail) => {
      // Refetch the caller's own quota windows: this turn spent from them.
      usageVersion.value++
      status.value = 'ready'
      // A turn that ended badly must say so. Without this the composer simply re-enables and the
      // person is left to infer from an absent answer that something failed.
      if (stopReason === 'error') {
        status.value = 'error'
        error.value = detail ?? 'the assistant could not finish this turn'
      }
      debug('turn ended %s', stopReason)
    },

    onError: message => {
      status.value = 'error'
      error.value = message
    }
  })

  const conversationId = agent.conversationId

  // The consent sheet's trigger, and the answer's path back.
  //
  // Two halves of one loop: the server advertises on `attached` that this account stores traces (the
  // gateway did it with a response header), which is what makes the sheet appear; and the answer is
  // sent back over the socket as well as written to the cookie, because the cookie is only read at
  // UPGRADE — without the frame, accepting would do nothing until the page reloaded.
  // Held back until the person has actually had an answer, which is when the gateway's response
  // header used to arrive. Advertising on attach instead would put the sheet over the composer before
  // they had said anything — asking for consent to store a conversation that does not exist yet.
  watch([agent.traceStorage, () => turns.value.some(turn => turn.message.role === 'assistant')],
    ([available, hasAnswer]) => { if (available && hasAnswer) traceStorageAvailable.value = true },
    { immediate: true })
  watch(consentRef, consent => {
    if (consent) agent.reportTraceConsent(consent === 'yes')
  })

  // An anonymous visitor's action token, fetched before each hello that starts a thread.
  let anonymousToken: string | undefined
  const refreshAnonymousToken = async () => {
    // A fresh one each time: a token is short-lived, and a reset can come long after the page loaded.
    resetAnonymousToken()
    anonymousToken = await getAnonymousToken()
  }

  /**
   * Create a conversation over HTTP. The socket binds to one; it does not make them — except for an
   * anonymous visitor, who has no HTTP route to make one with: undefined, and the hello creates it.
   */
  const createConversation = async (): Promise<string | undefined> => {
    if (options.anonymous) {
      await refreshAnonymousToken()
      return undefined
    }
    const conversation = await $fetch(
      `${$apiPath}/conversations/${options.accountType}/${options.accountId}`,
      { method: 'POST', body: { agentId: options.agentId ?? 'personal', title: options.title ?? 'chat' } }
    )
    return conversation.id
  }

  /**
   * The page's own events, forwarded up the socket instead of into a local store.
   *
   * Raw events, not a digest: the server holds the SAME `HostEventStore` class, so forwarding them
   * verbatim reproduces the browser's retention, coalescing and eviction exactly rather than
   * reimplementing them on the far side. A keyed event is retained state there for the same reason it
   * was here, because it is the same code deciding.
   *
   * `reportHostState({ key: null })` is how a withdrawal travels — the protocol spells "no longer
   * true" as a null value, which is a different statement from never having been reported.
   */
  subscribeHostEvents({
    onEvent: event => agent.reportHostEvents([event]),
    onWithdraw: key => agent.reportHostState({ [key]: null })
  })

  const start = async () => {
    aggregator = new FrameClientAggregator({
      // The PER-TAB channel: an aggregator on the default one never hears the page it is in.
      channelId: getTabChannelId(),
      onToolsChanged: discovered => {
        tools.value = { ...discovered }
        toolsVersion.value++
        repartition()
        // Only meaningful once the socket is up; before that `hello` carries the set anyway.
        agent.toolsChanged()
      }
    })
    aggregator.start()
    agent.connect(await createConversation())
  }

  start().catch(err => {
    status.value = 'error'
    error.value = err?.message ?? 'this conversation could not be opened'
  })

  onScopeDispose(() => {
    agent.close()
    aggregator?.close().catch(() => {})
  })

  return {
    messages,
    status,
    error,
    activity: agent.activity as Ref<ChatActivity | null>,
    isWaitingForUser: agent.isWaitingForUser,
    subAgentActivities: ref<Record<string, ChatActivity>>({}),
    tools,
    toolsVersion,
    resolvedPartition,
    conversationId,
    conversationCost,
    usageVersion,

    /** The caller's own quota windows and the account's status, for the Consumption tab. */
    fetchSelfUsage: async () => $fetch(`${$apiPath}/usage/${options.accountType}/${options.accountId}/self`,
      options.anonymous ? { headers: { 'x-anonymous-token': anonymousToken ?? await getAnonymousToken() } } : {}),

    sendMessage (content: string, sendOptions?: { hiddenContext?: string }) {
      if (!content.trim()) return
      error.value = null
      status.value = 'streaming'
      // The user turn is NOT added locally. The server stores it and sends it back as a `message`
      // frame, so the transcript has one source and the optimistic copy cannot disagree with the
      // stored one — which is what a reload would reveal.
      agent.prompt(content, sendOptions?.hiddenContext)
    },

    abort () {
      agent.abort()
      status.value = 'ready'
    },

    /** Start a fresh thread: a new conversation, and the socket rebound to it. */
    async reset () {
      agent.abort()
      turns.value = []
      subAgentPanels.value = {}
      conversationCost.value = 0
      error.value = null
      status.value = 'ready'
      agent.reset(await createConversation())
    },

    /** Report what is true on the page, for the model's context. */
    reportHostState: agent.reportHostState,
    reportHostEvents: agent.reportHostEvents
  }
}

export default useSessionChat
