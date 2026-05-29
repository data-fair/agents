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
}>()

const state = useAgentChatBlock()

// Per-instance key so multiple chats in the same tab keep distinct initial configs.
const initConfigKey = crypto.randomUUID()
setAgentInitConfig(initConfigKey, { prompt: props.systemPrompt, title: props.chatTitle })

const resolvedSrc = computed(() => resolveAgentChatUrl(props, initConfigKey))
</script>
