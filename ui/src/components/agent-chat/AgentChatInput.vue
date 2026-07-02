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
            variant="flat"
            size="x-small"
            color="error"
            class="composer-action"
            :title="t('stop')"
            @click="$emit('abort')"
          />
          <v-btn
            v-else
            :icon="mdiSend"
            variant="flat"
            size="x-small"
            color="secondary"
            class="composer-action"
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

<style scoped>
/* The composer field is a 40px pill with an xl (24px) radius, so its trailing
   end is a semicircular cap. Nest the action button as a 28px circle concentric
   with that cap — an even ~6px halo all around — instead of a larger button
   whose arc runs parallel to the border and reads as cramped. The negative end
   margin pulls the circle into the field's trailing padding to reach concentric. */
.composer-action.v-btn {
  width: 28px;
  height: 28px;
  min-width: 28px;
  margin-inline-end: -6px;
}
</style>
