<template>
  <v-card
    variant="tonal"
    class="pa-3"
  >
    <div class="text-title-small mb-2">
      {{ t('panelTitle') }}
    </div>
    <v-textarea
      v-model="display"
      :label="t('displayLabel')"
      rows="3"
      variant="outlined"
      readonly
    />
  </v-card>
</template>

<i18n lang="yaml">
fr:
  panelTitle: Panneau
  displayLabel: Affichage
  displayed: "Affiché par set_display"
en:
  panelTitle: Panel
  displayLabel: Display
  displayed: "Displayed by set_display"
</i18n>

<script lang="ts" setup>
/**
 * A panel that registers its OWN tool when it mounts — the miniature of what happens in
 * production when the agent navigates and the new page's components come up. The tool is
 * unregistered on unmount by useAgentTool's onScopeDispose.
 *
 * Used by pages/_dev/chat-live-tools.vue to exercise the mid-turn tool refresh.
 */
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentTool } from '@data-fair/lib-vue-agents'

const { t } = useI18n()
const display = ref('')

onMounted(() => {
  useAgentTool({
    name: 'set_display',
    title: 'Set display',
    description: 'Write a line into the panel display area',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' }
      }
    } as any,
    execute: (args: { text?: string }) => {
      display.value = args?.text || t('displayed')
      return { success: true }
    }
  } as any)
})
</script>
