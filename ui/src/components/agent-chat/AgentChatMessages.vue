<template>
  <div
    class="agent-chat-messages-wrapper flex-grow-1 d-flex flex-column"
    style="position: relative; min-height: 0"
  >
    <div
      ref="messagesContainer"
      class="flex-grow-1 overflow-y-auto agent-chat-message"
      style="min-height: 0"
      @click="onContentClick"
      @scroll="updateAtBottom"
    >
      <!-- Welcome message -->
      <div
        v-if="!messages.length"
        class="d-flex align-center justify-center fill-height"
      >
        <p class="text-body-medium text-medium-emphasis px-4 text-center">
          {{ welcomeText }}
        </p>
      </div>

      <div ref="messagesContent">
        <!-- Chat messages -->
        <template
          v-for="(message, index) in messages"
          :key="index"
        >
          <div class="px-2 py-1 px-sm-4 py-sm-2">
            <div
              v-if="message.role === 'user'"
              class="d-flex justify-end"
            >
              <v-card
                class="px-3 py-2 text-body-medium agent-chat__user-bubble"
                :color="isActionPrompt(message) ? 'accent' : 'secondary'"
                variant="flat"
              >
                {{ message.content }}
              </v-card>
            </div>
            <div
              v-else
              class="text-body-medium"
            >
              <!-- Reasoning ("thinking") from reasoning models: collapsed panel
                   above the answer it produced. Only when the user opts into full
                   reasoning display; otherwise the transient "Thinking…" activity
                   line is the sole feedback and nothing persists. -->
              <v-expansion-panels
                v-if="showReasoning && message.reasoning && message.reasoning.trim()"
                variant="accordion"
                density="compact"
                flat
                tile
                class="agent-chat__reasoning-panel mb-2 border-secondary border-s-sm border-opacity-100"
              >
                <v-expansion-panel>
                  <v-expansion-panel-title class="text-caption text-medium-emphasis py-1">
                    <v-icon
                      size="x-small"
                      :icon="mdiBrain"
                      class="mr-2"
                    />
                    {{ t('reasoning') }}
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="text-caption text-medium-emphasis agent-chat__reasoning-text">
                      {{ message.reasoning }}
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
              <!-- In the order it happened: the calls a step made show between the text before and after them. -->
              <template
                v-for="(block, blockIndex) in messageBlocks[index]"
                :key="blockIndex"
              >
                <markdown-content
                  v-if="block.type === 'text'"
                  class="assistant-content markdown-content"
                  :content="block.text"
                  :streaming="isStreaming && index === messages.length - 1 && blockIndex === messageBlocks[index].length - 1"
                  :mermaid="mermaidEnabled"
                  @mermaid-error="failures => emit('mermaid-error', { index, failures })"
                />
                <template v-else>
                  <div
                    v-if="hasVisibleTools(block.invocations)"
                    class="mt-2"
                  >
                    <template
                      v-for="invocation in block.invocations"
                      :key="invocation.toolCallId"
                    >
                      <approval-card
                        v-if="invocation.state === 'awaiting-approval' && invocation.approvalId"
                        :tool-name="invocation.toolName"
                        :tool-title="invocation.toolTitle"
                        :description="invocation.description"
                        :files="invocation.files"
                        :input="invocation.input"
                        :server-id="invocation.serverId"
                        :agent-path="agentPath"
                        :locked="!!invocation.approvalLocked"
                        :failure="chatError"
                        :readonly="readonly"
                        @decide="decision => emit('decide-approval', { approvalId: invocation.approvalId!, ...decision })"
                      />
                      <v-chip
                        v-else-if="simpleSubAgents || !isNestedWork(invocation.toolName)"
                        size="small"
                        :color="chipColor(invocation)"
                        variant="outlined"
                        class="mr-1 mb-1"
                        :data-testid="invocation.toolName.startsWith('subagent_') ? 'subagent-chip' : 'tool-chip'"
                        :append-icon="showToolDetails ? (detailOpen[invocation.toolCallId] ? mdiChevronUp : mdiChevronDown) : undefined"
                        @click="showToolDetails && toggleDetail(invocation.toolCallId)"
                      >
                        {{ chipLabel(invocation) }}
                      </v-chip>
                    </template>
                    <template v-if="showToolDetails">
                      <tool-call-detail
                        v-for="invocation in openDetails(block.invocations, '')"
                        :key="invocation.toolCallId"
                        :invocation="invocation"
                      />
                    </template>
                  </div>
                  <!-- Full sub-agent panels (when the simplify flag is off): each
                       delegation is its own v-alert box, collapsed by default, with
                       its live activity shown in the header even while collapsed. -->
                  <div
                    v-if="!simpleSubAgents && subAgentInvocations(block.invocations).length"
                    class="mt-2"
                  >
                    <div
                      v-for="invocation in subAgentInvocations(block.invocations)"
                      :key="invocation.toolCallId"
                      class="agent-chat__subagent mb-2 px-3 py-2 border-sm rounded"
                      :style="{ borderColor: `rgb(var(--v-theme-${invocation.state === 'done' ? 'success' : 'warning'}))` }"
                      data-testid="subagent-panel"
                    >
                      <div
                        class="d-flex align-center agent-chat__subagent-header"
                        data-testid="subagent-panel-header"
                        @click="toggleExpanded(invocation.toolCallId)"
                      >
                        <v-icon
                          :icon="mdiSubdirectoryArrowRight"
                          size="small"
                          class="mr-2 flex-shrink-0"
                          :color="invocation.state === 'done' ? 'success' : 'warning'"
                        />
                        <span class="text-body-medium font-weight-medium">{{ subAgentTitle(invocation.toolName) }}</span>
                        <span
                          v-if="isStreaming && index === messages.length - 1 && subAgentActivityLabel(invocation.toolCallId)"
                          class="d-flex align-center text-caption text-medium-emphasis font-italic ml-2"
                          data-testid="subagent-activity"
                        >
                          <v-icon
                            :icon="mdiLoading"
                            size="x-small"
                            class="agent-chat__spin mr-1"
                          />
                          {{ subAgentActivityLabel(invocation.toolCallId) }}
                        </span>
                        <v-spacer />
                        <v-icon
                          :icon="expanded[invocation.toolCallId] ? mdiChevronUp : mdiChevronDown"
                          size="small"
                        />
                      </div>
                      <v-expand-transition>
                        <div
                          v-show="expanded[invocation.toolCallId]"
                          data-testid="subagent-panel-body"
                          class="mt-2"
                        >
                          <tool-call-detail
                            v-if="showToolDetails"
                            :invocation="invocation"
                            show="input"
                          />
                          <div v-if="message.subAgentPanels?.[invocation.toolCallId]?.messages.length">
                            <div
                              v-for="(subMsg, subIdx) in message.subAgentPanels[invocation.toolCallId].messages"
                              :key="subIdx"
                              class="py-1"
                            >
                              <markdown-content
                                class="text-body-medium markdown-content"
                                :content="subMsg.content"
                                :streaming="isStreaming && index === messages.length - 1 && subIdx === message.subAgentPanels[invocation.toolCallId].messages.length - 1 && invocation.state !== 'done'"
                                :mermaid="mermaidEnabled"
                              />
                              <div
                                v-if="subMsg.toolInvocations?.length"
                                class="mt-1"
                              >
                                <v-chip
                                  v-for="subInv in subMsg.toolInvocations"
                                  :key="subInv.toolCallId"
                                  size="small"
                                  :color="chipColor(subInv)"
                                  variant="outlined"
                                  class="mr-1 mb-1"
                                  data-testid="nested-tool-chip"
                                  :append-icon="showToolDetails ? (detailOpen[`${invocation.toolCallId}/${subInv.toolCallId}`] ? mdiChevronUp : mdiChevronDown) : undefined"
                                  @click="showToolDetails && toggleDetail(`${invocation.toolCallId}/${subInv.toolCallId}`)"
                                >
                                  {{ toolTitle(subInv.toolName) }}
                                </v-chip>
                                <template v-if="showToolDetails">
                                  <tool-call-detail
                                    v-for="subInv in openDetails(subMsg.toolInvocations, `${invocation.toolCallId}/`)"
                                    :key="subInv.toolCallId"
                                    :invocation="subInv"
                                  />
                                </template>
                              </div>
                            </div>
                          </div>
                          <div
                            v-else-if="invocation.state === 'done' && !showToolDetails"
                            class="text-body-medium text-medium-emphasis"
                          >
                            {{ invocation.toolName === 'code_mode' ? t('scriptDone') : t('subAgentDone') }}
                          </div>
                          <tool-call-detail
                            v-if="showToolDetails"
                            :invocation="invocation"
                            show="output"
                          />
                        </div>
                      </v-expand-transition>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </template>

        <!-- Discreet activity line: one muted label naming the current phase
             (compacting / thinking / analyzing a tool result) instead of an
             ambiguous skeleton. Shown only during a gap with no visible output —
             while text streams, `activity` is null and the markdown cursor is the
             progress signal. A pending wait is the exception that outlives the turn: the
             handover ended it, and the label is what says the next move is the person's. -->
        <div
          v-if="(isStreaming || activity?.kind === 'waiting' || activity?.kind === 'approval') && activityLabel"
          class="px-2 py-1 px-sm-4 py-sm-2 d-flex align-center text-caption text-medium-emphasis"
          data-testid="chat-activity"
          :data-activity="activity?.kind"
        >
          <!-- Still while the turn is stopped on the person: a spinner would say it is working. -->
          <v-icon
            v-if="activity?.kind === 'waiting' || activity?.kind === 'approval'"
            :icon="mdiAccountClock"
            size="x-small"
            class="mr-2"
          />
          <v-icon
            v-else
            :icon="mdiLoading"
            size="x-small"
            class="agent-chat__spin mr-2"
          />
          <span class="font-italic">{{ activityLabel }}</span>
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
    </div>

    <v-btn
      v-if="!atBottom"
      class="agent-chat__jump-to-bottom"
      size="small"
      color="secondary"
      variant="outlined"
      :append-icon="mdiArrowDown"
      @click="jumpToBottom"
    >
      {{ t('jumpToBottom') }}
    </v-btn>
  </div>
