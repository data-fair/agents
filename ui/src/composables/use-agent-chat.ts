import { ref, watch, onScopeDispose } from 'vue'
import { streamText, generateText, stepCountIs, tool, jsonSchema, ToolLoopAgent, readUIMessageStream } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ModelMessage, Tool } from 'ai'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import { FrameClientAggregator } from '~/transports/frame-client-aggregator'
import type { SessionRecorder, ToolSnapshot } from '~/traces/session-recorder'
import { $apiPath } from '~/context'
import { extractErrorMessage } from '~/utils/error'
import { parseGatewayCompletion } from '~/traces/gateway-response'
import Debug from 'debug'

const debug = Debug('df-agents:use-agent-chat')

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
  debug?: boolean
  systemPrompt?: string
  initialMessages?: ChatMessage[]
  localTools?: Record<string, Tool>
  modelName?: string
  recorder?: SessionRecorder
}

interface SubAgentConfig {
  prompt: string
  tools: string[]
  model?: string
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

  const { recorder, localTools, modelName } = options
  const chatModelName = modelName ?? 'assistant'

  const messages = ref<ChatMessage[]>(options.initialMessages ?? [])

  const status = ref<'ready' | 'streaming' | 'error'>('ready')
  const error = ref<string | null>(null)
  const tools = ref<Record<string, Tool>>({})
  const toolsVersion = ref(0)
  const sessionUsage = ref({ inputTokens: 0, outputTokens: 0 })
  let history: ModelMessage[] = []
  // characters of serialized history before compaction
  // 24000 is roughly equivalent to a 8k tokens context with 10-15 turns of dialogue an 2-3 tool calls
  const COMPACTION_THRESHOLD = 24_000
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
        if (recorder) {
          const snapshots: ToolSnapshot[] = Object.entries(newTools).map(([name, t]) => ({
            name,
            title: (t as any).title,
            description: (t as any).description ?? '',
            inputSchema: (t as any).inputSchema?.jsonSchema ?? {}
          }))
          recorder.snapshotTools(snapshots)
        }
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

  function traceCtxOf (headers: HeadersInit | undefined): string {
    if (!headers) return 'unknown'
    try { return new Headers(headers).get('x-trace-ctx') ?? 'unknown' } catch { return 'unknown' }
  }

