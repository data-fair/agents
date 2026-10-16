<template>
  <!-- Only with a chat panel in this tab (the back office's): without one the click would go nowhere. -->
  <v-btn
    v-if="available"
    variant="text"
    :prepend-icon="mdiChatOutline"
    :text="t('openChat')"
    data-testid="open-chat"
    @click="open(agentId ? { agentId } : {})"
  />
</template>

<i18n lang="yaml">
en:
  openChat: Open chat
fr:
  openChat: Ouvrir la conversation
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { mdiChatOutline } from '@mdi/js'
import { useAgentChatLauncher } from '@data-fair/lib-vue-agents'

/** Opens the tab's chat panel, on this agent in a new conversation when one is named. */
defineProps<{ agentId?: string }>()

const { t } = useI18n()
const { available, open } = useAgentChatLauncher()
</script>
