import { ref, watch, onScopeDispose } from 'vue'
import { streamText, generateText, stepCountIs, tool, jsonSchema, ToolLoopAgent } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ModelMessage, Tool } from 'ai'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import { FrameClientAggregator } from '~/transports/frame-client-aggregator'
import { createExploreTool, formatToolsAvailableMessage, newlyAvailableTools, EXPLORE_TOOL_NAME } from '~/composables/tool-exploration'
import { shouldFlattenSubAgent } from '~/composables/sub-agent-flatten'
import { $apiPath } from '~/context'
import { useSession } from '@data-fair/lib-vue/session.js'
import { getAnonymousToken, resetAnonymousToken } from '~/composables/use-anonymous-token'
import { extractErrorMessage } from '~/utils/error'
import { readConsent, traceStorageAvailable } from '~/traces/trace-consent'
import { wrapHiddenContext } from '~/traces/hidden-context'
import Debug from 'debug'
import type { ChatActivity } from './agent-activity.ts'
import { applyStreamPart, type StreamScope, type StreamPart } from './agent-stream-parts.ts'

const debug = Debug('df-agents:use-agent-chat')

// Shown when the gateway blocks a message (finish_reason content_filter); the
// host normally supplies a localized refusalMessage, this is the fallback.
// Names the decision as content moderation (generic: a content_filter can come
// from this platform's gate or an upstream provider's own filter) so a falsely
// blocked user understands what happened and can react, without revealing a
// category/reason that would give abusers feedback.
const DEFAULT_REFUSAL = 'This message was declined by content moderation — it appears to fall outside what this assistant is meant to help with. Try rephrasing if you think this is a mistake.'

// Returned to the MAIN assistant (not the user) as a delegated sub-agent's result
// when that sub-agent was moderation-blocked. Distinct from the user-facing
// refusal: it tells the assistant this was a content-policy decision (not a tool
// failure) and gives bounded guidance, so it can re-formulate a legitimate task
// or explain the block — rather than dead-ending. Deliberately discourages blind
// resubmission (each re-delegation is itself re-moderated; the turn is capped at
// stepCountIs(10)) so this does not become a moderation-probing retry loop.
const SUBAGENT_MODERATION_NOTICE = 'This delegated sub-agent task was blocked by content moderation — a content-policy decision, not a tool error. If the task is legitimate platform work (for example editing a resource\'s title, description, summary or other metadata), rephrase it more precisely and delegate again, or carry it out yourself if you have the necessary tools. Otherwise, briefly tell the user the request was declined by moderation. Do not resubmit the same task wording unchanged.'

// Shown when a turn finishes cleanly but the assistant produced no text at all
// (empty model completion, a sub-agent that returned nothing, or the step limit
// reached on a tool call). Without this the turn would render as a blank bubble
// and the conversation would appear to silently stop.
const DEFAULT_EMPTY_RESPONSE = "I wasn't able to produce a response. Please try rephrasing your request."

// Shown inside the sub-agent panel when a delegated sub-agent fails (its own
// gateway/provider call errors). Surfaces the failure instead of letting it
// bubble up as an unhandled tool error that stalls the turn.
const DEFAULT_SUBAGENT_ERROR = 'The sub-agent could not complete this task.'

// Shown when a turn is aborted because the stream went silent for too long
// (a provider/gateway stall holding the socket open, or a compaction call that
// never returns). The idle watchdog turns an otherwise indefinite hang — a
// spinner that resolves to nothing — into a recoverable error the user can retry.
const DEFAULT_TIMEOUT_RESPONSE = 'The assistant took too long to respond, so the request was stopped. Please try again.'

// No stream activity (no compaction result, no SSE part) for this long is treated
// as a hang: the watchdog aborts the turn and surfaces DEFAULT_TIMEOUT_RESPONSE.
// Deliberately generous — a slow first token from a large reasoning model on a big
// context must not trip it; only a genuine stall should. Overridable for tests via
// sessionStorage('agent-chat-idle-timeout').
const STREAM_IDLE_TIMEOUT_MS = 90_000

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
    state: 'pending' | 'done'
  }>
  subAgentMessages?: ChatMessage[]
  subAgentTurn?: number
  // Set on a sub-agent refusal message so toModelOutput can hand the main agent a
  // moderation-specific notice instead of the generic user-facing refusal text.
  // Not rendered; the panel shows `content` like any other message.
  moderationBlocked?: boolean
}

export interface ToolInfo {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, any>
}

export interface SubAgentInfo {
  name: string
  displayName: string
  description: string
  tools: ToolInfo[]
}

