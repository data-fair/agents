<template>
  <v-container class="pa-4">
    <h2 class="text-title-large mb-2">
      {{ t('title') }}
    </h2>
    <p class="text-body-medium text-medium-emphasis">
      {{ t('description') }}
    </p>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Frame Portails
  description: "Cette iframe expose l'outil read_portal_form via BroadcastChannel. Elle est retirée du DOM pour simuler une navigation hors de la gestion des portails."
en:
  title: Portals Frame
  description: "This iframe exposes the read_portal_form tool via BroadcastChannel. It is removed from the DOM to simulate navigating away from the portals manager."
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useFrameServer, useAgentTool } from '@data-fair/lib-vue-agents'

const { t } = useI18n()

useFrameServer('portals-manager')

useAgentTool({
  name: 'read_portal_form',
  description: 'Read the current portal form configuration',
  inputSchema: { type: 'object', properties: {} } as any,
  execute: () => ({ content: [{ type: 'text' as const, text: 'Form is empty.' }] })
} as any)
</script>
