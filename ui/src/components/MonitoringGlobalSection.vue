<template>
  <v-row>
    <v-col>
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">
          {{ t('monthlyUsage') }}
        </v-card-title>
        <v-card-text>
          <monitoring-account-histogram
            v-if="monthlyFetch.data.value"
            :entries="monthlyFetch.data.value.entries"
            :monthly-limit="monthlyLimit"
            :currency="currency"
          />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row>
    <v-col>
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">
          {{ t('dailyUsage') }}
        </v-card-title>
        <v-card-text>
          <monitoring-account-histogram
            v-if="dailyFetch.data.value"
            :entries="dailyFetch.data.value.entries"
            :daily-limit="dailyLimit"
            :currency="currency"
          />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<i18n lang="yaml">
fr:
  monthlyUsage: Consommation mensuelle (12 mois)
  dailyUsage: Consommation journalière (30 jours)
en:
  monthlyUsage: Monthly usage (12 months)
  dailyUsage: Daily usage (30 days)
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context.ts'
import MonitoringAccountHistogram from '~/components/MonitoringAccountHistogram.vue'

interface UsageEntry {
  label: string
  cost: number
}

interface UsageData {
  currency: string
  quotas: {
    global: { unlimited?: boolean, monthlyLimit: number }
  }
}

const props = defineProps<{
  accountType: string
  accountId: string
}>()

const { t } = useI18n()

const usageFetch = useFetch<UsageData>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}`
)

const monthlyFetch = useFetch<{ entries: UsageEntry[] }>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}/history?scope=account-monthly&months=12`
)

const dailyFetch = useFetch<{ entries: UsageEntry[] }>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}/history?scope=account-daily&days=30`
)

const currency = computed(() => usageFetch.data.value?.currency || 'EUR')

const monthlyLimit = computed(() => {
  const q = usageFetch.data.value?.quotas?.global
  if (!q || q.unlimited) return undefined
  return q.monthlyLimit || undefined
})

const dailyLimit = computed(() => {
  const m = monthlyLimit.value
  return m ? m / 4 : undefined
})
</script>
