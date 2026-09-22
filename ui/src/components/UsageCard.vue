<template>
  <v-card
    v-if="usageFetch.data.value"
    variant="outlined"
    class="mb-4"
  >
    <v-card-title class="text-title-medium">
      {{ t('title') }}
    </v-card-title>
    <v-card-text>
      <div
        v-if="credits"
        class="mb-3"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-body-medium font-weight-medium">{{ t('creditCap') }}</span>
          <span class="text-body-medium text-medium-emphasis">
            {{ formatCost(credits.consumption) }} / {{ credits.limit === -1 ? t('unlimited') : formatCost(credits.limit) }}
            <template v-if="credits.limit !== -1">{{ t('credits') }}</template>
          </span>
        </div>
      </div>

      <template v-if="hasUsage">
        <div
          v-if="usageFetch.data.value.daily"
          class="mb-3"
        >
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-medium font-weight-medium">{{ t('daily') }}</span>
            <span class="text-body-medium text-medium-emphasis">
              {{ formatCost(usageFetch.data.value.daily.cost) }} {{ t('credits') }}
            </span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t('resets') }} {{ formatDate(usageFetch.data.value.daily.resetsAt) }}
          </div>
        </div>

        <div
          v-if="usageFetch.data.value.weekly"
          class="mb-3"
        >
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-medium font-weight-medium">{{ t('weekly') }}</span>
            <span class="text-body-medium text-medium-emphasis">
              {{ formatCost(usageFetch.data.value.weekly.cost) }} {{ t('credits') }}
            </span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t('resets') }} {{ formatDate(usageFetch.data.value.weekly.resetsAt) }}
          </div>
        </div>

        <div v-if="usageFetch.data.value.monthly">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-medium font-weight-medium">{{ t('monthly') }}</span>
            <span class="text-body-medium text-medium-emphasis">
              {{ formatCost(usageFetch.data.value.monthly.cost) }} {{ t('credits') }}
            </span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t('resets') }} {{ formatDate(usageFetch.data.value.monthly.resetsAt) }}
          </div>
        </div>
      </template>
      <div
        v-else
        class="text-body-medium text-medium-emphasis"
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
  credits: crédits
  creditCap: Crédits consommés
  unlimited: illimité
en:
  title: Usage
  daily: Daily
  weekly: Weekly
  monthly: Monthly
  resets: "Resets:"
  noUsage: No usage recorded
  credits: credits
  creditCap: Credits consumed
  unlimited: unlimited
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '../context.ts'
import { formatCredits } from '~/utils/credits'

const props = defineProps<{
  accountType: string
  accountId: string
}>()

const { t, locale } = useI18n()

interface UsagePeriod {
  cost: number
  resetsAt: string
}

interface UsageData {
  daily?: UsagePeriod
  weekly?: UsagePeriod
  monthly?: UsagePeriod
  credits?: { limit: number, consumption: number }
}

const usageFetch = useFetch<UsageData>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}`
)

/**
 * The org-wide credit allowance pushed by the customers service, and the
 * counter recordUsage increments. Read from the usage endpoint rather than
 * from GET /api/v1/limits: this card already fetches the former (one request
 * instead of two), both are admin-readable here, and the usage endpoint serves
 * the two figures from the same read so they cannot disagree.
 */
const credits = computed(() => usageFetch.data.value?.credits)

const hasUsage = computed(() => {
  const d = usageFetch.data.value
  if (!d) return false
  return (d.daily && d.daily.cost > 0) || (d.weekly && d.weekly.cost > 0) || (d.monthly && d.monthly.cost > 0)
})

function formatCost (amount: number): string {
  return formatCredits(locale.value, amount)
}

function formatDate (iso: string): string {
  return new Date(iso).toLocaleString()
}
</script>
