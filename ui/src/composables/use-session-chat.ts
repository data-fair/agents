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

import { ref, shallowRef, computed, watch, onScopeDispose, readonly, type Ref } from 'vue'
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
import { apiErrorMessage } from '~/utils/api-error'

const debug = Debug('df-agents:use-session-chat')

export interface UseSessionChatOptions {
  accountType: string
  accountId: string
  /** Which standard agent to talk to. Defaults to the personal assistant. */
  agentId?: string
  /** Shown before anything has been said. Never sent anywhere. */
  initialMessages?: ChatMessage[]
  /** The title a created conversation is stored with. Falls back to the creation date, which is what
   * the history list shows, so two threads of the same agent are distinguishable. */
  title?: string
  /** Bind the socket to this conversation instead of creating one. */
  initialConversationId?: string
  /**
   * Do not create a conversation up front: the first message creates one.
   *
   * This is what the multi-agent chat needs. It opens with the composer and a history list, and an
   * eagerly created thread would appear in that list — empty — before the person has said anything,
   * once per visit. A conversation that was never spoken into is noise, not history.
   */
  lazyConversation?: boolean
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
  /** Each panel's own phase line, keyed by the delegating call: they used to overwrite the main one. */
  const subAgentActivities = ref<Record<string, ChatActivity>>({})

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
      // Over the panels the stored message already carries (data-subagent parts): live frames win.
      return Object.keys(panels).length ? { ...turn.message, subAgentPanels: { ...turn.message.subAgentPanels, ...panels } } : turn.message
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

    onSubAgentActivity: (parentToolCallId, activity) => {
      const next = { ...subAgentActivities.value }
      if (activity) next[parentToolCallId] = activity
      else delete next[parentToolCallId]
      subAgentActivities.value = next
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

    // A turn the SERVER started is still a turn: the person's action on a pending wait wakes one, and a
    // page attaching mid-turn joins one. Its first activity is what says so — not a pending message,
    // which history replays for a turn a restart left unfinished, and which would leave this stuck.
    onActivity: activity => {
      if (activity && activity.kind !== 'waiting' && status.value !== 'streaming') status.value = 'streaming'
    },

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

  /**
   * The conversation this chat believes it is bound to.
   *
   * Its own ref, not the socket's `attached` echo: the echo is `'pending'` between a conversation-less
   * hello and the first reset (the lazy path), and treating that as an id would make the first send
   * skip creation and prompt into nothing. The one case where the server is the only source is an
   * anonymous visitor, whose thread it creates — hence the watch.
   */
  const conversationId = ref<string | undefined>(options.initialConversationId)
  watch(agent.conversationId, id => {
    if (options.anonymous && id && id !== 'pending') conversationId.value = id
  })

  /** Which agent subsequent conversations and turns use. The socket's hello names it only for the
   * anonymous path — a signed-in conversation carries its own agent. */
  const activeAgentId = ref(options.agentId ?? 'personal')

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
  const createConversation = async (agentId: string): Promise<string | undefined> => {
    if (options.anonymous) {
      await refreshAnonymousToken()
      return undefined
    }
    const conversation = await $fetch(
      `${$apiPath}/conversations/${options.accountType}/${options.accountId}`,
      { method: 'POST', body: { agentId, title: options.title ?? new Date().toLocaleString() } }
    )
    return conversation.id
  }

  /**
   * The conversation of an agent with the latest activity — an empty one only when none has any.
   *
   * Opening the chat of an agent resumes this instead of forcing a new thread: a person coming back
   * to the assistant expects the thread they were in the middle of, not another one. The server sorts
   * by last message, so a thread that was spoken in wins over a newer empty one; but an empty one is
   * still resumed when it is all there is. The eager chat creates its thread on open, and skipping
   * empty ones made every page load of a person who never typed leave one more behind.
   *
   * Best-effort on purpose: an unknown agent or a revoked grant must surface from conversation
   * creation, with the server's own sentence, not from this lookup.
   */
  const findLatestConversation = async (agentId: string): Promise<{ id: string } | undefined> => {
    if (options.anonymous) return undefined
    try {
      const res = await $fetch<{ results: Array<{ id: string }> }>(
        `${$apiPath}/conversations/${options.accountType}/${options.accountId}?agentId=${encodeURIComponent(agentId)}&size=1`
      )
      return res.results?.[0]
    } catch {
      return undefined
    }
  }

  /**
   * Drop the local transcript before the socket is rebound.
   *
   * The frames of the thread being left can still be in flight — a turn may be streaming — so the
   * abort is not politeness: without it the last deltas of the old thread would land in the new one's
   * transcript. The server's replay on attach replaces all of this for the thread being opened.
   *
   * It unbinds the conversation too. A lazy switch to an agent with no thread leaves nothing bound until
   * the first send, and that send creates a thread only when nothing is bound — a stale id here sent
   * the first message to the PREVIOUS agent's thread.
   */
  const clearThread = () => {
    agent.abort()
    conversationId.value = undefined
    turns.value = []
    subAgentPanels.value = {}
    subAgentActivities.value = {}
    conversationCost.value = 0
    error.value = null
    status.value = 'ready'
  }

  /**
   * Start a fresh conversation with an agent — the current one by default.
   *
   * A failure to create is recorded as the chat's error rather than thrown: every caller is a click
   * or the first message of a lazy thread, and an unhandled rejection would leave the composer
   * enabled over a conversation that does not exist.
   */
  const newConversation = async (agentId: string = activeAgentId.value): Promise<string | undefined> => {
    clearThread()
    activeAgentId.value = agentId
    try {
      const id = await createConversation(agentId)
      conversationId.value = id
      agent.reset(id)
      return id
    } catch (err: any) {
      status.value = 'error'
      error.value = apiErrorMessage(err) ?? 'this conversation could not be opened'
      return undefined
    }
  }

  /** Open an existing conversation, binding the socket to it so it replays its history. */
  const openConversation = (agentId: string, id: string) => {
    clearThread()
    activeAgentId.value = agentId
    conversationId.value = id
    agent.reset(id)
  }

  /**
   * The agent picker's move: land on the agent's ongoing conversation, or on nothing yet.
   *
   * Conversations never change agent. A thread's identity is the agent that answered in it, so
   * re-running older turns under a new persona would misrepresent both; switching therefore opens the
   * new agent's most recent thread, and an agent that has none starts fresh on the first message. A
   * lazy chat gets no empty thread out of a switch; the eager one creates it now, which is also what
   * reports a revoked grant immediately.
   *
   * Re-selecting the current agent is a no-op — a new thread with it is what the dedicated control is
   * for, and doing it here would create an empty conversation for a click that changed nothing.
   */
  const switchAgent = async (agentId: string) => {
    if (agentId === activeAgentId.value) return
    clearThread()
    activeAgentId.value = agentId
    const latest = await findLatestConversation(agentId)
    // Switched again (or opened a thread) while the lookup ran: binding this answer now would put the
    // socket on the previous agent's thread under the picker's new selection.
    if (activeAgentId.value !== agentId || conversationId.value) return
    if (latest) {
      conversationId.value = latest.id
      agent.reset(latest.id)
    } else if (!options.lazyConversation) {
      await newConversation(agentId)
    }
  }

  /** Select the next conversation's agent WITHOUT creating one: what the picker lands on when the
   * agent the chat was opened with is not offered, and creation is deferred to the first message. */
  const setActiveAgent = (agentId: string) => { activeAgentId.value = agentId }

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
    if (options.initialConversationId) {
      conversationId.value = options.initialConversationId
      agent.connect(options.initialConversationId)
    } else if (options.anonymous) {
      // The server creates the thread on this hello, but only for a browser that proves itself with a
      // fresh anonymous action token — which `createConversation` used to fetch as a side effect of
      // returning undefined, and this branch would otherwise skip.
      await refreshAnonymousToken()
      agent.connect()
    } else {
      // Opening the chat of an agent resumes the thread this person was in the middle of, if any.
      const latest = await findLatestConversation(activeAgentId.value)
      if (latest) {
        conversationId.value = latest.id
        agent.connect(latest.id)
      } else if (options.lazyConversation) {
        // No conversation yet: the first send creates one, so `conversationId` stays undefined.
        agent.connect()
      } else {
        conversationId.value = await createConversation(activeAgentId.value)
        agent.connect(conversationId.value)
      }
    }
  }

