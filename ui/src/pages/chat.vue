<template>
  <v-container
    class="chat-container"
    fluid
  >
    <v-row class="fill-height">
      <v-col
        cols="12"
        class="d-flex flex-column chat-col"
      >
        <div class="chat-header mb-4 d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h5">
              {{ t('title') }}
            </h1>
            <p class="text-body-2 text-medium-emphasis">
              {{ t('subtitle') }}
            </p>
          </div>
          <div class="d-flex align-center ga-2">
            <v-switch
              v-model="traceEnabledLocal"
              :label="t('trace')"
              density="compact"
              hide-details
              color="primary"
            />
            <v-btn
              v-if="currentTraceId"
              icon="mdi-chart-timeline-variant"
              variant="text"
              color="primary"
              :title="t('viewTrace')"
              @click="fetchAndShowTrace"
            />
          </div>
        </div>

        <AgentChat
          :trace-enabled="traceEnabled"
          @trace-id="currentTraceId = $event"
        />

        <v-dialog
          v-model="showTraceDialog"
          max-width="800"
          scrollable
        >
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              {{ t('traceViewer') }}
              <v-btn
                icon="mdi-close"
                variant="text"
                size="small"
                @click="showTraceDialog = false"
              />
            </v-card-title>
            <v-card-text>
              <v-timeline
                v-if="traceEvents.length"
                density="compact"
                side="end"
              >
                <v-timeline-item
                  v-for="event in traceEvents"
                  :key="event._id"
                  :dot-color="event.eventType === 'onFinish' ? 'success' : event.eventType === 'onToolCallFinish' ? 'warning' : 'primary'"
                  size="small"
                >
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-caption font-weight-medium">{{ event.eventType }}</span>
                    <span class="text-caption text-medium-emphasis">{{ new Date(event.timestamp).toLocaleTimeString() }}</span>
                  </div>
                  <div class="text-body-2 mt-1">
                    <pre class="trace-data">{{ JSON.stringify(event.data, null, 2) }}</pre>
                  </div>
                </v-timeline-item>
              </v-timeline>
              <div
                v-else
                class="text-center text-medium-emphasis"
              >
                {{ t('noTraceEvents') }}
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                variant="text"
                @click="showTraceDialog = false"
              >
                {{ t('close') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Assistant
  subtitle: Discutez avec l'agent IA
  trace: Traçage
  viewTrace: Voir le suivi
  traceViewer: Suivi d'exécution
  close: Fermer
  noTraceEvents: Aucun événement de trace
en:
  title: Assistant
  subtitle: Chat with the AI agent
  trace: Tracing
  viewTrace: View trace
  traceViewer: Execution Trace
  close: Close
  noTraceEvents: No trace events
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AgentChat from '~/components/AgentChat.vue'

interface TraceEvent {
  _id: string
  traceId: string
  userId: string
  eventType: string
  timestamp: string
  data: any
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const traceEnabled = computed(() => route.query.trace === 'true')
const currentTraceId = ref<string | null>(null)
const showTraceDialog = ref(false)
const traceEvents = ref<TraceEvent[]>([])

const traceEnabledLocal = computed({
  get: () => traceEnabled.value,
  set: (value: boolean) => {
    router.replace({
      query: { ...route.query, trace: value ? 'true' : undefined }
    })
  }
})

const fetchAndShowTrace = async () => {
  if (!currentTraceId.value) return
  try {
    const res = await fetch(`${$apiPath}/traces/${currentTraceId.value}`, {
      credentials: 'include'
    })
    const data = await res.json()
    traceEvents.value = data.results
    showTraceDialog.value = true
  } catch (error) {
    console.error('Failed to fetch trace:', error)
  }
}
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 100px);
  max-width: 900px;
  margin: 0 auto;
}

.chat-col {
  height: 100%;
}

.trace-data {
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 200px;
  margin: 0;
}
</style>
