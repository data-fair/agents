<template>
  <div>
    <v-alert
      v-if="credits"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      <template v-if="credits.limit === -1">
        {{ t('globalUnlimited') }}
      </template>
      <template v-else>
        {{ t('globalLimit', { limit: formatNumber(credits.limit) }) }}
      </template>
      {{ t('globalHint') }}
    </v-alert>
    <v-table density="comfortable">
      <thead>
        <tr>
          <th>{{ t('profile') }}</th>
          <th>{{ t('unlimited') }}</th>
          <th style="min-width: 220px;">
            {{ t('monthlyLimit') }}
          </th>
          <th class="text-right">
            {{ t('weekly') }}
          </th>
          <th class="text-right">
            {{ t('daily') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="role in roles"
          :key="role"
        >
          <td>
            <div class="font-weight-medium">
              {{ t(`roles.${role}`) }}
            </div>
            <div
              v-if="role === 'untrusted'"
              class="text-caption text-medium-emphasis"
            >
              {{ t('untrustedHint') }}
            </div>
          </td>
          <td>
            <v-checkbox-btn
              :model-value="quota(role).unlimited"
              :aria-label="`${t(`roles.${role}`)} - ${t('unlimited')}`"
              color="primary"
              @update:model-value="(unlimited: boolean) => update(role, { unlimited })"
            />
          </td>
          <td>
            <v-text-field
              v-if="!quota(role).unlimited"
              :model-value="quota(role).monthlyLimit"
              :aria-label="`${t(`roles.${role}`)} - ${t('monthlyLimit')}`"
              :suffix="limitSuffix"
              :rules="[nonNegative]"
              type="number"
              min="0"
              density="compact"
              variant="outlined"
              hide-details="auto"
              class="my-1"
              @update:model-value="(value: string) => update(role, { monthlyLimit: value === '' ? 0 : Number(value) })"
            />
            <span
              v-else
              class="text-medium-emphasis"
            >{{ t('unlimitedValue') }}</span>
          </td>
          <td class="text-right text-medium-emphasis">
            {{ derived(role, 2) }}
          </td>
          <td class="text-right text-medium-emphasis">
            {{ derived(role, 4) }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <p class="text-caption text-medium-emphasis mt-2">
      {{ t('footnote') }}
    </p>
  </div>
</template>

<i18n lang="yaml">
fr:
  profile: Profil d'utilisateur
  unlimited: Illimité
  unlimitedValue: illimité
  monthlyLimit: Limite mensuelle (crédits IA)
  weekly: Hebdomadaire
  daily: Journalière
  globalLimit: "Limite globale du compte : {limit} crédits IA."
  globalUnlimited: "Limite globale du compte : illimitée."
  globalHint: Les quotas ci-dessous répartissent cette enveloppe entre profils d'utilisateur, ils ne peuvent pas la dépasser.
  untrustedHint: Plafond cumulé des utilisateurs anonymes et externes, 0 = pas de plafond
  footnote: Limites par utilisateur exprimées en crédits IA, 0 = aucun accès. Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4.
  mustBePositive: Doit être positif ou nul
  roles:
    admin: Administrateurs
    contrib: Contributeurs
    user: Utilisateurs simples
    external: Utilisateurs externes
    anonymous: Utilisateurs anonymes
    untrusted: Réserve anonymes + externes
en:
  profile: User profile
  unlimited: Unlimited
  unlimitedValue: unlimited
  monthlyLimit: Monthly limit (AI credits)
  weekly: Weekly
  daily: Daily
  globalLimit: "Account global limit: {limit} AI credits."
  globalUnlimited: "Account global limit: unlimited."
  globalHint: The quotas below split this allowance between user profiles, they cannot exceed it.
  untrustedHint: Combined cap for anonymous and external users, 0 = no cap
  footnote: Per-user limits expressed in AI credits, 0 = no access. Weekly limit = monthly / 2, daily limit = monthly / 4.
  mustBePositive: Must be positive or zero
  roles:
    admin: Admins
    contrib: Contributors
    user: Simple users
    external: External users
    anonymous: Anonymous users
    untrusted: Anonymous + external pool
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import type { Settings } from '#api/types'
import { $apiPath } from '~/context'

type Quotas = NonNullable<Settings['quotas']>
type RoleQuota = Quotas['admin']
type QuotaRole = 'admin' | 'contrib' | 'user' | 'external' | 'anonymous' | 'untrusted'

const props = defineProps<{
  modelValue: Quotas | undefined
  accountType: string
  accountId: string
}>()
const emit = defineEmits<{ 'update:modelValue': [Quotas] }>()

const { t, locale } = useI18n()

// contributors and simple users only exist in an organization
const roles = computed<QuotaRole[]>(() => props.accountType === 'organization'
  ? ['admin', 'contrib', 'user', 'external', 'anonymous', 'untrusted']
  : ['admin', 'external', 'anonymous', 'untrusted'])

const emptyQuota: RoleQuota = { unlimited: false, monthlyLimit: 0 }
const quota = (role: QuotaRole): RoleQuota => (props.modelValue?.[role] as RoleQuota | undefined) ?? emptyQuota

// always emit a new object: the parent keeps the exact emitted value as its slice.
// The roles hidden for a personal account are kept as they are.
const update = (role: QuotaRole, patch: Partial<RoleQuota>) => {
  const required: QuotaRole[] = ['admin', 'contrib', 'user', 'external', 'anonymous']
  const base = Object.fromEntries(required.map(r => [r, quota(r)]))
  emit('update:modelValue', { ...base, ...props.modelValue, [role]: { ...quota(role), ...patch } } as Quotas)
}

const nonNegative = (value: any) => value === '' || Number(value) >= 0 || t('mustBePositive')

/**
 * The account-wide credit allowance (pushed by the customers service): every
 * per-profile quota is a share of it, so it is shown next to each limit.
 */
const usageFetch = useFetch<{ credits?: { limit: number, consumption: number } }>(() => `${$apiPath}/usage/${props.accountType}/${props.accountId}`)
const credits = computed(() => usageFetch.data.value?.credits)

const formatNumber = (value: number) => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value)

const limitSuffix = computed(() => {
  if (!credits.value || credits.value.limit === -1) return undefined
  return `/ ${formatNumber(credits.value.limit)}`
})

const derived = (role: QuotaRole, divider: number) => {
  const q = quota(role)
  if (q.unlimited) return t('unlimitedValue')
  if (!q.monthlyLimit) return '-'
  return formatNumber(q.monthlyLimit / divider)
}
</script>
