import ReconnectingWebSocket from 'reconnecting-websocket'
import { ref, onScopeDispose } from 'vue'
import type { ModelMessage } from 'ai'

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

  watchDeepDiff(agentTools, () => {
    if (status.value === 'open') {
      ws.send(JSON.stringify({ type: 'update-tools', tools: agentTools.value }))
    }
  })

  // 'open' is called after each reconnection
  ws.addEventListener('open', () => {
    status.value = 'handshake'
    // simple handshake system
    ws.send(JSON.stringify({ type: 'init-state', state: { history, tools: agentTools.value } }))
  })
  ws.addEventListener('close', () => {
    status.value = 'closed'
  })
  ws.onmessage = async (event: any) => {
    const body = JSON.parse(event.data) as Message
    if (body.type === 'init-state-ok') {
      status.value = 'open'
    } else {
      if (status.value !== 'waiting') {
        throw new Error('received websocket message while in status ' + status.value)
      }
      if (body.type === 'reset-history') {
        history = body.history
        status.value = 'open'
      } else if (body.type === 'push-history') {
        history = history.concat(body.history)
        status.value = 'open'
      } else if (body.type === 'agent-output') {
        agentOutput.value.push(body.content)
      } else if (body.type === 'tool-call') {
        const result = await agentTools[body.tool].execute(body.args)
        ws.send(JSON.stringify({ type: 'tool-result', callId: body.callId, result }))
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
    ws.send(JSON.stringify({ type: 'user-input', content: msg }))
  }

  return { status, userInput, agentOutput, sendMessage }
}

export default useAgentChat
