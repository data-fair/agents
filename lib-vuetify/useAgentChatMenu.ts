import { ref } from 'vue'
import { createAgentChatBase } from './useAgentChatBase.js'

const EXPANDED_KEY = 'df-agent-menu-expanded'

let singleton: AgentChatMenuState | null = null

function createAgentChatMenu () {
  // The menu always starts closed and opens only on click (or when an action button
  // starts a session). Its open state is intentionally not persisted: restoring it
  // across reloads made the menu pop up on its own, which is unwanted.
  const menuOpen = ref(false)
  const expanded = ref(localStorage.getItem(EXPANDED_KEY) === '1')
  const base = createAgentChatBase(menuOpen)

  function toggleExpanded () {
    expanded.value = !expanded.value
    localStorage.setItem(EXPANDED_KEY, expanded.value ? '1' : '0')
  }

  return {
    menuOpen,
    expanded,
    agentStatus: base.agentStatus,
    hasUnread: base.hasUnread,
    fabIcon: base.fabIcon,
    fabColor: base.fabColor,
    toggleMenu: base.toggle,
    toggleExpanded,
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
