import { ref, computed, type Ref } from 'vue'
import { mdiRobotOutline, mdiCommentQuestion, mdiAlertCircle } from '@mdi/js'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import type { AgentStatus, AgentChatMessage, AgentChatPong } from './types.js'
import Debug from 'debug'

const debug = Debug('df-agents:agent-chat')

export function createAgentChatBase (isOpen: Ref<boolean>, storageKey: string) {
  const agentStatus = ref<AgentStatus>('idle')
  const hasUnread = ref(false)
  const toolsJustChanged = ref(false)
  let toolsChangedTimeout: ReturnType<typeof setTimeout> | null = null

  // Listen on BroadcastChannel to auto-open on action start
  const channelId = getTabChannelId()
  const bc = new BroadcastChannel(channelId)
  bc.onmessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || data.channel !== channelId) return
    if (data.type === 'agent-start-session') {
      debug('received agent-start-session, opening')
      isOpen.value = true
      localStorage.setItem(storageKey, '1')
      hasUnread.value = false
    } else if (data.type === 'agent-chat-ping') {
      debug('received agent-chat-ping, sending pong')
      bc.postMessage({ channel: channelId, type: 'agent-chat-pong' } satisfies AgentChatPong)
    }
  }

  // Announce presence so action buttons already mounted can discover us
  bc.postMessage({ channel: channelId, type: 'agent-chat-ready' })

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

  function toggle () {
    isOpen.value = !isOpen.value
    localStorage.setItem(storageKey, isOpen.value ? '1' : '0')
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
      if (!isOpen.value && msg.unread) {
        hasUnread.value = true
      }
    }
  }

  return {
    agentStatus,
    hasUnread,
    fabIcon,
    fabColor,
    toggle,
    onDFrameMessage
  }
}

export function resolveAgentChatUrl (props: {
  src?: string
  accountType?: string
  accountId?: string
  chatTitle?: string
  systemPrompt?: string
}): string {
  if (props.src) return props.src
  if (props.accountType && props.accountId) {
    const base = `${window.location.origin}/agents/${props.accountType}/${props.accountId}/chat`
    const params = new URLSearchParams()
    if (props.chatTitle) params.set('title', props.chatTitle)
    if (props.systemPrompt) params.set('systemPrompt', props.systemPrompt)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }
  return ''
}
