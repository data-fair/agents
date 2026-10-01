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
import { setAgentInitConfig, hostInitConfig } from '@data-fair/lib-vue-agents'
import { useAgentChatBlock } from './useAgentChatBlock.js'
import { resolveAgentChatUrl, registerAgentChatRouter } from './useAgentChatBase.js'

// Capture the router from this setup (always run in router context) so the shared,
// possibly lazily-created chat state can navigate in-SPA on iframe link clicks.
registerAgentChatRouter()

const props = defineProps<{
  accountType?: string
  accountId?: string
  src?: string
  chatTitle?: string
  /** Which standard agent to talk to, by id. Replaces `systemPrompt`. */
  agentId?: string
  /** @deprecated Use `agentId`. Ignored, with a one-time console warning. */
  systemPrompt?: string
  initConfigKey?: string
}>()

const state = useAgentChatBlock()

// Stable per-variant key (overridable via prop) so a page can host one of each
// variant without clobbering, while keeping sessionStorage bounded — only pass a
// custom key when mounting several blocks in the same tab.
const initConfigKey = props.initConfigKey ?? 'block'
setAgentInitConfig(initConfigKey, hostInitConfig(props))

const resolvedSrc = computed(() => resolveAgentChatUrl(props, initConfigKey))
</script>
