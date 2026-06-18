<template>
  <v-container data-iframe-height>
    <p class="text-medium-emphasis">
      {{ t('selectAccount') }}
    </p>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  selectAccount: Sélectionnez une organisation pour gérer la configuration de ses agents.
en:
  selectAccount: Select an organization to manage its agents configuration.
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
