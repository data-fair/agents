<template>
  <v-container
    class="chat-live-tools-container"
    fluid
  >
    <v-row class="fill-height">
      <v-col
        cols="5"
        class="d-flex flex-column"
      >
        <h1 class="text-headline-small mb-2">
          {{ t('title') }}
        </h1>
        <p class="text-body-medium text-medium-emphasis mb-4">
          {{ t('instructions') }}
        </p>
        <LiveToolsPanel v-if="panelOpen" />
        <p
          v-else
          class="text-body-small text-medium-emphasis"
        >
          {{ t('panelClosed') }}
        </p>
      </v-col>

      <v-col
        cols="7"
        class="d-flex flex-column"
      >
        <AgentChat
          :account-type="session.account.value?.type ?? 'user'"
          :account-id="session.account.value?.id ?? ''"
          :is-admin="true"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Chat Outils Dynamiques Dev
  instructions: "L'outil open_panel monte un panneau qui enregistre son propre outil set_display. Envoyez 'chain open_panel set_display' pour vérifier que le second outil est appelable dans le MÊME tour."
  panelClosed: "Panneau fermé — set_display n'est pas encore enregistré."
en:
  title: Chat Live Tools Dev
  instructions: "The open_panel tool mounts a panel that registers its own set_display tool. Send 'chain open_panel set_display' to check the second tool is callable in the SAME turn."
  panelClosed: "Panel closed — set_display is not registered yet."
</i18n>

<script lang="ts" setup>
/**
 * Dev page for the mid-turn tool refresh (see composables/live-tools.ts).
 *
 * `open_panel` mounts LiveToolsPanel, which registers `set_display` on mount. So a turn
 * that calls open_panel and then set_display only works if the tool set handed to the
 * running stream is live — which is the whole point of reconciling it in place.
 */
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentTool, useFrameServer } from '@data-fair/lib-vue-agents'
import AgentChat from '~/components/AgentChat.vue'
import LiveToolsPanel from '~/components/dev/LiveToolsPanel.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const session = useSessionAuthenticated()

const panelOpen = ref(false)

useFrameServer('self')

onMounted(() => {
  useAgentTool({
    name: 'open_panel',
    title: 'Open panel',
    description: 'Open the side panel, which brings its own tools with it',
    inputSchema: {
      type: 'object',
      properties: {}
    } as any,
    execute: () => {
      panelOpen.value = true
      return { success: true, message: 'Panel opened' }
    }
  } as any)
})
</script>

<style scoped>
.chat-live-tools-container {
  height: calc(100vh - 100px);
}
</style>
