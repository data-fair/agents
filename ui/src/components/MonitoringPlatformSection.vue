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
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-select
        v-model="ownerFilter"
        :items="ownerItems"
        :label="t('owner')"
        :placeholder="t('allOwners')"
        clearable
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
            :dimension="dimension"
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
            :dimension="dimension"
          />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<i18n lang="yaml">
fr:
  monthlyUsage: Consommation mensuelle de la plateforme (12 mois)
  dailyUsage: Consommation journalière de la plateforme (30 jours)
  breakdown: Répartition
  owner: Compte
  allOwners: Tous les comptes
  byOwner: Par compte
  byModelRole: Par rôle de modèle
  byModel: Par modèle
  byProfile: Par profil utilisateur
  byTokenClass: Par classe de jetons
en:
  monthlyUsage: Platform monthly usage (12 months)
  dailyUsage: Platform daily usage (30 days)
  breakdown: Breakdown
  owner: Account
  allOwners: All accounts
  byOwner: By account
  byModelRole: By model role
  byModel: By model
  byProfile: By user profile
  byTokenClass: By token class
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context.ts'
import MonitoringAccountHistogram from '~/components/MonitoringAccountHistogram.vue'
import type { UsageDimension, UsageEntry } from '~/utils/usage-breakdown'

interface PlatformHistory {
  entries: UsageEntry[]
  owners: { type: string, id: string }[]
}

const { t } = useI18n()

// Owner is the top level: the platform chart stacks accounts by default, and
// picking one account drills down into the same dimensions as the account page.
const dimension = ref<UsageDimension>('owner')
const ownerFilter = ref<string | null>(null)

const dimensionItems = computed(() => [
  { title: t('byOwner'), value: 'owner' },
  { title: t('byModelRole'), value: 'modelRole' },
  { title: t('byModel'), value: 'model' },
  { title: t('byProfile'), value: 'profile' },
  { title: t('byTokenClass'), value: 'tokenType' }
])

watch(ownerFilter, (value) => {
  if (value && dimension.value === 'owner') dimension.value = 'modelRole'
})

const query = computed(() => {
  const parts = [`dimension=${dimension.value}`]
  if (ownerFilter.value) {
    const separator = ownerFilter.value.indexOf('/')
    parts.push(`ownerType=${ownerFilter.value.slice(0, separator)}`, `ownerId=${ownerFilter.value.slice(separator + 1)}`)
  }
  return parts.join('&')
})

const monthlyFetch = useFetch<PlatformHistory>(
  () => `${$apiPath}/usage/history?scope=platform-monthly&months=12&${query.value}`
)

const dailyFetch = useFetch<PlatformHistory>(
  () => `${$apiPath}/usage/history?scope=platform-daily&days=30&${query.value}`
)

const ownerItems = computed(() => {
  const owners = new Map<string, { type: string, id: string }>()
  for (const history of [monthlyFetch.data.value, dailyFetch.data.value]) {
    for (const owner of history?.owners ?? []) owners.set(`${owner.type}/${owner.id}`, owner)
  }
  return Array.from(owners.entries()).map(([value, owner]) => ({ title: owner.id, value }))
})
</script>
