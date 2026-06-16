<template>
  <v-card
    class="agent-chat d-flex flex-column"
    :border="0"
  >
    <agent-chat-header
      :is-admin="isAdmin"
      :title="chatTitle"
      @show-debug="showDebugDialog = true"
      @reset="handleReset"
    />

    <template v-if="messages.length">
      <agent-chat-messages
        :messages="messages"
        :is-streaming="isStreaming"
        :chat-error="chatError"
        :welcome-text="t('welcome')"
        :tool-title="toolTitle"
        :action-visible-prompt="actionVisiblePrompt"
        :mermaid-enabled="mermaidEnabled"
        @navigate="url => sendDFrameMessage({ type: 'navigate', url })"
        @fix-mermaid="handleFixMermaid"
      />

      <agent-chat-input
        :is-streaming="isStreaming"
        @send="handleSend"
        @abort="handleAbort"
      />
    </template>

    <div
      v-else
      class="flex-grow-1 d-flex flex-column align-center justify-center"
      style="min-height: 0"
    >
      <p
        v-if="showWelcome"
        class="text-body-medium text-medium-emphasis text-center mb-4"
      >
        {{ t('welcome') }}
      </p>
      <agent-chat-input
        :is-streaming="isStreaming"
        style="width: 100%"
        @send="handleSend"
        @abort="handleAbort"
      />
    </div>

    <agent-chat-debug-dialog
      v-model="showDebugDialog"
      :system-prompt="finalSystemPrompt"
      :debug-tools-partition="debugToolsPartition"
      :conversation-id="chat.conversationId.value"
      :is-admin="isAdmin"
      :account-type="accountType"
      :account-id="accountId"
      :tool-exploration="explorationEnabled"
      :mermaid="mermaidEnabled"
      @update:tool-exploration="handleToolExploration"
      @update:mermaid="handleMermaid"
    />

    <trace-consent-sheet />
  </v-card>
</template>

<i18n lang="yaml">
fr:
  welcome: Comment puis-je vous aider ?
  systemPromptBase: Tu es un assistant IA utile pour la plateforme Data Fair.
  systemPromptLang: La langue de l'utilisateur est {lang}.
  systemPromptOrg: "L'utilisateur actuel est membre de l'organisation {orgName}{depPart}."
  systemPromptDep: ", département {depName}"
  systemPromptCompact: "Tes réponses sont affichées dans un widget de chat étroit. Garde un formatage compact : utilise des paragraphes courts et des listes à puces simples. Évite les tableaux, les blocs de code larges et les sorties verbeuses. Sois concis."
  systemPromptMermaid: |
    Tu peux afficher des diagrammes et graphiques en émettant des blocs de code Mermaid (```mermaid). Privilégie les graphiques XY simples (xychart-beta) pour visualiser des données quantitatives (tendances, comparaisons). N'utilise un diagramme que s'il aide vraiment à la compréhension ; sinon réponds en texte ou avec un tableau. Pour un graphique XY, suis exactement cette syntaxe :
    ```mermaid
    xychart-beta
      title "Chiffre d'affaires"
      x-axis [jan, fev, mar]
      y-axis "EUR" 0 --> 100
      bar [20, 50, 90]
      line [20, 50, 90]
    ```
  moderationRefusal: "Cette demande ne peut pas être traitée car elle sort du cadre de ce que cet assistant peut faire."
  fixMermaidVisible: "Corrige le diagramme qui n'a pas pu s'afficher."
en:
  welcome: How can I help you?
  systemPromptBase: You are a helpful AI assistant for the Data Fair platform.
  systemPromptLang: The user's language is {lang}.
  systemPromptOrg: "The current user is a member of the organization {orgName}{depPart}."
  systemPromptDep: ", department {depName}"
  systemPromptCompact: "Your responses are displayed in a narrow chat widget. Keep formatting compact: use short paragraphs and simple bullet lists. Avoid tables, wide code blocks, and verbose output. Be concise."
  systemPromptMermaid: |
    You can render diagrams and charts by emitting Mermaid fenced code blocks (```mermaid). Prefer simple XY charts (xychart-beta) to visualize quantitative data such as trends and comparisons. Only use a diagram when it genuinely aids understanding; otherwise answer with prose or a table. When you draw an XY chart, follow this exact syntax:
    ```mermaid
    xychart-beta
      title "Revenue"
      x-axis [jan, feb, mar]
      y-axis "USD" 0 --> 100
      bar [20, 50, 90]
      line [20, 50, 90]
    ```
  moderationRefusal: "This request can't be processed as it falls outside what this assistant is meant to help with."
  fixMermaidVisible: "Please fix the diagram that failed to render."
