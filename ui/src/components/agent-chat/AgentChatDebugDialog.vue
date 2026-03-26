<template>
  <v-dialog
    :model-value="modelValue"
    fullscreen
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card
      class="d-flex flex-column"
      flat
    >
      <v-btn
        :icon="mdiClose"
        variant="text"
        size="small"
        :title="t('close')"
        class="position-absolute"
        style="top: 8px; left: 8px; z-index: 1"
        @click="$emit('update:modelValue', false)"
      />
      <v-card-text class="flex-grow-1 pt-10 px-4">
        <v-tabs
          v-model="activeDebugTab"
          density="compact"
        >
          <v-tab value="systemPrompt">
            {{ t('systemPrompt') }}
          </v-tab>
          <v-tab value="tools">
            {{ t('tools') }} ({{ totalToolCount }})
          </v-tab>
          <v-tab value="trace">
            {{ t('trace') }}
          </v-tab>
        </v-tabs>

        <v-window v-model="activeDebugTab">
          <v-window-item value="systemPrompt">
            <pre class="agent-chat__pre pa-3 mt-2">{{ systemPrompt }}</pre>
          </v-window-item>

          <v-window-item value="tools">
            <div
              v-if="!totalToolCount"
              class="text-center text-medium-emphasis pa-4"
            >
              {{ t('noTools') }}
            </div>
            <template v-else>
              <v-expansion-panels
                v-if="debugToolsPartition.mainTools.length"
                variant="accordion"
                class="mt-2"
              >
                <v-expansion-panel
                  v-for="dtool in debugToolsPartition.mainTools"
                  :key="dtool.name"
                >
                  <v-expansion-panel-title class="text-body-2">
                    <span class="font-weight-medium">{{ dtool.title || dtool.name }}</span>
                    <span
                      v-if="dtool.title"
                      class="text-medium-emphasis ml-2"
                    >{{ dtool.name }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <p class="text-body-2 mb-2">
                      {{ dtool.description }}
                    </p>
                    <p class="text-caption text-medium-emphasis mb-1">
                      {{ t('inputSchema') }}:
                    </p>
                    <pre class="agent-chat__pre pa-2">{{ JSON.stringify(dtool.inputSchema, null, 2) }}</pre>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <template
                v-for="sa in debugToolsPartition.subAgents"
                :key="sa.name"
              >
                <div class="text-subtitle-2 font-weight-bold mt-4 mb-1 px-2">
                  {{ sa.displayName }}
                  <span class="text-medium-emphasis text-caption ml-1">({{ sa.tools.length }} {{ t('tools').toLowerCase() }})</span>
                </div>
                <p
                  v-if="sa.description"
                  class="text-body-2 text-medium-emphasis px-2 mb-1"
                >
                  {{ sa.description }}
                </p>
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel
                    v-for="dtool in sa.tools"
                    :key="dtool.name"
                  >
                    <v-expansion-panel-title class="text-body-2">
                      <span class="font-weight-medium">{{ dtool.title || dtool.name }}</span>
                      <span
                        v-if="dtool.title"
                        class="text-medium-emphasis ml-2"
                      >{{ dtool.name }}</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <p class="text-body-2 mb-2">
                        {{ dtool.description }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-1">
                        {{ t('inputSchema') }}:
                      </p>
                      <pre class="agent-chat__pre pa-2">{{ JSON.stringify(dtool.inputSchema, null, 2) }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </template>
            </template>
          </v-window-item>

          <v-window-item value="trace">
            <template v-if="!tracingEnabled">
              <div class="text-center pa-4">
                <p class="text-body-2 text-medium-emphasis mb-4">
                  {{ t('tracingDisabled') }}
                </p>
                <v-btn
                  color="primary"
                  variant="tonal"
                  @click="startTracing"
                >
                  {{ t('startTracing') }}
                </v-btn>
              </div>
            </template>
            <template v-else>
              <div class="d-flex justify-end pa-2">
                <v-btn
                  size="small"
                  color="error"
                  variant="tonal"
                  @click="stopTracing"
                >
                  {{ t('stopTracing') }}
                </v-btn>
              </div>
              <div
                v-if="!traceOverview.length"
                class="text-center text-medium-emphasis pa-4"
              >
                {{ t('noTrace') }}
              </div>
              <v-expansion-panels
                v-else
                variant="accordion"
                class="mt-2"
                @update:model-value="onTraceExpand"
              >
                <v-expansion-panel
                  v-for="entry in traceOverview"
                  :key="entry.index"
                  :value="entry.index"
                >
                  <v-expansion-panel-title class="text-body-2 py-1">
                    <v-chip
                      size="x-small"
                      :color="traceEntryColor(entry.type)"
                      variant="tonal"
                      class="mr-2"
                    >
                      {{ entry.type }}
                    </v-chip>
                    <span class="font-weight-medium text-truncate">{{ entry.label }}</span>
                    <v-spacer />
                    <span class="text-caption text-medium-emphasis ml-2">
                      {{ formatTraceTime(entry.timestamp) }}
                    </span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      {{ entry.preview }}
                    </div>
                    <pre
                      v-if="traceEntryDetails[entry.index]"
                      class="agent-chat__pre pa-2 mt-1"
                    >{{ JSON.stringify(traceEntryDetails[entry.index]?.content, null, 2) }}</pre>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </template>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
fr:
  close: Fermer
  systemPrompt: Prompt système
  tools: Outils
  noTools: Aucun outil enregistré
  inputSchema: Schéma d'entrée
  trace: Trace
  noTrace: Aucune trace enregistrée.
  startTracing: Démarrer le traçage
  stopTracing: Arrêter le traçage
  tracingDisabled: Le traçage n'est pas actif. Activez-le pour enregistrer les échanges et pouvoir les analyser.
en:
  close: Close
  systemPrompt: System Prompt
  tools: Tools
  noTools: No tools registered
  inputSchema: Input Schema
  trace: Trace
  noTrace: No trace recorded.
  startTracing: Start tracing
  stopTracing: Stop tracing
  tracingDisabled: Tracing is not active. Enable it to record exchanges and analyze them.
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiClose } from '@mdi/js'
import type { TraceOverviewEntry, TraceEntryDetail, SessionRecorder } from '~/traces/session-recorder'
import type { DebugToolsPartition } from '~/composables/use-agent-chat'

const props = defineProps<{
  modelValue: boolean
  systemPrompt: string
  debugToolsPartition: DebugToolsPartition
  tracingEnabled: boolean
  traceOverview: TraceOverviewEntry[]
  recorder?: SessionRecorder
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const activeDebugTab = ref('systemPrompt')
const totalToolCount = computed(() => {
  const p = props.debugToolsPartition
  return p.mainTools.length + p.subAgents.reduce((sum, sa) => sum + sa.tools.length, 0)
})
const traceEntryDetails = ref<Record<number, TraceEntryDetail>>({})

const loadTraceEntry = (index: number) => {
  if (!props.recorder) return
  if (traceEntryDetails.value[index]) return
  const detail = props.recorder.getTraceEntry(index)
  if (detail) {
    traceEntryDetails.value = { ...traceEntryDetails.value, [index]: detail }
  }
}

const onTraceExpand = (value: unknown) => {
  if (typeof value === 'number') {
    loadTraceEntry(value)
  }
}

const traceEntryColor = (type: string) => {
  const colors: Record<string, string> = {
    'system-prompt': 'purple',
    'user-message': 'primary',
    'hidden-context': 'purple',
    'assistant-step': 'success',
    'tool-call': 'warning',
    'tool-result': 'info',
    'sub-agent-start': 'secondary',
    'sub-agent-system-prompt': 'purple',
    'sub-agent-step': 'secondary',
    'sub-agent-end': 'secondary',
    'tools-changed': 'accent'
  }
  return colors[type] || 'default'
}

const formatTraceTime = (date: Date) => {
  return date.toLocaleTimeString()
}

const startTracing = () => {
  sessionStorage.setItem('agent-chat-trace', '1')
  window.location.reload()
}

const stopTracing = () => {
  sessionStorage.removeItem('agent-chat-trace')
  window.location.reload()
}
</script>

<style scoped>
.agent-chat__pre {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
