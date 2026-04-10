<template>
  <v-row>
    <v-col>
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">
          {{ t('userUsage') }}
        </v-card-title>
        <v-card-text>
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
          />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<i18n lang="yaml">
fr:
  userUsage: Consommation par utilisateur (7 derniers jours)
en:
  userUsage: Per-user usage (last 7 days)
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context.ts'
import MonitoringUserHistogram from '~/components/MonitoringUserHistogram.vue'

interface UsageEntry {
  label: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

interface UserHistory {
  userId: string
  entries: UsageEntry[]
}

const props = defineProps<{
  accountType: string
  accountId: string
}>()

const { t } = useI18n()

const usersFetch = useFetch<{ users: UserHistory[] }>(
  () => `${$apiPath}/usage/${props.accountType}/${props.accountId}/history?scope=users&days=7`
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

const filteredUsers = computed(() => {
  if (!usersFetch.data.value) return []
  return usersFetch.data.value.users
    .map(user => {
      const entry = user.entries.find(e => e.label === selectedDate.value)
      return {
        userId: user.userId,
        totalTokens: entry?.totalTokens ?? 0,
        inputTokens: entry?.inputTokens ?? 0,
        outputTokens: entry?.outputTokens ?? 0
      }
    })
    .filter(u => u.totalTokens > 0)
    .sort((a, b) => b.totalTokens - a.totalTokens)
})
</script>
