<template>
  <v-dialog
    :model-value="modelValue"
    fullscreen
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card
      class="d-flex flex-column"
      flat
    >
      <v-btn
        :icon="mdiClose"
        variant="text"
        size="small"
        :title="t('close')"
        class="position-absolute"
        style="top: 8px; left: 8px; z-index: 1"
        @click="$emit('update:modelValue', false)"
      />
      <v-card-text class="d-flex align-center justify-center flex-grow-1">
        <div style="max-width: 500px; width: 100%">
          <div
            v-if="loading"
            class="d-flex justify-center py-4"
          >
            <v-progress-circular
              indeterminate
              size="24"
              width="2"
            />
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            v-else
            class="text-body-2 markdown-content"
            v-html="renderMarkdown(summary || t('noSummary'))"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
fr:
  close: Fermer
  noSummary: Aucune information disponible.
en:
  close: Close
  noSummary: No information available.
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { mdiClose } from '@mdi/js'
import { renderMarkdown } from '~/utils/markdown'

defineProps<{
  modelValue: boolean
  summary: string
  loading: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
</script>

<style scoped>
.markdown-content :deep(.markdown-paragraph:not(:last-child)) {
  margin-bottom: 16px;
}

.markdown-content :deep(pre) {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.75rem;
  overflow-x: auto;
  margin: 8px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.markdown-content :deep(code) {
  font-size: 0.85em;
}

.markdown-content :deep(p code) {
  background: rgb(var(--v-theme-surface-variant));
  padding: 2px 4px;
  border-radius: 3px;
}
</style>
