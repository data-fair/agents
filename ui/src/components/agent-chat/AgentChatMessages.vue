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
          <div
            v-if="!isHiddenExploreStep(message)"
            class="px-2 py-1 px-sm-4 py-sm-2"
          >
            <div
              v-if="message.role === 'user'"
              class="d-flex justify-end"
            >
              <v-card
                class="pa-3 text-body-medium rounded-xl"
                :class="{ 'bg-surface': !isActionPrompt(message) }"
                color="secondary"
                :variant="isActionPrompt(message) ? 'flat' : 'outlined'"
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
              <markdown-content
                class="assistant-content markdown-content"
                :content="message.content"
                :streaming="isStreaming && index === messages.length - 1"
                :mermaid="mermaidEnabled"
                @mermaid-error="failures => emit('mermaid-error', { index, failures })"
              />
              <div
                v-if="hasVisibleTools(message) || isExploring(message)"
                class="mt-2"
              >
                <template
                  v-for="invocation in message.toolInvocations"
                  :key="invocation.toolCallId"
                >
                  <v-chip
                    v-if="!invocation.toolName.startsWith('subagent_') && invocation.toolName !== EXPLORE_TOOL_NAME"
                    size="x-small"
                    :color="invocation.state === 'done' ? 'success' : 'warning'"
                    variant="tonal"
                    class="mr-1 mb-1"
                  >
                    {{ toolTitle(invocation.toolName) }}
                  </v-chip>
                </template>
                <!-- explore_tools is an internal step (deciding which tool to use): show a
                   placeholder skeleton chip while it runs; the real tool's chip then takes
                   its place in the next assistant message. The explore_tools name is never shown. -->
                <v-skeleton-loader
                  v-if="isExploring(message)"
                  type="chip"
                  :aria-label="t('findingTool')"
                  data-testid="explore-skeleton"
                  class="agent-chat__tool-skeleton d-inline-flex"
                />
              </div>
              <!-- Sub-agent expandable sections -->
              <div
                v-if="message.toolInvocations?.some(ti => ti.toolName.startsWith('subagent_'))"
                class="mt-2"
              >
                <v-expansion-panels
                  :model-value="openPanelFor(index)"
                  variant="accordion"
                  density="compact"
                  flat
                  tile
                  class="agent-chat__subagent-panels border-secondary border-s-sm border-opacity-100"
                  @update:model-value="(v: unknown) => setOpenPanel(index, v as number | undefined)"
                >
                  <v-expansion-panel
                    v-for="invocation in message.toolInvocations.filter(ti => ti.toolName.startsWith('subagent_'))"
                    :key="invocation.toolCallId"
                    density="compact"
                  >
                    <v-expansion-panel-title class="text-body-medium py-1">
                      <v-icon
                        size="x-small"
                        :color="invocation.state === 'done' ? 'success' : 'warning'"
                        class="mr-2"
                        :icon="invocation.state === 'done' ? mdiCheck : mdiLoading"
                        :class="{ 'agent-chat__spin': invocation.state !== 'done' }"
                      />
                      <span class="font-weight-medium">{{ subAgentTitle(invocation.toolName) }}</span>
                      <span
                        v-if="message.subAgentTurn"
                        class="text-medium-emphasis ml-1"
                      >(tour {{ message.subAgentTurn + 1 }})</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div
                        v-if="message.subAgentMessages?.length"
                      >
                        <div
                          v-for="(subMsg, subIdx) in message.subAgentMessages"
                          :key="subIdx"
                          class="py-1"
                        >
                          <markdown-content
                            class="text-body-medium markdown-content"
                            :content="subMsg.content"
                            :streaming="isStreaming && index === messages.length - 1 && subIdx === message.subAgentMessages!.length - 1 && invocation.state !== 'done'"
                            :mermaid="mermaidEnabled"
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
                        v-else-if="invocation.state === 'done'"
                        class="text-body-medium text-medium-emphasis"
                      >
                        {{ t('subAgentDone') }}
                      </div>
                      <!-- Live phase of this sub-agent, shown inside its open panel
                           (the running pane is open anyway). Replaces the bottom line
                           for sub-agent work; the panel title still spins if collapsed. -->
                      <div
                        v-if="isStreaming && index === messages.length - 1 && subAgentActivityLabel(invocation.toolName)"
                        class="d-flex align-center text-caption text-medium-emphasis py-1"
                        data-testid="subagent-activity"
                      >
                        <v-icon
                          :icon="mdiLoading"
                          size="x-small"
                          class="agent-chat__spin mr-2"
                        />
                        <span class="font-italic">{{ subAgentActivityLabel(invocation.toolName) }}</span>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </div>
          </div>
        </template>

        <!-- Discreet activity line: one muted label naming the current phase
             (compacting / thinking / analyzing a tool result) instead of an
             ambiguous skeleton. Shown only during a gap with no visible output —
             while text streams, `activity` is null and the markdown cursor is the
             progress signal. -->
        <div
          v-if="isStreaming && activityLabel"
          class="px-2 py-1 px-sm-4 py-sm-2 d-flex align-center text-caption text-medium-emphasis"
          data-testid="chat-activity"
        >
          <v-icon
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
  jumpToBottom: Aller en bas
  findingTool: Recherche de l'outil adapté…
  activityCompacting: Compression de la conversation…
  activityThinking: Réflexion…
  activityAnalyzing: Analyse du résultat de l'outil…
  activityAnalyzingSubAgent: Analyse du résultat de {name}…
  activitySubAgentStarting: Démarrage…
  activitySubAgentThinking: Réflexion…
  activitySubAgentTool: Exécution d'un outil…
  activitySubAgentAnalyzing: Analyse du résultat de l'outil…