</template>

<i18n lang="yaml">
fr:
  reasoning: Raisonnement
  subAgentDone: Sous-agent terminé.
  scriptTitle: Script
  scriptDone: Script terminé.
  jumpToBottom: Aller en bas
  activityCompacting: Compression de la conversation…
  activityThinking: Réflexion…
  activityAnalyzing: Analyse du résultat de l'outil…
  activityAnalyzingSubAgent: Analyse du résultat de {name}…
  activitySubAgentStarting: Démarrage…
  activitySubAgentThinking: Réflexion…
  activitySubAgentTool: Exécution d'un outil…
  activitySubAgentAnalyzing: Analyse du résultat de l'outil…
  activityWaiting: "En attente de votre action…"
  activityApproval: "En attente de votre approbation : {name}"
  waitingChip: "En attente : {name}"
  declinedChip: "Refusé : {name}"
  approvedChip: "Approuvé : {name}"
  waitedChip: "A attendu : {name}"
en:
  reasoning: Reasoning
  subAgentDone: Sub-agent finished.
  scriptTitle: Script
  scriptDone: Script finished.
  jumpToBottom: Jump to bottom
  activityCompacting: Compacting conversation…
  activityThinking: Thinking…
  activityAnalyzing: Analyzing tool result…
  activityAnalyzingSubAgent: Analyzing {name}'s result…
  activitySubAgentStarting: Starting…
  activitySubAgentThinking: Thinking…
  activitySubAgentTool: Running a tool…
  activitySubAgentAnalyzing: Analyzing tool result…
  activityWaiting: "Waiting for you…"
  activityApproval: "Awaiting your approval: {name}"
  waitingChip: "Waiting for: {name}"
  declinedChip: "Declined: {name}"
  approvedChip: "Approved: {name}"
  waitedChip: "Waited for: {name}"
