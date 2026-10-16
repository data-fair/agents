<template>
  <v-dialog
    :model-value="modelValue"
    max-width="960"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card :title="t('title', { agent: agent?.title ?? '' })">
      <v-card-text>
        <agent-memory-panel
          :agent="agent"
          :account-type="accountType"
          :account-id="accountId"
          :can-configure="canConfigure"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :text="t('close')"
          @click="emit('update:modelValue', false)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
en:
  title: Memory of {agent}
  close: Close
fr:
  title: Mémoire de {agent}
  close: Fermer
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import AgentMemoryPanel from '~/components/AgentMemoryPanel.vue'

// A thin dialog around the panel, for the chat: the autonomous agent's own page shows the panel inline.
defineProps<{
  modelValue: boolean
  agent: { id: string, title: string } | null
  accountType: string
  accountId: string
  canConfigure: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
</script>