export interface DebugToolsPartition {
  mainTools: ToolInfo[]
  subAgents: SubAgentInfo[]
}

export interface UseAgentChatOptions {
  accountType: string,
  accountId: string,
  systemPrompt?: string
  initialMessages?: ChatMessage[]
  localTools?: Record<string, Tool>
  modelName?: string
  refusalMessage?: string
  emptyResponseMessage?: string
  timeoutMessage?: string
  toolExploration?: boolean
  flattenSubAgents?: boolean
  // When set, this chat never opts into server-side trace storage: the
  // x-trace-consent header is withheld so the gateway never records its
  // requests. Used by the evaluator, whose own LLM calls reviewing a stored
  // trace would otherwise be stored as a confusing "meta" trace.
  disableTraceStorage?: boolean
}

interface SubAgentConfig {
  prompt: string
  tools: string[]
  model?: string
  delegateOnly?: boolean
}

/**
 * Partition tools into main-agent tools and sub-agent pseudo-tools.
 * Sub-agent tools (names listed in a sub-agent's `tools` array) are removed
 * from the main set so they are only visible to the sub-agent.
 */
function partitionTools (allTools: Record<string, Tool>): {
  mainTools: Record<string, Tool>
  subAgents: Record<string, { tool: Tool, config: SubAgentConfig }>
} {
  const subAgents: Record<string, { tool: Tool, config: SubAgentConfig }> = {}
  const reservedToolNames = new Set<string>()

  // First pass: identify sub-agents and collect reserved tool names
  for (const [name, t] of Object.entries(allTools)) {
    if (!name.startsWith('subagent_')) continue

    // Call execute to get the sub-agent config
    const executeFn = (t as any).execute
    if (!executeFn) continue

    // We need the config synchronously for partitioning, but execute is async.
    // The sub-agent tool's execute returns a static config, so we call it once
    // and cache the result. We'll resolve it before first use.
    subAgents[name] = { tool: t, config: null as any }
  }

  // Build the main tools set (exclude subagent_ pseudo-tools and reserved tools)
  const mainTools: Record<string, Tool> = {}
  for (const [name, t] of Object.entries(allTools)) {
    if (name.startsWith('subagent_')) continue
    if (reservedToolNames.has(name)) continue
    mainTools[name] = t
  }

  return { mainTools, subAgents }
}

