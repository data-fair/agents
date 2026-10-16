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
import { computed, onScopeDispose } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { mdiRobotOutline } from '@mdi/js'
import { getTabChannelId, useAgentChatLauncher } from '@data-fair/lib-vue-agents'
import type { AgentActionSessionCleared } from './types.js'

type BtnProps = Omit<VBtn['$props'], 'icon' | 'color' | 'loading' | 'onClick' | 'size'>

const props = withDefaults(defineProps<{
  actionId: string
  visiblePrompt: string
  hiddenContext: string
  /** The agent to ask, in a new conversation. Absent, the chat's current agent. */
  agentId?: string
  title?: string
  btnProps?: BtnProps
}>(), {
  agentId: undefined,
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

// Shown only once a chat panel answers: without one, the click would go nowhere.
const { available: chatAvailable, open } = useAgentChatLauncher()

function handleClick () {
  open({
    visiblePrompt: props.visiblePrompt,
    hiddenContext: props.hiddenContext,
    ...(props.agentId ? { agentId: props.agentId } : {})
  })
}

onScopeDispose(() => {
  const channelId = getTabChannelId()
  const bc = new BroadcastChannel(channelId)
  bc.postMessage({ channel: channelId, type: 'agent-session-cleared' } satisfies AgentActionSessionCleared)
  bc.close()
})
</script>
