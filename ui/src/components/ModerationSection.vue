<template>
  <div>
    <v-alert
      v-if="failOpenAlert"
      type="warning"
      density="compact"
      class="mb-4"
      :text="t('failOpenWarning', { rate: failOpenRatePct })"
    />
    <p
      v-if="loadError"
      class="text-error text-caption"
    >
      {{ loadError }}
    </p>
    <v-row
      v-if="stats"
      dense
      class="mb-2"
    >
      <v-col
        v-for="card in statCards"
        :key="card.label"
        cols="6"
        md="3"
      >
        <v-card density="compact">
          <v-card-text>
            <div class="text-h6">
              {{ card.value }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ card.label }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-btn
      size="small"
      variant="tonal"
      :loading="probing"
      class="mb-2"
      @click="runProbe"
    >
      {{ t('probe') }}
    </v-btn>
    <v-list
      v-if="probeResults.length"
      density="compact"
    >
      <v-list-item
        v-for="row in probeResults"
        :key="row.key"
      >
        <template #prepend>
          <v-chip
            size="small"
            :color="row.error ? 'warning' : (row.action === 'block' ? 'error' : 'success')"
            class="mr-2"
          >
            {{ row.error ? t('probeError') : row.action }}
          </v-chip>
        </template>
        <v-list-item-title class="text-body-2">
          {{ row.message }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          {{ row.category || row.error || '—' }} · {{ Math.round(row.latencyMs) }}ms
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <h4 class="text-title-medium mt-4 mb-2">
      {{ t('recentBlocks') }}
    </h4>
    <p
      v-if="!blocks.length"
      class="text-caption text-medium-emphasis"
    >
      {{ t('noBlocks') }}
    </p>
    <v-list
      v-else
      density="compact"
    >
      <v-list-item
        v-for="(row, i) in blocks"
        :key="i"
      >
        <v-list-item-title class="text-body-2">
          {{ row.messageExcerpt || '—' }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          {{ row.category || '—' }} · {{ row.reason || '—' }} · {{ row.role }}
        </v-list-item-subtitle>
        <template #append>
          <span class="text-caption text-medium-emphasis text-no-wrap ml-2">
            {{ formatDate(row.createdAt) }}
          </span>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<i18n lang="yaml">
fr:
  checks: Vérifications (30j)
  blocks: Messages bloqués (30j)
  failOpenRate: Taux de fail-open (24h)
  avgLatency: Latence moyenne du verdict
  probe: Tester la modération
  probeError: erreur
  recentBlocks: Derniers messages bloqués
  noBlocks: Aucun message bloqué.
  failOpenWarning: "La modération a échoué en mode ouvert pour {rate}% des vérifications des dernières 24h — vérifiez le modèle modérateur."
  loadError: Erreur de chargement des données de modération.
en:
  checks: Checks (30d)
  blocks: Blocked messages (30d)
  failOpenRate: Fail-open rate (24h)
  avgLatency: Average verdict latency
  probe: Test moderation
  probeError: error
  recentBlocks: Recent blocked messages
  noBlocks: No blocked messages.
  failOpenWarning: "Moderation failed open for {rate}% of checks in the last 24h — check your moderator model."
  loadError: Failed to load moderation data.
</i18n>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context'

const props = defineProps<{ accountType: string, accountId: string }>()
const { t } = useI18n()

const stats = ref<any>(null)
const blocks = ref<any[]>([])
const probeResults = ref<any[]>([])
const probing = ref(false)
const loadError = ref('')

const formatDate = (iso: string) => new Date(iso).toLocaleString()

const failOpenRatePct = computed(() => {
  if (!stats.value || !stats.value.last24h.checks) return 0
  return Math.round((stats.value.last24h.failOpen / stats.value.last24h.checks) * 100)
})

// the "silently broken" alarm: >20% fail-open over the last 24h, min 10 checks
const failOpenAlert = computed(() => !!stats.value && stats.value.last24h.checks >= 10 && failOpenRatePct.value > 20)

const statCards = computed(() => {
  const totals = stats.value?.totals ?? {}
  const checks = (totals.allow ?? 0) + (totals.block ?? 0) + (totals['late-block'] ?? 0) +
    (totals['fail-open-timeout'] ?? 0) + (totals['fail-open-error'] ?? 0)
  return [
    { label: t('checks'), value: checks },
    { label: t('blocks'), value: (totals.block ?? 0) + (totals['late-block'] ?? 0) },
    { label: t('failOpenRate'), value: `${failOpenRatePct.value}%` },
    { label: t('avgLatency'), value: stats.value?.latency?.avg != null ? `${Math.round(stats.value.latency.avg)}ms` : '—' }
  ]
})

const base = computed(() => `${$apiPath}/moderation/${props.accountType}/${props.accountId}`)

const fetchAll = async () => {
  try {
    const [sRes, eRes] = await Promise.all([
      fetch(`${base.value}/stats`, { credentials: 'include' }),
      fetch(`${base.value}/events?action=block,late-block&size=10`, { credentials: 'include' })
    ])
    if (!sRes.ok || !eRes.ok) { loadError.value = t('loadError'); return }
    stats.value = await sRes.json()
    blocks.value = (await eRes.json()).results
  } catch { loadError.value = t('loadError') }
}

const runProbe = async () => {
  probing.value = true
  try {
    const res = await fetch(`${base.value}/probe`, { method: 'POST', credentials: 'include' })
    if (!res.ok) { loadError.value = t('loadError'); return }
    probeResults.value = (await res.json()).results
  } catch { loadError.value = t('loadError') } finally { probing.value = false }
}

onMounted(fetchAll)
</script>
