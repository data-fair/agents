<!-- ui/src/components/dev/WorkflowDetail.vue -->
<template>
  <v-card
    variant="tonal"
    class="pa-3"
  >
    <div class="text-title-small mb-2">
      {{ t('created', { title: item.title }) }}
    </div>
    <div
      class="text-body-small mb-3"
      data-testid="workflow-detail"
    >
      id: {{ item.id }}
    </div>
    <v-btn @click="$emit('back')">
      Back
    </v-btn>
  </v-card>
</template>

<i18n lang="yaml">
fr:
  created: "« {title} » créé"
en:
  created: "\"{title}\" created"
</i18n>

<script lang="ts" setup>
/** What the page shows after Create — the wizard is gone, this component publishes its own state. */
import { useI18n } from 'vue-i18n'
import { useAgentState } from '@data-fair/lib-vue-agents'

const props = defineProps<{ item: { id: string, title: string } }>()
defineEmits<{ back: [] }>()
const { t } = useI18n()

useAgentState('detail', () => ({ id: props.item.id, title: props.item.title }))
</script>
