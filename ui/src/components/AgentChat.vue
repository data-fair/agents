<template>
  <v-card
    class="agent-chat d-flex flex-column"
    :border="0"
    :class="{ 'agent-chat--debug': debug }"
  >
    <agent-chat-header
      v-model:active-chat-tab="activeChatTab"
      :debug="debug"
      :title="title"
      :tracing-enabled="tracingEnabled"
      :tools-changed="toolsChanged"
      @show-debug="showDebugDialog = true"
      @show-info="showInfoDialog = true"
    />

    <template v-if="messages.length">
      <agent-chat-messages
        ref="messagesRef"
        :messages="messages"
        :is-streaming="isStreaming"
        :chat-error="chatError"
        :welcome-text="activeChatTab === 'evaluation' ? t('welcomeEvaluation') : t('welcome')"
        :tool-title="toolTitle"
        :action-visible-prompt="actionVisiblePrompt"
        :session-cleared-message="sessionClearedMessage"
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
        class="text-body-2 text-medium-emphasis text-center mb-4"
      >
        {{ activeChatTab === 'evaluation' ? t('welcomeEvaluation') : t('welcome') }}
      </p>
      <agent-chat-input
        :is-streaming="isStreaming"
        style="width: 100%"
        @send="handleSend"
        @abort="handleAbort"
      />
    </div>

    <agent-chat-info-dialog
      v-model="showInfoDialog"
      :summary="agentSummary"
      :loading="summaryLoading"
    />

    <agent-chat-debug-dialog
      v-model="showDebugDialog"
      :system-prompt="finalSystemPrompt"
      :debug-tools="debugTools"
      :tracing-enabled="tracingEnabled"
      :trace-overview="traceOverview"
      :recorder="recorder"
    />
  </v-card>
</template>

<i18n lang="yaml">
fr:
  welcome: Comment puis-je vous aider ?
  welcomeEvaluation: "Cet onglet vous permet d'analyser la session en cours avec un évaluateur IA. Posez des questions sur ce qui s'est passé, ce qui a bien fonctionné ou ce qui pourrait être amélioré."
  systemPromptBase: Tu es un assistant IA utile pour la plateforme Data Fair.
  systemPromptUser: L'utilisateur actuel est {userName}{orgPart}.
  systemPromptUserDefault: Utilisateur
  systemPromptLang: La langue de l'utilisateur est {lang}.
  systemPromptOrg: ", membre de l'organisation {orgName}"
  systemPromptDep: ", département {depName}"
en:
  welcome: How can I help you?
  welcomeEvaluation: "This tab lets you analyze the current session with an AI evaluator. Ask questions about what happened, what worked well, or what could be improved."
  systemPromptBase: You are a helpful AI assistant for the Data Fair platform.
  systemPromptUser: The current user is {userName}{orgPart}.
  systemPromptUserDefault: User
  systemPromptLang: The user's language is {lang}.
  systemPromptOrg: ", member of the organization {orgName}"
  systemPromptDep: ", department {depName}"
</i18n>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSession } from '@data-fair/lib-vue/session.js'
import { useVueRouterDFrameContent } from '@data-fair/frame/lib/vue-router/d-frame-content.js'
import { useAgentChat, type ChatMessage } from '~/composables/use-agent-chat'
import { $fetch } from '~/context'
import { SessionRecorder } from '~/traces/session-recorder'
import type { TraceOverviewEntry } from '~/traces/session-recorder'
import { buildEvaluatorTools } from '~/traces/evaluator-tools'
import { getTabChannelId } from '@data-fair/lib-vue-agents'
import type { AgentChatMessage } from '@data-fair/lib-vuetify-agents/types.js'
import AgentChatHeader from './agent-chat/AgentChatHeader.vue'
import AgentChatMessages from './agent-chat/AgentChatMessages.vue'
import AgentChatInput from './agent-chat/AgentChatInput.vue'
import AgentChatInfoDialog from './agent-chat/AgentChatInfoDialog.vue'
import AgentChatDebugDialog from './agent-chat/AgentChatDebugDialog.vue'

