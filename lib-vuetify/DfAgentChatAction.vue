<template>
  <v-btn
    v-show="chatAvailable"
    :data-action-id="actionId"
    class="df-agent-chat-action"
    v-bind="btnProps"
    @click="handleClick"
  />
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onScopeDispose } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { mdiRobotOutline } from '@mdi/js'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import type { AgentActionStartSession, AgentActionSessionCleared, AgentChatPing } from './types.js'

type BtnProps = Omit<VBtn['$props'], 'icon' | 'color' | 'loading' | 'onClick' | 'size'>

const props = withDefaults(defineProps<{
  actionId: string
  visiblePrompt: string
  hiddenContext: string
  title?: string
  btnProps?: BtnProps
}>(), {
  title: 'Ask the assistant',
  btnProps: () => ({}) as BtnProps
})

const btnProps = computed(() => ({
  variant: 'flat' as const,
  color: 'secondary',
  title: props.title,
  size: 'small',
  density: 'comfortable' as const,
  icon: mdiRobotOutline,
  ...props.btnProps
}))

const chatAvailable = ref(false)

let bc: BroadcastChannel | null = null
let channelId: string

onMounted(() => {
  channelId = getTabChannelId()
  bc = new BroadcastChannel(channelId)

  // Listen for drawer presence (pong response or ready announcement)
  bc.onmessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || data.channel !== channelId) return
    if (data.type === 'agent-chat-pong' || data.type === 'agent-chat-ready') {
      chatAvailable.value = true
    }
  }

  // Ping to discover if a drawer is already present
  bc.postMessage({ channel: channelId, type: 'agent-chat-ping' } satisfies AgentChatPing)
})

function handleClick () {
  if (!bc) return
  const msg: AgentActionStartSession = {
    channel: channelId,
    type: 'agent-start-session',
    visiblePrompt: props.visiblePrompt,
    hiddenContext: props.hiddenContext
  }
  bc.postMessage(msg)
  // Also persist so the iframe can pick it up if it hasn't loaded yet
  sessionStorage.setItem('df-agent-pending-action', JSON.stringify(msg))
}

onScopeDispose(() => {
  if (!bc) return
  bc.postMessage({
    channel: channelId,
    type: 'agent-session-cleared'
  } satisfies AgentActionSessionCleared)
  bc.close()
  bc = null
})
</script>
