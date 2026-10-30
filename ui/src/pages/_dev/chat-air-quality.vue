<template>
  <v-container
    class="chat-air-quality-container"
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

        <v-card
          variant="outlined"
          class="mb-4"
        >
          <v-card-title class="text-title-medium">
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
  title: Chat Air Quality Dev
  instructions: "Cette page expose les données de qualité de l'air d'une ville : get_schema et query_data pour les interroger, set_display pour afficher une réponse sur la page."
  registeredTools: Outils enregistrés
  getSchemaDesc: "Retourne le schéma d'un jeu de données"
  queryDataDesc: "Exécute une requête sur les données"
  setDisplayDesc: "Affiche du texte dans la zone de sortie"
  displayLabel: Sortie
  displayPlaceholder: "Le résultat de set_display apparaîtra ici..."
en:
  title: Chat Air Quality Dev
  instructions: "This page exposes a city's air quality data: get_schema and query_data to query it, set_display to show an answer on the page."
  registeredTools: Registered tools
  getSchemaDesc: "Returns the schema of a dataset"
  queryDataDesc: "Runs a query on data"
  setDisplayDesc: "Displays text in the output area"
  displayLabel: Output
  displayPlaceholder: "The result of set_display will appear here..."
</i18n>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentTool, useFrameServer, useAgentState } from '@data-fair/lib-vue-agents'
import AgentChat from '~/components/AgentChat.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const session = useSessionAuthenticated()

const displayOutput = ref('')

useFrameServer('self')

onMounted(() => {
  // The dataset this page is showing, published as state rather than left for the
  // agent to guess. A judged run had the worker invent four dataset names, then
  // refuse to guess at all and ask the caller for one — a name nothing on the page
  // could have told it. Retention puts this in the activation snapshot, so the
  // agent is told what it is looking at before its first tool call.
  const DEMO_DATASET = { id: 'air-quality', slug: 'air-quality', title: 'Air quality measurements' }

  // Measurements are dated relative to now. Hardcoded 2024 dates aged into a
  // guaranteed derailment: a judged run had the persona — an officer needing a
  // figure for a meeting that afternoon — quite correctly refuse two-year-old
  // readings, and six of its seven turns went to arguing about freshness
  // instead of finding and displaying the worst station.
  const measuredAt = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600_000).toISOString().slice(0, 16)

  // The one table every tool answers from, so the fixture cannot contradict itself.
  const ROWS = [
    { date: measuredAt(3), station: 'ST-001', pollutant: 'PM2.5', value: 14.2, quality: 'Good' },
    { date: measuredAt(3), station: 'ST-002', pollutant: 'PM2.5', value: 22.1, quality: 'Medium' },
    { date: measuredAt(3), station: 'ST-003', pollutant: 'PM2.5', value: 9.1, quality: 'Good' },
    { date: measuredAt(3), station: 'ST-004', pollutant: 'PM2.5', value: 15.4, quality: 'Medium' },
    { date: measuredAt(2), station: 'ST-001', pollutant: 'PM2.5', value: 10.4, quality: 'Good' },
    { date: measuredAt(2), station: 'ST-002', pollutant: 'PM2.5', value: 19.8, quality: 'Medium' },
    { date: measuredAt(2), station: 'ST-001', pollutant: 'NO2', value: 35.8, quality: 'Medium' },
    { date: measuredAt(2), station: 'ST-003', pollutant: 'NO2', value: 28.1, quality: 'Good' }
  ]

  useAgentState('dataset', () => DEMO_DATASET)

  useAgentTool({
    name: 'get_schema',
    description: 'Returns the schema of the demo dataset with column names and types',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: { type: 'string', description: 'Dataset id, as reported in the page state' }
      },
      required: ['dataset']
    },
    execute: (args: { dataset?: string }) => {
      return {
        dataset: args.dataset || DEMO_DATASET.id,
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

  useAgentTool({
    name: 'query_data',
    description: 'Runs a query on the dataset and returns results',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: { type: 'string', description: 'Dataset id, as reported in the page state' },
        filter: { type: 'string', description: 'Filter expression' },
        aggregation: { type: 'string', description: 'Aggregation type: avg, sum, count, min, max' },
        groupBy: { type: 'string', description: 'Column to group by' }
      },
      required: ['dataset']
    },
    execute: (args: { dataset?: string, filter?: string, aggregation?: string, groupBy?: string }) => {
      // One coherent table, actually queried. The mock used to answer every
      // argument set with the same three raw rows EXCEPT a hard-coded
      // avg-by-station branch reporting four stations, so the fixture said both
      // "two stations" and "four stations". A judged run had the worker make a
      // confident six-call "definitively only 2 stations" claim the page's own
      // data contradicted — the case could not tell a worker that verified
      // something from one that guessed, which is the only thing it exists to
      // test.
      let rows = ROWS
      const filter = args.filter ?? ''
      const pollutant = /pollutant\s*=\s*'([^']+)'/.exec(filter)?.[1]
      if (pollutant) rows = rows.filter(r => r.pollutant === pollutant)
      const station = /station\s*=\s*'([^']+)'/.exec(filter)?.[1]
      if (station) rows = rows.filter(r => r.station === station)

      if (args.groupBy === 'station' && args.aggregation) {
        const by = new Map<string, number[]>()
        for (const r of rows) by.set(r.station, [...(by.get(r.station) ?? []), r.value])
        const reduce = (vs: number[]) => {
          if (args.aggregation === 'avg') return Math.round((vs.reduce((a, b) => a + b, 0) / vs.length) * 10) / 10
          if (args.aggregation === 'max') return Math.max(...vs)
          if (args.aggregation === 'min') return Math.min(...vs)
          if (args.aggregation === 'sum') return Math.round(vs.reduce((a, b) => a + b, 0) * 10) / 10
          return vs.length
        }
        const results = [...by.entries()].map(([st, vs]) => ({ station: st, [`${args.aggregation}_value`]: reduce(vs) }))
        return { results, count: results.length }
      }
      if (args.aggregation === 'count') return { results: [{ count: rows.length }], count: 1 }
      return { results: rows, count: rows.length }
    }
  } as any)

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
})
</script>

<style scoped>
.chat-air-quality-container {
  height: calc(100vh - 100px);
}
</style>
