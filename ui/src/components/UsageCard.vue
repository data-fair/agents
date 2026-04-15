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
              {{ formatCost(usageFetch.data.value.daily.cost) }} / {{ formatLimit(dailyLimit) }}
            </span>
          </div>
          <v-progress-linear
            v-if="!quotasGlobal?.unlimited && dailyLimit"
            :model-value="percent(usageFetch.data.value.daily.cost, dailyLimit)"
            :color="barColor(usageFetch.data.value.daily.cost, dailyLimit)"
            height="8"
            rounded
          />
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t('resets') }} {{ formatDate(usageFetch.data.value.daily.resetsAt) }}
          </div>
        </div>

        <div
          v-if="usageFetch.data.value.weekly"
          class="mb-3"
        >
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 font-weight-medium">{{ t('weekly') }}</span>
            <span class="text-body-2 text-medium-emphasis">
              {{ formatCost(usageFetch.data.value.weekly.cost) }} / {{ formatLimit(weeklyLimit) }}
            </span>
          </div>
          <v-progress-linear
            v-if="!quotasGlobal?.unlimited && weeklyLimit"
            :model-value="percent(usageFetch.data.value.weekly.cost, weeklyLimit)"
            :color="barColor(usageFetch.data.value.weekly.cost, weeklyLimit)"
            height="8"
            rounded
          />
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t('resets') }} {{ formatDate(usageFetch.data.value.weekly.resetsAt) }}
          </div>
        </div>

        <div v-if="usageFetch.data.value.monthly">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 font-weight-medium">{{ t('monthly') }}</span>
            <span class="text-body-2 text-medium-emphasis">
              {{ formatCost(usageFetch.data.value.monthly.cost) }} / {{ formatLimit(monthlyLimit) }}
            </span>
          </div>
          <v-progress-linear
            v-if="!quotasGlobal?.unlimited && monthlyLimit"
            :model-value="percent(usageFetch.data.value.monthly.cost, monthlyLimit)"
            :color="barColor(usageFetch.data.value.monthly.cost, monthlyLimit)"
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
  weekly: Hebdomadaire
  monthly: Mensuel
  resets: "Réinitialisation :"
  noUsage: Aucune utilisation enregistrée
  unlimited: illimité
en:
  title: Usage
  daily: Daily
  weekly: Weekly
  monthly: Monthly
  resets: "Resets:"
  noUsage: No usage recorded
  unlimited: unlimited
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '../context.ts'

const props = defineProps<{
  accountType: string
  accountId: string
}>()

const { t, locale } = useI18n()

interface UsagePeriod {
  cost: number
  resetsAt: string
}

interface RoleQuota {
  unlimited?: boolean
  monthlyLimit?: number
}

interface UsageData {
  daily?: UsagePeriod
  weekly?: UsagePeriod
  monthly?: UsagePeriod
  currency: string
  quotas: {
    global: RoleQuota
    [role: string]: RoleQuota
  }
}

const usageFetch = useFetch<UsageData>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}`
)

const quotasGlobal = computed(() => usageFetch.data.value?.quotas.global)
const monthlyLimit = computed(() => quotasGlobal.value?.monthlyLimit || 0)
const weeklyLimit = computed(() => monthlyLimit.value / 2)
const dailyLimit = computed(() => monthlyLimit.value / 4)

const currency = computed(() => usageFetch.data.value?.currency || 'EUR')

const hasUsage = computed(() => {
  const d = usageFetch.data.value
  if (!d) return false
  return (d.daily && d.daily.cost > 0) || (d.weekly && d.weekly.cost > 0) || (d.monthly && d.monthly.cost > 0)
})

function formatCost (amount: number): string {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: currency.value }).format(amount)
}

function formatLimit (limit: number): string {
  if (quotasGlobal.value?.unlimited) return t('unlimited')
  return limit ? formatCost(limit) : t('unlimited')
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
