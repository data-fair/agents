import { ref, watch, onScopeDispose } from 'vue'
import { streamText, generateText, stepCountIs, tool, jsonSchema, ToolLoopAgent, readUIMessageStream } from 'ai'
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

const debug = Debug('df-agents:use-agent-chat')

// Shown when the gateway blocks a message (finish_reason content_filter); the
// host normally supplies a localized refusalMessage, this is the fallback.
const DEFAULT_REFUSAL = "This request can't be processed as it falls outside what this assistant is meant to help with."

// Shown when a turn finishes cleanly but the assistant produced no text at all
// (empty model completion, a sub-agent that returned nothing, or the step limit
// reached on a tool call). Without this the turn would render as a blank bubble
// and the conversation would appear to silently stop.
const DEFAULT_EMPTY_RESPONSE = "I wasn't able to produce a response. Please try rephrasing your request."

// Shown inside the sub-agent panel when a delegated sub-agent fails (its own
// gateway/provider call errors). Surfaces the failure instead of letting it
// bubble up as an unhandled tool error that stalls the turn.
const DEFAULT_SUBAGENT_ERROR = 'The sub-agent could not complete this task.'

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
  toolExploration?: boolean
  flattenSubAgents?: boolean
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
    const consent = readConsent()
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

  /**
   * Convert a UIMessage (from readUIMessageStream) into our ChatMessage[] format
   * for rendering in the existing UI components.
   */
  function uiMessageToChatMessages (uiMessage: any): ChatMessage[] {
    const chatMessages: ChatMessage[] = []
    let current: ChatMessage | null = null

    for (const part of uiMessage.parts ?? []) {
      if (part.type === 'text') {
        if (!current) { current = { role: 'assistant', content: '' }; chatMessages.push(current) }
        current.content += part.text
      } else if (part.type === 'dynamic-tool' || (part.type?.startsWith('tool-') && part.type !== 'tool-invocation')) {
        // Dynamic tools: type 'dynamic-tool' with toolName/toolCallId/state
        // Static tools: type 'tool-<name>' with same fields
        if (!current) { current = { role: 'assistant', content: '', toolInvocations: [] }; chatMessages.push(current) }
        if (!current.toolInvocations) current.toolInvocations = []
        const toolName = part.toolName ?? part.type.replace(/^tool-/, '')
        current.toolInvocations.push({
          toolCallId: part.toolCallId,
          toolName,
          state: part.state === 'output-available' ? 'done' : 'pending'
        })
      } else if (part.type === 'step-start') {
        current = null // new step → new message
      }
    }
    return chatMessages
  }

  async function compactHistory (compactionCtxId: string): Promise<void> {
    const threshold = Number(sessionStorage.getItem('agent-chat-compaction-threshold')) || COMPACTION_THRESHOLD
    const serialized = JSON.stringify(history)
    if (serialized.length < threshold) return

    // Summarize all messages except the latest user message, which we preserve verbatim
    const lastMessage = history[history.length - 1]
    const historyToCompact = history.slice(0, -1)
    if (historyToCompact.length === 0) return

    const prompt = 'You are summarizing a conversation history between a user and an AI assistant that uses tools. Preserve all key facts, decisions, tool results, and context needed to continue the conversation naturally. Be concise but complete.'

    try {
      const { text: summary } = await generateText({
        model: provider.chat('summarizer'),
        system: prompt,
        messages: [{ role: 'user' as const, content: JSON.stringify(historyToCompact) }],
        headers: traceHeaders(compactionCtxId)
      })

      const originalLength = serialized.length

      history = [
        { role: 'user' as const, content: `[Previous conversation summary]\n${summary}` },
        lastMessage
      ]

      promotedTools.clear()
      announcedTools.clear()

      debug('compacted history from %d chars to %d chars', originalLength, JSON.stringify(history).length)
    } catch (err) {
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

    // Compact history if it exceeds the threshold
    const compactionCtxId = `compaction:${turnId}`
    await compactHistory(compactionCtxId)

    abortController = new AbortController()
    let currentAssistantMessage: ChatMessage | null = null
    let streamError: unknown = null
    // Whether the assistant emitted any text this turn. A clean finish with no text
    // means a blank turn (empty completion / empty sub-agent / step limit on a tool
    // call); we surface a fallback rather than ending the conversation silently.
    let producedText = false

    try {
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
            // Track multi-turn state for this subagent
            const priorMessages = subAgentHistory.get(name) ?? []
            const callIndex = subAgentCallCount.get(name) ?? 0
            subAgentCallCount.set(name, callIndex + 1)

            // Find the parent tool call ID from currentAssistantMessage
            const parentToolCallId = currentAssistantMessage?.toolInvocations?.find(
              ti => ti.toolName === name && ti.state === 'pending'
            )?.toolCallId ?? name

            // Ensure subAgentMessages array exists on parent message
            if (currentAssistantMessage && !currentAssistantMessage.subAgentMessages) {
              currentAssistantMessage.subAgentMessages = []
            }
            if (currentAssistantMessage) {
              currentAssistantMessage.subAgentTurn = callIndex
            }

            try {
              // First call: single prompt. Subsequent calls: pass accumulated conversation history.
              const subResult = priorMessages.length === 0
                // `headers` is a construction-time setting in the AI SDK's agent types, not a
                // call-time param, so we widen only for it while keeping the rest type-checked.
                ? await subAgent.stream({ prompt: args.task, abortSignal, headers: traceHeaders(`sub:${ctxName}:${callIndex}:${parentToolCallId}`) } as Parameters<typeof subAgent.stream>[0] & { headers: Record<string, string> })
                : await subAgent.stream({
                  messages: [...priorMessages, { role: 'user' as const, content: args.task }],
                  abortSignal,
                  headers: traceHeaders(`sub:${ctxName}:${callIndex}:${parentToolCallId}`)
                } as Parameters<typeof subAgent.stream>[0] & { headers: Record<string, string> })

              // Yield intermediate UIMessages as preliminary results (streaming progress)
              for await (const uiMessage of readUIMessageStream({ stream: subResult.toUIMessageStream() })) {
                const chatMessages = uiMessageToChatMessages(uiMessage)
                // Replace subAgentMessages on each yield (readUIMessageStream accumulates)
                if (currentAssistantMessage) {
                  currentAssistantMessage.subAgentMessages = chatMessages
                }
                yield chatMessages
              }

              // Accumulate history for the next call to this subagent
              const subResponse = await subResult.response
              // A content_filter on the sub-agent's own gateway call (untrusted callers)
              // surfaces as a refusal output instead of aborting the whole turn.
              if ((await subResult.finishReason) === 'content-filter') {
                const refusal: ChatMessage = { role: 'assistant', content: options.refusalMessage || DEFAULT_REFUSAL }
                if (currentAssistantMessage) {
                  currentAssistantMessage.subAgentMessages = [...(currentAssistantMessage.subAgentMessages ?? []), refusal]
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
              if (currentAssistantMessage) {
                currentAssistantMessage.subAgentMessages = [...(currentAssistantMessage.subAgentMessages ?? []), errorMsg]
              }
              yield [errorMsg]
            }
          },
          toModelOutput: ({ output }: { output: any }) => {
            // Main agent sees only the final text summary, not full subagent trace
            const lastMsg = Array.isArray(output) ? output[output.length - 1] : null
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
        abortSignal: abortController.signal,
        ...(prepareStep ? { prepareStep } : {}),
        headers: traceHeaders(`turn:${turnId}`),
        onError: ({ error: err }) => {
          streamError = err
        }
      })

      for await (const part of result.fullStream) {
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
        if (part.type === 'text-delta') {
          if (part.text) producedText = true
          if (!currentAssistantMessage) {
            messages.value.push({ role: 'assistant', content: '' })
            currentAssistantMessage = messages.value[messages.value.length - 1]
          }
          currentAssistantMessage.content += part.text
        } else if (part.type === 'tool-call') {
          debug('tool-call name=%s id=%s', part.toolName, part.toolCallId)
          if (!currentAssistantMessage) {
            messages.value.push({ role: 'assistant', content: '', toolInvocations: [] })
            currentAssistantMessage = messages.value[messages.value.length - 1]
          }
          if (!currentAssistantMessage.toolInvocations) {
            currentAssistantMessage.toolInvocations = []
          }
          currentAssistantMessage.toolInvocations.push({
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            state: 'pending'
          })
        } else if (part.type === 'tool-result') {
          // Async generator tools emit preliminary results; only mark done on final
          const isPreliminary = !!(part as any).preliminary
          if (currentAssistantMessage?.toolInvocations && !isPreliminary) {
            const invocation = currentAssistantMessage.toolInvocations.find(
              ti => ti.toolCallId === part.toolCallId
            )
            if (invocation) invocation.state = 'done'
          }
        } else if (part.type === 'tool-error') {
          // A tool's execute threw. The SDK keeps the loop going (it feeds the error
          // back to the model), but the invocation never gets a 'tool-result', so
          // without this the chip would spin forever. Mark it done so the UI settles.
          debug('tool-error name=%s id=%s error=%O', (part as any).toolName, part.toolCallId, (part as any).error)
          if (currentAssistantMessage?.toolInvocations) {
            const invocation = currentAssistantMessage.toolInvocations.find(
              ti => ti.toolCallId === part.toolCallId
            )
            if (invocation) invocation.state = 'done'
          }
        } else if (part.type === 'finish-step') {
          // Reset for next step (new assistant message after tool results)
          currentAssistantMessage = null
        }
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
      if (!producedText) {
        messages.value.push({ role: 'assistant', content: options.emptyResponseMessage || DEFAULT_EMPTY_RESPONSE })
      }

      status.value = 'ready'
    } catch (err: any) {
      if (err.name === 'AbortError') {
        status.value = 'ready'
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

  return { messages, status, error, tools, toolsVersion, resolvedPartition, conversationId, sendMessage, abort, reset, setSystemPrompt, setToolExploration, setFlattenSubAgents }
}

export default useAgentChat
