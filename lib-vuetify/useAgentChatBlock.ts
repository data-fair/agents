import { ref } from 'vue'
import { createAgentChatBase } from './useAgentChatBase.js'

let singleton: AgentChatBlockState | null = null

function createAgentChatBlock () {
  // A block is rendered flat in a page and always visible, so there is no
  // open/close state to persist (hence no storage key) — isOpen stays true.
  const blockOpen = ref(true)
  const base = createAgentChatBase(blockOpen)

  return {
    agentStatus: base.agentStatus,
    onDFrameMessage: base.onDFrameMessage
  }
}

export function useAgentChatBlock () {
  if (typeof window === 'undefined') {
    throw new Error('useAgentChatBlock cannot be used in SSR')
  }
  if (!singleton) singleton = createAgentChatBlock()
  return singleton
}

export type AgentChatBlockState = ReturnType<typeof createAgentChatBlock>
