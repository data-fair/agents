<template>
  <v-row class="mb-2">
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-select
        v-model="dimension"
        :items="dimensionItems"
        :label="t('breakdown')"
        density="compact"
        hide-details
        variant="outlined"
      />
    </v-col>
  </v-row>

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
            :dimension="dimension || null"
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
            :dimension="dimension || null"
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
  breakdown: Répartition
  total: Total
  byModelRole: Par rôle de modèle
  byModel: Par modèle
  byProfile: Par profil utilisateur
  byTokenClass: Par classe de jetons
en:
  monthlyUsage: Monthly usage (12 months)
  dailyUsage: Daily usage (30 days)
  breakdown: Breakdown
  total: Total
  byModelRole: By model role
  byModel: By model
  byProfile: By user profile
  byTokenClass: By token class
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context.ts'
import MonitoringAccountHistogram from '~/components/MonitoringAccountHistogram.vue'
import type { UsageDimension, UsageEntry } from '~/utils/usage-breakdown'

const props = defineProps<{
  accountType: string
  accountId: string
}>()

const { t } = useI18n()

const dimension = ref<UsageDimension | ''>('')

const dimensionItems = computed(() => [
  { title: t('total'), value: '' },
  { title: t('byModelRole'), value: 'modelRole' },
  { title: t('byModel'), value: 'model' },
  { title: t('byProfile'), value: 'profile' },
  { title: t('byTokenClass'), value: 'tokenType' }
])

const dimensionQuery = computed(() => dimension.value ? `&dimension=${dimension.value}` : '')

const monthlyFetch = useFetch<{ entries: UsageEntry[] }>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}/history?scope=account-monthly&months=12${dimensionQuery.value}`
)

const dailyFetch = useFetch<{ entries: UsageEntry[] }>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}/history?scope=account-daily&days=30${dimensionQuery.value}`
)
</script>
