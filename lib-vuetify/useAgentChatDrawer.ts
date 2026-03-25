import { ref, computed, watch } from 'vue'
import { mdiRobotOutline, mdiCommentQuestion, mdiAlertCircle } from '@mdi/js'
import type { AgentStatus, AgentChatMessage } from './types.js'
import Debug from 'debug'

const debug = Debug('df-agents:agent-chat-drawer')

const STORAGE_KEY = 'df-agent-chat-open'

let singleton: AgentChatDrawerState | null = null

function createAgentChatDrawer () {
  const wasOpen = localStorage.getItem(STORAGE_KEY) === '1'
  const drawerOpen = ref(wasOpen)
  const iframeCreated = ref(wasOpen)
  const agentStatus = ref<AgentStatus>('idle')
  const hasUnread = ref(false)
  const toolsJustChanged = ref(false)
  let toolsChangedTimeout: ReturnType<typeof setTimeout> | null = null
  const ready = ref(false)
  const activeActionId = ref<string | null>(null)
  let iframeMessenger: ((msg: object) => void) | null = null

  function registerIframeMessenger (fn: (msg: object) => void) {
    iframeMessenger = fn
  }

  function postMessageToIframe (msg: object) {
    if (iframeMessenger) iframeMessenger(msg)
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
    if (!iframeCreated.value) iframeCreated.value = true
    ready.value = false
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
    } else if (msg.type === 'chat-ready') {
      ready.value = true
    } else if (msg.type === 'unread') {
      if (!drawerOpen.value && msg.unread) {
        hasUnread.value = true
      }
    }
  }

  async function openForAction (actionId: string, visiblePrompt: string, hiddenContext: string) {
    activeActionId.value = actionId

    if (!iframeCreated.value) {
      iframeCreated.value = true
      ready.value = false
    }
    drawerOpen.value = true
    localStorage.setItem(STORAGE_KEY, '1')
    hasUnread.value = false

    // Wait for the iframe to signal ready
    if (!ready.value) {
      await new Promise<void>((resolve) => {
        const stop = watch(ready, (val) => {
          if (val) {
            stop()
            resolve()
          }
        }, { immediate: true })
      })
    }

    postMessageToIframe({ type: 'start-session', visiblePrompt, hiddenContext })
  }

  function clearAction (actionId: string) {
    if (activeActionId.value !== actionId) return
    activeActionId.value = null
    postMessageToIframe({ type: 'session-cleared' })
  }

  return {
    drawerOpen,
    iframeCreated,
    agentStatus,
    hasUnread,
    fabIcon,
    fabColor,
    toggleDrawer,
    onDFrameMessage,
    ready,
    activeActionId,
    openForAction,
    clearAction,
    registerIframeMessenger,
    postMessageToIframe
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
