import { ref, computed } from 'vue'
import { mdiRobotOutline, mdiCommentQuestion, mdiAlertCircle } from '@mdi/js'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import type { AgentStatus, AgentChatMessage } from './types.js'
import Debug from 'debug'

const debug = Debug('df-agents:agent-chat-drawer')

const STORAGE_KEY = 'df-agent-chat-open'

let singleton: AgentChatDrawerState | null = null

function createAgentChatDrawer () {
  const wasOpen = localStorage.getItem(STORAGE_KEY) === '1'
  const drawerOpen = ref(wasOpen)
  const agentStatus = ref<AgentStatus>('idle')
  const hasUnread = ref(false)
  const toolsJustChanged = ref(false)
  let toolsChangedTimeout: ReturnType<typeof setTimeout> | null = null

  // Listen on BroadcastChannel to auto-open drawer on action start
  const channelId = getTabChannelId()
  const bc = new BroadcastChannel(channelId)
  bc.onmessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || data.channel !== channelId) return
    if (data.type === 'agent-start-session') {
      debug('received agent-start-session, opening drawer')
      drawerOpen.value = true
      localStorage.setItem(STORAGE_KEY, '1')
      hasUnread.value = false
    }
  }

  const fabIcon = computed(() => {
    switch (agentStatus.value) {
      case 'waiting-user': return mdiCommentQuestion
      case 'error': return mdiAlertCircle
      default: return mdiRobotOutline
    }
  })

  const fabColor = computed(() => {
    if (toolsJustChanged.value) return 'accent'
    switch (agentStatus.value) {
      case 'working': return 'accent'
      case 'waiting-user': return 'warning'
      case 'error': return 'error'
      default: return 'secondary'
    }
  })

  function toggleDrawer () {
    drawerOpen.value = !drawerOpen.value
    localStorage.setItem(STORAGE_KEY, drawerOpen.value ? '1' : '0')
    hasUnread.value = false
  }

  function onDFrameMessage (event: CustomEvent<AgentChatMessage>) {
    const msg = event.detail
    debug('frame message type=%s %o', msg.type, msg)
    if (msg.type === 'agent-status') {
      agentStatus.value = msg.status
    } else if (msg.type === 'tools-changed') {
      toolsJustChanged.value = true
      if (toolsChangedTimeout) clearTimeout(toolsChangedTimeout)
      toolsChangedTimeout = setTimeout(() => { toolsJustChanged.value = false }, 3000)
    } else if (msg.type === 'unread') {
      if (!drawerOpen.value && msg.unread) {
        hasUnread.value = true
      }
    }
  }

  return {
    drawerOpen,
    agentStatus,
    hasUnread,
    fabIcon,
    fabColor,
    toggleDrawer,
    onDFrameMessage
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
