<template>
  <div>
    <p
      v-if="loadError"
      class="text-error text-caption"
    >
      {{ loadError }}
    </p>
    <p
      v-else-if="!traces.length"
      class="text-caption text-medium-emphasis"
    >
      {{ t('noTraces') }}
    </p>
    <v-list density="compact">
      <v-list-item
        v-for="row in traces"
        :key="row.conversationId"
        :to="`${base}/traces/${row.conversationId}`"
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
  </div>
</template>

<i18n lang="yaml">
fr:
  requests: "{n} requête | {n} requêtes"
  noTraces: Aucune conversation enregistrée.
  loadError: Erreur de chargement des traces.
en:
  requests: "{n} request | {n} requests"
  noTraces: No stored conversation.
  loadError: Failed to load traces.
</i18n>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiDelete } from '@mdi/js'
import { $apiPath } from '~/context'

const props = defineProps<{ accountType: string, accountId: string, base: string }>()
const { t } = useI18n()
const SIZE = 20

const traces = ref<any[]>([])
const page = ref(1)
const pageCount = ref(1)
const loadError = ref('')

const formatDate = (iso: string) => new Date(iso).toLocaleString()

const apiBase = computed(() => `${$apiPath}/traces/${props.accountType}/${props.accountId}`)

const fetchTraces = async () => {
  try {
    const res = await fetch(`${apiBase.value}?page=${page.value}&size=${SIZE}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    traces.value = body.results
    pageCount.value = Math.max(1, Math.ceil((body.count ?? 0) / SIZE))
  } catch { loadError.value = t('loadError') }
}

const deleteTrace = async (conversationId: string) => {
  try {
    const res = await fetch(`${apiBase.value}/${conversationId}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
  } catch { loadError.value = t('loadError'); return }
  await fetchTraces()
}

onMounted(fetchTraces)
</script>
