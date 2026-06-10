<template>
  <div
    v-if="!traceOverview.length"
    class="text-center text-medium-emphasis pa-4"
  >
    {{ t('noTrace') }}
  </div>
  <v-expansion-panels
    v-else
    variant="accordion"
    density="compact"
    class="mt-1 agent-chat__trace-panels"
    @update:model-value="onTraceExpand"
  >
    <v-expansion-panel
      v-for="entry in traceOverview"
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
            <div class="text-caption text-medium-emphasis mb-1 mt-2">
              {{ t('request') }}
            </div>
            <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.requestBody, null, 2) }}</pre>
            <div class="text-caption text-medium-emphasis mb-1 mt-2">
              {{ t('response') }}
            </div>
            <pre class="agent-chat__pre pa-2 mt-1">{{ JSON.stringify(traceEntryDetails[entry.index]?.content?.result, null, 2) }}</pre>
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

<i18n lang="yaml">
fr:
  noTrace: Aucune trace enregistrée.
  task: Tâche
  tools: Outils
  request: Requête
  response: Réponse
  category: Catégorie
  reason: Raison
  moderationAllowed: Autorisé
  moderationBlocked: Bloqué
  moderationSkipped: Ignoré (fail-open)
en:
  noTrace: No trace recorded.
  task: Task
  tools: Tools
  request: Request
  response: Response
  category: Category
  reason: Reason
  moderationAllowed: Allowed
  moderationBlocked: Blocked
  moderationSkipped: Skipped (fail-open)
</i18n>

<script lang="ts" setup>
import { ref } from 'vue'
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