</i18n>

<script lang="ts" setup>
import { ref, reactive, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAutoScrollBottom } from '@data-fair/lib-vue/auto-scroll-bottom.js'
import { mdiLoading, mdiAccountClock, mdiArrowDown, mdiSubdirectoryArrowRight, mdiChevronDown, mdiChevronUp, mdiBrain } from '@mdi/js'
import { streamedLength } from './auto-scroll'
import MarkdownContent from './MarkdownContent.vue'
import ApprovalCard from './ApprovalCard.vue'
import ToolCallDetail from './ToolCallDetail.vue'
import { WAIT_TOOL_NAME } from '@agents/shared/agent-activity'
import type { MermaidFailure } from '~/utils/mermaid'
import type { ChatMessage } from '~/utils/chat-message'
import { activityLabelKey, type ChatActivity } from '@agents/shared/agent-activity'

const emit = defineEmits<{
  navigate: [url: string]
  'fix-mermaid': [payload: { source: string, error: string }]
  // Forwarded only for top-level assistant messages, carrying the message index so the
  // parent can confirm it is the latest before firing a bounded automatic fix.
  'mermaid-error': [payload: { index: number, failures: MermaidFailure[] }]
  // True once the transcript is scrolled down from the very top, so the header can
  // raise its elevation (mirrors v-app-bar's scroll-behavior="elevate").
  'update:scrolled': [scrolled: boolean]
  'decide-approval': [payload: { approvalId: string, approved: boolean, reason?: string }]
}>()

