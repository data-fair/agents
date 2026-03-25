<template>
  <v-btn
    :icon="mdiRobotOutline"
    color="secondary"
    :data-action-id="actionId"
    class="df-agent-chat-action"
    v-bind="btnProps"
    variant="flat"
    :title="title"
    size="small"
    @click="handleClick"
  />
</template>

<script lang="ts" setup>
import { onMounted, onScopeDispose } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { mdiRobotOutline } from '@mdi/js'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import type { AgentActionStartSession, AgentActionSessionCleared } from './types.js'

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

let bc: BroadcastChannel | null = null
let channelId: string

onMounted(() => {
  channelId = getTabChannelId()
  bc = new BroadcastChannel(channelId)
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
