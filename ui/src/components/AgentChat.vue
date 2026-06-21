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
        :activity="activity"
        :chat-error="chatError"
        :welcome-text="t('welcome')"
        :tool-title="toolTitle"
        :action-visible-prompt="actionVisiblePrompt"
        :mermaid-enabled="mermaidEnabled"
        @navigate="url => sendDFrameMessage({ type: 'navigate', url })"
        @fix-mermaid="handleFixMermaid"
        @mermaid-error="handleMermaidError"
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
      :sub-agents="subAgentsEnabled"
      :mermaid="mermaidEnabled"
      @update:tool-exploration="handleToolExploration"
      @update:sub-agents="handleSubAgents"
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
    Tu peux afficher des diagrammes et graphiques en émettant des blocs de code Mermaid (```mermaid). Privilégie les graphiques XY simples (xychart-beta) pour visualiser des données quantitatives (tendances, comparaisons). N'utilise un diagramme que s'il aide vraiment à la compréhension ; sinon réponds en texte ou avec un tableau. Les valeurs d'un graphique doivent provenir de données réellement interrogées via les outils — ne les invente jamais, ne les estime pas et n'utilise pas de nombres d'exemple ; si tu n'as pas les valeurs, ne trace pas le graphique. Pour un graphique XY, suis exactement cette syntaxe :
    ```mermaid
    xychart-beta
      title "Chiffre d'affaires"
      x-axis [jan, fev, mar]
      y-axis "EUR" 0 --> 100
      bar [20, 50, 90]
      line [20, 50, 90]
    ```
  moderationRefusal: "Ce message a été refusé par la modération de contenu — il semble sortir du cadre de ce que cet assistant peut faire. Reformulez votre demande si vous pensez qu'il s'agit d'une erreur."
  fixMermaidVisible: "Corrige le diagramme qui n'a pas pu s'afficher."
  fixMermaidAuto: "Le diagramme n'a pas pu s'afficher, correction automatique en cours…"
en:
  welcome: How can I help you?
  systemPromptBase: You are a helpful AI assistant for the Data Fair platform.
  systemPromptLang: The user's language is {lang}.
  systemPromptOrg: "The current user is a member of the organization {orgName}{depPart}."
  systemPromptDep: ", department {depName}"
  systemPromptCompact: "Your responses are displayed in a narrow chat widget. Keep formatting compact: use short paragraphs and simple bullet lists. Avoid tables, wide code blocks, and verbose output. Be concise."
  systemPromptMermaid: |
    You can render diagrams and charts by emitting Mermaid fenced code blocks (```mermaid). Prefer simple XY charts (xychart-beta) to visualize quantitative data such as trends and comparisons. Only use a diagram when it genuinely aids understanding; otherwise answer with prose or a table. A chart's values must come from data you actually queried with the tools — never invent or estimate them, and never use placeholder numbers; if you don't have the values, don't draw the chart. When you draw an XY chart, follow this exact syntax:
    ```mermaid
    xychart-beta
      title "Revenue"
      x-axis [jan, feb, mar]
      y-axis "USD" 0 --> 100
      bar [20, 50, 90]
      line [20, 50, 90]
    ```
  moderationRefusal: "This message was declined by content moderation — it appears to fall outside what this assistant is meant to help with. Try rephrasing if you think this is a mistake."
  fixMermaidVisible: "Please fix the diagram that failed to render."
  fixMermaidAuto: "The diagram failed to render, fixing it automatically…"
</i18n>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSession } from '@data-fair/lib-vue/session.js'
import { useVueRouterDFrameContent } from '@data-fair/frame/lib/vue-router/d-frame-content.js'
import { useAgentChat, type ChatMessage } from '~/composables/use-agent-chat'
import { formatMermaidFix, shouldAutoFixMermaid, MERMAID_AUTO_FIX_BUDGET } from '~/utils/mermaid-fix'
import type { MermaidFailure } from '~/utils/mermaid'
import { getTabChannelId, getAgentInitConfig } from '@data-fair/lib-vue-agents'
import type { AgentChatMessage } from '@data-fair/lib-vuetify-agents/types.js'
import AgentChatHeader from './agent-chat/AgentChatHeader.vue'
import AgentChatMessages from './agent-chat/AgentChatMessages.vue'
import AgentChatInput from './agent-chat/AgentChatInput.vue'
import AgentChatDebugDialog from './agent-chat/AgentChatDebugDialog.vue'
import TraceConsentSheet from './agent-chat/TraceConsentSheet.vue'
import { readFlags, writeFlags } from '~/utils/agent-flags'
import { $apiPath } from '~/context'

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

