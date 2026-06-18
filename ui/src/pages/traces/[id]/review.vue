<template>
  <v-container
    fluid
    class="trace-review pa-0"
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
  storedConversations: Conversations enregistrées
  review: Relecture
en:
  loadError: Trace not found or access denied.
  storedConversations: Stored conversations
  review: Review
</i18n>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { SessionRecorder } from '~/traces/session-recorder'
import type { TraceOverviewEntry } from '~/traces/session-recorder'
import { reconstructTrace } from '~/traces/reconstruct-trace'
import { $apiPath } from '~/context'
import TraceView from '~/components/agent-chat/TraceView.vue'
import EvaluatorChat from '~/components/EvaluatorChat.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const route = useRoute()
const conversationId = route.params.id as string

const recorder = shallowRef<SessionRecorder | null>(null)
const owner = ref<{ type: string, id: string } | null>(null)
const loadError = ref('')

const traceOverview = computed<TraceOverviewEntry[]>(() =>
  recorder.value ? recorder.value.getTraceOverview() : []
)

onMounted(async () => {
  try {
    const res = await fetch(`${$apiPath}/traces/conversation/${conversationId}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    const traceOwner = body.owner as { type: string, id: string }
    owner.value = traceOwner
    recorder.value = SessionRecorder.fromTrace(reconstructTrace(body.results))
    const firstMessage = recorder.value.getTrace().turns[0]?.userMessage?.trim()
    const label = firstMessage ? firstMessage.slice(0, 60) : t('review')
    setBreadcrumbs([
      { text: t('storedConversations'), to: `/${traceOwner.type}/${traceOwner.id}/activity` },
      { text: label }
    ])
  } catch {
    loadError.value = t('loadError')
  }
})
</script>

<style scoped>
/* Fixed viewport height (no data-iframe-height) so each pane scrolls on its own:
   scrolling the trace stack on the left no longer drives the evaluator chat on the right. */
.trace-review { height: 100vh; }
.trace-review__pane { height: 100%; overflow-y: auto; border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.trace-review__chat { border-right: none; }
</style>
