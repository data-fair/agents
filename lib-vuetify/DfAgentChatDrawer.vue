<template>
  <v-navigation-drawer
    v-model="state.drawerOpen.value"
    location="right"
    floating
    color="#FFFFFF00"
    app
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
import('@data-fair/frame/lib/d-frame.js')
import { setAgentInitConfig } from '@data-fair/lib-vue-agents'
import { useAgentChatDrawer } from './useAgentChatDrawer.js'
import { resolveAgentChatUrl, registerAgentChatRouter } from './useAgentChatBase.js'

// Capture the router from this setup (always run in router context) so the shared,
// possibly lazily-created chat state can navigate in-SPA on iframe link clicks.
registerAgentChatRouter()

type DrawerProps = Omit<VNavigationDrawer['$props'], 'modelValue' | 'location' | 'width' | 'floating'>

const props = withDefaults(defineProps<{
  accountType?: string
  accountId?: string
  src?: string
  chatTitle?: string
  systemPrompt?: string
  initConfigKey?: string
  drawerProps?: DrawerProps
}>(), {
  drawerProps: () => ({}) as DrawerProps
})

const state = useAgentChatDrawer()

// Stable per-variant key (overridable via prop) so a page can host one of each
// variant without clobbering, while keeping sessionStorage bounded — only pass a
// custom key when mounting several drawers in the same tab.
const initConfigKey = props.initConfigKey ?? 'drawer'
setAgentInitConfig(initConfigKey, { prompt: props.systemPrompt, title: props.chatTitle })

const resolvedSrc = computed(() => resolveAgentChatUrl(props, initConfigKey))
</script>
