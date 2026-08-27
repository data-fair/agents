<template>
  <v-sheet
    :elevation="elevated ? 3 : 0"
    class="agent-chat-header d-flex align-center py-2 px-4"
  >
    <v-icon
      :icon="mdiRobotOutline"
      size="small"
      class="mr-2 text-secondary flex-shrink-0"
    />
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
      :icon="mdiCog"
      variant="flat"
      density="compact"
      :title="t('settings')"
      class="ml-2"
      @click="$emit('showDebug')"
    />
    <v-spacer />
  </v-sheet>
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
import { mdiCog, mdiRefresh, mdiRobotOutline } from '@mdi/js'

defineProps<{
  isAdmin?: boolean
  title?: string
  // Raised (box-shadow) when the transcript is scrolled under the header, mirroring
  // v-app-bar's scroll-behavior="elevate". Driven by the messages container's scroll.
  elevated?: boolean
}>()

defineEmits<{
  showDebug: []
  reset: []
}>()

const { t } = useI18n()
</script>

<style scoped>
/* Sit above the transcript so the scroll-triggered shadow is cast over it, and
   ease the elevation in/out like a native app bar. */
.agent-chat-header {
  position: relative;
  z-index: 1;
  transition: box-shadow 0.2s ease;
}
</style>
