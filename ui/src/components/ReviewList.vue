<template>
  <div>
    <p
      v-if="loadError"
      class="text-error text-caption"
    >
      {{ loadError }}
    </p>
    <p
      v-else-if="!rows.length"
      class="text-caption text-medium-emphasis"
    >
      {{ t('noConversations') }}
    </p>
    <v-list density="compact">
      <v-list-item
        v-for="row in rows"
        :key="row.conversationId"
        :to="`${base}/review/${row.conversationId}`"
        data-testid="review-row"
      >
        <v-list-item-title class="text-body-2">
          {{ row.preview || row.conversationId }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          {{ rowLine(row) }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <v-pagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      density="compact"
      @update:model-value="fetchRows"
    />
  </div>
</template>

<i18n lang="yaml">
fr:
  noConversations: Aucune conversation enregistrée.
  loadError: Erreur de chargement des conversations.
en:
  noConversations: No stored conversation.
  loadError: Failed to load conversations.
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleDayjs } from '@data-fair/lib-vue/locale-dayjs.js'
import { $apiPath } from '~/context'

// `agentId`: one agent's conversations only, on that agent's page (where naming the agent on each row is noise).
const props = defineProps<{ accountType: string, accountId: string, base: string, agentId?: string }>()
const { t } = useI18n()
const { dayjs } = useLocaleDayjs()
const SIZE = 20

const rows = ref<any[]>([])
const page = ref(1)
const pageCount = ref(1)
const loadError = ref('')

const formatDate = (iso: string) => dayjs(iso).format('lll')
const rowLine = (row: any) => [row.userName || row.userId || '—', formatDate(row.lastMessageAt || row.startedAt), ...(props.agentId ? [] : [row.agentTitle ?? row.agentId])].join(' · ')

const apiBase = computed(() => `${$apiPath}/review/${props.accountType}/${props.accountId}`)

const fetchRows = async () => {
  try {
    const query = new URLSearchParams({ page: String(page.value), size: String(SIZE), ...(props.agentId ? { agentId: props.agentId } : {}) })
    const res = await fetch(`${apiBase.value}?${query}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    rows.value = body.results
    pageCount.value = Math.max(1, Math.ceil((body.count ?? 0) / SIZE))
  } catch { loadError.value = t('loadError') }
}

// Refetch on mount and whenever the account changes (the section is reused
// across org switches in the admin settings view), resetting pagination.
watch([apiBase, () => props.agentId], () => { page.value = 1; fetchRows() }, { immediate: true })
</script>
