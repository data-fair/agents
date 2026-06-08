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

        <!-- Stored conversations list -->
        <div
          v-if="stored.length"
          class="px-2 pb-2"
        >
          <div class="text-caption text-medium-emphasis mb-1 px-1">
            {{ t('storedConversations') }}
          </div>
          <v-list
            density="compact"
            class="stored-list pa-0"
          >
            <v-list-item
              v-for="row in stored"
              :key="row.conversationId"
              class="stored-list__item"
              @click="loadStored(row.conversationId)"
            >
              <v-list-item-title class="text-body-2">
                {{ row.preview || row.conversationId }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ row.userName || row.userId || '—' }} · {{ formatDate(row.startedAt) }} · {{ t('requests', row.requestCount) }}
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="error"
                  :title="t('delete')"
                  @click.stop="deleteStored(row.conversationId)"
                >
                  <v-icon :icon="mdiDelete" />
                </v-btn>
                <v-btn
                  v-if="row.userId"
                  icon
                  size="x-small"
                  variant="text"
                  color="warning"
                  :title="t('eraseUser')"
                  @click.stop="eraseUser(row.userId)"
                >
                  <v-icon :icon="mdiAccountRemove" />
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </div>

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
  storedConversations: Conversations stockées
  requests: "{n} requête | {n} requêtes"
  delete: Supprimer
  storedError: Impossible de charger les traces enregistrées.
  eraseUser: Effacer toutes les traces de cet utilisateur
  confirmEraseUser: Êtes-vous sûr de vouloir effacer toutes les traces de cet utilisateur ? Cette action est irréversible.
en:
  trace: Trace
  upload: Upload file
  empty: Load a trace (via the button or from a conversation) to analyze it.
  loadFirst: Load a trace first to chat with the evaluator.
  invalid: Invalid trace file.
  storedConversations: Stored conversations
  requests: "{n} request | {n} requests"
  delete: Delete
  storedError: Could not load stored traces.
  eraseUser: Erase all from this user
  confirmEraseUser: Are you sure you want to erase all traces from this user? This action cannot be undone.
</i18n>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiUpload, mdiDelete, mdiAccountRemove } from '@mdi/js'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import { SessionRecorder } from '~/traces/session-recorder'
import type { TraceOverviewEntry, SessionTrace } from '~/traces/session-recorder'
import { readHandoff } from '~/traces/trace-handoff'
import { reconstructTrace } from '~/traces/reconstruct-trace'
import { $apiPath } from '~/context'
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

interface StoredConversation {
  conversationId: string
  preview: string
  userName?: string
  userId?: string
  startedAt: string
  requestCount: number
}

const stored = ref<StoredConversation[]>([])

const traceOverview = computed<TraceOverviewEntry[]>(() =>
  recorder.value ? recorder.value.getTraceOverview() : []
)

const isSessionTrace = (v: any): v is SessionTrace =>
  v && Array.isArray(v.turns) && Array.isArray(v.physicalRequests) &&
  Array.isArray(v.toolChanges) && Array.isArray(v.toolSnapshots)

const loadTrace = (raw: SessionTrace) => {
  recorder.value = SessionRecorder.fromTrace(raw)
  loadCount.value++
  loadError.value = ''
}

const formatDate = (iso: string) => new Date(iso).toLocaleString()

const fetchStored = async () => {
  try {
    const res = await fetch(`${$apiPath}/traces/${accountType}/${accountId}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('storedError'); return }
    stored.value = (await res.json()).results
    loadError.value = ''
  } catch {
    loadError.value = t('storedError')
  }
}

const loadStored = async (conversationId: string) => {
  try {
    const res = await fetch(`${$apiPath}/traces/${accountType}/${accountId}/${conversationId}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('storedError'); return }
    const requests = (await res.json()).results
    recorder.value = SessionRecorder.fromTrace(reconstructTrace(requests))
    loadCount.value++
    loadError.value = ''
  } catch {
    loadError.value = t('storedError')
  }
}

const deleteStored = async (conversationId: string) => {
  // A trace currently viewed in `recorder` stays loaded after its conversation is deleted — intentional,
  // so the admin can still read what they were looking at.
  try {
    const res = await fetch(`${$apiPath}/traces/${accountType}/${accountId}/${conversationId}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) { loadError.value = t('storedError'); return }
    await fetchStored()
  } catch {
    loadError.value = t('storedError')
  }
}

const eraseUser = async (userId: string) => {
  if (!window.confirm(t('confirmEraseUser'))) return
  try {
    const res = await fetch(`${$apiPath}/traces/${accountType}/${accountId}?userId=${encodeURIComponent(userId)}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) { loadError.value = t('storedError'); return }
    await fetchStored()
  } catch {
    loadError.value = t('storedError')
  }
}

onMounted(() => {
  if (!isAdmin.value) {
    router.replace(`/${accountType}/${accountId}/chat`)
    return
  }
  const handed = readHandoff()
  if (handed) loadTrace(handed)
  fetchStored()
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
.trace-review__pane :deep(.v-expansion-panel__shadow) {
  display: none;
}
.stored-list {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
.stored-list__item {
  cursor: pointer;
}
</style>
