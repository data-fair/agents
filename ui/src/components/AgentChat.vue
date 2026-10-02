<template>
  <v-card
    class="agent-chat d-flex flex-column"
    :border="0"
  >
    <agent-chat-header
      :is-admin="isAdmin"
      :title="chatTitle"
      :elevated="headerElevated"
      @show-debug="showDebugDialog = true"
      @reset="handleReset"
    />

    <template v-if="messages.length">
      <agent-chat-messages
        :messages="messages"
        :is-streaming="isStreaming"
        :activity="activity"
        :sub-agent-activities="subAgentActivities"
        :chat-error="chatError"
        :welcome-text="t('welcome')"
        :tool-title="toolTitle"
        :action-visible-prompt="actionVisiblePrompt"
        :mermaid-enabled="mermaidEnabled"
        :simple-sub-agents="simpleSubAgentsEnabled"
        :show-reasoning="showReasoningEnabled"
        @navigate="url => sendDFrameMessage({ type: 'navigate', url })"
        @fix-mermaid="handleFixMermaid"
        @mermaid-error="handleMermaidError"
        @update:scrolled="value => headerElevated = value"
      />

      <agent-chat-input
        :is-streaming="isStreaming"
        :waiting-for-user="isWaitingForUser"
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
      :host-context="hostContext"
      :debug-tools-partition="debugToolsPartition"
      :conversation-id="chat.conversationId.value"
      :is-admin="isAdmin"
      :account-type="accountType"
      :account-id="accountId"
      :tool-exploration="explorationEnabled"
      :sub-agents="subAgentsEnabled"
      :simple-sub-agents="simpleSubAgentsEnabled"
      :mermaid="mermaidEnabled"
      :show-reasoning="showReasoningEnabled"
      @update:tool-exploration="handleToolExploration"
      @update:sub-agents="handleSubAgents"
      @update:simple-sub-agents="handleSimpleSubAgents"
      @update:mermaid="handleMermaid"
      @update:show-reasoning="handleShowReasoning"
    />

    <trace-consent-sheet />
  </v-card>
</template>

<i18n lang="yaml">
fr:
  welcome: Comment puis-je vous aider ?
  moderationRefusal: "Ce message a été refusé par la modération de contenu — il semble sortir du cadre de ce que cet assistant peut faire. Reformulez votre demande si vous pensez qu'il s'agit d'une erreur."
  fixMermaidVisible: "Corrige le diagramme qui n'a pas pu s'afficher."
  fixMermaidAuto: "Le diagramme n'a pas pu s'afficher, correction automatique en cours…"
en:
  welcome: How can I help you?
  moderationRefusal: "This message was declined by content moderation — it appears to fall outside what this assistant is meant to help with. Try rephrasing if you think this is a mistake."
  fixMermaidVisible: "Please fix the diagram that failed to render."
  fixMermaidAuto: "The diagram failed to render, fixing it automatically…"
</i18n>

<script lang="ts" setup>
import { createToolTitleMemo } from '../composables/tool-titles'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSession } from '@data-fair/lib-vue/session.js'
import { useVueRouterDFrameContent } from '@data-fair/frame/lib/vue-router/d-frame-content.js'
import { useSessionChat } from '~/composables/use-session-chat'
import type { ChatMessage } from '~/utils/chat-message'
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
import { canSendNow } from '~/composables/chat-send'
import { $apiPath } from '~/context'

