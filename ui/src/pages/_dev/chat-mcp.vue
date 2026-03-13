<template>
  <v-container
    class="chat-mcp-container"
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
        <AgentChat :debug="true" />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Chat MCP Dev
  instructions: "Cet outil permet de définir les données dans la zone de texte. Demandez à l'agent de définir les données, par exemple: 'Définis les données à: Bonjour le monde'"
  toolLabel: Données
  toolPlaceholder: "Les données définies par l'agent apparaîtront ici..."
  toolResult: "Données définies avec succès!"
en:
  title: Chat MCP Dev
  instructions: "This tool allows setting data in the textarea. Ask the agent to set the data, for example: 'Set the data to: Hello World'"
  toolLabel: Data
  toolPlaceholder: "Data set by the agent will appear here..."
  toolResult: "Data set successfully!"
</i18n>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentTool, useFrameServer } from '@data-fair/lib-vue-agents'
import AgentChat from '~/components/AgentChat.vue'

const { t } = useI18n()

const toolData = ref('')

useFrameServer('self')

onMounted(() => {
  useAgentTool({
    name: 'set_data',
    description: 'Set the data in the textarea',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string' }
      },
      required: ['data']
    } as any,
    execute: (args: { data: string }) => {
      toolData.value = args.data
      return { success: true, message: t('toolResult') }
    }
  } as any)
})
</script>

<style scoped>
.chat-mcp-container {
  height: calc(100vh - 100px);
}
</style>
