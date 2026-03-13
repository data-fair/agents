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
          @click="showDebugDialog = true"
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
                          :color="tool.state === 'done' ? 'success' : 'accent'"
                          class="mr-2"
                        >
                          {{ tool.toolName }}
                        </v-chip>
                        <span class="text-caption text-medium-emphasis">
                          {{ tool.state === 'done' ? t('done') : t('executing') }}
                        </span>
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

          <v-list-item
            v-if="chatError"
            class="chat-message assistant"
          >
            <template #prepend>
              <v-avatar
                color="error"
                size="32"
                class="mr-3"
              >
                <v-icon
                  icon="mdi-alert"
                  size="18"
                />
              </v-avatar>
            </template>
            <v-card
              flat
              color="transparent"
              max-width="85%"
            >
              <v-card-text class="pa-3 text-error">
                {{ chatError }}
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
                :label="t('placeholder')"
                :placeholder="t('placeholder')"
                variant="outlined"
                density="comfortable"
                hide-details
                :disabled="isLoading"
                @keydown.enter.prevent="handleSend"
              />
            </v-col>
            <v-col cols="auto">
              <v-btn
                type="submit"
                color="accent"
                :loading="isLoading"
                :disabled="!input.trim() || isLoading"
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
          </v-tabs>

          <v-window v-model="activeDebugTab">
            <v-window-item value="systemPrompt">
              <div class="pa-4">
                <pre class="trace-data">{{ finalSystemPrompt }}</pre>
              </div>
            </v-window-item>

            <v-window-item value="tools">
              <div class="pa-4">
                <div
                  v-if="!debugTools.length"
                  class="text-center text-medium-emphasis"
                >
                  {{ t('noTools') }}
                </div>
                <v-expansion-panels
                  v-else
                  variant="accordion"
                >
                  <v-expansion-panel
                    v-for="dtool in debugTools"
                    :key="dtool.name"
                  >
                    <v-expansion-panel-title>
                      <span class="font-weight-medium">{{ dtool.name }}</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <p class="text-body-2 mb-2">
                        {{ dtool.description }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-1">
                        {{ t('inputSchema') }}:
                      </p>
                      <pre class="trace-data">{{ JSON.stringify(dtool.inputSchema, null, 2) }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
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
  done: terminé
  openDebug: Ouvrir le débogueur
  debugDialog: Débogueur
  systemPrompt: Prompt système
  tools: Outils
  noTools: Aucun outil enregistré
  inputSchema: Schéma d'entrée
  close: Fermer
  systemPromptBase: Tu es un assistant IA utile pour la plateforme Data Fair.
  systemPromptUser: L'utilisateur actuel est {userName}{orgPart}.
  systemPromptUserDefault: Utilisateur
  systemPromptLang: La langue de l'utilisateur est {lang}.
  systemPromptOrg: ", membre de l'organisation {orgName}"
  systemPromptDep: ", département {depName}"
en:
  placeholder: Type your message...
  send: Send
  executing: executing
  done: done
  openDebug: Open debugger
  debugDialog: Debugger
  systemPrompt: System Prompt
  tools: Tools
  noTools: No tools registered
  inputSchema: Input Schema
  close: Close
  systemPromptBase: You are a helpful AI assistant for the Data Fair platform.
  systemPromptUser: The current user is {userName}{orgPart}.
  systemPromptUserDefault: User
  systemPromptLang: The user's language is {lang}.
  systemPromptOrg: ", member of the organization {orgName}"
  systemPromptDep: ", department {depName}"
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSession } from '@data-fair/lib-vue/session.js'
import { useAgentChat } from '~/composables/use-agent-chat'
import { useAgentTools } from '~/composables/use-agent-tools'

const props = defineProps<{
  debug?: boolean
  systemPrompt?: string
}>()

const { t } = useI18n()
const session = useSession()
const agentTools = useAgentTools()

const finalSystemPrompt = computed(() => {
  if (props.systemPrompt) {
    return props.systemPrompt
  }

  const lang = session.state.lang || 'fr'
  const userName = session.state.user?.name || t('systemPromptUserDefault', { lang })
  const orgName = session.state.account?.name
  const depName = session.state.account?.departmentName

  let orgPart = ''
  if (orgName) {
    orgPart = t('systemPromptOrg', { orgName })
    if (depName) {
      orgPart += t('systemPromptDep', { depName })
    }
  }

  const parts = [
    t('systemPromptBase'),
    t('systemPromptUser', { userName, orgPart }),
    t('systemPromptLang', { lang })
  ]

  return parts.join(' ')
})

const chatResult = useAgentChat(props.debug, finalSystemPrompt.value)

if (!chatResult) {
  throw new Error('Chat not supported in SSR')
}

const messages = computed(() => chatResult.messages.value)
const status = computed(() => chatResult.status.value)
const chatError = computed(() => chatResult.error.value)
const sendMessage = chatResult.sendMessage

const showDebugDialog = ref(false)
const activeDebugTab = ref('systemPrompt')

const input = ref('')

const isLoading = computed(() => status.value === 'streaming')

const chatMaxHeight = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerHeight - 290
  }
  return 500
})

const debugTools = computed(() => {
  return Object.values(agentTools)
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
