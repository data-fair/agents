<template>
  <div class="agent-chat">
    <v-card
      class="chat-messages flex-grow-1 mb-4"
      :max-height="chatMaxHeight"
    >
      <v-card-text class="pa-0">
        <v-list
          class="chat-list"
          bg-color="transparent"
        >
          <v-list-item
            v-for="(message, index) in messages"
            :key="index"
            :class="['chat-message', message.role]"
          >
            <template #prepend>
              <v-avatar
                :color="message.role === 'user' ? 'primary' : 'secondary'"
                size="32"
                class="mr-3"
              >
                <v-icon
                  v-if="message.role === 'user'"
                  icon="mdi-account"
                  size="18"
                />
                <v-icon
                  v-else
                  icon="mdi-robot"
                  size="18"
                />
              </v-avatar>
            </template>

            <v-card
              flat
              color="transparent"
              max-width="85%"
            >
              <v-card-text class="pa-3">
                <div
                  v-if="message.role === 'user'"
                  class="text-body-1"
                >
                  {{ message.content }}
                </div>
                <div
                  v-else
                  class="text-body-1 assistant-content"
                >
                  {{ message.content }}
                  <div
                    v-if="message.toolInvocations?.length"
                    class="tool-invocations mt-2"
                  >
                    <v-expand-transition>
                      <div
                        v-for="tool in message.toolInvocations"
                        :key="tool.toolCallId"
                        class="tool-call mb-2"
                      >
                        <v-chip
                          size="x-small"
                          color="accent"
                          class="mr-2"
                        >
                          {{ tool.toolName }}
                        </v-chip>
                        <span class="text-caption text-medium-emphasis">{{ t('executing') }}</span>
                      </div>
                    </v-expand-transition>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-list-item>

          <v-list-item
            v-if="isLoading"
            class="chat-message assistant"
          >
            <template #prepend>
              <v-avatar
                color="secondary"
                size="32"
                class="mr-3"
              >
                <v-icon
                  icon="mdi-robot"
                  size="18"
                />
              </v-avatar>
            </template>
            <v-card
              flat
              color="transparent"
              max-width="85%"
            >
              <v-card-text class="pa-3">
                <v-progress-circular
                  indeterminate
                  size="20"
                  width="2"
                  color="secondary"
                />
              </v-card-text>
            </v-card>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-card
      class="chat-input"
      flat
    >
      <v-card-text class="pa-2">
        <v-form @submit.prevent="handleSend">
          <v-row
            density="comfortable"
            align="center"
          >
            <v-col>
              <v-text-field
                v-model="input"
                :placeholder="t('placeholder')"
                variant="outlined"
                density="comfortable"
                hide-details
                :disabled="isLoading || !isReady"
                @keydown.enter.prevent="handleSend"
              />
            </v-col>
            <v-col cols="auto">
              <v-btn
                type="submit"
                color="accent"
                :loading="isLoading"
                :disabled="!input.trim() || !isReady"
              >
                {{ t('send') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<i18n lang="yaml">
fr:
  placeholder: Tapez votre message...
  send: Envoyer
  executing: en cours d'exécution
en:
  placeholder: Type your message...
  send: Send
  executing: executing
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentChat } from '~/composables/use-agent-chat'

const props = defineProps<{
  traceEnabled?: boolean
}>()

const emit = defineEmits<{
  'trace-id': [traceId: string]
}>()

const { t } = useI18n()

const chatResult = useAgentChat(props.traceEnabled)

if (!chatResult) {
  throw new Error('WebSocket not supported')
}

const messages = computed(() => chatResult.messages.value)
const status = computed(() => chatResult.status.value)
const sendMessage = chatResult.sendMessage
chatResult.emitTraceId = (traceId: string) => {
  emit('trace-id', traceId)
}

const input = ref('')

const isLoading = computed(() => status.value === 'waiting')
const isReady = computed(() => status.value === 'open')

const chatMaxHeight = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerHeight - 250
  }
  return 500
})

const handleSend = () => {
  const userMessage = input.value.trim()
  if (!userMessage || isLoading.value) return

  sendMessage(userMessage)
  input.value = ''
}
</script>

<style scoped>
.agent-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
}

.chat-list {
  padding: 16px;
}

.chat-message {
  margin-bottom: 12px;
}

.chat-message.user {
  flex-direction: row;
}

.chat-message.assistant {
  flex-direction: row;
}

.chat-message.user :deep(.v-list-item__prepend) {
  order: 2;
}

.chat-message.user :deep(.v-card) {
  order: 1;
  background: rgb(var(--v-theme-primary));
  color: white;
}

.chat-message.assistant :deep(.v-card) {
  background: rgb(var(--v-theme-surface-variant));
}

.tool-invocations {
  border-top: 1px solid rgba(128, 128, 128, 0.2);
  padding-top: 8px;
}

.assistant-content {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
