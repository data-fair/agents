import { ref, onScopeDispose } from 'vue'
import { streamText, stepCountIs } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ModelMessage, Tool } from 'ai'
import { BrowserTraceIntegration } from '../traces/browser-trace-integration'
import type { BrowserTraceEvent } from '../traces/browser-trace-integration'
import { $apiPath } from '~/context'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
    state: 'pending' | 'done'
  }>
}

export function useAgentChat (traceEnabled = false, systemPrompt?: string, externalTools?: Record<string, Tool>) {
  // @ts-ignore
  if (import.meta.env?.SSR) return

  const messages = ref<ChatMessage[]>([])
  const status = ref<'ready' | 'streaming' | 'error'>('ready')
  const error = ref<string | null>(null)
  const traceEvents = ref<BrowserTraceEvent[]>([])
  let history: ModelMessage[] = []
  let abortController: AbortController | null = null
  let traceIntegration: BrowserTraceIntegration | null = null

  if (traceEnabled) {
    traceIntegration = new BrowserTraceIntegration(crypto.randomUUID())
  }

  const provider = createOpenAI({
    baseURL: `${window.location.origin}${$apiPath}/gateway/v1`,
    apiKey: 'unused'
  })

  onScopeDispose(() => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  })

  const sendMessage = async (msg: string) => {
    if (status.value === 'streaming') return

    status.value = 'streaming'
    error.value = null
    messages.value.push({ role: 'user', content: msg })

    // Add user message to history
    history.push({ role: 'user', content: msg })

    abortController = new AbortController()
    let currentAssistantMessage: ChatMessage | null = null

    try {
      const tools = externalTools ?? {}

      const result = streamText({
        model: provider.chat('assistant'),
        system: systemPrompt,
        messages: history,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        stopWhen: stepCountIs(10),
        abortSignal: abortController.signal,
        ...(traceIntegration
          ? {
              experimental_telemetry: {
                isEnabled: true,
                functionId: traceIntegration.getTraceId(),
                integrations: [traceIntegration]
              }
            }
          : {})
      })

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          if (!currentAssistantMessage) {
            currentAssistantMessage = { role: 'assistant', content: '' }
            messages.value.push(currentAssistantMessage)
          }
          currentAssistantMessage.content += part.text
        } else if (part.type === 'tool-call') {
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
        } else if (part.type === 'tool-result') {
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

      // Update history with all response messages
      const response = await result.response
      history = history.concat(response.messages)

      if (traceIntegration) {
        traceEvents.value = traceIntegration.getEvents()
      }

      status.value = 'ready'
    } catch (err: any) {
      if (err.name === 'AbortError') {
        status.value = 'ready'
        return
      }
      console.error('Agent chat error:', err)
      error.value = err.message || 'Unknown error'
      status.value = 'error'
    } finally {
      abortController = null
    }
  }

  return { messages, status, error, traceEvents, sendMessage }
}

export default useAgentChat
