import { ref, computed, watch, type Ref } from 'vue'
import { useRouter, type Router } from 'vue-router'
import { mdiRobotOutline, mdiCommentQuestion, mdiAlertCircle } from '@mdi/js'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import type { AgentStatus, AgentChatMessage, AgentChatPong } from './types.js'
import { decideAgentNavigation } from './link-utils.js'
import Debug from './debug.js'

const debug = Debug('df-agents:agent-chat')

// vue-router's useRouter() is inject()-based and only resolves during a synchronous
// component setup. The chat state is a lazily-created singleton that a host may first
// instantiate outside that window (e.g. from a watchEffect once a session loads), where
// useRouter() returns undefined. So the rendering components — whose setup always runs in
// router context — register the router here, and the navigate handler reads it from here.
let chatRouter: Router | undefined

/** Called from a chat component's setup (router context guaranteed) to capture the router. */
export function registerAgentChatRouter () {
  const router = useRouter()
  if (router) chatRouter = router
}

export function createAgentChatBase (isOpen: Ref<boolean>, storageKey?: string) {
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
      if (storageKey) localStorage.setItem(storageKey, '1')
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

  // Clear unread state and persist open state whenever isOpen changes
  // (whether via toggle(), v-model, or BroadcastChannel)
  watch(isOpen, (open) => {
    if (storageKey) localStorage.setItem(storageKey, open ? '1' : '0')
    if (open) {
      hasUnread.value = false
    }
  })

  function toggle () {
    isOpen.value = !isOpen.value
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
    } else if (msg.type === 'navigate') {
      // The link may be a full URL, a base-prefixed path, or an app-relative path that
      // omits our base prefix (models often write those). Resolve against our router base
      // and navigate in-SPA when it maps to a real route; otherwise fall back to a full
      // navigation (external links, same-origin pages outside this app, or no router).
      const decision = decideAgentNavigation(msg.url, window.location.origin, chatRouter)
      if (decision.spa && chatRouter) {
        chatRouter.push(decision.path)
      } else {
        window.location.href = decision.url
      }
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

/**
 * Build the chat iframe URL. When an init-config key is provided it is appended as
 * the `initConfig` query param so the iframe knows which stored config to read —
 * this is what lets several chats coexist in one tab without clobbering each other.
 */
export function resolveAgentChatUrl (props: {
  src?: string
  accountType?: string
  accountId?: string
}, initConfigKey?: string): string {
  let url: string
  if (props.src) url = props.src
  else if (props.accountType && props.accountId) url = `${window.location.origin}/agents/${props.accountType}/${props.accountId}/chat`
  else return ''

  if (initConfigKey) {
    const parsed = new URL(url, window.location.origin)
    parsed.searchParams.set('initConfig', initConfigKey)
    url = parsed.toString()
  }
  return url
}
