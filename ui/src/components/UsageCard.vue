<template>
  <v-card
    v-if="usageFetch.data.value"
    variant="outlined"
    class="mb-4"
  >
    <v-card-title class="text-subtitle-1">
      {{ t('title') }}
    </v-card-title>
    <v-card-text>
      <template v-if="hasUsage">
        <div
          v-if="usageFetch.data.value.daily"
          class="mb-3"
        >
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 font-weight-medium">{{ t('daily') }}</span>
            <span class="text-body-2 text-medium-emphasis">
              {{ formatTokens(usageFetch.data.value.daily.totalTokens) }} / {{ formatLimit(usageFetch.data.value.limits.dailyTokenLimit) }}
            </span>
          </div>
          <v-progress-linear
            v-if="usageFetch.data.value.limits.dailyTokenLimit"
            :model-value="percent(usageFetch.data.value.daily.totalTokens, usageFetch.data.value.limits.dailyTokenLimit)"
            :color="barColor(usageFetch.data.value.daily.totalTokens, usageFetch.data.value.limits.dailyTokenLimit)"
            height="8"
            rounded
          />
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t('resets') }} {{ formatDate(usageFetch.data.value.daily.resetsAt) }}
          </div>
        </div>

        <div v-if="usageFetch.data.value.monthly">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 font-weight-medium">{{ t('monthly') }}</span>
            <span class="text-body-2 text-medium-emphasis">
              {{ formatTokens(usageFetch.data.value.monthly.totalTokens) }} / {{ formatLimit(usageFetch.data.value.limits.monthlyTokenLimit) }}
            </span>
          </div>
          <v-progress-linear
            v-if="usageFetch.data.value.limits.monthlyTokenLimit"
            :model-value="percent(usageFetch.data.value.monthly.totalTokens, usageFetch.data.value.limits.monthlyTokenLimit)"
            :color="barColor(usageFetch.data.value.monthly.totalTokens, usageFetch.data.value.limits.monthlyTokenLimit)"
            height="8"
            rounded
          />
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t('resets') }} {{ formatDate(usageFetch.data.value.monthly.resetsAt) }}
          </div>
        </div>
      </template>
      <div
        v-else
        class="text-body-2 text-medium-emphasis"
      >
        {{ t('noUsage') }}
      </div>
    </v-card-text>
  </v-card>
</template>

<i18n lang="yaml">
fr:
  title: Utilisation
  daily: Journalier
  monthly: Mensuel
  resets: "Réinitialisation :"
  noUsage: Aucune utilisation enregistrée
  unlimited: illimité
en:
  title: Usage
  daily: Daily
  monthly: Monthly
  resets: "Resets:"
  noUsage: No usage recorded
  unlimited: unlimited
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { $apiPath } from '../context.ts'

const props = defineProps<{
  accountType: string
  accountId: string
}>()

const { t } = useI18n()

interface UsagePeriod {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  resetsAt: string
}

interface UsageData {
  daily?: UsagePeriod
  monthly?: UsagePeriod
  limits: { dailyTokenLimit: number, monthlyTokenLimit: number }
  userLimits?: { dailyTokenLimit: number, monthlyTokenLimit: number }
}

const usageFetch = useFetch<UsageData>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}`
)

const hasUsage = computed(() => {
  const d = usageFetch.data.value
  if (!d) return false
  return (d.daily && d.daily.totalTokens > 0) || (d.monthly && d.monthly.totalTokens > 0)
})

function formatTokens (n: number): string {
  return n.toLocaleString()
}

function formatLimit (limit: number): string {
  return limit ? limit.toLocaleString() : t('unlimited')
}

function percent (usage: number, limit: number): number {
  if (!limit) return 0
  return Math.min(100, (usage / limit) * 100)
}

function barColor (usage: number, limit: number): string {
  const p = percent(usage, limit)
  if (p >= 90) return 'error'
  if (p >= 70) return 'warning'
  return 'primary'
}

function formatDate (iso: string): string {
  return new Date(iso).toLocaleString()
}
</script>
