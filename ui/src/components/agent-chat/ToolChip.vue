<template>
  <v-chip
    size="small"
    :color="color"
    variant="outlined"
    class="mr-1 mb-1"
    :data-state="failed ? 'failed' : invocation.state"
    :append-icon="expandable ? (open ? mdiChevronUp : mdiChevronDown) : undefined"
    @click="expandable && $emit('toggle')"
  >
    <!-- The state a color alone does not say: still at work, waiting on the person, or failed. -->
    <template
      v-if="stateIcon"
      #prepend
    >
      <v-icon
        :icon="stateIcon"
        size="x-small"
        :class="['mr-1', { 'tool-chip__spin': stateIcon === mdiLoading }]"
      />
    </template>
    <!-- In its own element: as a bare text node beside the icon, the chip's text read " Approved: …". -->
    <span>{{ label }}</span>
  </v-chip>
</template>

<script lang="ts" setup>
/**
 * One tool call, as the chat shows it: its title, and its state. Running calls spin, so a slow one reads
 * as at work rather than stuck; a failed one is red everywhere, not only where details are shown — it
 * used to turn green like a success, so the person was never told.
 */
import { computed } from 'vue'
import { mdiLoading, mdiAccountClock, mdiAlertCircleOutline, mdiChevronDown, mdiChevronUp } from '@mdi/js'
import { WAIT_TOOL_NAME } from '@agents/shared/agent-activity'
import type { ChatMessage } from '~/utils/chat-message'

const props = defineProps<{
  invocation: NonNullable<ChatMessage['toolInvocations']>[number]
  label: string
  /** Where details are shown: the chip opens them. */
  expandable?: boolean
  open?: boolean
}>()
defineEmits<{ toggle: [] }>()

const failed = computed(() => props.invocation.errorText !== undefined)
const color = computed(() => failed.value || props.invocation.state === 'denied'
  ? 'error'
  : props.invocation.state === 'done' ? 'success' : 'warning')
const stateIcon = computed(() => {
  if (failed.value) return mdiAlertCircleOutline
  if (props.invocation.state !== 'pending') return undefined
  // An open wait is the person's move: a spinner would say the assistant is working.
  return props.invocation.toolName === WAIT_TOOL_NAME ? mdiAccountClock : mdiLoading
})
</script>

<style scoped>
.tool-chip__spin {
  animation: tool-chip-spin 1s linear infinite;
}
@keyframes tool-chip-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
