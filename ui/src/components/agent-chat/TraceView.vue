<template>
  <div
    v-if="!traceOverview.length"
    class="text-center text-medium-emphasis pa-4"
  >
    {{ t('noTrace') }}
  </div>
  <template v-else>
    <div
      class="d-flex align-center flex-wrap ga-2 px-2 py-1 mb-1 bg-background rounded"
    >
      <span class="text-caption font-weight-medium">
        {{ summary.requestCount }} {{ t('requests') }} · {{ formatDuration(summary.totalDurationMs) }} · {{ formatTokens(summary.inputTokens) }} {{ t('in') }} · {{ formatTokens(summary.outputTokens) }} {{ t('out') }}<template v-if="summary.totalCost != null"> · {{ formatCost(summary.totalCost) }}</template>
      </span>
      <v-spacer />
      <v-chip
        v-for="f in flagChips"
        :key="f.key"
        size="x-small"
        :color="f.active ? 'primary' : undefined"
        :variant="f.active ? 'tonal' : 'outlined'"
        label
        :class="['flex-shrink-0', { 'text-decoration-line-through text-disabled': !f.active }]"
        style="font-size: 0.65rem;"
      >
        {{ t(f.key) }}
      </v-chip>
      <v-btn-toggle
        v-model="viewMode"
        density="compact"
        variant="outlined"
        divided
        mandatory
        class="ml-2"
      >
        <v-btn
          size="x-small"
          value="interpreted"
        >
          {{ t('interpreted') }}
        </v-btn>
        <v-btn
          size="x-small"
          value="raw"
        >
          {{ t('raw') }}
        </v-btn>
        <v-btn
          size="x-small"
          value="both"
        >
          {{ t('both') }}
        </v-btn>
      </v-btn-toggle>
    </div>
    <v-expansion-panels
      variant="accordion"
      density="compact"
      class="mt-1 agent-chat__trace-panels"
      @update:model-value="onTraceExpand"
    >
      <v-expansion-panel
        v-for="entry in visibleOverview"
        :key="entry.index"
        :value="entry.index"
        density="compact"
      >
        <v-expansion-panel-title class="text-caption py-0">
          <v-chip
            size="x-small"
            :color="traceEntryColor(entry.type)"
            variant="tonal"
            label
            class="mr-2 flex-shrink-0"
            style="font-size: 0.65rem;"
          >
            {{ entry.type }}
          </v-chip>
          <span
            v-if="entry.label"
            class="font-weight-medium mr-2 flex-shrink-0"
          >{{ entry.label }}</span>
          <span class="text-label-small text-medium-emphasis text-truncate agent-chat__trace-preview">{{ entry.preview }}</span>
          <span
            v-if="entry.cost != null"
            class="text-medium-emphasis ml-2 flex-shrink-0"
            style="white-space: nowrap;"
          >{{ formatCost(entry.cost.total) }}</span>
          <span
            class="text-medium-emphasis ml-2 flex-shrink-0"
            style="white-space: nowrap;"
          >
            {{ formatTraceTime(entry.timestamp) }}
          </span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <template v-if="traceEntryDetails[entry.index]">
            <template v-if="entry.type === 'assistant-step' || entry.type === 'sub-agent-step'">
              <v-chip
                v-if="traceEntryDetails[entry.index]?.content?.finishReason"
                size="x-small"
                variant="tonal"
                label
                class="my-2"
              >
                {{ traceEntryDetails[entry.index].content.finishReason }}
              </v-chip>
              <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.messages, null, 2) }}</pre>
            </template>
            <template v-else-if="entry.type === 'physical-request'">
              <v-chip
                v-if="traceEntryDetails[entry.index].content.finishReason"
                size="x-small"
                variant="tonal"
                label
                class="my-2"
              >
                {{ traceEntryDetails[entry.index].content.finishReason }}
              </v-chip>
              <div
                v-if="traceEntryDetails[entry.index].content.model"
                class="text-caption mt-2"
              >
                {{ traceEntryDetails[entry.index].content.model }}<template v-if="traceEntryDetails[entry.index].content.provider">
                  ({{ traceEntryDetails[entry.index].content.provider.name }})
                </template><template v-if="traceEntryDetails[entry.index].content.cost">
                  · {{ formatCost(traceEntryDetails[entry.index].content.cost.total) }} ({{ formatCost(traceEntryDetails[entry.index].content.cost.input) }} {{ t('in') }} + {{ formatCost(traceEntryDetails[entry.index].content.cost.output) }} {{ t('out') }})
                </template>
              </div>
              <div class="text-caption text-medium-emphasis mb-1 mt-2">
                {{ t('request') }}
              </div>
              <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.requestBody, null, 2) }}</pre>
              <div class="text-caption text-medium-emphasis mb-1 mt-2">
                {{ t('response') }}
              </div>
              <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.result, null, 2) }}</pre>
              <template v-if="traceEntryDetails[entry.index]?.content?.upstream">
                <div class="text-caption mt-3 font-weight-medium">
                  Upstream (provider)
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ traceEntryDetails[entry.index].content.upstream.request.url }} ·
                  HTTP {{ traceEntryDetails[entry.index].content.upstream.response.status }} ·
                  {{ traceEntryDetails[entry.index].content.upstream.response.rawChars }} chars{{ traceEntryDetails[entry.index].content.upstream.response.truncated ? ' (truncated)' : '' }}
                </div>
                <pre class="agent-chat__pre pa-2 mt-1">{{ recorder.getUpstreamExchange(entry.index)?.response.raw }}</pre>
              </template>
            </template>
            <template v-else-if="entry.type === 'sub-agent-start'">
              <div class="text-caption text-medium-emphasis mb-1">
                {{ t('task') }}
              </div>
              <pre class="agent-chat__pre pa-2 mt-1">{{ traceEntryDetails[entry.index]?.content?.task }}</pre>
              <div class="text-caption text-medium-emphasis mb-1 mt-2">
                {{ t('tools') }}
              </div>
              <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.tools, null, 2) }}</pre>
            </template>
            <template v-else-if="entry.type === 'compaction'">
              <v-chip
                size="x-small"
                color="orange"
                variant="tonal"
                label
                class="my-2"
              >
                {{ traceEntryDetails[entry.index].content.originalCharCount }} → {{ traceEntryDetails[entry.index].content.compactedCharCount }} {{ t('chars') }}
              </v-chip>
              <div class="text-caption text-medium-emphasis mb-1 mt-2">
                {{ t('summary') }}
              </div>
              <pre class="agent-chat__pre pa-2 mt-1">{{ traceEntryDetails[entry.index]?.content?.summary }}</pre>
              <div class="text-caption text-medium-emphasis mb-1 mt-2">
                {{ t('summarizedMessages') }}
              </div>
              <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.originalMessages, null, 2) }}</pre>
            </template>
            <template v-else-if="entry.type === 'moderation'">
              <v-chip
                size="x-small"
                :color="moderationActionColor(traceEntryDetails[entry.index]?.content)"
                variant="tonal"
                label
                class="my-2"
              >
                {{ moderationActionLabel(traceEntryDetails[entry.index]?.content) }}
              </v-chip>
              <template v-if="traceEntryDetails[entry.index]?.content?.category">
                <div class="text-caption text-medium-emphasis mb-1 mt-2">
                  {{ t('category') }}
                </div>
                <div class="text-caption">
                  {{ traceEntryDetails[entry.index].content.category }}
                </div>
              </template>
              <template v-if="traceEntryDetails[entry.index]?.content?.reason">
                <div class="text-caption text-medium-emphasis mb-1 mt-2">
                  {{ t('reason') }}
                </div>
                <div class="text-caption">
                  {{ traceEntryDetails[entry.index].content.reason }}
                </div>
              </template>
            </template>
            <pre
              v-else
              class="agent-chat__pre pa-2 mt-1"
            >{{ formatContent(traceEntryDetails[entry.index]?.content) }}</pre>
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </template>
</template>

