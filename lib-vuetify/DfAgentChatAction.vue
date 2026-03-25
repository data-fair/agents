<template>
  <v-btn
    :icon="icon"
    :color="color"
    :loading="loading"
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
import { computed, onScopeDispose, ref } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { mdiRobotOutline, mdiCommentQuestion, mdiAlertCircle } from '@mdi/js'
import { useAgentChatDrawer } from './useAgentChatDrawer.js'

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

const state = useAgentChatDrawer()
const waitingForReady = ref(false)

const isActive = computed(() => state.activeActionId.value === props.actionId)

const icon = computed(() => {
  if (!isActive.value) return mdiRobotOutline
  switch (state.agentStatus.value) {
    case 'waiting-user': return mdiCommentQuestion
    case 'error': return mdiAlertCircle
    default: return mdiRobotOutline
  }
})

const color = computed(() => {
  if (!isActive.value) return 'secondary'
  switch (state.agentStatus.value) {
    case 'working': return 'accent'
    case 'waiting-user': return 'warning'
    case 'error': return 'error'
    default: return 'secondary'
  }
})

const loading = computed(() => {
  if (waitingForReady.value) return true
  if (!isActive.value) return false
  return state.agentStatus.value === 'working'
})

async function handleClick () {
  if (isActive.value) {
    // Already active: just open/focus the drawer
    state.drawerOpen.value = true
    return
  }
  waitingForReady.value = true
  try {
    await state.openForAction(props.actionId, props.visiblePrompt, props.hiddenContext)
  } finally {
    waitingForReady.value = false
  }
}

onScopeDispose(() => {
  state.clearAction(props.actionId)
})
</script>
