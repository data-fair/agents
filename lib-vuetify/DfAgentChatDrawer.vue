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
import { useAgentChatDrawer } from './useAgentChatDrawer.js'
import { resolveAgentChatUrl } from './useAgentChatBase.js'

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

const resolvedSrc = computed(() => resolveAgentChatUrl(props))
</script>
