<template>
  <v-container data-iframe-height>
    <v-alert
      type="info"
      variant="tonal"
      data-testid="chat-panel-notice"
      :text="agent ? t('agent') : t('account')"
    />
  </v-container>
</template>

<i18n lang="yaml">
en:
  account: This page is for administrators. Your assistant and your agents are in the chat panel, which you open from the top right of the back office.
  agent: This page is for administrators. To talk to this agent, open the chat panel from the top right of the back office and pick the agent at the top of the chat.
fr:
  account: Cette page est réservée aux administrateurs. Votre assistant et vos agents sont dans le panneau de conversation, qui s'ouvre en haut à droite du back-office.
  agent: Cette page est réservée aux administrateurs. Pour parler à cet agent, ouvrez le panneau de conversation en haut à droite du back-office et choisissez l'agent en haut de la conversation.
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

/**
 * What someone who is not an admin sees on an admin page. They used to be sent to a full-page chat;
 * the chat is the back office's panel now, the one place people talk to their agents, with its agent
 * picker.
 */
defineProps<{ agent?: boolean }>()

const { t } = useI18n()
</script>