const props = withDefaults(defineProps<{
  messages: ChatMessage[]
  isStreaming: boolean
  // Coarse phase of the current streaming turn, shown as a discreet muted line
  // during gaps with no visible output. null while text streams or when idle.
  activity?: ChatActivity | null
  subAgentActivities?: Record<string, ChatActivity>
  chatError: string | null
  welcomeText: string
  toolTitle: (toolName: string) => string
  actionVisiblePrompt: string | null
  mermaidEnabled: boolean
  // Default-on: render delegations as a plain tool chip. Callers that want the
  // full expandable trace (the admin conversation review) pass false.
  simpleSubAgents?: boolean
  // Render reasoning-model "thinking" as a foldable panel; when false the panel is
  // omitted entirely (compact mode), leaving only the live "Thinking…" activity line.
  showReasoning?: boolean
  // The configured agent's API path, where an approval card reads the task a planning call changes.
  agentPath?: string
  // A transcript read by someone who cannot answer it (the admin review, a task run): approval cards
  // show no buttons.
  readonly?: boolean
  // A transcript read to audit it (the admin review, a task run): a call opens on what went in and what
  // came back, and a script's panel shows its source and its value around the calls it made.
  showToolDetails?: boolean
}>(), {
  activity: null,
  subAgentActivities: () => ({}),
  simpleSubAgents: true,
  showReasoning: false,
  agentPath: undefined,
  readonly: false,
  showToolDetails: false
})

const isActionPrompt = (message: ChatMessage) => {
  return message.role === 'user' && props.actionVisiblePrompt === message.content
}

type Invocation = NonNullable<ChatMessage['toolInvocations']>[number]
type RenderedBlock = { type: 'text', text: string } | { type: 'tools', invocations: Invocation[] }
/**
 * Each message's blocks (ChatMessage.blocks), with each call resolved. Without blocks (a message not built
 * from stored parts, like the welcome), the text and then the calls.
 */
const messageBlocks = computed<RenderedBlock[][]>(() => props.messages.map(message => {
  const invocations = message.toolInvocations ?? []
  if (!message.blocks?.length) {
    return [{ type: 'text', text: message.content }, ...(invocations.length ? [{ type: 'tools' as const, invocations }] : [])]
  }
  return message.blocks.map(block => block.type === 'text'
    ? block
    : { type: 'tools', invocations: block.toolCallIds.map(id => invocations.find(i => i.toolCallId === id)).filter((i): i is Invocation => !!i) })
}))

const hasVisibleTools = (invocations: Invocation[]) =>
  invocations.some(ti => props.simpleSubAgents || !isNestedWork(ti.toolName))

const { t } = useI18n()

const pendingApprovalTitle = (toolName: string) => {
  for (const message of props.messages) {
    const pending = message.toolInvocations?.find(ti => ti.toolName === toolName && ti.state === 'awaiting-approval')
    if (pending) return pending.toolTitle ?? props.toolTitle(toolName)
  }
  return props.toolTitle(toolName)
}

// Bottom-line label: top-level phases only. Sub-agent phases (kind 'subagent')
// render inside their panel via subAgentActivityLabel, not here.
const activityLabel = computed(() => {
  const a = props.activity
  if (!a || a.kind === 'subagent') return ''
  const label = activityLabelKey(a)
  if (!label) return ''
  // A pending call is named by the title recorded on it, as its card and chip do — one name.
  if (a.kind === 'approval') return t(label.key, { name: pendingApprovalTitle(a.toolName) })
  // label.name is a subagent_* tool name for 'analyzing' (prettify it into a title) but
  // the model's own free-text words for 'waiting' (show verbatim, don't title-case it).
  return t(label.key, label.name
    ? { name: a.kind === 'waiting' ? label.name : subAgentTitle(label.name) }
    : {})
})

const messagesContainer = ref<HTMLElement | null>(null)
const messagesContent = ref<HTMLElement | null>(null)

// px from the bottom still counted as "at the bottom" — shared by the autoscroll
// re-arm margin and the jump-to-bottom button visibility so they agree.
const BOTTOM_THRESHOLD = 24

