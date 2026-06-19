<template>
  <v-container
    fluid
    class="trace-review pa-0"
    data-iframe-height
  >
    <p
      v-if="loadError"
      class="text-error pa-3"
    >
      {{ loadError }}
    </p>
    <v-row
      v-else-if="recorder && owner"
      no-gutters
      class="fill-height"
    >
      <v-col
        cols="12"
        md="6"
        class="trace-review__pane"
      >
        <trace-view
          :trace-overview="traceOverview"
          :recorder="recorder"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
        class="trace-review__pane trace-review__chat"
      >
        <evaluator-chat
          :recorder="recorder"
          :account-type="owner.type"
          :account-id="owner.id"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  loadError: Trace introuvable ou accès refusé.
  review: Analyse
en:
  loadError: Trace not found or access denied.
  review: Review
</i18n>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { SessionRecorder } from '~/traces/session-recorder'
import type { TraceOverviewEntry } from '~/traces/session-recorder'
import { reconstructTrace } from '~/traces/reconstruct-trace'
import { $apiPath } from '~/context'
import TraceView from '~/components/agent-chat/TraceView.vue'
import EvaluatorChat from '~/components/EvaluatorChat.vue'

const { t } = useI18n()
const props = defineProps<{ conversationId: string }>()
const emit = defineEmits<{ loaded: [{ owner: { type: string, id: string }, label: string }] }>()

const recorder = shallowRef<SessionRecorder | null>(null)
const owner = ref<{ type: string, id: string } | null>(null)
const loadError = ref('')

const traceOverview = computed<TraceOverviewEntry[]>(() =>
  recorder.value ? recorder.value.getTraceOverview() : []
)

onMounted(async () => {
  try {
    const res = await fetch(`${$apiPath}/traces/conversation/${props.conversationId}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    owner.value = body.owner
    recorder.value = SessionRecorder.fromTrace(reconstructTrace(body.results))
    const firstMessage = recorder.value.getTrace().turns[0]?.userMessage?.trim()
    emit('loaded', { owner: body.owner, label: firstMessage ? firstMessage.slice(0, 60) : t('review') })
  } catch {
    loadError.value = t('loadError')
  }
})
</script>

<style scoped>
.trace-review { height: 100%; }
.trace-review__pane { height: 100%; overflow-y: auto; border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.trace-review__chat { border-right: none; }
</style>