en:
  reasoning: Reasoning
  subAgentDone: Sub-agent finished.
  jumpToBottom: Jump to bottom
  findingTool: Finding the right tool…
  activityCompacting: Compacting conversation…
  activityThinking: Thinking…
  activityAnalyzing: Analyzing tool result…
  activityAnalyzingSubAgent: Analyzing {name}'s result…
  activitySubAgentStarting: Starting…
  activitySubAgentThinking: Thinking…
  activitySubAgentTool: Running a tool…
  activitySubAgentAnalyzing: Analyzing tool result…
</i18n>

<script lang="ts" setup>
import { ref, reactive, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAutoScrollBottom } from '@data-fair/lib-vue/auto-scroll-bottom.js'
import { mdiCheck, mdiLoading, mdiArrowDown, mdiBrain } from '@mdi/js'
import { streamedLength, latestSubAgentPanel } from './auto-scroll'
import MarkdownContent from './MarkdownContent.vue'
import { EXPLORE_TOOL_NAME } from '~/composables/tool-exploration'
import type { MermaidFailure } from '~/utils/mermaid'
import type { ChatMessage } from '~/composables/use-agent-chat'
import { activityLabelKey, type ChatActivity } from '~/composables/agent-activity'

const emit = defineEmits<{
  navigate: [url: string]
  'fix-mermaid': [payload: { source: string, error: string }]
  // Forwarded only for top-level assistant messages, carrying the message index so the
  // parent can confirm it is the latest before firing a bounded automatic fix.
  'mermaid-error': [payload: { index: number, failures: MermaidFailure[] }]
}>()

const props = defineProps<{
  messages: ChatMessage[]
  isStreaming: boolean
  // Coarse phase of the current streaming turn, shown as a discreet muted line
  // during gaps with no visible output. null while text streams or when idle.
  activity?: ChatActivity | null
  chatError: string | null
  welcomeText: string
  toolTitle: (toolName: string) => string
  actionVisiblePrompt: string | null
  mermaidEnabled: boolean
  // Render reasoning-model "thinking" as a foldable panel; when false the panel is
  // omitted entirely (compact mode), leaving only the live "Thinking…" activity line.
  showReasoning: boolean
}>()

const isActionPrompt = (message: ChatMessage) => {
  return message.role === 'user' && props.actionVisiblePrompt === message.content
}

