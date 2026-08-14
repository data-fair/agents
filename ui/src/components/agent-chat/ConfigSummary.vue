<template>
  <div v-if="settings">
    <h4 class="text-title-small mb-2">
      {{ t('providers') }}
    </h4>
    <v-chip
      v-for="p in settings.providers"
      :key="p.id"
      size="small"
      class="mr-1 mb-1"
    >
      {{ p.name }} · {{ p.type }}
    </v-chip>

    <h4 class="text-title-small mt-4 mb-2">
      {{ t('assistantModel') }}
    </h4>
    <p>{{ settings.modelMapping?.assistant?.name || t('defaultModel') }}</p>

    <h4 class="text-title-small mt-4 mb-2">
      {{ t('limits') }}
    </h4>
    <v-table density="compact">
      <tbody>
        <tr
          v-for="(q, role) in settings.quotas"
          :key="role"
        >
          <td>{{ role }}</td>
          <td>{{ q.unlimited ? t('unlimited') : t('perMonth', { n: q.monthlyLimit }) }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<i18n lang="yaml">
fr:
  providers: Fournisseurs
  assistantModel: Modèle de l'assistant
  defaultModel: Modèle par défaut
  limits: Limites
  unlimited: Illimité
  perMonth: "{n} / mois"
en:
  providers: Providers
  assistantModel: Assistant model
  defaultModel: Default model
  limits: Limits
  unlimited: Unlimited
  perMonth: "{n} / month"
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
// The effective assistant model is resolved server-side: an unmapped role falls
// back to the global default, so an absent mapping is displayed as such rather
// than being resolved here.
defineProps<{ settings: any }>()
</script>
