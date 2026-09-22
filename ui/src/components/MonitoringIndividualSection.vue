<template>
  <v-row>
    <v-col>
      <v-card variant="outlined">
        <v-card-title class="text-title-medium">
          {{ t('userUsage') }}
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="dimension"
            :items="dimensionItems"
            :label="t('breakdown')"
            density="compact"
            hide-details
            variant="outlined"
            max-width="300"
            class="mb-4"
          />

          <v-btn-toggle
            v-model="selectedDate"
            mandatory
            density="compact"
            class="mb-4 d-flex flex-wrap"
          >
            <v-btn
              v-for="day in weekDays"
              :key="day.date"
              :value="day.date"
              size="small"
            >
              {{ day.label }}
            </v-btn>
          </v-btn-toggle>

          <monitoring-user-histogram
            v-if="usersFetch.data.value"
            :users="filteredUsers"
            :dimension="dimension || null"
          />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<i18n lang="yaml">
fr:
  userUsage: Consommation par utilisateur (7 derniers jours)
  breakdown: Répartition
  total: Total
  byModelRole: Par rôle de modèle
  byModel: Par modèle
  byProfile: Par profil utilisateur
  byTokenClass: Par classe de jetons
en:
  userUsage: Per-user usage (last 7 days)
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
import MonitoringUserHistogram from '~/components/MonitoringUserHistogram.vue'
import type { UsageDimension, UsageEntry } from '~/utils/usage-breakdown'

interface UserHistory {
  userId: string
  userName?: string
  entries: UsageEntry[]
}

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

const usersFetch = useFetch<{ users: UserHistory[] }>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}/history?scope=users&days=7${dimensionQuery.value}`
)

const weekDays = computed(() => {
  const days: { date: string, label: string }[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })
    })
  }
  return days
})

const selectedDate = ref(weekDays.value[weekDays.value.length - 1]?.date ?? '')

function formatUserLabel (userId: string, userName?: string): string {
  if (userId.startsWith('anon:')) return `anonymous (${userId.slice(5)})`
  if (userName) return `${userName} (${userId})`
  return userId
}

const filteredUsers = computed(() => {
  if (!usersFetch.data.value) return []
  return usersFetch.data.value.users
    .map(user => {
      const entry = user.entries.find(e => e.label === selectedDate.value)
      return {
        userId: user.userId,
        userLabel: formatUserLabel(user.userId, user.userName),
        cost: entry?.cost ?? 0,
        breakdown: entry?.breakdown
      }
    })
    .filter(u => u.cost > 0)
    .sort((a, b) => b.cost - a.cost)
})
</script>