// explore_tools is an internal "which tool should I use?" step. It is never shown as a
// named chip; instead a skeleton placeholder chip is shown while it runs, and the
// resolved explore-only message bubble is hidden so the real tool chip (emitted in the
// next assistant message) appears in its place.
const isExploring = (message: ChatMessage) =>
  !!message.toolInvocations?.some(ti => ti.toolName === EXPLORE_TOOL_NAME && ti.state !== 'done')

const hasVisibleTools = (message: ChatMessage) =>
  !!message.toolInvocations?.some(ti => !ti.toolName.startsWith('subagent_') && ti.toolName !== EXPLORE_TOOL_NAME)

const hasSubAgents = (message: ChatMessage) =>
  !!message.toolInvocations?.some(ti => ti.toolName.startsWith('subagent_'))

// A finished explore-only step (no text, no other tool calls): hide the empty bubble.
const isHiddenExploreStep = (message: ChatMessage) =>
  message.role === 'assistant' &&
  !message.content?.trim() &&
  !!message.toolInvocations?.some(ti => ti.toolName === EXPLORE_TOOL_NAME) &&
  !isExploring(message) &&
  !hasVisibleTools(message) &&
  !hasSubAgents(message)

const { t } = useI18n()

// Bottom-line label: top-level phases only. Sub-agent phases (kind 'subagent')
// render inside their panel via subAgentActivityLabel, not here.
const activityLabel = computed(() => {
  const a = props.activity
  if (!a || a.kind === 'subagent') return ''
  const label = activityLabelKey(a)
  if (!label) return ''
  return t(label.key, label.name ? { name: subAgentTitle(label.name) } : {})
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
const updateAtBottom = () => {
  const el = messagesContainer.value
  atBottom.value = !el || el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD
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

// Open sub-agent panel per message index. In autoscroll (following) mode only
// the LAST message may keep a panel open, and only when it ends on a sub-agent:
// as soon as a newer message arrives behind it (another sub-agent or a plain
// text turn) the previous message's panel is closed. So a conversation that ends
// on a sub-agent leaves it open; one that ends on text leaves everything closed.
// Within a message the accordion still holds a single open index, so a newer
// sub-agent in the same message collapses the previous one. Gated on `following`:
// once the user scrolls up to read history we stop touching panels entirely
// (their manual open/close holds) until they jump back to the bottom.
const openPanels = reactive<Record<number, number | undefined>>({})
const openPanelFor = (index: number) => openPanels[index]
const setOpenPanel = (index: number, v: number | undefined) => { openPanels[index] = v }
watch(
  () => [props.messages.length, latestSubAgentPanel(props.messages[props.messages.length - 1])] as const,
  ([length, panel]) => {
    if (!following.value) return
    for (const key in openPanels) delete openPanels[key]
    if (panel !== undefined) openPanels[length - 1] = panel
  },
  { immediate: true }
)

const subAgentTitle = (toolName: string) => {
  const title = props.toolTitle(toolName)
  if (title !== toolName) return title
  const name = toolName.replace(/^subagent_/, '')
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// In-panel label for the sub-agent whose `subagent_*` tool name matches the
// current activity; '' for any other panel.
const subAgentActivityLabel = (toolName: string) => {
  const a = props.activity
  if (!a || a.kind !== 'subagent' || a.name !== toolName) return ''
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

/* explore_tools placeholder: a small chip-shaped skeleton sized to match the
   x-small tool chips it stands in for. */
.agent-chat-message .agent-chat__tool-skeleton {
  vertical-align: middle;
}
.agent-chat-message .agent-chat__tool-skeleton .v-skeleton-loader__chip {
  width: 72px;
  height: 20px;
  margin: 0 4px 4px 0;
}

.agent-chat-message .agent-chat__subagent-panels .v-expansion-panel-text__wrapper {
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 0px;
  padding-bottom: 0px;
}

.agent-chat-message .agent-chat__subagent-panels .v-expansion-panel-title.v-expansion-panel-title--active {
  min-height: 48px;
}

@keyframes agent-chat-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