<i18n lang="yaml">
fr:
  noTrace: Aucune trace enregistrée.
  task: Tâche
  tools: Outils
  request: Requête
  response: Réponse
  summary: Résumé
  summarizedMessages: Messages résumés
  chars: caractères
  category: Catégorie
  reason: Raison
  moderationAllowed: Autorisé
  moderationBlocked: Bloqué
  moderationSkipped: Ignoré (fail-open)
  requests: requêtes
  in: entrée
  out: sortie
  interpreted: Interprété
  raw: Brut
  both: Les deux
  subAgents: sous-agents
  toolExploration: exploration d'outils
  mermaid: mermaid
en:
  noTrace: No trace recorded.
  task: Task
  tools: Tools
  request: Request
  response: Response
  summary: Summary
  summarizedMessages: Summarized messages
  chars: chars
  category: Category
  reason: Reason
  moderationAllowed: Allowed
  moderationBlocked: Blocked
  moderationSkipped: Skipped (fail-open)
  requests: requests
  in: in
  out: out
  interpreted: Interpreted
  raw: Raw
  both: Both
  subAgents: sub-agents
  toolExploration: tool exploration
  mermaid: mermaid
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TraceOverviewEntry, TraceEntryDetail, SessionRecorder } from '~/traces/session-recorder'