  start().catch(err => {
    status.value = 'error'
    // The server's sentence (a 403 naming the missing grant, for instance) is in the response body;
    // `message` on a lib-express error is only the HTTP status text.
    error.value = apiErrorMessage(err) ?? 'this conversation could not be opened'
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
    subAgentActivities,
    tools,
    toolsVersion,
    resolvedPartition,
    conversationId,
    conversationCost,
    usageVersion,

    /** The caller's own quota windows and the account's status, for the Consumption tab. */
    fetchSelfUsage: async () => $fetch(`${$apiPath}/usage/${options.accountType}/${options.accountId}/self`,
      options.anonymous ? { headers: { 'x-anonymous-token': anonymousToken ?? await getAnonymousToken() } } : {}),

    /**
     * Send a turn. The first message of a lazy or just-switched chat creates its conversation here,
     * so a failure to create (a quota, a revoked grant) is reported as this send's error rather than
     * surfacing as an unhandled rejection with the composer still enabled.
     */
    async sendMessage (content: string, sendOptions?: { hiddenContext?: string }) {
      if (!content.trim()) return
      if (!conversationId.value && !options.anonymous) {
        // An error was already recorded by newConversation; do not prompt into a thread that is not
        // bound, which the server would refuse with a second, less useful message.
        if (!await newConversation()) return
      }
      error.value = null
      status.value = 'streaming'
      // The user turn is NOT added locally. The server stores it and sends it back as a `message`
      // frame, so the transcript has one source and the optimistic copy cannot disagree with the
      // stored one — which is what a reload would reveal.
      agent.prompt(content, sendOptions?.hiddenContext)
    },

    /** The person's Stop: the turn in flight, or the handover the assistant is waiting on. */
    abort () {
      agent.abort({ dismissWait: true })
      status.value = 'ready'
    },

    /** Start a fresh thread with the current agent: a new conversation, and the socket rebound to it. */
    reset () {
      return newConversation()
    },

    /** The chat's current agent — the picker's selection, and what a new conversation is created with. */
    activeAgentId: readonly(activeAgentId),
    /** Open an existing conversation from the history list. */
    openConversation,
    /** Change agent: resume its latest thread, or start one (see switchAgent). */
    switchAgent,
    setActiveAgent,

    /** Report what is true on the page, for the model's context. */
    reportHostState: agent.reportHostState,
    reportHostEvents: agent.reportHostEvents
  }
}

export default useSessionChat
