<template>
  <v-navigation-drawer
    v-model="state.drawerOpen.value"
    location="right"
    floating
    color="#FFFFFF00"
    app
    :width="drawerWidth"
    style="z-index: 2500; /* Higher than v-dialog's 2400 */"
    v-bind="drawerProps"
  >
    <d-frame
      v-show="state.drawerOpen.value"
      :src="resolvedSrc"
      resize="no"
      style="height: 100%;"
      @message="state.onDFrameMessage"
    />
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer'
import { useDisplay } from 'vuetify'
import('@data-fair/frame/lib/d-frame.js')
import { useAgentChatDrawer } from './useAgentChatDrawer.js'

type DrawerProps = Omit<VNavigationDrawer['$props'], 'modelValue' | 'location' | 'width' | 'floating'>

const props = withDefaults(defineProps<{
  accountType?: string
  accountId?: string
  src?: string
  chatTitle?: string
  systemPrompt?: string
  drawerProps?: DrawerProps
}>(), {
  drawerProps: () => ({}) as DrawerProps
})

const state = useAgentChatDrawer()

const { name: breakpoint } = useDisplay()

const drawerWidth = computed(() => {
  switch (breakpoint.value) {
    case 'xs':
    case 'sm': return 350
    case 'md': return undefined
    case 'lg': return 350
    default: return 450
  }
})

const resolvedSrc = computed(() => {
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
})
</script>