const props = defineProps<{
  traceOverview: TraceOverviewEntry[]
  recorder: SessionRecorder
}>()

const { t } = useI18n()

const traceEntryDetails = ref<Record<number, TraceEntryDetail>>({})

const loadTraceEntry = (index: number) => {
  if (traceEntryDetails.value[index]) return
  const detail = props.recorder.getTraceEntry(index)
  if (detail) {
    traceEntryDetails.value = { ...traceEntryDetails.value, [index]: detail }
  }
}

const onTraceExpand = (value: unknown) => {
  if (typeof value === 'number') loadTraceEntry(value)
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
    'physical-request': 'teal',
    'tools-changed': 'accent',
    compaction: 'orange',
    moderation: 'pink'
  }
  return colors[type] || 'default'
}

const moderationActionColor = (content?: { action?: string, failOpen?: string }) => {
  if (!content || content.failOpen) return 'warning'
  return content.action === 'block' ? 'error' : 'success'
}

const moderationActionLabel = (content?: { action?: string, failOpen?: string }) => {
  if (!content) return ''
  if (content.failOpen) return t('moderationSkipped')
  return content.action === 'block' ? t('moderationBlocked') : t('moderationAllowed')
}

const formatTraceTime = (date: Date) => date.toLocaleTimeString()

// String content (system prompt, user message, etc.) is shown as-is to keep newlines
// readable; structured content is pretty-printed as JSON.
const formatContent = (content: unknown) =>
  typeof content === 'string' ? content : JSON.stringify(content, null, 2)

const summary = computed(() => props.recorder.getSummary())

const viewMode = ref<'interpreted' | 'raw' | 'both'>('interpreted')

const visibleOverview = computed(() => {
  if (viewMode.value === 'both') return props.traceOverview
  if (viewMode.value === 'raw') return props.traceOverview.filter(e => e.type === 'physical-request')
  return props.traceOverview.filter(e => e.type !== 'physical-request')
})

const flagChips = computed(() => [
  { key: 'subAgents', active: summary.value.flags.subAgents },
  { key: 'toolExploration', active: summary.value.flags.toolExploration },
  { key: 'mermaid', active: summary.value.flags.mermaid }
])

// Compact token formatting: 1234 -> "1.2k", 999 -> "999".
const formatTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`

const formatCost = (n: number) => `${n.toFixed(4)} €`

// Cumulated request time: sub-second stays in ms, otherwise seconds (one decimal
// under a minute) then minutes+seconds.
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  return `${m}m ${Math.round(s % 60)}s`
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

.agent-chat__trace-panels :deep(.v-expansion-panel-title) {
  min-height: 28px;
}

/* allow the preview to take remaining width and truncate with an ellipsis */
.agent-chat__trace-preview {
  flex: 1 1 0;
  min-width: 0;
}

.agent-chat__trace-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 4px 12px 8px;
}
</style>
