<template>
  <v-fab
    :icon="fabIcon"
    :color="fabColor"
    :loading="agentStatus === 'working'"
    app
    location="top end"
    class="df-agent-chat-fab"
    v-bind="fabProps"
    @click="toggleDrawer"
  >
    <v-badge
      :model-value="hasUnread"
      dot
      color="error"
      floating
    >
      <v-icon :icon="fabIcon" />
    </v-badge>
  </v-fab>

  <v-navigation-drawer
    v-model="drawerOpen"
    location="right"
    :width="width"
    floating
    color="#FFFFFF00"
    v-bind="drawerProps"
  >
    <d-frame
      v-if="iframeCreated"
      v-show="drawerOpen"
      ref="dFrameEl"
      :src="resolvedSrc"
      resize="no"
      style="height: 100%; padding: 8px 0"
      @message="onDFrameMessage"
    />
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { VBadge } from 'vuetify/components/VBadge'
import { VFab } from 'vuetify/components/VFab'
import { VIcon } from 'vuetify/components/VIcon'
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer'
import { mdiRobotOutline, mdiCommentQuestion, mdiAlertCircle } from '@mdi/js'
import('@data-fair/frame/lib/d-frame.js')
import type { AgentStatus, AgentChatMessage } from './types.js'

type FabProps = Omit<VFab['$props'], 'icon' | 'color' | 'loading' | 'onClick'>
type DrawerProps = Omit<VNavigationDrawer['$props'], 'modelValue' | 'location' | 'width' | 'floating'>

const props = withDefaults(defineProps<{
  accountType?: string
  accountId?: string
  src?: string
  width?: number | string
  fabProps?: FabProps
  drawerProps?: DrawerProps
}>(), {
  fabProps: () => ({}) as FabProps,
  drawerProps: () => ({}) as DrawerProps
})

const resolvedSrc = computed(() => {
  if (props.src) return props.src
  if (props.accountType && props.accountId) {
    return `${window.location.origin}/agents/${props.accountType}/${props.accountId}/chat`
  }
  return ''
})

const STORAGE_KEY = 'df-agent-chat-open'
const wasOpen = localStorage.getItem(STORAGE_KEY) === '1'
const drawerOpen = ref(wasOpen)
const iframeCreated = ref(wasOpen)
const agentStatus = ref<AgentStatus>('idle')
const hasUnread = ref(false)
const toolsJustChanged = ref(false)
let toolsChangedTimeout: ReturnType<typeof setTimeout> | null = null

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
    default: return 'primary'
  }
})

function toggleDrawer () {
  if (!iframeCreated.value) iframeCreated.value = true
  drawerOpen.value = !drawerOpen.value
  localStorage.setItem(STORAGE_KEY, drawerOpen.value ? '1' : '0')
  hasUnread.value = false
}

function onDFrameMessage (event: CustomEvent<AgentChatMessage>) {
  const msg = event.detail
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
</script>

