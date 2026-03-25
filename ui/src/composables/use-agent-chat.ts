import { ref, onScopeDispose } from 'vue'
import { streamText, stepCountIs, tool, jsonSchema } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ModelMessage, Tool } from 'ai'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import { FrameClientAggregator } from '~/transports/frame-client-aggregator'
import type { SessionRecorder, ToolSnapshot } from '~/traces/session-recorder'
import { $apiPath } from '~/context'
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
}

export interface ToolInfo {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, any>
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
}

function extractErrorMessage (err: unknown): string {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  const e = err as any
  // API errors from the gateway have a JSON body with error.message
  if (e.data?.error?.message) return e.data.error.message
  if (e.responseBody) {
    try {
      const body = JSON.parse(e.responseBody)
      if (body.error?.message) return body.error.message
    } catch {}
  }
  if (e.message) return e.message
  return 'Unknown error'
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
  let history: ModelMessage[] = []
  let abortController: AbortController | null = null

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

  const provider = createOpenAI({
    baseURL: `${window.location.origin}${$apiPath}/gateway/${options.accountType}/${options.accountId}/v1`,
    apiKey: 'unused'
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
    }
  }

  const reset = (newSystemPrompt?: string) => {
    abort()
    messages.value = []
    status.value = 'ready'
    error.value = null
    history = []
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
   * Run a sub-agent: execute a nested streamText call with the sub-agent's
   * prompt and tools, returning the final text response.
   */
  async function executeSubAgent (
    parentToolCallId: string,
    subAgentDisplayName: string,
    config: SubAgentConfig,
    task: string,
    allTools: Record<string, Tool>,
    signal: AbortSignal,
    onMessage?: (msg: ChatMessage) => void
  ): Promise<string> {
    // Collect the sub-agent's tools from the full tool set
    const subAgentTools: Record<string, Tool> = {}
    for (const toolName of config.tools) {
      if (allTools[toolName]) {
        subAgentTools[toolName] = allTools[toolName]
      }
    }

    if (recorder) {
      const subToolSnapshots: ToolSnapshot[] = Object.entries(subAgentTools).map(([name, t]) => ({
        name,
        title: (t as any).title,
        description: (t as any).description ?? '',
        inputSchema: (t as any).parameters ?? {}
      }))
      recorder.startSubAgent(parentToolCallId, subAgentDisplayName, config.prompt, task, subToolSnapshots)
    }

    const subResult = streamText({
      model: provider.chat('tools'),
      system: config.prompt,
      messages: [{ role: 'user', content: task }],
      tools: Object.keys(subAgentTools).length > 0 ? subAgentTools : undefined,
      stopWhen: stepCountIs(10),
      abortSignal: signal
    })

    let fullText = ''
    let currentSubMessage: ChatMessage | null = null

    for await (const part of subResult.fullStream) {
      if (part.type === 'text-delta') {
        fullText += part.text
        if (!currentSubMessage) {
          currentSubMessage = { role: 'assistant', content: '' }
          onMessage?.(currentSubMessage)
        }
        currentSubMessage.content += part.text
      } else if (part.type === 'tool-call') {
        if (!currentSubMessage) {
          currentSubMessage = { role: 'assistant', content: '', toolInvocations: [] }
          onMessage?.(currentSubMessage)
        }
        if (!currentSubMessage.toolInvocations) {
          currentSubMessage.toolInvocations = []
        }
        currentSubMessage.toolInvocations.push({
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          state: 'pending'
        })
        if (recorder) {
          recorder.startSubAgentToolCall(parentToolCallId, part.toolCallId, part.toolName, (part as any).args)
        }
      } else if (part.type === 'tool-result') {
        if (currentSubMessage?.toolInvocations) {
          const invocation = currentSubMessage.toolInvocations.find(
            ti => ti.toolCallId === part.toolCallId
          )
          if (invocation) invocation.state = 'done'
        }
        if (recorder) {
          recorder.finishSubAgentToolCall(parentToolCallId, part.toolCallId, (part as any).output)
        }
      } else if (part.type === 'finish-step') {
        currentSubMessage = null
        if (recorder) {
          recorder.finishSubAgentStep(parentToolCallId)
        }
      }
    }

    const subResponse = await subResult.response
    if (recorder) {
      recorder.addSubAgentStepMessages(parentToolCallId, subResponse.messages, (subResponse as any).usage)
    }

    return fullText || 'No response from sub-agent.'
  }

  const sendMessage = async (msg: string) => {
    if (status.value === 'streaming') return

    status.value = 'streaming'
    error.value = null
    messages.value.push({ role: 'user', content: msg })

    if (recorder) {
      recorder.startTurn(msg)
    }

    // Add user message to history
    history.push({ role: 'user', content: msg })

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
      // main tools + sub-agent pseudo-tools (with execute that runs nested streamText)
      const mainLLMTools: Record<string, Tool> = { ...mainTools }
      for (const [name, entry] of Object.entries(subAgents)) {
        mainLLMTools[name] = tool({
          description: (entry.tool as any).description || '',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              task: { type: 'string', description: 'The task to delegate to this sub-agent' }
            },
            required: ['task']
          }),
          execute: async (args: any) => {
            const config = subAgents[name].config
            const subMessages: ChatMessage[] = []

            // Find the parent tool call ID from currentAssistantMessage
            const parentToolCallId = currentAssistantMessage?.toolInvocations?.find(
              ti => ti.toolName === name && ti.state === 'pending'
            )?.toolCallId ?? name

            // Find the current assistant message to attach sub-agent messages
            if (currentAssistantMessage) {
              if (!currentAssistantMessage.subAgentMessages) {
                currentAssistantMessage.subAgentMessages = []
              }
            }

            const displayName = name.replace(/^subagent_/, '')
            const result = await executeSubAgent(
              parentToolCallId,
              displayName,
              config,
              args.task,
              currentTools,
              abortController!.signal,
              (subMsg) => {
                subMessages.push(subMsg)
                if (currentAssistantMessage) {
                  if (!currentAssistantMessage.subAgentMessages) {
                    currentAssistantMessage.subAgentMessages = []
                  }
                  currentAssistantMessage.subAgentMessages.push(subMsg)
                }
              }
            )

            return result
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
        onError: ({ error: err }) => {
          streamError = err
        }
      })

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          if (!currentAssistantMessage) {
            currentAssistantMessage = { role: 'assistant', content: '' }
            messages.value.push(currentAssistantMessage)
          }
          currentAssistantMessage.content += part.text
        } else if (part.type === 'tool-call') {
          debug('tool-call name=%s id=%s', part.toolName, part.toolCallId)
          if (!currentAssistantMessage) {
            currentAssistantMessage = { role: 'assistant', content: '', toolInvocations: [] }
            messages.value.push(currentAssistantMessage)
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
          if (currentAssistantMessage?.toolInvocations) {
            const invocation = currentAssistantMessage.toolInvocations.find(
              ti => ti.toolCallId === part.toolCallId
            )
            if (invocation) invocation.state = 'done'
          }
          if (recorder) {
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

      // Update history with all response messages
      const response = await result.response
      history = history.concat(response.messages)

      if (recorder) {
        recorder.addStepMessages(response.messages, (response as any).usage, (response as any).finishReason)
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

  return { messages, status, error, tools, toolsVersion, sendMessage, abort, reset }
}

export default useAgentChat