const props = defineProps<{
  isAdmin?: boolean
  title?: string
  /**
   * Which standard agent to talk to, by id. Replaces the former `systemPrompt` prop.
   *
   * Not yet consulted on THIS path: the browser loop assembles its own instructions and sends them to
   * the gateway as `system`, so the gateway's client has full control of them by construction and no
   * prop here can take that away. The id is carried so hosts migrate once; it becomes load-bearing when
   * this component is pointed at the server-held session, which resolves the persona itself.
   */
  agentId?: string
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
const chatTitle = computed(() => initConfig?.title ?? props.title)

const { t } = useI18n()
const session = useSession()

/**
 * Facts about this surface, in ENGLISH and not through i18n.
 *
 * They are addressed to the model, not to the person, and they used to be localized — which meant the
 * assistant's instructions themselves differed by UI language, so a French user and an English user
 * got measurably different behaviour from the same build. The person's language travels as its own
 * fact (`language` below) and the model answers in it; how it should format is one instruction for
 * everyone.
 */
const NARROW_SURFACE = 'a narrow chat widget: keep answers compact, with short paragraphs and simple bullet lists, and avoid tables, wide code blocks and verbose output'

const MERMAID_SUPPORT = [
  'this host renders Mermaid fenced code blocks (```mermaid), so diagrams and charts may be used in answers.',
  'Prefer simple XY charts (xychart-beta) for quantitative data such as trends and comparisons, and only use a diagram when it genuinely aids understanding — otherwise answer with prose or a table.',
  // The guardrail, carried over verbatim in substance: it is the part that stops a chart from
  // inventing its own data, which is the failure that makes a chart worse than no chart.
  "A chart's values must come from data actually queried with the tools — never invented, estimated, or placeholder numbers; without the values, do not draw the chart.",
  'XY charts follow this exact syntax:\n```mermaid\nxychart-beta\n  title "Revenue"\n  x-axis [jan, feb, mar]\n  y-axis "USD" 0 --> 100\n  bar [20, 50, 90]\n  line [20, 50, 90]\n```'
].join(' ')

/**
 * The context this chat's surroundings add, reported as HOST STATE rather than spliced into a prompt.
 *
 * It used to be concatenated onto a client-built system prompt. The prompt is the server's now, and
 * the server does not know any of this — the person's language, which organization they are in, that
 * the chat is a narrow strip rather than a page, whether this host renders diagrams. So it travels on
 * the channel that exists for exactly this: facts the page knows and the model needs.
 *
 * This is a better home than the prompt was, for a reason worth recording: these are OBSERVATIONS
 * about the situation, and they change while a conversation is open. Someone widening the drawer or
 * switching language used to need a conversation reset for the prompt to be uniform; as state, the
 * next turn simply sees the new value.
 *
 * The user's NAME stays out, as it did before: it has no bearing on the assistant's behaviour and it
 * is a privacy concern to hand to a provider.
 */
const hostContext = computed<Record<string, string | null>>(() => {
  const orgName = session.state.account?.name
  const depName = session.state.account?.departmentName
  return {
    language: session.state.lang || 'fr',
    organization: props.accountType === 'organization' && orgName
      ? (depName ? `${orgName}, department ${depName}` : orgName)
      : null,
    // Null WITHDRAWS the fact, which is the difference between "this chat is a wide page" and "nobody
    // said how wide it is" — only the first should make the assistant stop keeping its answers narrow.
    surface: props.narrowViewport ? NARROW_SURFACE : null,
    diagrams: mermaidEnabled.value ? MERMAID_SUPPORT : null
  }
})

// Experimental chat flags, persisted in a service-scoped cookie (see agent-flags.ts)
// and toggled from the debug dialog's Settings tab. subAgents is ON by default;
// turning it off is the "flatten" mode (every sub-agent tool exposed directly).
const initialFlags = readFlags()
const explorationEnabled = ref(initialFlags.toolExploration)
const subAgentsEnabled = ref(initialFlags.subAgents)
const simpleSubAgentsEnabled = ref(initialFlags.simpleSubAgents)
const mermaidEnabled = ref(initialFlags.mermaid)
const showReasoningEnabled = ref(initialFlags.showReasoning)

const chatResult = useSessionChat({
  accountType: props.accountType,
  accountId: props.accountId,
  ...(props.agentId ? { agentId: props.agentId } : {}),
  initialMessages: props.initialMessages,
  ...(chatTitle.value ? { title: chatTitle.value } : {})
})

if (!chatResult) {
  throw new Error('Chat not supported in SSR')
}
// chatResult is guaranteed to be defined after the throw guard above
// but TypeScript doesn't narrow across script setup scope, so we re-bind
const chat = chatResult

// Reported on attach and whenever it changes. `immediate` matters: the first turn is the one most
// likely to ask "what is this?", and a report that only fired on CHANGE would leave that turn blind.
watch(hostContext, context => { chat.reportHostState(context) }, { immediate: true, deep: true })

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
const isWaitingForUser = computed(() => chat.isWaitingForUser.value)
const subAgentActivities = computed(() => chat.subAgentActivities.value)
const chatError = computed(() => chat.error.value)

const showDebugDialog = ref(false)

// Raised header shadow, toggled by the messages transcript's scroll position.
const headerElevated = ref(false)

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
    simpleSubAgents: simpleSubAgentsEnabled.value,
    mermaid: mermaidEnabled.value,
    showReasoning: showReasoningEnabled.value
  }, $apiPath)
}

