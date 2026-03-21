<template>
  <div class="py-2 px-4">
    <v-form @submit.prevent="handleSend">
      <v-textarea
        v-model="localInput"
        :placeholder="t('placeholder')"
        variant="plain"
        density="compact"
        hide-details
        rows="1"
        max-rows="5"
        auto-grow
        autofocus
        :disabled="false"
        @keydown.enter.exact.prevent="handleSend"
      >
        <template #append-inner>
          <v-btn
            v-if="isStreaming"
            icon
            variant="text"
            size="small"
            density="comfortable"
            color="error"
            :title="t('stop')"
            @click="$emit('abort')"
          >
            <v-icon
              size="small"
              :icon="mdiStop"
            />
          </v-btn>
          <v-btn
            v-else
            icon
            variant="text"
            size="small"
            density="comfortable"
            color="primary"
            :disabled="!localInput.trim()"
            :title="t('send')"
            @click="handleSend"
          >
            <v-icon
              size="small"
              :icon="mdiSend"
            />
          </v-btn>
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
import { mdiSend, mdiStop } from '@mdi/js'

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
