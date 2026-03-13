<template>
  <v-container class="pa-4">
    <h2 class="text-h6 mb-2">
      {{ t('title') }}
    </h2>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ t('description') }}
    </p>
    <v-textarea
      v-model="toolData"
      :label="t('toolLabel')"
      :placeholder="t('toolPlaceholder')"
      rows="6"
      variant="outlined"
      readonly
    />
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Iframe Outils
  description: "Cette iframe expose l'outil set_data via BroadcastChannel."
  toolLabel: Données
  toolPlaceholder: "Les données définies par l'agent apparaîtront ici..."
en:
  title: Tools Iframe
  description: "This iframe exposes the set_data tool via BroadcastChannel."
  toolLabel: Data
  toolPlaceholder: "Data set by the agent will appear here..."
</i18n>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFrameServer } from '~/composables/use-frame-server'

const { t } = useI18n()

const toolData = ref('')

useFrameServer('tools-iframe')

navigator.modelContext.registerTool({
  name: 'set_data',
  description: 'Set the data in the textarea of the tools iframe',
  inputSchema: {
    type: 'object',
    properties: {
      data: { type: 'string', description: 'The data to set' }
    },
    required: ['data']
  },
  execute: (args: Record<string, unknown>) => {
    toolData.value = args.data as string
    return { content: [{ type: 'text' as const, text: 'Data set successfully!' }] }
  }
} as any)
</script>
