<template>
  <v-card-title class="d-flex align-center py-2 px-4">
    <span class="text-title-medium text-truncate text-secondary">
      {{ title }}
    </span>
    <v-btn
      :icon="mdiRefresh"
      variant="flat"
      density="compact"
      :title="t('reset')"
      class="ml-2"
      @click="$emit('reset')"
    />
    <v-btn
      v-if="isAdmin"
      :icon="mdiCog"
      variant="flat"
      density="compact"
      :title="t('settings')"
      class="ml-2"
      @click="$emit('showDebug')"
    />
    <v-spacer />
  </v-card-title>
</template>

<i18n lang="yaml">
fr:
  settings: Paramètres
  reset: Réinitialiser la conversation
en:
  settings: Settings
  reset: Reset conversation
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { mdiCog, mdiRefresh } from '@mdi/js'

defineProps<{
  isAdmin?: boolean
  title?: string
}>()

defineEmits<{
  showDebug: []
  reset: []
}>()

const { t } = useI18n()
</script>
