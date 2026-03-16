<template>
  <v-container
    class="chat-subagent-container"
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

        <v-card
          variant="outlined"
          class="mb-4"
        >
          <v-card-title class="text-subtitle-1">
            {{ t('registeredTools') }}
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title class="font-weight-medium">
                  get_schema
                </v-list-item-title>
                <v-list-item-subtitle>{{ t('getSchemaDesc') }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-medium">
                  query_data
                </v-list-item-title>
                <v-list-item-subtitle>{{ t('queryDataDesc') }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-medium">
                  set_display
                </v-list-item-title>
                <v-list-item-subtitle>{{ t('setDisplayDesc') }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card
          variant="outlined"
          class="mb-4"
        >
          <v-card-title class="text-subtitle-1">
            {{ t('subAgentSection') }}
          </v-card-title>
          <v-card-text>
            <v-chip
              color="primary"
              variant="tonal"
              class="mr-2"
            >
              subagent_data_analyst
            </v-chip>
            <p class="text-body-2 mt-2 text-medium-emphasis">
              {{ t('subAgentInfo') }}
            </p>
          </v-card-text>
        </v-card>

        <v-textarea
          v-model="displayOutput"
          :label="t('displayLabel')"
          :placeholder="t('displayPlaceholder')"
          rows="6"
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
  title: Chat Sub-Agent Dev
  instructions: "Cette page teste les sous-agents. Le sous-agent 'data_analyst' a accès à get_schema et query_data, mais pas à set_display. L'agent principal a accès à set_display mais pas aux outils du sous-agent. Essayez : 'Analyse les données disponibles et affiche un résumé'"
  registeredTools: Outils enregistrés
  getSchemaDesc: "Retourne le schéma d'un jeu de données (réservé au sous-agent)"
  queryDataDesc: "Exécute une requête sur les données (réservé au sous-agent)"
  setDisplayDesc: "Affiche du texte dans la zone de sortie (agent principal uniquement)"
  subAgentSection: Sous-agent
  subAgentInfo: "Le sous-agent data_analyst utilise get_schema et query_data. Ces outils ne sont PAS visibles par l'agent principal."
  displayLabel: Sortie
  displayPlaceholder: "Le résultat de set_display apparaîtra ici..."
en:
  title: Chat Sub-Agent Dev
  instructions: "This page tests sub-agents. The 'data_analyst' sub-agent has access to get_schema and query_data, but not set_display. The main agent has access to set_display but not the sub-agent's tools. Try: 'Analyze the available data and display a summary'"
  registeredTools: Registered tools
  getSchemaDesc: "Returns the schema of a dataset (reserved for sub-agent)"
  queryDataDesc: "Runs a query on data (reserved for sub-agent)"
  setDisplayDesc: "Displays text in the output area (main agent only)"
  subAgentSection: Sub-agent
  subAgentInfo: "The data_analyst sub-agent uses get_schema and query_data. These tools are NOT visible to the main agent."
  displayLabel: Output
  displayPlaceholder: "The result of set_display will appear here..."
</i18n>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentTool, useAgentSubAgent, useFrameServer } from '@data-fair/lib-vue-agents'
import AgentChat from '~/components/AgentChat.vue'

const { t } = useI18n()

const displayOutput = ref('')

useFrameServer('self')

onMounted(() => {
  // Tool reserved for the sub-agent
  useAgentTool({
    name: 'get_schema',
    description: 'Returns the schema of the demo dataset with column names and types',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: { type: 'string', description: 'Name of the dataset' }
      },
      required: ['dataset']
    },
    execute: (args: { dataset: string }) => {
      return {
        dataset: args.dataset || 'air_quality_2024',
        columns: [
          { name: 'date', type: 'datetime', description: 'Measurement date and time' },
          { name: 'station', type: 'string', description: 'Station identifier' },
          { name: 'pollutant', type: 'string', description: 'Pollutant type (PM2.5, PM10, NO2, O3)' },
          { name: 'value', type: 'number', description: 'Measured value (µg/m³)' },
          { name: 'quality', type: 'string', description: 'Quality index (Good, Medium, Bad)' }
        ]
      }
    }
  } as any)

  // Tool reserved for the sub-agent
  useAgentTool({
    name: 'query_data',
    description: 'Runs a query on the dataset and returns results',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: { type: 'string', description: 'Name of the dataset' },
        filter: { type: 'string', description: 'Filter expression' },
        aggregation: { type: 'string', description: 'Aggregation type: avg, sum, count, min, max' },
        groupBy: { type: 'string', description: 'Column to group by' }
      },
      required: ['dataset']
    },
    execute: (args: { dataset: string, aggregation?: string, groupBy?: string }) => {
      // Return mock data
      if (args.aggregation === 'avg' && args.groupBy === 'station') {
        return {
          results: [
            { station: 'ST-001', avg_value: 12.3 },
            { station: 'ST-002', avg_value: 18.7 },
            { station: 'ST-003', avg_value: 9.1 },
            { station: 'ST-004', avg_value: 15.4 }
          ],
          count: 4
        }
      }
      return {
        results: [
          { date: '2024-01-15T08:00', station: 'ST-001', pollutant: 'PM2.5', value: 14.2, quality: 'Good' },
          { date: '2024-01-15T08:00', station: 'ST-002', pollutant: 'PM2.5', value: 22.1, quality: 'Medium' },
          { date: '2024-01-15T09:00', station: 'ST-001', pollutant: 'NO2', value: 35.8, quality: 'Medium' }
        ],
        count: 3
      }
    }
  } as any)

  // Tool for the main agent only (NOT in the sub-agent's tools list)
  useAgentTool({
    name: 'set_display',
    description: 'Displays text in the output area on the left side of the page',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text to display' }
      },
      required: ['text']
    },
    execute: (args: { text: string }) => {
      displayOutput.value = args.text
      return { success: true, message: 'Display updated' }
    }
  } as any)

  // Sub-agent that uses get_schema and query_data
  useAgentSubAgent({
    name: 'data_analyst',
    description: 'Analyzes datasets by querying their schema and data, then produces statistical summaries',
    prompt: 'You are a data analyst. Use the get_schema tool to understand dataset structure, then use query_data to retrieve and analyze data. Provide concise statistical summaries.',
    tools: ['get_schema', 'query_data']
  })
})
</script>

<style scoped>
.chat-subagent-container {
  height: calc(100vh - 100px);
}
</style>
