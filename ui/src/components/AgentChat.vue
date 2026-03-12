<template>
  <div class="agent-chat">
    <v-card
      class="chat-messages flex-grow-1 mb-4"
      :max-height="chatMaxHeight"
    >
      <div class="d-flex justify-end pa-2">
        <v-btn
          v-if="debug"
          icon="mdi-bug"
          variant="text"
          size="small"
          color="primary"
          :title="t('openDebug')"
          @click="openDebugDialog"
        />
      </div>
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

    <v-dialog
      v-model="showDebugDialog"
      max-width="900"
      scrollable
    >
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          {{ t('debugDialog') }}
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="showDebugDialog = false"
          />
        </v-card-title>
        <v-card-text>
          <v-tabs v-model="activeDebugTab">
            <v-tab value="systemPrompt">
              {{ t('systemPrompt') }}
            </v-tab>
            <v-tab value="tools">
              {{ t('tools') }}
            </v-tab>
            <v-tab value="trace">
              {{ t('trace') }}
            </v-tab>
          </v-tabs>

          <v-window v-model="activeDebugTab">
            <v-window-item value="systemPrompt">
              <div class="pa-4">
                <p class="text-body-2 text-medium-emphasis">
                  {{ t('noSystemPrompt') }}
                </p>
              </div>
            </v-window-item>

            <v-window-item value="tools">
              <div class="pa-4">
                <div
                  v-if="!agentTools.length"
                  class="text-center text-medium-emphasis"
                >
                  {{ t('noTools') }}
                </div>
                <v-expansion-panels
                  v-else
                  variant="accordion"
                >
                  <v-expansion-panel
                    v-for="tool in agentTools"
                    :key="tool.name"
                  >
                    <v-expansion-panel-title>
                      <span class="font-weight-medium">{{ tool.name }}</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <p class="text-body-2 mb-2">
                        {{ tool.description }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-1">
                        {{ t('inputSchema') }}:
                      </p>
                      <pre class="trace-data">{{ JSON.stringify(tool.inputSchema, null, 2) }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-window-item>

            <v-window-item value="trace">
              <div class="pa-4">
                <v-timeline
                  v-if="traceEvents.length"
                  density="compact"
                  side="end"
                >
                  <v-timeline-item
                    v-for="event in traceEvents"
                    :key="event._id"
                    :dot-color="event.eventType === 'onFinish' ? 'success' : event.eventType === 'onToolCallFinish' ? 'warning' : 'primary'"
                    size="small"
                  >
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-caption font-weight-medium">{{ event.eventType }}</span>
                      <span class="text-caption text-medium-emphasis">{{ new Date(event.timestamp).toLocaleTimeString() }}</span>
                    </div>
                    <div class="text-body-2 mt-1">
                      <pre class="trace-data">{{ JSON.stringify(event.data, null, 2) }}</pre>
                    </div>
                  </v-timeline-item>
                </v-timeline>
                <div
                  v-else
                  class="text-center text-medium-emphasis"
                >
                  {{ t('noTraceEvents') }}
                </div>
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="showDebugDialog = false"
          >
            {{ t('close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<i18n lang="yaml">
fr:
  placeholder: Tapez votre message...
  send: Envoyer
  executing: en cours d'exécution
  openDebug: Ouvrir le débogueur
  debugDialog: Débogueur
  systemPrompt: Prompt système
  tools: Outils
  trace: Traçage
  noSystemPrompt: Aucun prompt système configuré
  noTools: Aucun outil enregistré
  noTraceEvents: Aucun événement de trace
  inputSchema: Schéma d'entrée
  close: Fermer
en:
  placeholder: Type your message...
  send: Send
  executing: executing
  openDebug: Open debugger
  debugDialog: Debugger
  systemPrompt: System Prompt
  tools: Tools
  trace: Trace
  noSystemPrompt: No system prompt configured
  noTools: No tools registered
  noTraceEvents: No trace events
  inputSchema: Input Schema
  close: Close
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentChat } from '~/composables/use-agent-chat'
import { $apiPath } from '~/context'

interface TraceEvent {
  _id: string
  traceId: string
  userId: string
  eventType: string
  timestamp: string
  data: any
}

const props = defineProps<{
  debug?: boolean
}>()

const { t } = useI18n()

const chatResult = useAgentChat(props.debug)

if (!chatResult) {
  throw new Error('WebSocket not supported')
}

const messages = computed(() => chatResult.messages.value)
const status = computed(() => chatResult.status.value)
const sendMessage = chatResult.sendMessage
const agentTools = computed(() => chatResult.agentTools.value)
const currentTraceId = chatResult.currentTraceId

const showDebugDialog = ref(false)
const activeDebugTab = ref('systemPrompt')
const traceEvents = ref<TraceEvent[]>([])

const input = ref('')

const isLoading = computed(() => status.value === 'waiting')
const isReady = computed(() => status.value === 'open')

const chatMaxHeight = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerHeight - 290
  }
  return 500
})

const handleSend = () => {
  const userMessage = input.value.trim()
  if (!userMessage || isLoading.value) return

  sendMessage(userMessage)
  input.value = ''
}

const fetchTrace = async () => {
  if (!currentTraceId.value) return
  try {
    const res = await fetch(`${$apiPath}/traces/${currentTraceId.value}`, {
      credentials: 'include'
    })
    const data = await res.json()
    traceEvents.value = data.results
  } catch (error) {
    console.error('Failed to fetch trace:', error)
  }
}

const openDebugDialog = async () => {
  if (currentTraceId.value) {
    await fetchTrace()
  } else {
    traceEvents.value = []
  }
  showDebugDialog.value = true
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

.trace-data {
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 200px;
  margin: 0;
}
</style>
