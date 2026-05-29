<template>
  <d-frame
    :src="resolvedSrc"
    resize="no"
    style="height: 100%; width: 100%;"
    @message="state.onDFrameMessage"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import('@data-fair/frame/lib/d-frame.js')
import { setAgentInitConfig } from '@data-fair/lib-vue-agents'
import { useAgentChatBlock } from './useAgentChatBlock.js'
import { resolveAgentChatUrl } from './useAgentChatBase.js'

const props = defineProps<{
  accountType?: string
  accountId?: string
  src?: string
  chatTitle?: string
  systemPrompt?: string
  initConfigKey?: string
}>()

const state = useAgentChatBlock()

// Stable per-variant key (overridable via prop) so a page can host one of each
// variant without clobbering, while keeping sessionStorage bounded — only pass a
// custom key when mounting several blocks in the same tab.
const initConfigKey = props.initConfigKey ?? 'block'
setAgentInitConfig(initConfigKey, { prompt: props.systemPrompt, title: props.chatTitle })

const resolvedSrc = computed(() => resolveAgentChatUrl(props, initConfigKey))
</script>