const props = defineProps<{
  debug?: boolean
  title?: string
  systemPrompt?: string
  initialMessages?: ChatMessage[]
  accountType: string
  accountId: string
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
  if (props.accountType === 'organization' && orgName) {
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

const tracingEnabled = props.debug && sessionStorage.getItem('agent-chat-trace') === '1'
const recorder = tracingEnabled ? new SessionRecorder() : undefined
if (recorder) {
  recorder.setSystemPrompt(finalSystemPrompt.value)
}

const chatResult = useAgentChat({
  accountType: props.accountType,
  accountId: props.accountId,
  debug: props.debug,
  systemPrompt: finalSystemPrompt.value,
  initialMessages: props.initialMessages,
  recorder
})

if (!chatResult) {
  throw new Error('Chat not supported in SSR')
}
// chatResult is guaranteed to be defined after the throw guard above
// but TypeScript doesn't narrow across script setup scope, so we re-bind
const chat = chatResult

const actionVisiblePrompt = ref<string | null>(null)
const sessionClearedMessage = ref<string | null>(null)

const EVALUATOR_PROMPT = `You are an AI session evaluator. You analyze conversation traces between a user and an AI assistant to help improve the system.

The user will ask you about what happened during the session — what went well, what went wrong, and how to improve prompts, tools, or model configuration.

Use the provided tools to explore the session trace. Start with getTraceOverview to understand the session flow, then use getTraceEntry or getTraceEntries to examine specific parts in detail. Use getSessionConfig to review the system prompt and available tools.

Be specific in your analysis. Reference concrete trace entries by index. When suggesting improvements, explain what you observed and what change would address it.`

const activeChatTab = ref<'session' | 'evaluation'>('session')

const evaluatorChat = tracingEnabled && recorder
  ? useAgentChat({
    accountType: props.accountType,
    accountId: props.accountId,
    localTools: buildEvaluatorTools(recorder),
    modelName: 'evaluator',
    systemPrompt: EVALUATOR_PROMPT
  })
  : null

const activeMessages = computed(() => {
  if (activeChatTab.value === 'evaluation' && evaluatorChat) {
    return evaluatorChat.messages.value
  }
  return chat.messages.value
})

const activeStatus = computed(() => {
  if (activeChatTab.value === 'evaluation' && evaluatorChat) {
    return evaluatorChat.status.value
  }
  return chat.status.value
})

const activeError = computed(() => {
  if (activeChatTab.value === 'evaluation' && evaluatorChat) {
    return evaluatorChat.error.value
  }
  return chat.error.value
})

const activeSendMessage = computed(() => {
  if (activeChatTab.value === 'evaluation' && evaluatorChat) {
    return evaluatorChat.sendMessage
  }
  return chat.sendMessage
})

const activeAbort = computed(() => {
  if (activeChatTab.value === 'evaluation' && evaluatorChat) {
    return evaluatorChat.abort
  }
  return chat.abort
})

const messages = computed(() => activeMessages.value)
const isStreaming = computed(() => activeStatus.value === 'streaming')
const chatError = computed(() => activeError.value)

const showInfoDialog = ref(false)
const showDebugDialog = ref(false)
const messagesRef = ref<InstanceType<typeof AgentChatMessages> | null>(null)

// Track tools changes for visual activation on "i" button
const toolsChanged = ref(false)
let toolsChangedTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => chat.toolsVersion.value, () => {
  toolsChanged.value = true
  if (toolsChangedTimeout) clearTimeout(toolsChangedTimeout)
  toolsChangedTimeout = setTimeout(() => {
    toolsChanged.value = false
  }, 3000)
})

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
  sessionStorage.removeItem('df-agent-pending-action')
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
  const newSystemPrompt = finalSystemPrompt.value + '\n\n' + hiddenContext

  if (recorder) {
    recorder.setSystemPrompt(newSystemPrompt)
  }

  actionVisiblePrompt.value = visiblePrompt
  sessionClearedMessage.value = null

  // Reset the chat with the new system prompt (clears messages and history)
  chat.reset(newSystemPrompt)

  // Send the visible prompt — this adds it to messages + history and triggers the LLM
  chat.sendMessage(visiblePrompt)
}

function handleSessionCleared () {
  sessionClearedMessage.value = 'This assistance session has ended because you navigated away from the action.'
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

// Auto-scroll to bottom on new messages
watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    const container = messagesRef.value?.messagesContainer
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
)

// Also scroll during streaming (content updates)
watch(
  () => messages.value[messages.value.length - 1]?.content,
  async () => {
    await nextTick()
    const container = messagesRef.value?.messagesContainer
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
)

// Agent summary via summarizer model
const agentSummary = ref('')
const summaryLoading = ref(false)
let lastSummaryToolsVersion = -1

watch(showInfoDialog, async (open) => {
  if (!open) return
  if (lastSummaryToolsVersion === chat.toolsVersion.value && agentSummary.value) return

  lastSummaryToolsVersion = chat.toolsVersion.value
  summaryLoading.value = true

  try {
    const toolDescriptions = Object.entries(chat.tools.value).map(([name, t]) => {
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

    const result = await $fetch(`/summary/${props.accountType}/${props.accountId}`, {
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
  return Object.entries(chat.tools.value).map(([name, t]) => ({
    name,
    title: (t as any).title,
    description: (t as any).description ?? '',
    inputSchema: (t as any).inputSchema?.jsonSchema ?? {}
  }))
})

const toolTitle = (toolName: string) => {
  const t = chat.tools.value[toolName] as any
  return t?.title || toolName
}

const handleSend = (userMessage: string) => {
  if (isStreaming.value) return
  activeSendMessage.value(userMessage)
}

const handleAbort = () => {
  activeAbort.value()
}

// Trace tab support
const traceOverview = computed<TraceOverviewEntry[]>(() => {
  if (!recorder) return []
  // Trigger re-computation when messages change or when a turn completes
  // (status changes to 'ready' after recorder.addStepMessages is called)
  // eslint-disable-next-line no-void
  void chat.messages.value.length
  // eslint-disable-next-line no-void
  void chat.status.value
  return recorder.getTraceOverview()
})
</script>

<style scoped>
.agent-chat {
  height: 100%;
  overflow: hidden;
}
</style>
