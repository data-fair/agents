<template>
  <v-container
    class="chat-iframe-container"
    fluid
  >
    <v-row class="fill-height">
      <v-col
        cols="5"
        class="d-flex flex-column"
      >
        <h1 class="text-h5 mb-2">
          {{ t('title') }}
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ t('instructions') }}
        </p>
        <v-textarea
          v-model="toolData"
          :label="t('toolLabel')"
          :placeholder="t('toolPlaceholder')"
          rows="8"
          variant="outlined"
          readonly
        />
      </v-col>

      <v-col
        cols="7"
        class="d-flex flex-column"
      >
        <iframe
          :src="iframeSrc"
          class="chat-iframe"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Chat Iframe Dev
  instructions: "Le chat tourne dans une iframe. Les outils sont partagés via BroadcastChannel. Demandez à l'agent de définir les données, par exemple: 'Définis les données à: Bonjour le monde'"
  toolLabel: Données
  toolPlaceholder: "Les données définies par l'agent apparaîtront ici..."
en:
  title: Chat Iframe Dev
  instructions: "The chat runs inside an iframe. Tools are shared via BroadcastChannel. Ask the agent to set the data, for example: 'Set the data to: Hello World'"
  toolLabel: Data
  toolPlaceholder: "Data set by the agent will appear here..."
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFrameServer } from '@data-fair/lib-vue-agents'

const { t } = useI18n()

const toolData = ref('')

const iframeSrc = computed(() => {
  return `${window.location.origin}/_dev/chat-iframe-child`
})

useFrameServer('parent')

navigator.modelContext.registerTool({
  name: 'set_data',
  description: 'Set the data in the textarea of the parent page',
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

<style scoped>
.chat-iframe-container {
  height: calc(100vh - 100px);
}

.chat-iframe {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
</style>