export function useAgentChat (options: UseAgentChatOptions) {
  // @ts-ignore
  if (import.meta.env?.SSR) return

  const session = useSession()
  const isAnonymous = () => !session.user.value
  if (isAnonymous()) {
    // prefetch so SD's notBefore window elapses while the user types
    // eslint-disable-next-line no-void
    void getAnonymousToken().catch(err => debug('anonymous token prefetch failed: %O', err))
  }

  const { localTools, modelName } = options
  const chatModelName = modelName ?? 'assistant'
  // Reactive so a reset starts a fresh trace: consumers (debug dialog review link)
  // and trace headers pick up the new id.
  const conversationId = ref(crypto.randomUUID())

  const messages = ref<ChatMessage[]>(options.initialMessages ?? [])

  const status = ref<'ready' | 'streaming' | 'error'>('ready')
  const error = ref<string | null>(null)
  // Coarse label for what a streaming turn is doing during a gap with no visible
  // output, so the UI can show a discreet "Compacting…/Thinking…/Analyzing tool
  // result…" line instead of an ambiguous spinner. Held null while text is actively
  // streaming (the streaming markdown cursor is signal enough) and while idle.
  const activity = ref<ChatActivity | null>(null)
  const tools = ref<Record<string, Tool>>({})
  const toolsVersion = ref(0)
  let history: ModelMessage[] = []
  // characters of serialized history before compaction
  // 24000 is roughly equivalent to a 8k tokens context with 10-15 turns of dialogue an 2-3 tool calls
  const COMPACTION_THRESHOLD = 24_000
  // Read live from `options` (like systemPrompt) so toggling exploration takes
  // effect on the next turn; callers flip it via setToolExploration + reset.
  const explorationEnabled = () => !!options.toolExploration
  // Read live like explorationEnabled so toggling takes effect on the next turn;
  // callers flip it via setFlattenSubAgents + reset.
  const flatteningEnabled = () => !!options.flattenSubAgents
  // Tools promoted to the callable set via explore_tools; persists across turns,
  // cleared on compaction and reset. Read live by prepareStep.
  let promotedTools = new Set<string>()
  // Tool names already surfaced to the model via <tools-available> messages.
  // Persists across turns; pruned to live tools each turn; cleared on compaction and reset.
  const announcedTools = new Set<string>()
  let abortController: AbortController | null = null
  let turnSeq = 0

  let aggregator: FrameClientAggregator | null = null

  if (localTools) {
    // When localTools is provided, skip FrameClientAggregator entirely
    debug('using local tools=%o', Object.keys(localTools))
    tools.value = { ...localTools }
    toolsVersion.value++
  } else {
    aggregator = new FrameClientAggregator({
      channelId: getTabChannelId(),
      onToolsChanged: (newTools) => {
        debug('tools changed version=%d tools=%o', toolsVersion.value + 1, Object.keys(newTools))
        tools.value = { ...newTools }
        toolsVersion.value++
      }
    })
    aggregator.start()
  }

  const resolvedPartition = ref<DebugToolsPartition>({ mainTools: [], subAgents: [] })
  let resolveGeneration = 0

  async function resolveToolsPartition () {
    const gen = ++resolveGeneration
    const allTools = tools.value
    const subAgentEntries: SubAgentInfo[] = []
    const reservedNames = new Set<string>()

    for (const [name, t] of Object.entries(allTools)) {
      if (!name.startsWith('subagent_')) continue
      const executeFn = (t as any).execute
      if (!executeFn) continue
      try {
        const raw = await executeFn({ task: '' })
        if (gen !== resolveGeneration) return
        let configStr: string
        if (typeof raw === 'string') configStr = raw
        else if (raw?.content?.[0]?.text) configStr = raw.content[0].text
        else continue
        const config: SubAgentConfig = JSON.parse(configStr)
        for (const tn of config.tools) reservedNames.add(tn)
        const childTools: ToolInfo[] = config.tools
          .filter(tn => allTools[tn])
          .map(tn => {
            const ct = allTools[tn] as any
            return {
              name: tn,
              title: ct.title,
              description: ct.description ?? '',
              inputSchema: ct.inputSchema?.jsonSchema ?? {}
            }
          })
        subAgentEntries.push({
          name,
          displayName: (t as any).title || name.replace(/^subagent_/, ''),
          description: (t as any).description ?? '',
          tools: childTools
        })
      } catch { /* skip broken subagents */ }
    }

    if (gen !== resolveGeneration) return

    const main: ToolInfo[] = []
    for (const [name, t] of Object.entries(allTools)) {
      if (name.startsWith('subagent_')) continue
      if (reservedNames.has(name)) continue
      main.push({
        name,
        title: (t as any).title,
        description: (t as any).description ?? '',
        inputSchema: (t as any).inputSchema?.jsonSchema ?? {}
      })
    }

    resolvedPartition.value = { mainTools: main, subAgents: subAgentEntries }
  }

  watch(() => toolsVersion.value, () => { resolveToolsPartition() }, { immediate: true })

  function traceHeaders (ctx: string): Record<string, string> {
    const consent = options.disableTraceStorage ? null : readConsent()
    return {
      'x-trace-ctx': ctx,
      'x-trace-conversation': conversationId.value,
      ...(consent ? { 'x-trace-consent': consent } : {})
    }
  }

  // Surface server-advertised trace storage availability (drives the consent sheet).
  const noteStorageHeader = (res: Response): Response => {
    if (res.headers.get('x-trace-storage') === 'available') traceStorageAvailable.value = true
    return res
  }

  const gatewayFetch: typeof fetch = async (input, init) => {
    if (!isAnonymous()) return noteStorageHeader(await fetch(input, init))
    const withToken = async (token: string) => {
      const headers = new Headers(init?.headers as HeadersInit | undefined)
      headers.set('x-anonymous-token', token)
      return fetch(input, { ...(init as RequestInit), headers })
    }
    let res = await withToken(await getAnonymousToken())
    if (res.status === 401) {
      resetAnonymousToken()
      res = await withToken(await getAnonymousToken())
    }
    return noteStorageHeader(res)
  }

  const provider = createOpenAI({
    baseURL: `${window.location.origin}${$apiPath}/gateway/${options.accountType}/${options.accountId}/v1`,
    apiKey: 'unused',
    fetch: gatewayFetch
  })

  onScopeDispose(() => {
    if (aggregator) {
      aggregator.close()
    }
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  })

  const abort = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
      status.value = 'ready'
    }
  }

  const reset = (newSystemPrompt?: string) => {
    abort()
    messages.value = []
    status.value = 'ready'
    error.value = null
    history = []
    // Start a fresh trace: a reset is a new conversation, not a continuation.
    conversationId.value = crypto.randomUUID()
    // abort() above guarantees no in-flight prepareStep will read the old Set
    promotedTools = new Set<string>()
    announcedTools.clear()
    if (newSystemPrompt !== undefined) {
      options.systemPrompt = newSystemPrompt
    }
  }

  /**
   * Resolve sub-agent configs by calling their execute functions.
   * Removes a sub-agent's reserved tools from mainTools unless that sub-agent will be
   * flattened (opts.willFlatten), where the reserved tools stay callable by the main agent.
   */
  async function resolveSubAgents (
    mainTools: Record<string, Tool>,
    subAgents: Record<string, { tool: Tool, config: SubAgentConfig }>,
    opts?: { willFlatten?: (config: SubAgentConfig) => boolean }
  ) {
    for (const [, entry] of Object.entries(subAgents)) {
      const executeFn = (entry.tool as any).execute
      if (executeFn) {
        // Pass a dummy task to satisfy the inputSchema requirement
        const raw = await executeFn({ task: '' })
        // The MCP tool execute returns a CallToolResult: { content: [{ type: 'text', text: '...' }] }
        // Extract the JSON string from the content array
        let configStr: string
        if (typeof raw === 'string') {
          configStr = raw
        } else if (raw?.content?.[0]?.text) {
          configStr = raw.content[0].text
        } else {
          continue
        }
        entry.config = JSON.parse(configStr) as SubAgentConfig

        // Keep reserved tools in the main set only for flattened sub-agents; delegated
        // sub-agents keep them exclusive to their ToolLoopAgent.
        if (!opts?.willFlatten?.(entry.config)) {
          for (const reservedName of entry.config.tools) {
            delete mainTools[reservedName]
          }
        }
      }
    }
  }

  async function compactHistory (compactionCtxId: string, signal: AbortSignal): Promise<void> {
    const threshold = Number(sessionStorage.getItem('agent-chat-compaction-threshold')) || COMPACTION_THRESHOLD
    const serialized = JSON.stringify(history)
    if (serialized.length < threshold) return

    // Summarize all messages except the latest user message, which we preserve verbatim
    const lastMessage = history[history.length - 1]
    const historyToCompact = history.slice(0, -1)
    if (historyToCompact.length === 0) return

    // Compaction is otherwise an invisible, multi-second blank gap (a separate
    // summarizer call over the whole history before the real turn even starts);
    // name it so the user sees what's happening instead of a mute spinner.
    activity.value = { kind: 'compacting' }

    // The summary becomes the assistant's only memory of everything before the last
    // user message, so it must stay *actionable*: keep the open task and its next
    // step, the user's goals/constraints, decisions, and — verbatim — the identifiers
    // the assistant needs to keep acting (ids, indices, paths, URLs, names, figures).
    // Detailed tool payloads can be dropped (tools remain callable to re-fetch them)
    // but the references to re-fetch them must survive.
    const prompt = 'You are compacting the earlier part of a conversation between a user and a tool-using AI assistant so it can continue within a smaller context window. Write a dense recap that preserves everything needed to continue seamlessly: any task still in progress and the concrete next step; the user\'s stated goals, preferences and constraints; key decisions and conclusions; and important results from tool calls. Keep identifiers and references verbatim — dataset/resource ids, entry indices, file paths, URLs, names, exact figures — since the assistant may need them to act again. Omit pleasantries and redundant back-and-forth. Be concise, but lossless on actionable details.'

    try {
      const { text: summary } = await generateText({
        model: provider.chat('summarizer'),
        system: prompt,
        messages: [{ role: 'user' as const, content: JSON.stringify(historyToCompact) }],
        abortSignal: signal,
        headers: traceHeaders(compactionCtxId)
      })

      const originalLength = serialized.length

      // Framed as a user turn (not assistant): providers like Anthropic require the
      // history to start with a user message, and the SDK coalesces it with the
      // verbatim last user message that follows. The preamble tells the model this is
      // a condensed record of the earlier exchange — including its own actions — so it
      // doesn't mistake the recap for a fresh user request.
      history = [
        { role: 'user' as const, content: `[Automatic recap of our earlier conversation, condensed to save context — continue as if you remember it]\n${summary}` },
        lastMessage
      ]

      promotedTools.clear()
      announcedTools.clear()

      debug('compacted history from %d chars to %d chars', originalLength, JSON.stringify(history).length)
    } catch (err) {
      // An abort (the user pressed Stop, or the idle watchdog fired) must stop the
      // whole turn — rethrow so sendMessage's catch handles it. Any other failure is
      // non-fatal: fall through and continue with the un-compacted history.
      if (signal.aborted) throw err
      debug('compaction error, continuing with full history: %O', err)
    }
  }

  const sendMessage = async (msg: string, sendOptions?: { hiddenContext?: string }) => {
    if (status.value === 'streaming') return

    status.value = 'streaming'
    const turnId = turnSeq++
    error.value = null
    messages.value.push({ role: 'user', content: msg })
    // Index of the first message added after the user message this turn — used to
    // roll back partial assistant output if the gateway blocks the turn.
    const turnMessagesStart = messages.value.length

    // Add user message to history. When an action button supplied hidden context,
    // wrap it into this same user turn so the model sees it as turn-scoped context
    // (not a permanent system-prompt mutation); the chat UI above shows only `msg`.
    const hiddenContext = sendOptions?.hiddenContext
    history.push({ role: 'user', content: hiddenContext ? wrapHiddenContext(hiddenContext, msg) : msg })

    // Create the abort controller before compaction so the Stop button (and the idle
    // watchdog) can cancel the summarizer call too — previously compaction ran with
    // no controller, leaving a slow/stalled summarize unkillable and invisible.
    abortController = new AbortController()
    const signal = abortController.signal
    let streamError: unknown = null
    let timedOut = false
    let watchdog: ReturnType<typeof setTimeout> | undefined
    const idleMs = Number(sessionStorage.getItem('agent-chat-idle-timeout')) || STREAM_IDLE_TIMEOUT_MS
    const armWatchdog = () => {
      if (watchdog) clearTimeout(watchdog)
      watchdog = setTimeout(() => { timedOut = true; abortController?.abort() }, idleMs)
    }

    // The main assistant transcript is built by the shared applyStreamPart, the same
    // builder each sub-agent uses. `current`, `producedText` and `stepHadTool` live on
    // the scope; the sub-agent execute closure reads `mainScope.current` as its parent
    // message. The main bottom line stays quiet while a tool runs (its chip spins, and
    // a sub-agent drives its own panel line); the post-step gap names the sub-agent.
    const mainScope: StreamScope = {
      messages: messages.value,
      current: null,
      producedText: false,
      stepHadTool: false,
      setActivity: (phase, toolName) => {
        switch (phase) {
          case 'streaming':
          case 'tool':
            activity.value = null
            break
          case 'analyzing':
            activity.value = { kind: 'analyzing', subAgent: toolName?.startsWith('subagent_') ? toolName : undefined }
            break
          case 'thinking':
            activity.value = { kind: 'thinking' }
            break
        }
      }
    }

    activity.value = { kind: 'thinking' }
    armWatchdog()

    try {
      // Compact history if it exceeds the threshold (abortable, watchdog-covered).
      const compactionCtxId = `compaction:${turnId}`
      await compactHistory(compactionCtxId, signal)
      activity.value = { kind: 'thinking' }
      armWatchdog()

      const currentTools = tools.value
      const { mainTools, subAgents } = partitionTools(currentTools)
      debug('partitioned tools: main=%o subAgents=%o', Object.keys(mainTools), Object.keys(subAgents))

      // Flat mode keeps reserved tools in the main set and turns sub-agents into
      // no-arg guidance tools (experimental flatten toggle). The decision is per sub-agent:
      // model-pinned or delegateOnly sub-agents stay delegated even when flatten is on.
      const flatten = flatteningEnabled()
      const willFlatten = (config: SubAgentConfig) => shouldFlattenSubAgent(config, flatten)
      await resolveSubAgents(mainTools, subAgents, { willFlatten })

      // Build the tool set for the main LLM:
      // main tools + sub-agent pseudo-tools using ToolLoopAgent + async generators
      const subAgentHistory = new Map<string, ModelMessage[]>()
      const subAgentCallCount = new Map<string, number>()
      const mainLLMTools: Record<string, Tool> = { ...mainTools }
      for (const [name, entry] of Object.entries(subAgents)) {
        const config = entry.config

        if (willFlatten(config)) {
          // Flattened: register the sub-agent as a no-arg guidance tool that returns its
          // own prompt, under the de-prefixed name so AgentChatMessages renders it as an
          // ordinary chip (not an empty sub-agent panel — panel rendering keys off the
          // `subagent_` prefix). Reserved tools are already exposed flat, so the main agent
          // reads the brief and then drives them itself in the same loop.
          // Assumes sub-agent names don't collide with real tool names; in flat mode a
          // colliding flatName would overwrite that tool in mainLLMTools.
          const flatName = name.replace(/^subagent_/, '')
          mainLLMTools[flatName] = tool({
            description: (entry.tool as any).description || '',
            inputSchema: jsonSchema({ type: 'object', properties: {}, additionalProperties: false }),
            execute: async () => config.prompt
          })
          continue
        }

        // Collect the sub-agent's tools from the full tool set
        const subAgentTools: Record<string, Tool> = {}
        for (const toolName of config.tools) {
          if (currentTools[toolName]) subAgentTools[toolName] = currentTools[toolName]
        }

        const subAgent = new ToolLoopAgent({
          model: provider.chat(config.model ?? 'tools'),
          instructions: config.prompt,
          tools: subAgentTools,
          stopWhen: stepCountIs(10)
        })

        const displayName = name.replace(/^subagent_/, '')
        // Colons are the field separator in the sub-agent trace ctx
        // (sub:<name>:<index>:<uid>); sanitize so a colon in the name can't
        // misalign the server-side parseContextId fields.
        const ctxName = displayName.replace(/:/g, '_')

        mainLLMTools[name] = tool({
          description: (entry.tool as any).description || '',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              task: { type: 'string', description: 'The task to delegate to this sub-agent. Include all relevant context from the conversation that the sub-agent needs to accomplish the task (user preferences, constraints, data references, etc.).' }
            },
            required: ['task']
          }),
          execute: async function * (args: any, { abortSignal }: { abortSignal?: AbortSignal }) {
            // Track multi-turn state for this sub-agent
            const priorMessages = subAgentHistory.get(name) ?? []
            const callIndex = subAgentCallCount.get(name) ?? 0
            subAgentCallCount.set(name, callIndex + 1)

            // The parent assistant message hosting this sub-agent's panel. The SDK invokes
            // this tool's execute BEFORE the main loop processes the `subagent_` tool-call
            // part, so mainScope.current is still null on entry; it is set during the first
            // `await` below. So we read it LIVE (via liveParent) at each write site rather
            // than capturing it once. mainScope.current is the structural StreamMessage
            // minimum; here we need the ChatMessage fields (subAgentMessages/subAgentTurn),
            // and at these call sites it always IS a ChatMessage (applyStreamPart pushed it
            // into messages.value, a ChatMessage[]).
            const liveParent = () => mainScope.current as ChatMessage | null
            const parentToolCallId = liveParent()?.toolInvocations?.find(
              ti => ti.toolName === name && ti.state === 'pending'
            )?.toolCallId ?? name

            // Same shared builder as the main loop, but its activity drives the SAME
            // global `activity` ref tagged for THIS sub-agent, so the component shows
            // the phase inside this panel. Unlike the main line, the 'tool' phase shows
            // (sub-agent chips don't spin, so the panel line carries it).
            // The builder writes into this scratch array; each yield we copy a fresh
            // snapshot onto the reactive parent's subAgentMessages. Reassigning a new
            // array (rather than mutating in place) is what reliably triggers Vue to
            // re-render the panel — the same approach the previous snapshot path used.
            const subScope: StreamScope = {
              messages: [],
              current: null,
              producedText: false,
              stepHadTool: false,
              setActivity: (phase) => {
                switch (phase) {
                  case 'streaming': activity.value = null; break
                  case 'tool': activity.value = { kind: 'subagent', name, phase: 'tool' }; break
                  case 'analyzing': activity.value = { kind: 'subagent', name, phase: 'analyzing' }; break
                  case 'thinking': activity.value = { kind: 'subagent', name, phase: 'thinking' }; break
                }
              }
            }

            // Enter gap: name the spin-up before the first token arrives.
            activity.value = { kind: 'subagent', name, phase: 'starting' }

            let subStreamError: unknown = null
            try {
              // First call: single prompt. Subsequent calls: pass accumulated history.
              const subResult = priorMessages.length === 0
                // `headers` is a construction-time setting in the AI SDK's agent types, not a
                // call-time param, so we widen only for it while keeping the rest type-checked.
                ? await subAgent.stream({ prompt: args.task, abortSignal, headers: traceHeaders(`sub:${ctxName}:${callIndex}:${parentToolCallId}`) } as Parameters<typeof subAgent.stream>[0] & { headers: Record<string, string> })
                : await subAgent.stream({
                  messages: [...priorMessages, { role: 'user' as const, content: args.task }],
                  abortSignal,
                  headers: traceHeaders(`sub:${ctxName}:${callIndex}:${parentToolCallId}`)
                } as Parameters<typeof subAgent.stream>[0] & { headers: Record<string, string> })

              // Build the panel transcript from the same delta parts the main loop uses,
              // yielding a snapshot each part so the SDK gets streaming preliminary results.
              for await (const part of subResult.fullStream) {
                // In-band provider error (the #38 silent-drop class): the SDK does not
                // throw it, so capture and stop instead of finishing as a blank sub-agent.
                if (part.type === 'error') { subStreamError = (part as any).error; break }
                applyStreamPart(part as unknown as StreamPart, subScope)
                // Publish a fresh snapshot onto the (now-live) parent each part so Vue
                // re-renders the panel; reassigning a new array is what triggers it.
                const parent = liveParent()
                if (parent) {
                  parent.subAgentTurn = callIndex
                  parent.subAgentMessages = [...subScope.messages]
                }
                yield [...subScope.messages]
              }
              if (subStreamError) throw subStreamError

              // Accumulate history for the next call to this sub-agent
              const subResponse = await subResult.response
              // A content_filter on the sub-agent's own gateway call (untrusted callers)
              // surfaces as a refusal output instead of aborting the whole turn.
              if ((await subResult.finishReason) === 'content-filter') {
                // User-facing refusal for the panel; moderationBlocked tells
                // toModelOutput to hand the main agent SUBAGENT_MODERATION_NOTICE
                // instead of this generic text so it can react appropriately.
                const refusal: ChatMessage = { role: 'assistant', content: options.refusalMessage || DEFAULT_REFUSAL, moderationBlocked: true }
                const parent = liveParent()
                if (parent) {
                  parent.subAgentMessages = [...(parent.subAgentMessages ?? []), refusal]
                }
                yield [refusal]
              }
              subAgentHistory.set(name, [
                ...priorMessages,
                { role: 'user' as const, content: args.task },
                ...subResponse.messages
              ])
            } catch (subErr: any) {
              // Let an abort tear down the whole turn (handled by sendMessage's catch).
              if (subErr?.name === 'AbortError') throw subErr
              // Any other sub-agent failure (its own gateway/provider error) would
              // otherwise surface as an unhandled tool-error: the model gets no result,
              // the panel keeps spinning, and the turn can end with no visible output.
              // Yield a final error message instead so the failure is shown and becomes
              // this tool's output (via toModelOutput) for the main agent to react to.
              debug('sub-agent %s failed: %O', name, subErr)
              const errorMsg: ChatMessage = { role: 'assistant', content: DEFAULT_SUBAGENT_ERROR }
              const parent = liveParent()
              if (parent) {
                parent.subAgentMessages = [...(parent.subAgentMessages ?? []), errorMsg]
              }
              yield [errorMsg]
            }
          },
          toModelOutput: ({ output }: { output: any }) => {
            // Main agent sees only the final text summary, not full subagent trace
            const lastMsg = Array.isArray(output) ? output[output.length - 1] : null
            // A moderation block is a content-policy decision, not a finished task:
            // give the main agent an actionable notice rather than the user-facing
            // refusal text so it can re-formulate a legitimate task or explain.
            if ((lastMsg as ChatMessage | null)?.moderationBlocked) {
              return { type: 'text' as const, value: SUBAGENT_MODERATION_NOTICE }
            }
            return {
              type: 'text' as const,
              value: (lastMsg as ChatMessage | null)?.content || 'Task completed.'
            }
          }
        })
      }

      // Exploration mode: hide plain tools behind explore_tools, expose only
      // explore_tools + sub-agent pseudo-tools + already-promoted tools per step.
      // The plain tool names are surfaced to the model as <tools-available> messages
      // (names only); the system prompt is left untouched.
      // Names announced via a <tools-available> message this turn; used to roll back
      // the push (and the announcement) if the turn is blocked by moderation.
      let announcedThisTurn: string[] = []
      let prepareStep: undefined | (() => { activeTools: string[] })
      if (explorationEnabled()) {
        const subAgentNames = Object.keys(subAgents)
        const plainTools = { ...mainTools }
        mainLLMTools[EXPLORE_TOOL_NAME] = createExploreTool({
          plainTools,
          promote: (names) => names.forEach(n => promotedTools.add(n)),
          summarizer: provider.chat('summarizer'),
          headers: traceHeaders(`turn:${turnId}`)
        })

        // Prune announced/promoted sets in place to the tools still live, so a tool
        // that disappears (server disconnect) un-announces and un-promotes; if it
        // returns later it re-announces. Mutate in place — the promote and prepareStep
        // closures capture these set objects.
        const liveNames = new Set(Object.keys(plainTools))
        for (const n of [...announcedTools]) if (!liveNames.has(n)) announcedTools.delete(n)
        for (const n of [...promotedTools]) if (!liveNames.has(n)) promotedTools.delete(n)

        // Announce newly-available tool names (delta) as one <tools-available> message.
        const delta = newlyAvailableTools(Object.keys(plainTools), announcedTools)
        if (delta.length) {
          // Insert the availability notice just before this turn's user message (the
          // history tail) so the user message stays last — models (and the mock) act on
          // the final user message.
          history.splice(history.length - 1, 0, { role: 'user' as const, content: formatToolsAvailableMessage(delta) })
          for (const n of delta) announcedTools.add(n)
          announcedThisTurn = delta
        }

        prepareStep = () => ({
          activeTools: [EXPLORE_TOOL_NAME, ...subAgentNames, ...promotedTools]
            .filter(n => n in mainLLMTools)
        })
      }

      debug('streaming with model=%s tools=%o exploration=%s', chatModelName, Object.keys(mainLLMTools), explorationEnabled())
      const result = streamText({
        model: provider.chat(chatModelName),
        system: options.systemPrompt,
        messages: history,
        tools: Object.keys(mainLLMTools).length > 0 ? mainLLMTools : undefined,
        stopWhen: stepCountIs(10),
        abortSignal: signal,
        ...(prepareStep ? { prepareStep } : {}),
        headers: traceHeaders(`turn:${turnId}`),
        onError: ({ error: err }) => {
          streamError = err
        }
      })

      for await (const part of result.fullStream) {
        // Any part counts as activity: re-arm so the watchdog only fires on a genuine
        // stall (a gap longer than idleMs between parts), not on a slow-but-live stream.
        armWatchdog()
        if (part.type === 'finish' && part.finishReason === 'content-filter') {
          // The gateway blocked this turn (moderation). Drop it from model context;
          // the blocked user message is the history tail; if exploration announced
          // tools this turn, a <tools-available> notice sits just before it.
          history.pop()
          if (announcedThisTurn.length) {
            history.pop()
            for (const n of announcedThisTurn) announcedTools.delete(n)
          }
          // Discard partial assistant output (late blocks cut mid-stream)
          messages.value.splice(turnMessagesStart)
          messages.value.push({ role: 'assistant', content: options.refusalMessage || DEFAULT_REFUSAL })
          status.value = 'ready'
          return
        }
        if (part.type === 'error') {
          // The provider emits a mid-stream failure as an in-band 'error' part instead
          // of throwing (onError also fires, but races our consumer). streamText's
          // result.response only rejects when zero steps completed, so after a tool
          // step this error would otherwise be silently dropped. Capture and stop.
          streamError = streamError ?? (part as any).error
          break
        }
        applyStreamPart(part, mainScope)
      }

      // Surface an in-band stream error captured during the loop (or by onError).
      // The fullStream does not throw on an 'error' part and result.response only
      // rejects when no step completed, so after a tool step the error must be
      // re-thrown here to reach the catch instead of finishing as a blank 'ready'.
      if (streamError) throw streamError

      // Update history with all response messages
      const response = await result.response
      history = history.concat(response.messages)

      // A clean finish with no assistant text is a silent drop: empty model
      // completion, a sub-agent that returned nothing, or the step limit reached on
      // a tool call. Surface a fallback so the turn is never visibly empty.
      if (!mainScope.producedText) {
        messages.value.push({ role: 'assistant', content: options.emptyResponseMessage || DEFAULT_EMPTY_RESPONSE })
      }

      status.value = 'ready'
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // The watchdog aborts the same controller as the Stop button; distinguish
        // them so a genuine hang surfaces a recoverable timeout error, while a user
        // abort stays silent.
        if (timedOut) {
          error.value = options.timeoutMessage || DEFAULT_TIMEOUT_RESPONSE
          status.value = 'error'
        } else {
          status.value = 'ready'
        }
        return
      }
      // The AI SDK wraps stream failures in a generic NoOutputGeneratedError.
      // Use the actual error captured via onError when available.
      const actualError = streamError ?? err
      const message = extractErrorMessage(actualError)
      debug('chat error: %s %O', message, actualError)
      console.error('Agent chat error:', actualError)
      error.value = message
      status.value = 'error'
    } finally {
      if (watchdog) clearTimeout(watchdog)
      activity.value = null
      abortController = null
    }
  }

  const setSystemPrompt = (prompt: string) => {
    options.systemPrompt = prompt
  }

  const setToolExploration = (enabled: boolean) => {
    options.toolExploration = enabled
  }

  const setFlattenSubAgents = (enabled: boolean) => {
    options.flattenSubAgents = enabled
  }

  return { messages, status, error, activity, tools, toolsVersion, resolvedPartition, conversationId, sendMessage, abort, reset, setSystemPrompt, setToolExploration, setFlattenSubAgents }
}

export default useAgentChat
