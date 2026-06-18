<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('title') }}</v-card-title>
      <v-card-text>
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
          {{ t('noOther') }}
        </p>
        <v-list density="compact">
          <v-list-item
            v-for="row in rows"
            :key="row.conversationId"
            @click="choose(row.conversationId)"
          >
            <v-list-item-title class="text-body-2">
              {{ row.preview || row.conversationId }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ row.userName || row.userId || '—' }} · {{ formatDate(row.startedAt) }} · {{ t('requests', row.requestCount) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-pagination
          v-if="pageCount > 1"
          v-model="page"
          :length="pageCount"
          density="compact"
          @update:model-value="fetchTraces"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('update:modelValue', false)">
          {{ t('cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
fr:
  title: Comparer avec une autre conversation
  noOther: Aucune autre conversation enregistrée.
  cancel: Annuler
  requests: "{n} requête | {n} requêtes"
  loadError: Erreur de chargement des traces.
en:
  title: Compare with another conversation
  noOther: No other stored conversation.
  cancel: Cancel
  requests: "{n} request | {n} requests"
  loadError: Failed to load traces.
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context'

const props = defineProps<{ modelValue: boolean, accountType: string, accountId: string, excludeId: string }>()
const emit = defineEmits<{ 'update:modelValue': [boolean], select: [string] }>()
const { t } = useI18n()
const SIZE = 20

const rows = ref<any[]>([])
const page = ref(1)
const pageCount = ref(1)
const loadError = ref('')

const formatDate = (iso: string) => new Date(iso).toLocaleString()
const base = computed(() => `${$apiPath}/traces/${props.accountType}/${props.accountId}`)

const fetchTraces = async () => {
  try {
    const res = await fetch(`${base.value}?page=${page.value}&size=${SIZE}`, { credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    const body = await res.json()
    rows.value = (body.results ?? []).filter((r: any) => r.conversationId !== props.excludeId)
    pageCount.value = Math.max(1, Math.ceil((body.count ?? 0) / SIZE))
  } catch { loadError.value = t('loadError') }
}

const choose = (conversationId: string) => {
  emit('select', conversationId)
  emit('update:modelValue', false)
}

// Fetch when the dialog opens (and refetch if it reopens later).
watch(() => props.modelValue, (open) => { if (open) { page.value = 1; fetchTraces() } }, { immediate: true })
</script>