// Stick-to-bottom autoscroll on the inner scroll container: follows the
// streaming tail but lets the user scroll up to read history. Shared with
// processings' run log via @data-fair/lib-vue. The growth signal must cover
// sub-agent and tool-chip growth too, otherwise it freezes (and autoscroll
// stops following) whenever a sub-agent — not the parent message — is streaming.
const { following } = useAutoScrollBottom(
  () => messagesContainer.value,
  () => streamedLength(props.messages),
  () => props.isStreaming,
  BOTTOM_THRESHOLD
)

// Whether the scroll container is actually at its bottom. This — not `following`
// — drives the jump-to-bottom button: `following` is a "should auto-pin" intent
// that a wheel-up flips off even when there's nothing below, which would show the
// button wrongly. Recomputed on scroll, on content growth, and — crucially — via
// a ResizeObserver on the content, so it stays correct when the rendered height
// SHRINKS without a scroll (a sub-agent panel collapsing, a turn ending): in that
// case neither a scroll event nor the growth signal fires, so without the
// observer `atBottom` would stay stale-false and show the button with nothing to
// scroll.
const atBottom = ref(true)
// Tracked alongside atBottom (same scroll/resize/growth triggers) so the header can
// elevate once the transcript is no longer pinned to the very top.
const scrolledFromTop = ref(false)
const updateAtBottom = () => {
  const el = messagesContainer.value
  atBottom.value = !el || el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD
  const scrolled = !!el && el.scrollTop > 4
  if (scrolled !== scrolledFromTop.value) {
    scrolledFromTop.value = scrolled
    emit('update:scrolled', scrolled)
  }
}
watch(() => streamedLength(props.messages), updateAtBottom, { flush: 'post' })

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  updateAtBottom()
  resizeObserver = new ResizeObserver(() => updateAtBottom())
  // content height changes (messages/panels growing or collapsing) and viewport
  // height changes (resize) both move the "am I at the bottom" answer
  if (messagesContent.value) resizeObserver.observe(messagesContent.value)
  if (messagesContainer.value) resizeObserver.observe(messagesContainer.value)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

// Pin at turn boundaries.
// - Turn START: if we're at the bottom, (re-)arm `following`. The composable can
//   drop following when content shrinks (panels collapsing at a turn's end), and
//   it only re-arms on a user scroll — so a passive viewer sitting at the bottom
//   would otherwise stop being auto-followed on the next answer.
// - Turn END: `renderStreamingMarkdown` only reveals complete (`\n\n`-terminated)
//   blocks while streaming and renders the last, incomplete block once streaming
//   stops; the composable's pin is gated on isActive, so that final block would
//   land below the fold. Re-pin here (flush:post, after it's in the DOM) when we
//   were following, so the tail of the answer stays in view.
watch(() => props.isStreaming, (streaming) => {
  if (streaming) {
    if (atBottom.value) following.value = true
    return
  }
  if (!following.value) return
  const el = messagesContainer.value
  if (el) el.scrollTop = el.scrollHeight
  updateAtBottom()
}, { flush: 'post' })

// Jump back to the live tail; the smooth scroll fires scroll events that re-arm
// the composable's `following` and flip `atBottom` true (hiding the button).
const jumpToBottom = () => {
  const el = messagesContainer.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
}

// Sub-agent panels are collapsed by default and toggled manually, keyed by the
// delegating toolCallId so concurrent sub-agents expand/collapse independently.
const expanded = reactive<Record<string, boolean>>({})
const toggleExpanded = (toolCallId: string) => { expanded[toolCallId] = !expanded[toolCallId] }
// A script's calls are shown like a worker's: in a panel under the call (api/src/code-mode/code-tools.ts).
const isNestedWork = (toolName: string) => toolName.startsWith('subagent_') || toolName === 'code_mode'
const subAgentInvocations = (invocations: Invocation[]) => invocations.filter(ti => isNestedWork(ti.toolName))

// Open tool details, keyed like the panels; a call inside a panel is prefixed with the panel's call id.
const detailOpen = reactive<Record<string, boolean>>({})
const toggleDetail = (key: string) => { detailOpen[key] = !detailOpen[key] }
const openDetails = (invocations: Invocation[], prefix: string) => invocations.filter(ti =>
  detailOpen[prefix + ti.toolCallId] && (prefix || simpleSubAgentsOrPlain(ti)))
