<template>
  <div class="d-flex flex-wrap ga-2">
    <!-- Not enabled is shown explicitly: it is a real kill switch, so an admin must see at a glance
         that an autonomous agent is stopped. -->
    <v-chip
      v-if="!agent.enabled"
      size="small"
      color="warning"
      variant="tonal"
      :text="t('disabled')"
    />
    <v-chip
      v-if="agent.nhi?.clientId"
      size="small"
      variant="tonal"
      :title="agent.nhi.clientId"
      :text="t('enrolled')"
    />
    <v-chip
      v-else
      size="small"
      color="warning"
      variant="tonal"
      :text="t('notEnrolled')"
    />
  </div>
</template>

<i18n lang="yaml">
en:
  disabled: Disabled
  notEnrolled: No identity
  enrolled: Identity enrolled
fr:
  disabled: Désactivé
  notEnrolled: Pas d'identité
  enrolled: Identité enregistrée
</i18n>

<script lang="ts" setup>
// An autonomous agent's state as the org list and its page both show it.
import { useI18n } from 'vue-i18n'

defineProps<{ agent: { enabled?: boolean, nhi?: { clientId?: string } } }>()

const { t } = useI18n()
</script>