// Experimental chat flags, persisted in a service-scoped cookie (see agent-flags.ts)
// and toggled from the debug dialog's Settings tab. subAgents is ON by default;
// turning it off is the "flatten" mode (every sub-agent tool exposed directly).
const initialFlags = readFlags()
const explorationEnabled = ref(initialFlags.toolExploration)
const subAgentsEnabled = ref(initialFlags.subAgents)
const mermaidEnabled = ref(initialFlags.mermaid)

const chatResult = useAgentChat({
  accountType: props.accountType,
  accountId: props.accountId,
  systemPrompt: finalSystemPrompt.value,
  initialMessages: props.initialMessages,
  refusalMessage: t('moderationRefusal'),
  toolExploration: explorationEnabled.value,
  flattenSubAgents: !subAgentsEnabled.value
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

// Replenished on every genuine user turn (typed send or action session) so each turn gets
// its own automatic-fix budget; a model that keeps emitting broken diagrams within one turn
// can't loop (see shouldAutoFixMermaid), it falls back to the manual "fix this diagram"
// button. Declared here — before the synchronous pending-action block below can call
// startActionSession during setup — so it is never read in its temporal dead zone.
const mermaidAutoFixBudget = ref(MERMAID_AUTO_FIX_BUDGET)

const messages = computed(() => chat.messages.value)
const isStreaming = computed(() => chat.status.value === 'streaming')
const activity = computed(() => chat.activity.value)
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
  mermaidAutoFixBudget.value = MERMAID_AUTO_FIX_BUDGET

  // The hidden context rides inside this user turn (see use-agent-chat sendMessage)
  // instead of mutating the session system prompt, so it stays scoped to the turn
  // and surfaces in the trace reviewer.
  chat.sendMessage(visiblePrompt, { hiddenContext })
}

function persistFlags () {
  writeFlags({
    toolExploration: explorationEnabled.value,
    subAgents: subAgentsEnabled.value,
    mermaid: mermaidEnabled.value
  }, $apiPath)
}

function handleToolExploration (enabled: boolean) {
  explorationEnabled.value = enabled
  persistFlags()
  chat.setToolExploration(enabled)
  // Reset the conversation so the new tool set applies from a clean state.
  handleReset()
}

function handleSubAgents (enabled: boolean) {
  subAgentsEnabled.value = enabled
  persistFlags()
  chat.setFlattenSubAgents(!enabled)
  // Reset the conversation so the new tool set applies from a clean state.
  handleReset()
}

function handleMermaid (enabled: boolean) {
  mermaidEnabled.value = enabled
  persistFlags()
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
  mermaidAutoFixBudget.value = MERMAID_AUTO_FIX_BUDGET
  chat.sendMessage(userMessage)
}

function handleFixMermaid ({ source, error }: { source: string, error: string }) {
  if (isStreaming.value) return
  chat.sendMessage(t('fixMermaidVisible'), { hiddenContext: formatMermaidFix(error, source) })
}

// Bounded automatic counterpart to the manual fix: when the latest reply contains a
// diagram that failed to render, silently ask the model to correct it once — without the
// user having to click. The budget caps retries so a persistently broken diagram settles
// on the manual button instead of looping.
function handleMermaidError ({ index, failures }: { index: number, failures: MermaidFailure[] }) {
  const isLatestMessage = index === messages.value.length - 1
  if (!shouldAutoFixMermaid({ budget: mermaidAutoFixBudget.value, isStreaming: isStreaming.value, isLatestMessage })) return
  mermaidAutoFixBudget.value--
  const { source, error } = failures[0]
  chat.sendMessage(t('fixMermaidAuto'), { hiddenContext: formatMermaidFix(error, source) })
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
