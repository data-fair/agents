<template>
  <v-menu
    v-model="state.menuOpen.value"
    :close-on-content-click="false"
    :close-on-back="false"
    persistent
    no-click-animation
    eager
    v-bind="resolvedMenuProps"
  >
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="{ ...activatorProps, ...btnProps }"
        :icon="state.fabIcon.value"
        :color="state.fabColor.value"
        :loading="state.agentStatus.value === 'working'"
        class="df-agent-chat-toggle"
        variant="flat"
        :title="title"
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

    <v-card
      style="height: 100%; width: 100%; position: relative;"
      v-bind="cardProps"
    >
      <div style="position: absolute; top: 4px; right: 4px; z-index: 1; display: flex; gap: 2px;">
        <v-btn
          :icon="state.expanded.value ? mdiArrowCollapse : mdiArrowExpand"
          size="small"
          variant="flat"
          @click="state.toggleExpanded"
        />
        <v-btn
          icon="$close"
          size="small"
          variant="flat"
          @click="state.toggleMenu"
        />
      </div>
      <d-frame
        ref="dFrameRef"
        v-show="state.menuOpen.value"
        :src="resolvedSrc"
        resize="no"
        style="height: 100%; width: 100%;"
        @message="state.onDFrameMessage"
      />
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { mdiArrowExpand, mdiArrowCollapse } from '@mdi/js'
import { VMenu } from 'vuetify/components/VMenu'
import { VCard } from 'vuetify/components/VCard'
import { VBtn } from 'vuetify/components/VBtn'
import { VBadge } from 'vuetify/components/VBadge'
import { VIcon } from 'vuetify/components/VIcon'
import('@data-fair/frame/lib/d-frame.js')
import { useAgentChatMenu } from './useAgentChatMenu.js'
import { resolveAgentChatUrl } from './useAgentChatBase.js'

type MenuProps = Omit<VMenu['$props'], 'modelValue' | 'closeOnContentClick'>

type BtnProps = Omit<VBtn['$props'], 'icon' | 'color' | 'loading' | 'onClick'>

const props = withDefaults(defineProps<{
  accountType?: string
  accountId?: string
  src?: string
  chatTitle?: string
  systemPrompt?: string
  title?: string
  btnProps?: BtnProps
  menuProps?: MenuProps
  cardProps?: VCard['$props']
}>(), {
  title: 'Assistant',
  btnProps: () => ({}) as BtnProps,
  menuProps: () => ({}) as MenuProps,
  cardProps: () => ({}) as VCard['$props']
})

const state = useAgentChatMenu()
const dFrameRef = ref<HTMLElement | null>(null)

watch(() => state.menuOpen.value, async (open) => {
  if (open) {
    await nextTick()
    const iframe = dFrameRef.value?.querySelector?.('iframe') as HTMLIFrameElement | null
    iframe?.focus()
  }
})

const resolvedSrc = computed(() => resolveAgentChatUrl(props))

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)
function onResize () {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const resolvedMenuProps = computed(() => {
  const base = {
    location: 'bottom end' as const,
    width: 400,
    height: 500,
    scrollStrategy: 'none' as const,
    ...props.menuProps
  }
  if (!state.expanded.value) return base

  const isSmallScreen = windowWidth.value < 800
  if (isSmallScreen) {
    return {
      ...base,
      width: windowWidth.value,
      height: windowHeight.value,
      location: 'top start' as const,
      offset: 0
    }
  }
  return {
    ...base,
    width: Math.min(800, windowWidth.value - 32),
    height: Math.min(700, windowHeight.value - 32)
  }
})
</script>
