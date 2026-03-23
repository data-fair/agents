<template>
  <v-btn
    :icon="state.fabIcon.value"
    :color="state.fabColor.value"
    :loading="state.agentStatus.value === 'working'"
    class="df-agent-chat-toggle"
    v-bind="btnProps"
    variant="flat"
    :title="title"
    @click="state.toggleDrawer"
  >
    <v-badge
      :model-value="state.hasUnread.value"
      dot
      color="error"
      floating
    >
      <v-icon :icon="state.fabIcon.value" />
    </v-badge>
  </v-btn>
</template>

<script lang="ts" setup>
import { VBadge } from 'vuetify/components/VBadge'
import { VBtn } from 'vuetify/components/VBtn'
import { VIcon } from 'vuetify/components/VIcon'
import { useAgentChatDrawer } from './useAgentChatDrawer.js'

type BtnProps = Omit<VBtn['$props'], 'icon' | 'color' | 'loading' | 'onClick'>

withDefaults(defineProps<{
  title?: string
  btnProps?: BtnProps
}>(), {
  title: 'Assistant',
  btnProps: () => ({}) as BtnProps
})

const state = useAgentChatDrawer()
</script>
