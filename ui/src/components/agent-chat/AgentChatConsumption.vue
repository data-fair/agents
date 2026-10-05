<template>
  <div class="pa-3">
    <div
      class="d-flex justify-space-between text-body-medium mb-4"
      data-testid="consumption-conversation"
    >
      <span class="font-weight-medium">{{ t('conversation') }}</span>
      <span>{{ formatCredits(locale, conversationCost) }} {{ t('credits') }}</span>
    </div>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      :text="t('loadError')"
    />
    <v-progress-linear
      v-else-if="!usage"
      indeterminate
    />
    <template v-else>
      <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
        {{ t('yourQuota') }}
        <span v-if="usage.quota.unlimited"> — {{ t('unlimited') }}</span>
      </div>
      <div
        v-for="period in periods"
        :key="period"
        class="mb-3"
        :data-testid="`consumption-${period}`"
      >
        <div class="d-flex justify-space-between text-body-medium">
          <span>{{ t(period) }}</span>
          <span>
            {{ formatCredits(locale, usage.quota[period].used) }}
            <template v-if="usage.quota[period].limit !== undefined"> / {{ formatCredits(locale, usage.quota[period].limit!) }}</template>
            {{ t('credits') }}
          </span>
        </div>
        <v-progress-linear
          v-if="usage.quota[period].limit"
          :model-value="Math.min(100, 100 * usage.quota[period].used / usage.quota[period].limit!)"
          :color="barColor(usage.quota[period].used / usage.quota[period].limit!)"
          rounded
          class="my-1"
        />
        <div class="text-caption text-medium-emphasis">
          {{ t('resets', { date: formatDate(usage.quota[period].resetsAt) }) }}
        </div>
      </div>

      <v-alert
        v-if="usage.account.status === 'exhausted'"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-2"
        :text="t('accountExhausted', { date: formatDate(usage.account.resetsAt!) })"
      />
      <div
        v-if="usage.account.limit !== undefined"
        class="d-flex justify-space-between text-body-medium mt-2"
      >
        <span>{{ t('account') }}</span>
        <span>{{ formatCredits(locale, usage.account.used!) }} / {{ formatCredits(locale, usage.account.limit) }} {{ t('credits') }}</span>
      </div>
    </template>
  </div>
</template>

<i18n lang="yaml">
fr:
  conversation: Cette conversation
  credits: crédits
  yourQuota: Votre quota
  unlimited: illimité
  daily: Aujourd'hui
  weekly: Cette semaine
  monthly: Ce mois-ci
  resets: "Réinitialisation le {date}"
  account: Budget du compte
  accountExhausted: "Le budget IA de ce compte est épuisé jusqu'au {date}."
  loadError: Impossible de charger votre consommation.
en:
  conversation: This conversation
  credits: credits
  yourQuota: Your quota
  unlimited: unlimited
  daily: Today
  weekly: This week
  monthly: This month
  resets: "Resets on {date}"
  account: Account budget
  accountExhausted: "This account's AI budget is exhausted until {date}."
  loadError: Could not load your consumption.
</i18n>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCredits } from '~/utils/credits'
import type { SelfUsage } from '../../../../api/src/usage/operations'

const props = defineProps<{
  conversationCost: number
  usageVersion: number
  fetchSelfUsage: () => Promise<SelfUsage>
  // fetch only while visible: the dialog stays mounted when closed
  active: boolean
}>()

const { t, locale } = useI18n()
const periods = ['daily', 'weekly', 'monthly'] as const
const usage = ref<SelfUsage | null>(null)
const error = ref(false)

const load = async () => {
  try {
    usage.value = await props.fetchSelfUsage()
    error.value = false
  } catch {
    error.value = true
  }
}
watch(() => [props.active, props.usageVersion], () => { if (props.active) load() }, { immediate: true })

const barColor = (ratio: number) => ratio >= 1 ? 'error' : ratio >= 0.8 ? 'warning' : 'primary'
const formatDate = (iso: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
</script>
