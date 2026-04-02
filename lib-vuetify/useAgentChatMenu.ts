import { ref } from 'vue'
import { createAgentChatBase } from './useAgentChatBase.js'

const STORAGE_KEY = 'df-agent-menu-open'

let singleton: AgentChatMenuState | null = null

function createAgentChatMenu () {
  const wasOpen = localStorage.getItem(STORAGE_KEY) === '1'
  const menuOpen = ref(wasOpen)
  const base = createAgentChatBase(menuOpen, STORAGE_KEY)

  return {
    menuOpen,
    agentStatus: base.agentStatus,
    hasUnread: base.hasUnread,
    fabIcon: base.fabIcon,
    fabColor: base.fabColor,
    toggleMenu: base.toggle,
    onDFrameMessage: base.onDFrameMessage
  }
}

export function useAgentChatMenu () {
  if (typeof window === 'undefined') {
    throw new Error('useAgentChatMenu cannot be used in SSR')
  }
  if (!singleton) singleton = createAgentChatMenu()
  return singleton
}

export type AgentChatMenuState = ReturnType<typeof createAgentChatMenu>
