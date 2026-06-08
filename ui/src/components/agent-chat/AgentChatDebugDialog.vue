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
          <v-tab value="settings">
            {{ t('settings') }}
          </v-tab>
        </v-tabs>

        <div
          v-if="sessionUsage && (sessionUsage.inputTokens > 0 || sessionUsage.outputTokens > 0)"
          class="d-flex align-center ga-2 px-2 py-1 text-caption text-medium-emphasis"
        >
          <v-icon
            :icon="mdiChartBar"
            size="small"
          />
          <span>{{ t('tokens') }}: {{ (sessionUsage.inputTokens + sessionUsage.outputTokens).toLocaleString() }}</span>
          <span>({{ t('input') }}: {{ sessionUsage.inputTokens.toLocaleString() }} | {{ t('output') }}: {{ sessionUsage.outputTokens.toLocaleString() }})</span>
          <span v-if="sessionUsage.cacheReadTokens">{{ t('cached') }}: {{ sessionUsage.cacheReadTokens.toLocaleString() }}{{ sessionUsage.cacheWriteTokens ? ` | ${t('cacheWritten')}: ${sessionUsage.cacheWriteTokens.toLocaleString()}` : '' }}</span>
        </div>

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
                density="compact"
                class="mt-1 agent-chat__tools-panels"
              >
                <v-expansion-panel
                  v-for="dtool in debugToolsPartition.mainTools"
                  :key="dtool.name"
                  density="compact"
                >
                  <v-expansion-panel-title class="text-caption py-0">
                    <span class="font-weight-medium">{{ dtool.title || dtool.name }}</span>
                    <span
                      v-if="dtool.title"
                      class="text-medium-emphasis ml-1"
                    >{{ dtool.name }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <p class="text-caption mb-1">
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
                <div class="text-caption font-weight-bold mt-3 mb-1 px-2">
                  {{ sa.displayName }}
                  <span class="text-medium-emphasis ml-1">({{ sa.tools.length }} {{ t('tools').toLowerCase() }})</span>
                </div>
                <p
                  v-if="sa.description"
                  class="text-caption text-medium-emphasis px-2 mb-1"
                >
                  {{ sa.description }}
                </p>
                <v-expansion-panels
                  variant="accordion"
                  density="compact"
                  class="agent-chat__tools-panels"
                >
                  <v-expansion-panel
                    v-for="dtool in sa.tools"
                    :key="dtool.name"
                    density="compact"
                  >
                    <v-expansion-panel-title class="text-caption py-0">
                      <span class="font-weight-medium">{{ dtool.title || dtool.name }}</span>
                      <span
                        v-if="dtool.title"
                        class="text-medium-emphasis ml-1"
                      >{{ dtool.name }}</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <p class="text-caption mb-1">
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
            <div class="d-flex justify-end ga-2 pa-2">
              <v-btn
                size="small"
                variant="tonal"
                :prepend-icon="mdiDownload"
                @click="onDownload"
              >
                {{ t('download') }}
              </v-btn>
              <v-btn
                v-if="isAdmin"
                size="small"
                color="primary"
                variant="tonal"
                :prepend-icon="mdiOpenInNew"
                @click="onOpenReview"
              >
                {{ t('openReview') }}
              </v-btn>
            </div>
            <trace-view
              v-if="recorder"
              :trace-overview="traceOverview"
              :recorder="recorder"
            />
          </v-window-item>

          <v-window-item value="settings">
            <div class="pa-3">
              <v-switch
                v-if="traceStorageAvailable"
                :model-value="consent === 'yes'"
                :label="t('storeTraces')"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="(v: boolean | null) => { const val = v ? 'yes' : 'no'; writeConsent(val); consent = val }"
              />
              <v-switch
                :model-value="toolExploration"
                color="primary"
                density="compact"
                hide-details
                :label="t('toolExploration')"
                class="mt-2"
                @update:model-value="$emit('update:toolExploration', $event ?? false)"
              />
              <p class="text-caption text-medium-emphasis mt-1">
                {{ t('toolExplorationHint') }}
              </p>
            </div>
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
  tokens: Tokens
  input: entrée
  output: sortie
  cached: cache lu
  cacheWritten: cache écrit
  download: Télécharger
  openReview: Ouvrir l'analyse
  settings: Paramètres
  storeTraces: Enregistrer mes conversations pour relecture
  toolExploration: Exploration des outils (expérimental)
  toolExplorationHint: "Masque les outils derrière un outil « explore_tools » que l'assistant appelle pour découvrir et activer les outils pertinents à la demande. Changer ce réglage réinitialise la conversation."
en:
  close: Close
  systemPrompt: System Prompt
  tools: Tools
  noTools: No tools registered
  inputSchema: Input Schema
  trace: Trace
  tokens: Tokens
  input: input
  output: output
  cached: cache read
  cacheWritten: cache write
  download: Download
  openReview: Open review
  settings: Settings
  storeTraces: Store my conversations for review
  toolExploration: Tool exploration (experimental)
  toolExplorationHint: "Hides tools behind an 'explore_tools' tool the assistant calls to discover and enable relevant tools on demand. Changing this setting resets the conversation."
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { mdiClose, mdiChartBar, mdiDownload, mdiOpenInNew } from '@mdi/js'
import type { TraceOverviewEntry, SessionRecorder } from '~/traces/session-recorder'
import type { DebugToolsPartition } from '~/composables/use-agent-chat'
import { writeHandoff, downloadTrace } from '~/traces/trace-handoff'
import { traceStorageAvailable, readConsent, writeConsent } from '~/traces/trace-consent'
import TraceView from './TraceView.vue'

const props = defineProps<{
  modelValue: boolean
  systemPrompt: string
  debugToolsPartition: DebugToolsPartition
  traceOverview: TraceOverviewEntry[]
  recorder?: SessionRecorder
  sessionUsage?: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number }
  isAdmin?: boolean
  accountType: string
  accountId: string
  toolExploration?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'update:toolExploration': [value: boolean]
}>()

const { t } = useI18n()

const router = useRouter()

const activeDebugTab = ref('systemPrompt')
const consent = ref(readConsent())
const totalToolCount = computed(() => {
  const p = props.debugToolsPartition
  return p.mainTools.length + p.subAgents.reduce((sum, sa) => sum + sa.tools.length, 0)
})

const onDownload = () => {
  if (props.recorder) downloadTrace(props.recorder.getTrace())
}

const onOpenReview = () => {
  if (!props.recorder) return
  const trace = props.recorder.getTrace()
  if (!writeHandoff(trace)) downloadTrace(trace) // quota fallback: hand off via manual upload
  const href = router.resolve({ path: `/${props.accountType}/${props.accountId}/trace-review` }).href
  window.open(href, '_blank')
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

.agent-chat__tools-panels :deep(.v-expansion-panel-title) {
  min-height: 28px;
}

.agent-chat__tools-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 4px 12px 8px;
}
</style>
