import ReconnectingWebSocket from 'reconnecting-websocket'
import { ref, computed, onScopeDispose, watch } from 'vue'
import type { ModelMessage } from 'ai'
import type { ChatWsClientMessage, ChatWsServerMessage } from '#api/types'
import { useAgentTools } from './use-agent-tools'
import { $apiPath } from '~/context'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
  }>
}

export function useAgentChat (traceEnabled = false) {
  if (!window.WebSocket) return
  // @ts-ignore
  if (import.meta.env?.SSR) return

  const agentTools = computed(() => Object.values(useAgentTools()).map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })))

  const url = (`${window.location.origin}${$apiPath}/chat`).replace('http:', 'ws:').replace('https:', 'wss:')
  const ws = new ReconnectingWebSocket(url)
  let history: ModelMessage[] = []
  const messages = ref<ChatMessage[]>([])
  const status = ref<'closed' | 'handshake' | 'open' | 'waiting'>('closed')
  let currentAssistantMessage: ChatMessage | null = null
  let currentTraceId: string | null = null

  const emitTraceId = (traceId: string) => {
    currentTraceId = traceId
  }

  watch(agentTools, () => {
    if (status.value === 'open') {
      ws.send(JSON.stringify({ type: 'update-tools', tools: agentTools.value } as ChatWsClientMessage))
    }
  }, { deep: true })

  ws.addEventListener('open', () => {
    status.value = 'handshake'
  })
  ws.addEventListener('close', () => {
    status.value = 'closed'
  })
  ws.onmessage = async (event: MessageEvent) => {
    const body = event.data as string
    const msg = JSON.parse(body) as ChatWsServerMessage
    if (msg.type === 'ready') {
      ws.send(JSON.stringify({
        type: 'init-state',
        history,
        tools: agentTools.value,
        trace: traceEnabled,
        traceId: currentTraceId || undefined
      } as ChatWsClientMessage))
    } else if (msg.type === 'init-state-ok') {
      status.value = 'open'
      if (msg.traceId) {
        emitTraceId(msg.traceId)
      }
    } else {
      if (status.value !== 'waiting') {
        throw new Error('received websocket message while in status ' + status.value)
      }
      if (msg.type === 'reset-history') {
        history = msg.history
        status.value = 'open'
      } else if (msg.type === 'push-history') {
        history = history.concat(msg.history)
        status.value = 'open'
      } else if (msg.type === 'agent-output') {
        if (currentAssistantMessage) {
          currentAssistantMessage.content += msg.content
        } else {
          currentAssistantMessage = { role: 'assistant', content: msg.content }
          messages.value.push(currentAssistantMessage)
        }
      } else if (msg.type === 'tool-call') {
        if (!currentAssistantMessage) {
          currentAssistantMessage = { role: 'assistant', content: '', toolInvocations: [] }
          messages.value.push(currentAssistantMessage)
        }
        if (!currentAssistantMessage.toolInvocations) {
          currentAssistantMessage.toolInvocations = []
        }
        currentAssistantMessage.toolInvocations.push({
          toolCallId: msg.callId,
          toolName: msg.name
        })
        const tools = useAgentTools()
        const toolExecutor = (tools[msg.name] as any)?.execute
        if (!toolExecutor) throw new Error(`Tool ${msg.name} not found`)
        const result = await toolExecutor({ args: msg.args, context: {} })
        ws.send(JSON.stringify({ type: 'tool-result', callId: msg.callId, result } as ChatWsClientMessage))
      }
    }
  }

  onScopeDispose(() => {
    status.value = 'closed'
    ws.close()
  })

  const sendMessage = (msg: string) => {
    if (status.value !== 'open') {
      throw new Error('received user message while in status ' + status.value)
    }
    status.value = 'waiting'
    messages.value.push({ role: 'user', content: msg })
    currentAssistantMessage = null
    ws.send(JSON.stringify({ type: 'user-input', content: msg } as ChatWsClientMessage))
  }

  return { messages, status, sendMessage, emitTraceId }
}

export default useAgentChat