</i18n>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSession } from '@data-fair/lib-vue/session.js'
import { useVueRouterDFrameContent } from '@data-fair/frame/lib/vue-router/d-frame-content.js'
import { useAgentChat, type ChatMessage } from '~/composables/use-agent-chat'
import { formatMermaidFix } from '~/utils/mermaid-fix'
import { getTabChannelId, getAgentInitConfig } from '@data-fair/lib-vue-agents'
import type { AgentChatMessage } from '@data-fair/lib-vuetify-agents/types.js'
import AgentChatHeader from './agent-chat/AgentChatHeader.vue'
import AgentChatMessages from './agent-chat/AgentChatMessages.vue'
import AgentChatInput from './agent-chat/AgentChatInput.vue'
import AgentChatDebugDialog from './agent-chat/AgentChatDebugDialog.vue'
import TraceConsentSheet from './agent-chat/TraceConsentSheet.vue'

const props = defineProps<{
  isAdmin?: boolean
  title?: string
  systemPrompt?: string
  narrowViewport?: boolean
  initialMessages?: ChatMessage[]
  accountType: string
  accountId: string
}>()

// Initial configuration written by the host page (drawer/menu) before this iframe
// loaded; read once on mount via the per-chat `initConfig` key in our own URL, so
// several chats in one tab don't clobber each other. Takes precedence over props.
const initConfigKey = new URLSearchParams(window.location.search).get('initConfig')
const initConfig = initConfigKey ? getAgentInitConfig(initConfigKey) : undefined
const initSystemPrompt = initConfig?.prompt
const chatTitle = computed(() => initConfig?.title ?? props.title)

const { t } = useI18n()
const session = useSession()

const finalSystemPrompt = computed(() => {
  const lang = session.state.lang || 'fr'
  const orgName = session.state.account?.name
  const depName = session.state.account?.departmentName

  // The user's name is deliberately omitted: it has no bearing on the assistant's
  // behaviour, it is a privacy concern to send to providers, and keeping it out
  // makes the system prompt prefix homogeneous across users (better prompt caching).
  const parts = [
    (initSystemPrompt ?? props.systemPrompt) || t('systemPromptBase')
  ]

  if (props.accountType === 'organization' && orgName) {
    const depPart = depName ? t('systemPromptDep', { depName }) : ''
    parts.push(t('systemPromptOrg', { orgName, depPart }))
  }

  parts.push(t('systemPromptLang', { lang }))

  if (props.narrowViewport) {
    parts.push(t('systemPromptCompact'))
  }

  if (mermaidEnabled.value) {
    parts.push(t('systemPromptMermaid'))
  }

  return parts.join(' ')
})

// Experimental tool-exploration mode: admin-only opt-in, persisted in localStorage
// and toggled from the debug dialog's Settings tab.
const explorationEnabled = ref(!!props.isAdmin && localStorage.getItem('agent-chat-explore') === '1')

// Experimental mermaid rendering: admin-only opt-in (still experimental), persisted
// in localStorage and toggled from the settings dialog.
const mermaidEnabled = ref(!!props.isAdmin && localStorage.getItem('agent-chat-mermaid') === '1')

const chatResult = useAgentChat({
  accountType: props.accountType,
  accountId: props.accountId,
  systemPrompt: finalSystemPrompt.value,
  initialMessages: props.initialMessages,
  refusalMessage: t('moderationRefusal'),
  toolExploration: explorationEnabled.value
})

if (!chatResult) {
  throw new Error('Chat not supported in SSR')
}
// chatResult is guaranteed to be defined after the throw guard above
// but TypeScript doesn't narrow across script setup scope, so we re-bind
const chat = chatResult

watch(finalSystemPrompt, (prompt) => {
  chat.setSystemPrompt(prompt)
})

const actionVisiblePrompt = ref<string | null>(null)

const messages = computed(() => chat.messages.value)
const isStreaming = computed(() => chat.status.value === 'streaming')
const chatError = computed(() => chat.error.value)

const showDebugDialog = ref(false)

// Emit status messages to parent d-frame
const inIframe = window.parent !== window
const dFrameContent = useVueRouterDFrameContent()

function sendDFrameMessage (msg: AgentChatMessage) {
  if (inIframe) dFrameContent.sendMessage(msg)
}

// Welcome message gating: delay in iframe to allow start-session to suppress it
const welcomeDelayDone = ref(!inIframe)
const sessionStarted = ref(false)
let welcomeTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (inIframe) {
    welcomeTimeout = setTimeout(() => {
      welcomeDelayDone.value = true
    }, 200)
  }
})