const simpleSubAgentsOrPlain = (ti: Invocation) => props.simpleSubAgents || !isNestedWork(ti.toolName)
// A failed call is 'done' (ChatMessage has no failure state); where details are shown, its chip says it failed.
const chipColor = (ti: Invocation) => props.showToolDetails && ti.errorText !== undefined
  ? 'error'
  : ti.state === 'done' ? 'success' : ti.state === 'denied' ? 'error' : 'warning'

const subAgentTitle = (toolName: string) => {
  if (toolName === 'code_mode') return t('scriptTitle')
  const title = props.toolTitle(toolName)
  if (title !== toolName) return title
  const name = toolName.replace(/^subagent_/, '')
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Chip label for the simplified tool-chip row: sub-agents use their display title,
// plain tools the host-provided tool title, and the built-in wait shows what the
// agent said it is waiting for.
const chipLabel = (invocation: { toolName: string, toolTitle?: string, input?: unknown, state?: string, approved?: true }) => {
  if (invocation.toolName === WAIT_TOOL_NAME) {
    // Past tense once it settles. Every other chip is a noun, so this is the only
    // label that reads as a live instruction — and it stays in history forever. A
    // judged run watched a person read a resolved "Waiting for: User clicks
    // Create" as current page state, conclude the assistant had lied about
    // creating their list, and spend four turns hunting a button that was gone.
    const name = (invocation.input as any)?.expecting ?? ''
    return invocation.state === 'done' ? t('waitedChip', { name }) : t('waitingChip', { name })
  }
  // A title the tool declared (its MCP annotation) first: it is recorded on the call, so it survives a reload.
  const title = invocation.toolTitle ?? props.toolTitle(invocation.toolName)
  if (invocation.state === 'denied') return t('declinedChip', { name: title })
  if (invocation.approved) return t('approvedChip', { name: title })
  return invocation.toolName.startsWith('subagent_') ? subAgentTitle(invocation.toolName) : title
}

// In-panel label for the sub-agent running under `toolCallId`. Reads the
// per-call activity map so concurrent panels each show their own live phase.
const subAgentActivityLabel = (toolCallId: string) => {
  const a = props.subAgentActivities?.[toolCallId]
  if (!a || a.kind !== 'subagent') return ''
  const label = activityLabelKey(a)
  return label ? t(label.key) : ''
}

const inIframe = window.parent !== window

function onContentClick (e: MouseEvent) {
  const target = e.target as HTMLElement
  // The mermaid "fix" button lives in v-html, so it is handled by delegation here.
  const fixBtn = target.closest('[data-mermaid-fix]') as HTMLElement | null
  if (fixBtn) {
    emit('fix-mermaid', {
      source: fixBtn.dataset.mermaidSource ?? '',
      error: fixBtn.dataset.mermaidError ?? ''
    })
    return
  }
  const anchor = target.closest('a[href]')
  if (!anchor) return
  if (!inIframe) return
  // Forward the raw href the model wrote, not the DOM-resolved one: this iframe's URL
  // (/agents/.../chat) is never the link target, so resolving here would corrupt
  // app-relative links. The host resolves it against the embedding app's router base.
  e.preventDefault()
  emit('navigate', anchor.getAttribute('href') ?? (anchor as HTMLAnchorElement).href)
}

</script>

<style>
.agent-chat__jump-to-bottom {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  /* opaque background so the transcript text doesn't bleed through the
     transparent outlined button */
  background-color: rgb(var(--v-theme-surface));
}

.agent-chat-message .assistant-content {
  word-break: break-word;
}

/* User message bubble: strongly rounded, with the corner nearest the sender
   (bottom-right in LTR) softened for the classic "tail" asymmetry. Constrained
   width so long messages don't span the whole column, and no border. */
.agent-chat-message .agent-chat__user-bubble {
  border-radius: 18px;
  border-end-end-radius: 4px;
  max-width: 80%;
  border: none;
}

/* Reasoning panel: muted, monospace-ish, preserves the model's line breaks. */
.agent-chat-message .agent-chat__reasoning-text {
  white-space: pre-wrap;
  word-break: break-word;
}
.agent-chat-message .agent-chat__reasoning-panel .v-expansion-panel-text__wrapper {
  padding: 0 8px 8px;
}

.agent-chat-message .markdown-content ul {
  padding-left: 8px;
  margin-top: 0;
}

.agent-chat-message .agent-chat__spin {
  animation: agent-chat-spin 1s linear infinite;
}

.agent-chat-message .agent-chat__subagent-header {
  cursor: pointer;
}

@keyframes agent-chat-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
