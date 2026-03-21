<template>
  <v-card-title class="d-flex align-center py-2 px-4">
    <template v-if="tracingEnabled">
      <v-tabs
        :model-value="activeChatTab"
        density="compact"
        class="flex-grow-0"
        @update:model-value="$emit('update:activeChatTab', $event)"
      >
        <v-tab value="session">
          {{ title || t('sessionTab') }}
        </v-tab>
        <v-tab value="evaluation">
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
    <v-btn
      :icon="mdiInformationSymbol"
      variant="flat"
      :color="toolsChanged ? 'accent' : 'info'"
      density="compact"
      :title="t('agentInfo')"
      class="ml-1"
      @click="$emit('showInfo')"
    />
    <v-spacer />
  </v-card-title>
</template>

<i18n lang="yaml">
fr:
  debugInfo: Débogage
  agentInfo: Informations sur l'agent
  sessionTab: Session
  evaluationTab: Évaluation
en:
  debugInfo: Debug
  agentInfo: Agent information
  sessionTab: Session
  evaluationTab: Evaluation
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { mdiBugOutline, mdiInformationSymbol } from '@mdi/js'

defineProps<{
  debug?: boolean
  title?: string
  tracingEnabled?: boolean
  activeChatTab: 'session' | 'evaluation'
  toolsChanged: boolean
}>()

defineEmits<{
  'update:activeChatTab': [value: 'session' | 'evaluation']
  showDebug: []
  showInfo: []
}>()

const { t } = useI18n()
</script>
