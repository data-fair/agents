<template>
  <!-- One muted line that opens on a click, as a step's reasoning is folded: what the transcript shows only
       where it is read to audit it (what the page added to a turn, a recap, what the service told the model). -->
  <div
    class="agent-chat__reasoning my-1"
    :class="{ 'd-flex flex-column align-end': alignEnd }"
  >
    <button
      type="button"
      class="d-inline-flex align-center text-caption text-medium-emphasis text-start"
      :aria-expanded="open"
      @click="open = !open"
    >
      <v-icon
        :icon="icon"
        size="x-small"
        class="mr-1"
      />
      {{ label }}
      <v-icon
        v-if="text"
        :icon="open ? mdiChevronUp : mdiChevronDown"
        size="x-small"
        class="ml-1"
      />
    </button>
    <div
      v-if="open && text"
      class="text-caption text-medium-emphasis agent-chat__reasoning-text agent-chat__folded-note-text mt-1"
    >
      {{ text }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'

defineProps<{ icon: string, label: string, text?: string, alignEnd?: boolean }>()
const open = ref(false)
</script>

<style scoped>
.agent-chat__folded-note-text {
  max-height: 320px;
  overflow-y: auto;
}
.align-end .agent-chat__folded-note-text {
  max-width: 80%;
}
</style>
