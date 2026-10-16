import { ref, onMounted, onScopeDispose, type Ref } from 'vue'
import { getTabChannelId } from './get-tab-channel-id.js'

/**
 * What opens the tab's chat panel, over the tab's BroadcastChannel. The panel (DfAgentChatDrawer, in the
 * host's shell) opens on it whatever it carries; the chat inside the panel then acts on the fields.
 *
 * - `agentId`: talk to this agent, in a new conversation. Absent, the chat keeps its current agent.
 * - `visiblePrompt` (shown as the person's message) and `hiddenContext` (passed to the agent with it):
 *   sent as the first message. Absent, the chat only opens, ready for the person to write.
 */
export interface AgentActionStartSession {
  channel: string
  type: 'agent-start-session'
  agentId?: string
  visiblePrompt?: string
  hiddenContext?: string
}

/** The key the request is also stored under, for a chat iframe that had not loaded when it was sent. */
export const PENDING_ACTION_KEY = 'df-agent-pending-action'

export interface AgentChatLauncher {
  /** Whether a chat panel answered in this tab: without one, there is nothing to open. */
  available: Ref<boolean>
  open: (request: Omit<AgentActionStartSession, 'channel' | 'type'>) => void
}

/**
 * Open the tab's chat panel from any page of the tab — the host's own, or a same-origin iframe in it.
 * `available` turns true once a panel answers the ping, or announces itself later.
 */
export function useAgentChatLauncher (): AgentChatLauncher {
  const available = ref(false)
  let bc: BroadcastChannel | null = null
  let channelId: string

  onMounted(() => {
    channelId = getTabChannelId()
    bc = new BroadcastChannel(channelId)
    bc.onmessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.channel !== channelId) return
      if (data.type === 'agent-chat-pong' || data.type === 'agent-chat-ready') available.value = true
    }
    bc.postMessage({ channel: channelId, type: 'agent-chat-ping' })
  })

  onScopeDispose(() => {
    bc?.close()
    bc = null
  })

  const open = (request: Omit<AgentActionStartSession, 'channel' | 'type'>) => {
    if (!bc) return
    const message: AgentActionStartSession = { channel: channelId, type: 'agent-start-session', ...request }
    bc.postMessage(message)
    sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(message))
  }

  return { available, open }
}
