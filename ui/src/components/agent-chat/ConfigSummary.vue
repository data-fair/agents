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
      {{ t('models') }}
    </h4>
    <v-table density="compact">
      <tbody>
        <tr
          v-for="role in modelRoles"
          :key="role"
        >
          <td>{{ role }}</td>
          <td>{{ settings.models?.[role]?.model?.name || '—' }}</td>
        </tr>
      </tbody>
    </v-table>

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
  models: Modèles
  limits: Limites
  unlimited: Illimité
  perMonth: "{n} / mois"
en:
  providers: Providers
  models: Models
  limits: Limits
  unlimited: Unlimited
  perMonth: "{n} / month"
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
defineProps<{ settings: any }>()
const modelRoles = ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']
</script>
