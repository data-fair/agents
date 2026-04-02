import { ref } from 'vue'
import { createAgentChatBase } from './useAgentChatBase.js'

const STORAGE_KEY = 'df-agent-chat-open'

let singleton: AgentChatDrawerState | null = null

function createAgentChatDrawer () {
  const wasOpen = localStorage.getItem(STORAGE_KEY) === '1'
  const drawerOpen = ref(wasOpen)
  const base = createAgentChatBase(drawerOpen, STORAGE_KEY)

  return {
    drawerOpen,
    agentStatus: base.agentStatus,
    hasUnread: base.hasUnread,
    fabIcon: base.fabIcon,
    fabColor: base.fabColor,
    toggleDrawer: base.toggle,
    onDFrameMessage: base.onDFrameMessage
  }
}

export function useAgentChatDrawer () {
  if (typeof window === 'undefined') {
    throw new Error('useAgentChatDrawer cannot be used in SSR')
  }
  if (!singleton) singleton = createAgentChatDrawer()
  return singleton
}

export type AgentChatDrawerState = ReturnType<typeof createAgentChatDrawer>
