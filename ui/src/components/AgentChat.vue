<template>
  <v-card
    class="agent-chat d-flex flex-column border-secondary border-md border-e-0 border-opacity-100 rounded-ts-xl rounded-bs-xl rounded-te-0 rounded-be-0"

    :class="{ 'agent-chat--debug': debug }"
  >
    <!-- Header -->
    <v-card-title class="d-flex align-center py-2 px-4">
      <span class="text-subtitle-1 font-weight-medium text-truncate text-secondary">
        {{ title }}
      </span>
      <v-spacer />
      <v-btn
        v-if="debug"
        icon
        variant="text"
        size="x-small"
        density="comfortable"
        :title="t('debugInfo')"
        @click="showDebugDialog = true"
      >
        <span class="text-caption font-weight-bold">d</span>
      </v-btn>
      <v-btn
        :icon="mdiInformationSymbol"
        variant="flat"
        :color="toolsChanged ? 'accent' : 'info'"
        density="compact"
        :title="t('agentInfo')"
        class="agent-info-btn"
        :class="{ 'agent-info-btn--active': toolsChanged }"
        @click="showInfoDialog = true"
      />
    </v-card-title>

    <!-- Messages area -->
    <div
      ref="messagesContainer"
      class="flex-grow-1 overflow-y-auto"
      style="min-height: 0"
    >
      <!-- Welcome message -->
      <div
        v-if="!messages.length"
        class="d-flex align-center justify-center fill-height"
      >
        <p class="text-body-2 text-medium-emphasis">
          {{ t('welcome') }}
        </p>
      </div>

      <!-- Chat messages -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="px-4 py-2"
      >
        <div
          v-if="message.role === 'user'"
          class="d-flex justify-end"
        >
          <v-card
            class="pa-3 text-body-2 rounded-ts-xl rounded-bs-xl rounded-be-xl rounded-te-md bg-surface"
            color="secondary"
            variant="outlined"
          >
            {{ message.content }}
          </v-card>
        </div>
        <div
          v-else
          class="text-body-2"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            class="assistant-content markdown-content"
            v-html="renderMarkdown(message.content)"
          />
          <div
            v-if="message.toolInvocations?.length"
            class="mt-2"
          >
            <template
              v-for="invocation in message.toolInvocations"
              :key="invocation.toolCallId"
            >
              <v-chip
                v-if="!invocation.toolName.startsWith('subagent_')"
                size="x-small"
                :color="invocation.state === 'done' ? 'success' : 'warning'"
                variant="tonal"
                class="mr-1 mb-1"
              >
                {{ toolTitle(invocation.toolName) }}
              </v-chip>
            </template>
          </div>
          <!-- Sub-agent expandable sections -->
          <div
            v-if="message.toolInvocations?.some(ti => ti.toolName.startsWith('subagent_'))"
            class="mt-2"
          >
            <v-expansion-panels
              variant="accordion"
              density="compact"
            >
              <v-expansion-panel
                v-for="invocation in message.toolInvocations.filter(ti => ti.toolName.startsWith('subagent_'))"
                :key="invocation.toolCallId"
              >
                <v-expansion-panel-title class="text-body-2 py-1">
                  <v-icon
                    size="x-small"
                    :color="invocation.state === 'done' ? 'success' : 'warning'"
                    class="mr-2"
                    :icon="invocation.state === 'done' ? mdiCheck : mdiLoading"
                    :class="{ 'agent-chat__spin': invocation.state !== 'done' }"
                  />
                  <span class="font-weight-medium">{{ subAgentTitle(invocation.toolName) }}</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div
                    v-if="message.subAgentMessages?.length"
                    class="pl-2"
                    style="border-left: 2px solid rgb(var(--v-theme-primary), 0.3)"
                  >
                    <div
                      v-for="(subMsg, subIdx) in message.subAgentMessages"
                      :key="subIdx"
                      class="py-1"
                    >
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <div
                        class="text-body-2 markdown-content"
                        v-html="renderMarkdown(subMsg.content)"
                      />
                      <div
                        v-if="subMsg.toolInvocations?.length"
                        class="mt-1"
                      >
                        <v-chip
                          v-for="subInv in subMsg.toolInvocations"
                          :key="subInv.toolCallId"
                          size="x-small"
                          :color="subInv.state === 'done' ? 'success' : 'warning'"
                          variant="tonal"
                          class="mr-1 mb-1"
                        >
                          {{ toolTitle(subInv.toolName) }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="text-body-2 text-medium-emphasis"
                  >
                    {{ invocation.state === 'done' ? t('subAgentDone') : t('subAgentRunning') }}
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div
        v-if="isStreaming"
        class="px-4 py-2"
      >
        <v-progress-linear
          indeterminate
          color="primary"
          height="2"
          class="mb-0"
        />
      </div>

      <!-- Error -->
      <div
        v-if="chatError"
        class="px-4 py-2"
      >
        <v-alert
          type="error"
          density="compact"
          variant="tonal"
        >
          {{ chatError }}
        </v-alert>
      </div>
    </div>

    <!-- Input area -->
    <div class="py-2 px-4">
      <v-form @submit.prevent="handleSend">
        <v-text-field
          v-model="input"
          :placeholder="t('placeholder')"
          variant="plain"
          density="compact"
          hide-details
          single-line
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
              @click="handleAbort"
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
              :disabled="!input.trim()"
              :title="t('send')"
              @click="handleSend"
            >
              <v-icon
                size="small"
                :icon="mdiSend"
              />
            </v-btn>
          </template>
        </v-text-field>
      </v-form>
    </div>

    <!-- Info dialog -->
    <v-dialog
      v-model="showInfoDialog"
      fullscreen
    >
      <v-card class="d-flex flex-column">
        <v-btn
          :icon="mdiClose"
          variant="text"
          size="small"
          :title="t('close')"
          class="position-absolute"
          style="top: 8px; right: 8px; z-index: 1"
          @click="showInfoDialog = false"
        />
        <v-card-text class="d-flex align-center justify-center flex-grow-1">
          <div style="max-width: 500px; width: 100%">
            <div
              v-if="summaryLoading"
              class="d-flex justify-center py-4"
            >
              <v-progress-circular
                indeterminate
                size="24"
                width="2"
              />
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              v-else
              class="text-body-2 markdown-content"
              v-html="renderMarkdown(agentSummary || t('noSummary'))"
            />
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Debug dialog -->
    <v-dialog
      v-model="showDebugDialog"
      fullscreen
    >
      <v-card class="d-flex flex-column">
        <v-btn
          :icon="mdiClose"
          variant="text"
          size="small"
          :title="t('close')"
          class="position-absolute"
          style="top: 8px; right: 8px; z-index: 1"
          @click="showDebugDialog = false"
        />
        <v-card-text class="d-flex align-center justify-center flex-grow-1">
          <div style="max-width: 800px; width: 100%">
            <v-tabs
              v-model="activeDebugTab"
              density="compact"
            >
              <v-tab value="systemPrompt">
                {{ t('systemPrompt') }}
              </v-tab>
              <v-tab value="tools">
                {{ t('tools') }} ({{ debugTools.length }})
              </v-tab>
            </v-tabs>

            <v-window v-model="activeDebugTab">
              <v-window-item value="systemPrompt">
                <pre class="agent-chat__pre pa-3 mt-2">{{ finalSystemPrompt }}</pre>
              </v-window-item>

              <v-window-item value="tools">
                <div
                  v-if="!debugTools.length"
                  class="text-center text-medium-emphasis pa-4"
                >
                  {{ t('noTools') }}
                </div>
                <v-expansion-panels
                  v-else
                  variant="accordion"
                  class="mt-2"
                >
                  <v-expansion-panel
                    v-for="dtool in debugTools"
                    :key="dtool.name"
                  >
                    <v-expansion-panel-title class="text-body-2">
                      <span class="font-weight-medium">{{ dtool.name }}</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <p class="text-body-2 mb-2">
                        {{ dtool.description }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-1">
                        {{ t('inputSchema') }}:
                      </p>
                      <pre class="agent-chat__pre pa-2">{{ JSON.stringify(dtool.inputSchema, null, 2) }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-window-item>
            </v-window>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<i18n lang="yaml">
fr:
  placeholder: Tapez votre message...
  send: Envoyer
  stop: Arrêter
  welcome: Posez une question pour commencer.
  agentInfo: Informations sur l'agent
  debugInfo: Débogage
  debugDialog: Débogage
  systemPrompt: Prompt système
  tools: Outils
  noTools: Aucun outil enregistré
  inputSchema: Schéma d'entrée
  close: Fermer
  noSummary: Aucune information disponible.
  systemPromptBase: Tu es un assistant IA utile pour la plateforme Data Fair.
  systemPromptUser: L'utilisateur actuel est {userName}{orgPart}.
  systemPromptUserDefault: Utilisateur
  systemPromptLang: La langue de l'utilisateur est {lang}.
  systemPromptOrg: ", membre de l'organisation {orgName}"
  systemPromptDep: ", département {depName}"
  subAgentRunning: Sous-agent en cours d'exécution...
  subAgentDone: Sous-agent terminé.
en:
  placeholder: Type your message...
  send: Send
  stop: Stop
  welcome: Ask a question to get started.
  agentInfo: Agent information
  debugInfo: Debug
  debugDialog: Debug
  systemPrompt: System Prompt
  tools: Tools
  noTools: No tools registered
  inputSchema: Input Schema
  close: Close
  noSummary: No information available.
  systemPromptBase: You are a helpful AI assistant for the Data Fair platform.
  systemPromptUser: The current user is {userName}{orgPart}.
  systemPromptUserDefault: User
  systemPromptLang: The user's language is {lang}.
  systemPromptOrg: ", member of the organization {orgName}"
  systemPromptDep: ", department {depName}"
  subAgentRunning: Sub-agent running...
  subAgentDone: Sub-agent finished.
</i18n>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSession } from '@data-fair/lib-vue/session.js'
import { useAgentChat, type ChatMessage } from '~/composables/use-agent-chat'
import { $fetch } from '~/context'
import { mdiCheck, mdiClose, mdiInformationSymbol, mdiLoading, mdiSend, mdiStop } from '@mdi/js'
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{
  debug?: boolean
  title?: string
  systemPrompt?: string
  initialMessages?: ChatMessage[]
}>()

const { t } = useI18n()
const session = useSession()

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

const chatResult = useAgentChat(props.debug, finalSystemPrompt.value, props.initialMessages)

if (!chatResult) {
  throw new Error('Chat not supported in SSR')
}

const messages = computed(() => chatResult.messages.value)
const status = computed(() => chatResult.status.value)
const chatError = computed(() => chatResult.error.value)
const sendMessage = chatResult.sendMessage
const abort = chatResult.abort

const showInfoDialog = ref(false)
const showDebugDialog = ref(false)
const activeDebugTab = ref('systemPrompt')
const input = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const isStreaming = computed(() => status.value === 'streaming')

// Track tools changes for visual activation on "i" button
const toolsChanged = ref(false)
let toolsChangedTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => chatResult.toolsVersion.value, () => {
  toolsChanged.value = true
  if (toolsChangedTimeout) clearTimeout(toolsChangedTimeout)
  toolsChangedTimeout = setTimeout(() => {
    toolsChanged.value = false
  }, 3000)
})

// Auto-scroll to bottom on new messages
watch(
  () => chatResult.messages.value.length,
  async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
)

// Also scroll during streaming (content updates)
watch(
  () => messages.value[messages.value.length - 1]?.content,
  async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
)

// Agent summary via summarizer model
const agentSummary = ref('')
const summaryLoading = ref(false)
let lastSummaryToolsVersion = -1

watch(showInfoDialog, async (open) => {
  if (!open) return
  if (lastSummaryToolsVersion === chatResult.toolsVersion.value && agentSummary.value) return

  lastSummaryToolsVersion = chatResult.toolsVersion.value
  summaryLoading.value = true

  try {
    const toolDescriptions = Object.entries(chatResult.tools.value).map(([name, t]) => {
      return `- ${name}: ${(t as any).description ?? ''}`
    }).join('\n')

    const content = [
      `System prompt: ${finalSystemPrompt.value}`,
      toolDescriptions ? `\nAvailable tools:\n${toolDescriptions}` : '\nNo tools available.'
    ].join('\n')

    const lang = session.state.lang || 'fr'
    const prompt = lang === 'fr'
      ? 'Décris brièvement les capacités de cet agent en 2-3 phrases, en mettant en avant les outils récemment ajoutés si pertinent. Tu peux utiliser du markdown pour la mise en forme. Réponds en français.'
      : 'Briefly describe this agent\'s capabilities in 2-3 sentences, highlighting recently added tools if relevant. You can use markdown for formatting.'

    const result = await $fetch('/summary/', {
      method: 'POST',
      body: { prompt, content }
    })
    agentSummary.value = result.summary
  } catch {
    agentSummary.value = ''
  } finally {
    summaryLoading.value = false
  }
})

const debugTools = computed(() => {
  return Object.entries(chatResult.tools.value).map(([name, t]) => ({
    name,
    description: (t as any).description ?? '',
    inputSchema: (t as any).parameters ?? {}
  }))
})

const toolTitle = (toolName: string) => {
  const t = chatResult.tools.value[toolName] as any
  return t?.title || toolName
}

const subAgentTitle = (toolName: string) => {
  // Strip 'subagent_' prefix and format nicely
  const name = toolName.replace(/^subagent_/, '')
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const handleSend = () => {
  const userMessage = input.value.trim()
  if (!userMessage || isStreaming.value) return

  sendMessage(userMessage)
  input.value = ''
}

const handleAbort = () => {
  abort()
}
</script>

<style scoped>
.agent-chat {
  height: 100%;
  overflow: hidden;
}

.assistant-content {
  word-break: break-word;
}

.markdown-content :deep(.markdown-paragraph:not(:last-child)) {
  margin-bottom: 16px;
}

.markdown-content :deep(pre) {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.75rem;
  overflow-x: auto;
  margin: 8px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.markdown-content :deep(code) {
  font-size: 0.85em;
}

.markdown-content :deep(p code) {
  background: rgb(var(--v-theme-surface-variant));
  padding: 2px 4px;
  border-radius: 3px;
}

.agent-chat__pre {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 300px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.agent-info-btn--active {
  animation: agent-info-pulse 0.6s ease-in-out 3;
}

@keyframes agent-info-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.agent-chat__spin {
  animation: agent-chat-spin 1s linear infinite;
}

@keyframes agent-chat-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
