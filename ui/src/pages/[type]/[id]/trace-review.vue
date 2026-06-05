<template>
  <v-container
    fluid
    class="trace-review pa-0"
    data-iframe-height
  >
    <v-row
      no-gutters
      class="fill-height"
    >
      <v-col
        cols="12"
        md="6"
        class="trace-review__pane"
      >
        <div class="d-flex align-center ga-2 pa-2">
          <h3 class="text-title-medium">
            {{ t('trace') }}
          </h3>
          <v-spacer />
          <v-btn
            size="small"
            variant="tonal"
            :prepend-icon="mdiUpload"
            @click="fileInput?.click()"
          >
            {{ t('upload') }}
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            style="display: none"
            @change="onFile"
          >
        </div>
        <p
          v-if="loadError"
          class="text-error text-caption px-3"
        >
          {{ loadError }}
        </p>
        <div
          v-if="!recorder"
          class="text-center text-medium-emphasis pa-6"
        >
          {{ t('empty') }}
        </div>
        <trace-view
          v-else
          :key="loadCount"
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
          v-if="recorder"
          :key="loadCount"
          :recorder="recorder"
          :account-type="accountType"
          :account-id="accountId"
        />
        <div
          v-else
          class="text-center text-medium-emphasis pa-6"
        >
          {{ t('loadFirst') }}
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  trace: Trace
  upload: Charger un fichier
  empty: Chargez une trace (via le bouton ou depuis une conversation) pour l'analyser.
  loadFirst: Chargez d'abord une trace pour discuter avec l'évaluateur.
  invalid: Fichier de trace invalide.
en:
  trace: Trace
  upload: Upload file
  empty: Load a trace (via the button or from a conversation) to analyze it.
  loadFirst: Load a trace first to chat with the evaluator.
  invalid: Invalid trace file.
</i18n>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiUpload } from '@mdi/js'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import { SessionRecorder } from '~/traces/session-recorder'
import type { TraceOverviewEntry, SessionTrace } from '~/traces/session-recorder'
import { readHandoff } from '~/traces/trace-handoff'
import TraceView from '~/components/agent-chat/TraceView.vue'
import EvaluatorChat from '~/components/EvaluatorChat.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()

const accountType = route.params.type as string
const accountId = route.params.id as string

const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'
)

const recorder = shallowRef<SessionRecorder | null>(null)
const loadCount = ref(0)
const loadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const traceOverview = computed<TraceOverviewEntry[]>(() =>
  recorder.value ? recorder.value.getTraceOverview() : []
)

const isSessionTrace = (v: any): v is SessionTrace =>
  v && Array.isArray(v.turns) && Array.isArray(v.physicalRequests)

const loadTrace = (raw: SessionTrace) => {
  recorder.value = SessionRecorder.fromTrace(raw)
  loadCount.value++
  loadError.value = ''
}

onMounted(() => {
  if (!isAdmin.value) {
    router.replace(`/${accountType}/${accountId}/chat`)
    return
  }
  const handed = readHandoff()
  if (handed) loadTrace(handed)
})

const onFile = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text())
    if (!isSessionTrace(parsed)) { loadError.value = t('invalid'); return }
    loadTrace(parsed)
  } catch {
    loadError.value = t('invalid')
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<style scoped>
.trace-review {
  height: 100vh;
}
.trace-review__pane {
  height: 100vh;
  overflow-y: auto;
}
.trace-review__chat {
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
