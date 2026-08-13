<template>
  <v-row>
    <v-col>
      <v-card variant="outlined">
        <v-card-title class="text-title-medium">
          {{ t('monthlyUsage') }}
        </v-card-title>
        <v-card-text>
          <monitoring-account-histogram
            v-if="monthlyFetch.data.value"
            :entries="monthlyFetch.data.value.entries"
          />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row>
    <v-col>
      <v-card variant="outlined">
        <v-card-title class="text-title-medium">
          {{ t('dailyUsage') }}
        </v-card-title>
        <v-card-text>
          <monitoring-account-histogram
            v-if="dailyFetch.data.value"
            :entries="dailyFetch.data.value.entries"
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
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context.ts'
import MonitoringAccountHistogram from '~/components/MonitoringAccountHistogram.vue'

interface UsageEntry {
  label: string
  cost: number
}

const props = defineProps<{
  accountType: string
  accountId: string
}>()

const { t } = useI18n()

const monthlyFetch = useFetch<{ entries: UsageEntry[] }>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}/history?scope=account-monthly&months=12`
)

const dailyFetch = useFetch<{ entries: UsageEntry[] }>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}/history?scope=account-daily&days=30`
)
</script>
