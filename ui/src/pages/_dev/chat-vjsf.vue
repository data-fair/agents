<template>
  <v-container
    class="chat-vjsf-container"
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
        <vjsf-webmcp
          v-model="toolData"
          :schema="schema"
        />
      </v-col>

      <v-col
        cols="7"
        class="d-flex flex-column"
      >
        <AgentChat
          :account-type="session.account.value?.type ?? 'user'"
          :account-id="session.account.value?.id ?? ''"
          :debug="true"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Chat VJSF Dev
  instructions: "Cet outil permet de définir les données dans le formulaire JSON Schema. Demandez à l'agent de modifier les données."
  toolResult: "Données définies avec succès!"
en:
  title: Chat VJSF Dev
  instructions: "This tool allows setting data in the JSON Schema form. Ask the agent to modify the data."
  toolResult: "Data set successfully!"
</i18n>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentTool, useFrameServer } from '@data-fair/lib-vue-agents'
import AgentChat from '~/components/AgentChat.vue'
import VjsfWebmcp from '@koumoul/vjsf/components/vjsf-webmcp.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const session = useSessionAuthenticated()

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    age: { type: 'integer', title: 'Age' },
    active: { type: 'boolean', title: 'Active' }
  }
}

const toolData = ref<Record<string, any>>({})

useFrameServer('self')

onMounted(() => {
  useAgentTool({
    name: 'set_data',
    description: 'Set the data in the form',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object' }
      },
      required: ['data']
    } as any,
    execute: ({ args }: { args: { data: Record<string, any> } }) => {
      toolData.value = args.data
      return { success: true, message: t('toolResult') }
    }
  } as any)
})
</script>

<style scoped>
.chat-vjsf-container {
  height: calc(100vh - 100px);
}
</style>
