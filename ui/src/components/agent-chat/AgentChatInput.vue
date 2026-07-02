<template>
  <div class="px-4 pb-3 pt-1">
    <v-form @submit.prevent="handleSend">
      <v-textarea
        v-model="localInput"
        :placeholder="t('placeholder')"
        color="secondary"
        variant="outlined"
        rounded="xl"
        density="compact"
        hide-details
        rows="1"
        max-rows="6"
        auto-grow
        autofocus
        @keydown.enter.exact.prevent="handleSend"
      >
        <template #prepend-inner>
          <v-icon
            :icon="mdiCreation"
            size="small"
            color="secondary"
          />
        </template>

        <template #append-inner>
          <v-btn
            v-if="isStreaming"
            :icon="mdiStop"
            variant="tonal"
            size="small"
            color="error"
            :title="t('stop')"
            @click="$emit('abort')"
          />
          <v-btn
            v-else
            :icon="mdiSend"
            variant="flat"
            size="x-small"
            color="secondary"
            :disabled="!localInput.trim()"
            :title="t('send')"
            @click="handleSend"
          />
        </template>
      </v-textarea>
    </v-form>
  </div>
</template>

<i18n lang="yaml">
fr:
  placeholder: Tapez votre message...
  send: Envoyer
  stop: Arrêter
en:
  placeholder: Type your message...
  send: Send
  stop: Stop
</i18n>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiSend, mdiStop, mdiCreation } from '@mdi/js'

const props = defineProps<{
  isStreaming: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
  abort: []
}>()

const { t } = useI18n()

const localInput = ref('')

const handleSend = () => {
  const userMessage = localInput.value.trim()
  if (!userMessage || props.isStreaming) return
  emit('send', userMessage)
  localInput.value = ''
}
</script>
