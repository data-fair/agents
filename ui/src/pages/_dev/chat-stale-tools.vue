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
  description: "Cette iframe expose le sous-agent portals_config via BroadcastChannel. Elle est retirée du DOM pour simuler une navigation hors de la gestion des portails."
en:
  title: Portals Frame
  description: "This iframe exposes the portals_config sub-agent via BroadcastChannel. It is removed from the DOM to simulate navigating away from the portals manager."
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useFrameServer, useAgentTool, useAgentSubAgent } from '@data-fair/lib-vue-agents'

const { t } = useI18n()

useFrameServer('portals-manager')

useAgentTool({
  name: 'read_portal_form',
  description: 'Read the current portal form configuration',
  inputSchema: { type: 'object', properties: {} } as any,
  execute: () => ({ content: [{ type: 'text' as const, text: 'Form is empty.' }] })
} as any)

useAgentSubAgent({
  name: 'portals_config',
  title: 'Portals config',
  description: 'Configure forms of the portals manager',
  prompt: 'You configure forms in the portals manager.',
  tools: ['read_portal_form']
})
</script>