const showWelcome = computed(() => {
  if (sessionStarted.value) return false
  return welcomeDelayDone.value
})

// Listen for action messages via BroadcastChannel
const actionChannelId = getTabChannelId()
const actionChannel = new BroadcastChannel(actionChannelId)
actionChannel.onmessage = (event: MessageEvent) => {
  const data = event.data
  if (!data || data.channel !== actionChannelId) return

  if (data.type === 'agent-start-session') {
    sessionStarted.value = true
    if (welcomeTimeout) {
      clearTimeout(welcomeTimeout)
      welcomeTimeout = null
    }
    startActionSession(data.visiblePrompt, data.hiddenContext)
  } else if (data.type === 'agent-session-cleared') {
    handleSessionCleared()
  }
}

// On mount, check for a pending action stored in sessionStorage
// (handles case where the BroadcastChannel message was sent before this iframe loaded)
const pendingAction = sessionStorage.getItem('df-agent-pending-action')
if (pendingAction) {
  try {
    const data = JSON.parse(pendingAction)
    if (data.type === 'agent-start-session' && data.visiblePrompt) {
      sessionStarted.value = true
      if (welcomeTimeout) {
        clearTimeout(welcomeTimeout)
        welcomeTimeout = null
      }
      startActionSession(data.visiblePrompt, data.hiddenContext)
    }
  } catch { /* ignore malformed data */ }
}

onUnmounted(() => {
  actionChannel.close()
})

function startActionSession (visiblePrompt: string, hiddenContext: string) {
  sessionStorage.removeItem('df-agent-pending-action')

  // Abort any in-flight response so sendMessage won't be silently dropped
  chat.abort()

  actionVisiblePrompt.value = visiblePrompt

  // The hidden context rides inside this user turn (see use-agent-chat sendMessage)
  // instead of mutating the session system prompt, so it stays scoped to the turn
  // and surfaces in the trace reviewer.
  chat.sendMessage(visiblePrompt, { hiddenContext })
}

function handleToolExploration (enabled: boolean) {
  explorationEnabled.value = enabled
  if (enabled) localStorage.setItem('agent-chat-explore', '1')
  else localStorage.removeItem('agent-chat-explore')
  chat.setToolExploration(enabled)
  // Reset the conversation so the new tool set applies from a clean state.
  handleReset()
}

function handleMermaid (enabled: boolean) {
  mermaidEnabled.value = enabled
  if (enabled) localStorage.setItem('agent-chat-mermaid', '1')
  else localStorage.removeItem('agent-chat-mermaid')
  // Reset so the system prompt is uniform across the whole conversation.
  handleReset()
}

function handleReset () {
  chat.abort()
  chat.reset(finalSystemPrompt.value)
  actionVisiblePrompt.value = null
  sessionStarted.value = false
}

function handleSessionCleared () {
  // The action that started this context is gone, but the conversation continues.
  // Hidden context now lives in the user turn (not the system prompt), so there is
  // nothing to restore — just clear the action-specific banner state.
  actionVisiblePrompt.value = null
}

watch(() => chat.status.value, (status) => {
  if (status === 'streaming') {
    sendDFrameMessage({ type: 'agent-status', status: 'working' })
  } else if (status === 'error') {
    sendDFrameMessage({ type: 'agent-status', status: 'error' })
  } else if (status === 'ready') {
    const msgs = chat.messages.value
    const lastMsg = msgs[msgs.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      sendDFrameMessage({ type: 'agent-status', status: 'waiting-user' })
    } else {
      sendDFrameMessage({ type: 'agent-status', status: 'idle' })
    }
  }
})

watch(() => chat.toolsVersion.value, () => {
  sendDFrameMessage({ type: 'tools-changed' })
})

watch(() => chat.messages.value.length, () => {
  const msgs = chat.messages.value
  const lastMsg = msgs[msgs.length - 1]
  if (lastMsg && lastMsg.role === 'assistant') {
    sendDFrameMessage({ type: 'unread', unread: true })
  }
})

const debugToolsPartition = computed(() => chat.resolvedPartition.value)

const toolTitle = (toolName: string) => {
  const t = chat.tools.value[toolName] as any
  return t?.title || toolName
}

const handleSend = (userMessage: string) => {
  if (isStreaming.value) return
  chat.sendMessage(userMessage)
}

function handleFixMermaid ({ source, error }: { source: string, error: string }) {
  if (isStreaming.value) return
  chat.sendMessage(t('fixMermaidVisible'), { hiddenContext: formatMermaidFix(error, source) })
}

const handleAbort = () => {
  chat.abort()
}
</script>

<style scoped>
.agent-chat {
  height: 100%;
  overflow: hidden;
}
</style>
