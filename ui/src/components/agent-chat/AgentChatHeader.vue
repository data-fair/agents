<template>
  <v-card-title class="d-flex align-center py-2 px-4">
    <template v-if="tracingEnabled">
      <v-tabs
        :model-value="activeChatTab"
        density="compact"
        class="flex-grow-0"
        @update:model-value="$emit('update:activeChatTab', $event)"
      >
        <v-tab
          value="session"
          class="text-title-medium text-secondary"
        >
          {{ title || t('sessionTab') }}
        </v-tab>
        <v-tab
          value="evaluation"
          class="text-title-medium"
        >
          {{ t('evaluationTab') }}
        </v-tab>
      </v-tabs>
    </template>
    <span
      v-else
      class="text-title-medium text-truncate text-secondary"
    >
      {{ title }}
    </span>
    <v-btn
      v-if="debug"
      :icon="mdiBugOutline"
      variant="flat"
      color="success"
      density="compact"
      :title="t('debugInfo')"
      class="ml-2"
      @click="$emit('showDebug')"
    />
    <v-spacer />
  </v-card-title>
</template>

<i18n lang="yaml">
fr:
  debugInfo: Débogage
  sessionTab: Session
  evaluationTab: Évaluation
en:
  debugInfo: Debug
  sessionTab: Session
  evaluationTab: Evaluation
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { mdiBugOutline } from '@mdi/js'

defineProps<{
  debug?: boolean
  title?: string
  tracingEnabled?: boolean
  activeChatTab: 'session' | 'evaluation'
}>()

defineEmits<{
  'update:activeChatTab': [value: 'session' | 'evaluation']
  showDebug: []
}>()

const { t } = useI18n()
</script>
