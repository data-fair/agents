<template>
  <v-container
    v-if="!settings && loadError"
    data-iframe-height
  >
    <p class="text-error">
      {{ loadError }}
    </p>
  </v-container>
  <v-container
    v-else-if="settings"
    data-iframe-height
  >
    <h3 class="text-title-large mb-4">
      {{ t('configuration') }}
    </h3>
    <config-summary :settings="settings" />

    <h3 class="text-title-large mt-6 mb-4">
      {{ t('usage') }}
    </h3>
    <usage-card
      :account-type="accountType"
      :account-id="accountId"
    />
    <monitoring-global-section
      :account-type="accountType"
      :account-id="accountId"
    />
    <monitoring-individual-section
      :account-type="accountType"
      :account-id="accountId"
    />

    <h3 class="text-title-large mt-6 mb-4">
      {{ t('traces') }}
    </h3>
    <p
      v-if="loadError"
      class="text-error text-caption"
    >
      {{ loadError }}
    </p>
    <v-list density="compact">
      <v-list-item
        v-for="row in traces"
        :key="row.conversationId"
        :to="`/traces/${row.conversationId}/review`"
      >
        <v-list-item-title class="text-body-2">
          {{ row.preview || row.conversationId }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          {{ row.userName || row.userId || '—' }} · {{ formatDate(row.startedAt) }} · {{ t('requests', row.requestCount) }}
        </v-list-item-subtitle>
        <template #append>
          <v-btn
            :icon="mdiDelete"
            size="small"
            variant="text"
            @click.prevent="deleteTrace(row.conversationId)"
          />
        </template>
      </v-list-item>
    </v-list>
    <v-pagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      density="compact"
      @update:model-value="fetchTraces"
    />
  </v-container>
</template>

<i18n lang="yaml">
fr:
  configuration: Configuration
  usage: Consommation
  traces: Conversations enregistrées
  requests: "{n} requête | {n} requêtes"
  loadError: Erreur de chargement des traces.
en:
  configuration: Configuration
  usage: Usage
  traces: Stored conversations
  requests: "{n} request | {n} requests"
  loadError: Failed to load traces.
</i18n>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiDelete } from '@mdi/js'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import { $apiPath } from '~/context'
import ConfigSummary from '~/components/agent-chat/ConfigSummary.vue'
import UsageCard from '~/components/UsageCard.vue'
import MonitoringGlobalSection from '~/components/MonitoringGlobalSection.vue'
import MonitoringIndividualSection from '~/components/MonitoringIndividualSection.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()
const accountType = route.params.type as string
const accountId = route.params.id as string
const SIZE = 20

const settings = ref<any>(null)
const traces = ref<any[]>([])
const page = ref(1)
const pageCount = ref(1)
const loadError = ref('')

const formatDate = (iso: string) => new Date(iso).toLocaleString()

const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'
)

const fetchTraces = async () => {
  try {
    const res = await fetch(`${$apiPath}/traces/${accountType}/${accountId}?page=${page.value}&size=${SIZE}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    traces.value = body.results
    pageCount.value = Math.max(1, Math.ceil((body.count ?? 0) / SIZE))
  } catch { loadError.value = t('loadError') }
}

const deleteTrace = async (conversationId: string) => {
  try {
    const res = await fetch(`${$apiPath}/traces/${accountType}/${accountId}/${conversationId}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
  } catch { loadError.value = t('loadError'); return }
  await fetchTraces()
}

onMounted(async () => {
  if (!isAdmin.value) { router.replace(`/${accountType}/${accountId}/chat`); return }
  try {
    const sRes = await fetch(`${$apiPath}/settings/${accountType}/${accountId}`, { credentials: 'include' })
    if (!sRes.ok) { loadError.value = t('loadError'); return }
    settings.value = await sRes.json()
  } catch { loadError.value = t('loadError'); return }
  await fetchTraces()
})
</script>