  async function capturePhysicalResponse (
    response: Response,
    ctx: { requestBody: any; bodyChars: number; contextId: string; timestamp: Date; startMs: number }
  ): Promise<void> {
    if (!recorder) return
    try {
      const reader = response.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let raw = ''
      let timeToFirstChunkMs: number | undefined
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value && timeToFirstChunkMs === undefined) timeToFirstChunkMs = performance.now() - ctx.startMs
        raw += decoder.decode(value, { stream: true })
      }
      raw += decoder.decode()
      const durationMs = performance.now() - ctx.startMs
      const { result, usage } = parseGatewayCompletion(raw)
      const messages = Array.isArray(ctx.requestBody?.messages) ? ctx.requestBody.messages : []
      const tools = Array.isArray(ctx.requestBody?.tools) ? ctx.requestBody.tools : []
      recorder.recordPhysicalRequest({
        contextId: ctx.contextId,
        timestamp: ctx.timestamp,
        modelRole: typeof ctx.requestBody?.model === 'string' ? ctx.requestBody.model : 'unknown',
        requestBody: ctx.requestBody,
        result,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        messageCount: messages.length,
        toolCount: tools.length,
        bodyChars: ctx.bodyChars,
        durationMs,
        timeToFirstChunkMs
      })
    } catch (err) {
      debug('physical-request capture failed: %O', err)
    }
  }

  const tracingFetch: typeof fetch = async (input, init) => {
    if (!recorder || !init || typeof init.body !== 'string') {
      return fetch(input as any, init)
    }
    let requestBody: any
    try { requestBody = JSON.parse(init.body) } catch { return fetch(input as any, init) }
    const contextId = traceCtxOf(init.headers)
    const timestamp = new Date()
    const startMs = performance.now()
    const res = await fetch(input as any, init)
    // eslint-disable-next-line no-void
    void capturePhysicalResponse(res.clone(), { requestBody, bodyChars: init.body.length, contextId, timestamp, startMs })
    return res
  }

  const provider = createOpenAI({
    baseURL: `${window.location.origin}${$apiPath}/gateway/${options.accountType}/${options.accountId}/v1`,
    apiKey: 'unused',
    ...(recorder ? { fetch: tracingFetch } : {})
  })

  const moderationBase = `${window.location.origin}${$apiPath}/moderation/${options.accountType}/${options.accountId}`
  let moderationConfigPromise: Promise<{ enabled: boolean }> | null = null
  const loadModerationConfig = (): Promise<{ enabled: boolean }> => {
    if (!moderationConfigPromise) {
      moderationConfigPromise = fetch(moderationBase, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { enabled: false })
        .catch(() => ({ enabled: false }))
    }
    return moderationConfigPromise
  }
  // Pre-warm on setup so the verdict round-trip overlaps the user typing.
  loadModerationConfig()

  interface ModerationResult { action: 'allow' | 'block', refusalMessage?: string, category?: string, reason?: string, skipped?: boolean }
  const moderate = async (message: string): Promise<ModerationResult> => {
    try {
      const res = await fetch(moderationBase, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, system: options.systemPrompt })
      })
      if (!res.ok) return { action: 'allow', skipped: true }
      return await res.json()
    } catch {
      return { action: 'allow', skipped: true }
    }
  }

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
    sessionUsage.value = { inputTokens: 0, outputTokens: 0 }
    if (newSystemPrompt !== undefined) {
      options.systemPrompt = newSystemPrompt
    }
  }

  /**
   * Resolve sub-agent configs by calling their execute functions.
   * Also removes reserved tools from mainTools.
   */
  async function resolveSubAgents (
    mainTools: Record<string, Tool>,
    subAgents: Record<string, { tool: Tool, config: SubAgentConfig }>
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

        // Remove reserved tools from main set
        for (const reservedName of entry.config.tools) {
          delete mainTools[reservedName]
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
        ...(recorder ? { headers: { 'x-trace-ctx': compactionCtxId } } : {})
      })

      const originalHistory = history
      const originalLength = serialized.length

      history = [
        { role: 'user' as const, content: `[Previous conversation summary]\n${summary}` },
        lastMessage
      ]

      if (recorder) {
        recorder.recordCompaction(originalHistory, summary, originalLength, JSON.stringify(history).length)
      }

      debug('compacted history from %d chars to %d chars', originalLength, JSON.stringify(history).length)
    } catch (err) {
      debug('compaction error, continuing with full history: %O', err)
    }
  }

  const sendMessage = async (msg: string, sendOptions?: { hiddenContext?: string }) => {
    if (status.value === 'streaming') return

    status.value = 'streaming'
    const turnId = turnSeq++
    const turnCtxId = `main:${turnId}`
    error.value = null
    messages.value.push({ role: 'user', content: msg })

    if (recorder) {
      recorder.startTurn(msg, sendOptions?.hiddenContext)
    }

    // Add user message to history
    history.push({ role: 'user', content: msg })

    // Kick off moderation concurrently with the rest of the turn (does not delay request start).
    const moderationEnabled = (await loadModerationConfig()).enabled
    const moderationPromise = moderationEnabled ? moderate(msg) : null
    let moderationChecked = false

    // Compact history if it exceeds the threshold
    const compactionCtxId = `compaction:${turnId}`
    await compactHistory(compactionCtxId)

    abortController = new AbortController()
    let currentAssistantMessage: ChatMessage | null = null
    let streamError: unknown = null

    try {
      const currentTools = tools.value
      const { mainTools, subAgents } = partitionTools(currentTools)
      debug('partitioned tools: main=%o subAgents=%o', Object.keys(mainTools), Object.keys(subAgents))

      // Resolve sub-agent configs and remove their reserved tools from mainTools
      await resolveSubAgents(mainTools, subAgents)

      // Build the tool set for the main LLM:
      // main tools + sub-agent pseudo-tools using ToolLoopAgent + async generators
      const subAgentHistory = new Map<string, ModelMessage[]>()
      const subAgentCallCount = new Map<string, number>()
      const mainLLMTools: Record<string, Tool> = { ...mainTools }
      for (const [name, entry] of Object.entries(subAgents)) {
        const config = entry.config

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

            const subCtxId = `sub:${parentToolCallId}`

            // Record telemetry
            if (recorder) {
              const subToolSnapshots: ToolSnapshot[] = Object.entries(subAgentTools).map(([n, t]) => ({
                name: n,
                title: (t as any).title,
                description: (t as any).description ?? '',
                inputSchema: (t as any).parameters ?? {}
              }))
              recorder.startSubAgent(parentToolCallId, displayName, config.prompt, args.task, subToolSnapshots, callIndex)
            }

            // Ensure subAgentMessages array exists on parent message
            if (currentAssistantMessage && !currentAssistantMessage.subAgentMessages) {
              currentAssistantMessage.subAgentMessages = []
            }
            if (currentAssistantMessage) {
              currentAssistantMessage.subAgentTurn = callIndex
            }

            // Record each sub-agent step as it completes (tool calls, messages)
            const onStepFinish = (step: any) => {
              if (!recorder) return
              recorder.recordSubAgentStep(parentToolCallId, {
                messages: step.response.messages,
                finishReason: step.finishReason,
                toolCalls: step.toolCalls,
                toolResults: step.toolResults
              })
            }

            // First call: single prompt. Subsequent calls: pass accumulated conversation history.
            const subResult = priorMessages.length === 0
              ? await subAgent.stream({ prompt: args.task, abortSignal, onStepFinish, ...(recorder ? { headers: { 'x-trace-ctx': subCtxId } } : {}) })
              : await subAgent.stream({
                messages: [...priorMessages, { role: 'user' as const, content: args.task }],
                abortSignal,
                onStepFinish,
                ...(recorder ? { headers: { 'x-trace-ctx': subCtxId } } : {})
              })

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
            subAgentHistory.set(name, [
              ...priorMessages,
              { role: 'user' as const, content: args.task },
              ...subResponse.messages
            ])
            const subUsage = (subResponse as any).usage
            if (subUsage) {
              sessionUsage.value = {
                inputTokens: sessionUsage.value.inputTokens + (subUsage.inputTokens ?? 0),
                outputTokens: sessionUsage.value.outputTokens + (subUsage.outputTokens ?? 0)
              }
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

      debug('streaming with model=%s tools=%o', chatModelName, Object.keys(mainLLMTools))
      const result = streamText({
        model: provider.chat(chatModelName),
        system: options.systemPrompt,
        messages: history,
        tools: Object.keys(mainLLMTools).length > 0 ? mainLLMTools : undefined,
        stopWhen: stepCountIs(10),
        abortSignal: abortController.signal,
        ...(recorder ? { headers: { 'x-trace-ctx': turnCtxId } } : {}),
        onError: ({ error: err }) => {
          streamError = err
        }
      })

      for await (const part of result.fullStream) {
        if (moderationPromise && !moderationChecked && (part.type === 'text-delta' || part.type === 'tool-call')) {
          const verdict = await moderationPromise
          moderationChecked = true
          if (recorder) recorder.recordModerationDecision(verdict)
          if (verdict.action === 'block') {
            abortController?.abort()
            history.pop() // drop the blocked user message from model context
            messages.value.push({ role: 'assistant', content: verdict.refusalMessage || 'This request can\'t be processed.' })
            status.value = 'ready'
            return
          }
        }
        if (part.type === 'text-delta') {
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
          if (recorder) {
            recorder.startToolCall(part.toolCallId, part.toolName, (part as any).args)
          }
        } else if (part.type === 'tool-result') {
          // Async generator tools emit preliminary results; only mark done on final
          const isPreliminary = !!(part as any).preliminary
          if (currentAssistantMessage?.toolInvocations && !isPreliminary) {
            const invocation = currentAssistantMessage.toolInvocations.find(
              ti => ti.toolCallId === part.toolCallId
            )
            if (invocation) invocation.state = 'done'
          }
          if (recorder && !isPreliminary) {
            recorder.finishToolCall(part.toolCallId, (part as any).output)
          }
        } else if (part.type === 'finish-step') {
          // Reset for next step (new assistant message after tool results)
          currentAssistantMessage = null
          if (recorder) {
            recorder.finishStep()
          }
        }
      }

      // If the stream produced no visible part, the gate above never ran —
      // still record the moderation decision for trace completeness (allow/skip/block).
      if (moderationPromise && !moderationChecked) {
        const verdict = await moderationPromise
        moderationChecked = true
        if (recorder) recorder.recordModerationDecision(verdict)
      }

      // Update history with all response messages
      const response = await result.response
      history = history.concat(response.messages)

      if (recorder) {
        recorder.addStepMessages(response.messages, (response as any).finishReason)
      }
      const usage = (response as any).usage
      if (usage) {
        sessionUsage.value = {
          inputTokens: sessionUsage.value.inputTokens + (usage.inputTokens ?? 0),
          outputTokens: sessionUsage.value.outputTokens + (usage.outputTokens ?? 0)
        }
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

  return { messages, status, error, tools, toolsVersion, resolvedPartition, sendMessage, abort, reset, setSystemPrompt, sessionUsage }
}

export default useAgentChat
