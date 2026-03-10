<template>
  <v-container
    class="chat-container"
    fluid
  >
    <v-row class="fill-height">
      <v-col
        cols="12"
        class="d-flex flex-column chat-col"
      >
        <div class="chat-header mb-4">
          <h1 class="text-h5">
            {{ t('title') }}
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ t('subtitle') }}
          </p>
        </div>

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
            <v-form @submit.prevent="sendMessage">
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
                    :disabled="isLoading"
                    @keydown.enter.prevent="sendMessage"
                  />
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    type="submit"
                    color="accent"
                    :loading="isLoading"
                    :disabled="!input.trim()"
                  >
                    {{ t('send') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Assistant
  subtitle: Discutez avec l'agent IA
  placeholder: Tapez votre message...
  send: Envoyer
  executing: en cours d'exécution
  error: Une erreur est survenue
en:
  title: Assistant
  subtitle: Chat with the AI agent
  placeholder: Type your message...
  send: Send
  executing: executing
  error: An error occurred
</i18n>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
  }>
}

const { t } = useI18n()
const route = useRoute()

const agentId = computed(() => route.params.id as string)
const messages = ref<ChatMessage[]>([])
const input = ref('')
const isLoading = ref(false)

const chatMaxHeight = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerHeight - 250
  }
  return 500
})

const scrollToBottom = () => {
  nextTick(() => {
    const chatList = document.querySelector('.chat-list')
    if (chatList) {
      chatList.scrollTop = chatList.scrollHeight
    }
  })
}

const sendMessage = async () => {
  const userMessage = input.value.trim()
  if (!userMessage || isLoading.value) return

  messages.value.push({ role: 'user', content: userMessage })
  input.value = ''
  isLoading.value = true

  const assistantMessage: ChatMessage = { role: 'assistant', content: '', toolInvocations: [] }
  messages.value.push(assistantMessage)
  scrollToBottom()

  try {
    const response = await fetch(`${$apiPath}/agents/${agentId.value}/stream-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userMessage }),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      assistantMessage.content = buffer
      scrollToBottom()
    }
  } catch (error) {
    console.error('Chat error:', error)
    assistantMessage.content = t('error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 100px);
  max-width: 900px;
  margin: 0 auto;
}

.chat-col {
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
