<template>
  <v-container data-iframe-height>
    <v-alert
      type="info"
      variant="tonal"
      data-testid="chat-panel-notice"
      :text="agentId ? t('agent') : t('account')"
    >
      <template #append>
        <open-chat-button :agent-id="agentId" />
      </template>
    </v-alert>
  </v-container>
</template>

<i18n lang="yaml">
en:
  account: This page is for administrators. Your assistant and your agents are in the chat panel.
  agent: This page is for administrators. You can talk to this agent in the chat panel.
fr:
  account: Cette page est réservée aux administrateurs. Votre assistant et vos agents sont dans le panneau de conversation.
  agent: Cette page est réservée aux administrateurs. Vous pouvez parler à cet agent dans le panneau de conversation.
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import OpenChatButton from '~/components/OpenChatButton.vue'

/**
 * What someone who is not an admin sees on an admin page. They used to be sent to the full-page chat;
 * the chat is the back office's panel now, the one place people talk to their agents.
 */
defineProps<{ agentId?: string }>()

const { t } = useI18n()
</script>