// Tool exploration and sub-agent flattening are the two flags the server-held loop does not take
// from the client. Exploration is shelved; flattening is the loop's own decision now. The flags are
// still persisted — the debug dialog shows them — but the conversation reset is what used to apply
// them here, and resetting for a setting that no longer reaches the loop would throw the transcript
// away for nothing.
function handleToolExploration (enabled: boolean) {
  explorationEnabled.value = enabled
  persistFlags()
}

function handleSubAgents (enabled: boolean) {
  subAgentsEnabled.value = enabled
  persistFlags()
}

function handleSimpleSubAgents (enabled: boolean) {
  simpleSubAgentsEnabled.value = enabled
  persistFlags()
  // Presentation-only: no conversation reset (unlike mermaid/subAgents/toolExploration).
}

function handleMermaid (enabled: boolean) {
  mermaidEnabled.value = enabled
  persistFlags()
  // No reset: the mermaid instruction used to be part of the client-built system prompt, so the
  // conversation had to restart for it to be uniform. The prompt is the server's now and this flag is
  // render-only here.
}

function handleShowReasoning (enabled: boolean) {
  // Render-only preference: reasoning is always captured onto the message, so this
  // just toggles the panel's visibility. No conversation reset — existing reasoning
  // panels appear/disappear reactively and the change is fully reversible.
  showReasoningEnabled.value = enabled
  persistFlags()
}

function handleReset () {
  chat.abort()
  chat.reset()
  actionVisiblePrompt.value = null
  sessionStarted.value = false
  // The transcript is gone; drop the scroll-driven header shadow until it scrolls again.
  headerElevated.value = false
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

// A declared wait is the user's turn even though the stream is still open: tell the
// host so its FAB shows the same "your move" colour as a finished turn.
watch(() => chat.activity.value?.kind === 'waiting', (waiting) => {
  if (chat.status.value !== 'streaming') return
  sendDFrameMessage({ type: 'agent-status', status: waiting ? 'waiting-user' : 'working' })
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

// Memoised: a page's tools are unregistered when it unmounts, and without this
// a chip already in the scrollback would turn back into its raw snake_case name,
// rewriting what the person read minutes ago.
const toolTitle = createToolTitleMemo((toolName: string) => (chat.tools.value[toolName] as any)?.title)

// What someone typed while the turn was busy, waiting for it to stop being busy.
// Dropping it is what this replaces: a judged simulation lost six of its nine
// turns to messages that went nowhere and said nothing. The composer only offers
// Send while a wait is armed, so a person rarely meets the guard — but the flag
// can flip between the button being found and the click landing, and the message
// fell into that gap.
const queuedUserMessage = ref<string | null>(null)

const deliver = (userMessage: string) => {
  mermaidAutoFixBudget.value = MERMAID_AUTO_FIX_BUDGET
  chat.sendMessage(userMessage)
}

const handleSend = (userMessage: string) => {
  // A turn paused on a declared wait is interruptible: sendMessage settles the
  // wait and takes the turn back. Any other streaming turn is genuinely working,
  // so the message waits its turn rather than being lost.
  if (!canSendNow(isStreaming.value, isWaitingForUser.value)) {
    queuedUserMessage.value = userMessage
    return
  }
  deliver(userMessage)
}

watch([isStreaming, isWaitingForUser], () => {
  const queued = queuedUserMessage.value
  if (!queued) return
  if (!canSendNow(isStreaming.value, isWaitingForUser.value)) return
  queuedUserMessage.value = null
  deliver(queued)
})

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
