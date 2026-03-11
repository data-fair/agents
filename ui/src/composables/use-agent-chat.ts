import ReconnectingWebSocket from 'reconnecting-websocket'
import { ref, computed, onScopeDispose, watch } from 'vue'
import type { ModelMessage } from 'ai'
import type { ChatWsClientMessage, ChatWsServerMessage } from '#api/types'
import { useAgentTools } from './use-agent-tools'

export function useAgentChat (agentId: string) {
  if (!window.WebSocket) return
  // @ts-ignore
  if (import.meta.env?.SSR) return

  const agentTools = computed(() => Object.values(useAgentTools()).map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })))

  const url = (`${window.location.origin}/agents/api/agents/${agentId}/chat`).replace('http:', 'ws:').replace('https:', 'wss:')
  const ws = new ReconnectingWebSocket(url)
  let history: ModelMessage[] = []
  const userInput = ref<string[]>([])
  const agentOutput = ref<string[]>([])
  const status = ref<'closed' | 'handshake' | 'open' | 'waiting'>('closed')

  watch(agentTools, () => {
    if (status.value === 'open') {
      ws.send(JSON.stringify({ type: 'update-tools', tools: agentTools.value } as ChatWsClientMessage))
    }
  }, { deep: true })

  // 'open' is called after each reconnection
  ws.addEventListener('open', () => {
    status.value = 'handshake'
    ws.send(JSON.stringify({ type: 'init-state', history, tools: agentTools.value } as ChatWsClientMessage))
  })
  ws.addEventListener('close', () => {
    status.value = 'closed'
  })
  ws.onmessage = async (event: MessageEvent) => {
    const body = event.data as string
    const msg = JSON.parse(body) as ChatWsServerMessage
    if (msg.type === 'init-state-ok') {
      status.value = 'open'
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
        agentOutput.value.push(msg.content)
      } else if (msg.type === 'tool-call') {
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
    ws.send(JSON.stringify({ type: 'user-input', content: msg } as ChatWsClientMessage))
  }

  return { status, userInput, agentOutput, sendMessage }
}

export default useAgentChat
