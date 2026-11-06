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
                <!-- A step's reasoning, folded where it happened: one muted line that opens on a click, as
                     other chat UIs keep it. Never open by default — some providers send it raw and long. -->
                <div
                  v-else-if="block.type === 'reasoning'"
                  class="agent-chat__reasoning my-1"
                  data-testid="reasoning"
                >
                  <button
                    type="button"
                    class="d-inline-flex align-center text-caption text-medium-emphasis"
                    :aria-expanded="!!reasoningOpen[`${index}/${blockIndex}`]"
                    @click="toggleReasoning(`${index}/${blockIndex}`)"
                  >
                    <v-icon
                      :icon="mdiBrain"
                      size="x-small"
                      class="mr-1"
                    />
                    {{ t('reasoning') }}
                    <v-icon
                      :icon="reasoningOpen[`${index}/${blockIndex}`] ? mdiChevronUp : mdiChevronDown"
                      size="x-small"
                      class="ml-1"
                    />
                  </button>
                  <div
                    v-if="reasoningOpen[`${index}/${blockIndex}`]"
                    class="text-caption text-medium-emphasis agent-chat__reasoning-text mt-1"
                  >
                    {{ block.text }}
                  </div>
                </div>
                <template v-else-if="block.type === 'tools'">
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
                        :tool-title="invocationTitle(invocation)"
                        :description="invocation.description"
                        :files="invocation.files"
                        :input="invocation.input"
                        :server-id="invocation.serverId"
                        :review="invocation.review"
                        :agent-path="agentPath"
                        :locked="!!invocation.approvalLocked"
                        :failure="chatError"
                        :readonly="readonly"
                        @decide="decision => emit('decide-approval', { approvalId: invocation.approvalId!, ...decision })"
                      />
                      <!-- Where details are shown, one call per line, its detail right under its chip: listed
                           after the whole row, several open calls could not be told apart. -->
                      <div
                        v-else-if="!showTraces || !isTraced(invocation.toolName)"
                        :class="showToolDetails || scriptCalls(message, invocation).length ? 'agent-chat__tool-call' : 'd-inline'"
                      >
                        <tool-chip
                          :invocation="invocation"
                          :label="chipLabel(invocation)"
                          :expandable="showToolDetails"
                          :open="!!detailOpen[invocation.toolCallId]"
                          data-testid="tool-chip"
                          @toggle="toggleDetail(invocation.toolCallId)"
                        />
                        <!-- What a script did is the calls it made: shown under it, without its code, which is
                             for the review page. -->
                        <div
                          v-if="scriptCalls(message, invocation).length"
                          class="agent-chat__script-calls"
                          data-testid="script-calls"
                        >
                          <tool-chip
                            v-for="call in scriptCalls(message, invocation)"
                            :key="call.toolCallId"
                            :invocation="call"
                            :label="chipLabel(call)"
                            data-testid="nested-tool-chip"
                          />
                        </div>
                        <tool-call-detail
                          v-if="showToolDetails && detailOpen[invocation.toolCallId]"
                          class="agent-chat__tool-call-detail"
                          :invocation="invocation"
                        />
                        <!-- The way past a reviewer's denial is the person's own words, which the next review
                             reads: no override button, which would be the reflex click again. -->
                        <span
                          v-if="!readonly && invocation.state === 'denied' && invocation.deniedByReviewer"
                          class="text-caption text-medium-emphasis ms-2"
                          data-testid="reviewer-denied-hint"
                        >{{ t('reviewerDeniedHint') }}</span>
                      </div>
                    </template>
                  </div>
                  <!-- Trace panels (where the transcript is read to audit it): each script
                       is its own box, collapsed by default, with the calls it made inside. -->
                  <div
                    v-if="showTraces && tracedInvocations(block.invocations).length"
                    class="mt-2"
                  >
                    <div
                      v-for="invocation in tracedInvocations(block.invocations)"
                      :key="invocation.toolCallId"
                      class="agent-chat__trace mb-2 px-3 py-2 border-sm rounded"
                      :style="{ borderColor: `rgb(var(--v-theme-${invocation.state === 'done' ? 'success' : 'warning'}))` }"
                      data-testid="trace-panel"
                    >
                      <div
                        class="d-flex align-center agent-chat__trace-header"
                        data-testid="trace-panel-header"
                        @click="toggleExpanded(invocation.toolCallId)"
                      >
                        <v-icon
                          :icon="mdiSubdirectoryArrowRight"
                          size="small"
                          class="mr-2 flex-shrink-0"
                          :color="invocation.state === 'done' ? 'success' : 'warning'"
                        />
                        <span class="text-body-medium font-weight-medium">{{ t('scriptTitle') }}</span>
                        <v-spacer />
                        <v-icon
                          :icon="expanded[invocation.toolCallId] ? mdiChevronUp : mdiChevronDown"
                          size="small"
                        />
                      </div>
                      <v-expand-transition>
                        <div
                          v-show="expanded[invocation.toolCallId]"
                          data-testid="trace-panel-body"
                          class="mt-2"
                        >
                          <tool-call-detail
                            v-if="showToolDetails"
                            :invocation="invocation"
                            show="input"
                          />
                          <div v-if="message.tracePanels?.[invocation.toolCallId]?.messages.length">
                            <div
                              v-for="(subMsg, subIdx) in message.tracePanels[invocation.toolCallId].messages"
                              :key="subIdx"
                              class="py-1"
                            >
                              <markdown-content
                                class="text-body-medium markdown-content"
                                :content="subMsg.content"
                                :streaming="isStreaming && index === messages.length - 1 && subIdx === message.tracePanels[invocation.toolCallId].messages.length - 1 && invocation.state !== 'done'"
                                :mermaid="mermaidEnabled"
                              />
                              <div
                                v-if="subMsg.toolInvocations?.length"
                                class="mt-1"
                              >
                                <div
                                  v-for="subInv in subMsg.toolInvocations"
                                  :key="subInv.toolCallId"
                                  :class="showToolDetails ? 'agent-chat__tool-call' : 'd-inline'"
                                >
                                  <tool-chip
                                    :invocation="subInv"
                                    :label="chipLabel(subInv)"
                                    :expandable="showToolDetails"
                                    :open="!!detailOpen[`${invocation.toolCallId}/${subInv.toolCallId}`]"
                                    data-testid="nested-tool-chip"
                                    @toggle="toggleDetail(`${invocation.toolCallId}/${subInv.toolCallId}`)"
                                  />
                                  <tool-call-detail
                                    v-if="showToolDetails && detailOpen[`${invocation.toolCallId}/${subInv.toolCallId}`]"
                                    class="agent-chat__tool-call-detail"
                                    :invocation="subInv"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div
                            v-else-if="invocation.state === 'done' && !showToolDetails"
                            class="text-body-medium text-medium-emphasis"
                          >
                            {{ t('scriptDone') }}
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
             (compacting / thinking / the call at work / analyzing its result) instead of an
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
  scriptTitle: Script
  scriptDone: Script terminé.
  jumpToBottom: Aller en bas
  activityCompacting: Compression de la conversation…
  activityThinking: Réflexion…
  activityAnalyzing: Analyse du résultat de l'outil…
  activityTool: "{name}…"
  activityWaiting: "En attente de votre action…"
  activityApproval: "En attente de votre approbation : {name}"
  waitingChip: "En attente : {name}"
  declinedChip: "Refusé : {name}"
  cancelledChip: "Annulé : {name}"
  reviewerDeniedChip: "Refusé par le relecteur : {name}"
  reviewerDeniedHint: Si vous voulez que ce soit fait, dites-le à l'agent.
  approvedChip: "Approuvé : {name}"
  waitedChip: "A attendu : {name}"
  toolReadSkill: "Lire le guide : {name}"
  toolReadSkillAny: Lire un guide
  toolCodeMode: Exécuter un script
  toolMemoryView: Consulter la mémoire
  toolMemoryEdit: Mettre à jour la mémoire
  toolFetchUrl: "Consulter {name}"
  toolFetchUrlAny: Consulter une page web
  toolListSitePages: "Lister les pages de {name}"
  toolListSitePagesAny: Lister les pages d'un site
  toolRequestWebAccess: Demander un accès web
  toolRequestMcpAccess: Demander l'accès à des outils
  toolLs: Lister les fichiers
  toolReadFile: "Lire {name}"
  toolReadFileAny: Lire un fichier
  toolWriteFile: "Écrire {name}"
  toolWriteFileAny: Écrire un fichier
  toolGetMyConfiguration: Lire ma configuration
  toolListMyRuns: Lister mes exécutions
  toolReadConversation: Lire une conversation passée
  toolPlanTask: Planifier une tâche
  toolUpdateTask: Modifier une tâche
  toolDeleteTask: Supprimer une tâche
  toolReportOutcome: Rendre compte du résultat
en:
  reasoning: Reasoning
  scriptTitle: Script
  scriptDone: Script finished.
  jumpToBottom: Jump to bottom
  activityCompacting: Compacting conversation…
  activityThinking: Thinking…
  activityAnalyzing: Analyzing tool result…
  activityTool: "{name}…"
  activityWaiting: "Waiting for you…"
  activityApproval: "Awaiting your approval: {name}"
  waitingChip: "Waiting for: {name}"
  declinedChip: "Declined: {name}"
  cancelledChip: "Cancelled: {name}"
  reviewerDeniedChip: "Denied by the reviewer: {name}"
  reviewerDeniedHint: If you want this done, tell the agent so.
  approvedChip: "Approved: {name}"
  waitedChip: "Waited for: {name}"
  toolReadSkill: "Read guide: {name}"
  toolReadSkillAny: Read a guide
  toolCodeMode: Run a script
  toolMemoryView: Read memory
  toolMemoryEdit: Update memory
  toolFetchUrl: "Fetch {name}"
  toolFetchUrlAny: Fetch a web page
  toolListSitePages: "List pages of {name}"
  toolListSitePagesAny: List a site's pages
  toolRequestWebAccess: Request web access
  toolRequestMcpAccess: Request tool access
  toolLs: List files
  toolReadFile: "Read {name}"
  toolReadFileAny: Read a file
  toolWriteFile: "Write {name}"
  toolWriteFileAny: Write a file
  toolGetMyConfiguration: Read my configuration
  toolListMyRuns: List my runs
  toolReadConversation: Read a past conversation
  toolPlanTask: Plan a task
  toolUpdateTask: Update a task
  toolDeleteTask: Delete a task
  toolReportOutcome: Report the outcome
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
import ToolChip from './ToolChip.vue'
import { builtinToolLabel } from '~/utils/builtin-tool-labels'
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
  chatError: string | null
  welcomeText: string
  toolTitle: (toolName: string) => string
  actionVisiblePrompt: string | null
  mermaidEnabled: boolean
  // A script (code_mode) as an expandable panel of the calls it made, where the transcript is read to
  // audit it (the admin review, a task run); a plain tool chip in the chat.
  showTraces?: boolean
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
  showTraces: false,
  agentPath: undefined,
  readonly: false,
  showToolDetails: false
})

const isActionPrompt = (message: ChatMessage) => {
  return message.role === 'user' && props.actionVisiblePrompt === message.content
}

type Invocation = NonNullable<ChatMessage['toolInvocations']>[number]
type RenderedBlock = { type: 'text' | 'reasoning', text: string } | { type: 'tools', invocations: Invocation[] }
/**
 * Each message's blocks (ChatMessage.blocks), with each call resolved. Without blocks (a message not built
 * from stored parts, like the welcome), the text and then the calls.
 */
const messageBlocks = computed<RenderedBlock[][]>(() => props.messages.map(message => {
  const invocations = message.toolInvocations ?? []
  if (!message.blocks?.length) {
    return [{ type: 'text', text: message.content }, ...(invocations.length ? [{ type: 'tools' as const, invocations }] : [])]
  }
  return message.blocks.map(block => block.type !== 'tools'
    ? block
    : { type: 'tools', invocations: block.toolCallIds.map(id => invocations.find(i => i.toolCallId === id)).filter((i): i is Invocation => !!i) })
}))

const hasVisibleTools = (invocations: Invocation[]) =>
  invocations.some(ti => !props.showTraces || !isTraced(ti.toolName))

const { t } = useI18n()

/**
 * What a call is called — on its chip, its approval card and the activity line alike. The service's own
 * tools by what they did and on what (builtin-tool-labels.ts), any other by the title it declared: recorded
 * on the call, so it survives a reload, or else the live registry's.
 */
const invocationTitle = (invocation: { toolName: string, toolTitle?: string, input?: unknown }) => {
  const builtin = builtinToolLabel(invocation.toolName, invocation.input)
  if (builtin) return t(builtin.key, builtin.name ? { name: builtin.name } : {})
  return invocation.toolTitle ?? props.toolTitle(invocation.toolName)
}

/** The title of the latest call by this name in the given state: the activity line names the call it is about. */
const latestCallTitle = (toolName: string, state: Invocation['state']) => {
  for (let i = props.messages.length - 1; i >= 0; i--) {
    const call = [...(props.messages[i].toolInvocations ?? [])].reverse().find(ti => ti.toolName === toolName && ti.state === state)
    if (call) return invocationTitle(call)
  }
  return invocationTitle({ toolName })
}

// The bottom line's label for the current phase.
const activityLabel = computed(() => {
  const a = props.activity
  if (!a) return ''
  const label = activityLabelKey(a)
  if (!label) return ''
  // A pending call is named by the title recorded on it, as its card and chip do — one name.
  if (a.kind === 'approval') return t(label.key, { name: latestCallTitle(a.toolName, 'awaiting-approval') })
  if (a.kind === 'tool') return t(label.key, { name: latestCallTitle(a.toolName, 'pending') })
  // 'waiting' names what the model said it waits for, verbatim.
  return t(label.key, label.name ? { name: label.name } : {})
})

const messagesContainer = ref<HTMLElement | null>(null)
const messagesContent = ref<HTMLElement | null>(null)

// px from the bottom still counted as "at the bottom" — shared by the autoscroll
// re-arm margin and the jump-to-bottom button visibility so they agree.
const BOTTOM_THRESHOLD = 24

// Stick-to-bottom autoscroll on the inner scroll container: follows the
// streaming tail but lets the user scroll up to read history. Shared with
// processings' run log via @data-fair/lib-vue. The growth signal must cover
// trace-panel and tool-chip growth too, otherwise it freezes (and autoscroll
// stops following) whenever a script's trace — not the parent message — is streaming.
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
// SHRINKS without a scroll (a trace panel collapsing, a turn ending): in that
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

const pinToBottom = () => {
  const el = messagesContainer.value
  if (el) el.scrollTop = el.scrollHeight
  updateAtBottom()
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  pinToBottom()
  // While following, any growth stays pinned, as stick-to-bottom chats do: the composable follows streamed
  // text only, but a conversation opens on its latest exchange (its messages arriving after it opens, its
  // diagrams rendering after its text), and the activity line ("Thinking…") or an error are not streamed
  // text. Someone who scrolled up to read is not following, and keeps their place.
  resizeObserver = new ResizeObserver(() => following.value ? pinToBottom() : updateAtBottom())
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
  if (following.value) pinToBottom()
}, { flush: 'post' })

// Jump back to the live tail; the smooth scroll fires scroll events that re-arm
// the composable's `following` and flip `atBottom` true (hiding the button).
const jumpToBottom = () => {
  const el = messagesContainer.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
}

// Trace panels are collapsed by default and toggled manually, keyed by the script's toolCallId so
// several scripts in one message expand and collapse independently.
const expanded = reactive<Record<string, boolean>>({})
const toggleExpanded = (toolCallId: string) => { expanded[toolCallId] = !expanded[toolCallId] }
// A script's calls are shown in a panel under the call (api/src/code-mode/code-tools.ts).
const isTraced = (toolName: string) => toolName === 'code_mode'
const tracedInvocations = (invocations: Invocation[]) => invocations.filter(ti => isTraced(ti.toolName))

// Open tool details, keyed like the panels; a call inside a panel is prefixed with the panel's call id.
const detailOpen = reactive<Record<string, boolean>>({})
const toggleDetail = (key: string) => { detailOpen[key] = !detailOpen[key] }

// A step's reasoning is folded until opened, keyed by message and block.
const reasoningOpen = reactive<Record<string, boolean>>({})
const toggleReasoning = (key: string) => { reasoningOpen[key] = !reasoningOpen[key] }

/** The calls a script made, in order, where the chat shows no trace panel: the chips under its own. */
const scriptCalls = (message: ChatMessage, invocation: Invocation): Invocation[] => {
  if (props.showTraces || !isTraced(invocation.toolName)) return []
  return (message.tracePanels?.[invocation.toolCallId]?.messages ?? []).flatMap(m => m.toolInvocations ?? [])
}

// Chip label: the tool's title, and for the built-in wait what the agent said it is waiting for.
const chipLabel = (invocation: { toolName: string, toolTitle?: string, input?: unknown, state?: string, approved?: true, deniedByReviewer?: true, cancelled?: 'message' | 'page' }) => {
  if (invocation.toolName === WAIT_TOOL_NAME) {
    // Past tense once it settles. Every other chip is a noun, so this is the only
    // label that reads as a live instruction — and it stays in history forever. A
    // judged run watched a person read a resolved "Waiting for: User clicks
    // Create" as current page state, conclude the assistant had lied about
    // creating their list, and spend four turns hunting a button that was gone.
    const name = (invocation.input as any)?.expecting ?? ''
    return invocation.state === 'done' ? t('waitedChip', { name }) : t('waitingChip', { name })
  }
  const title = invocationTitle(invocation)
  if (invocation.state === 'denied' && invocation.cancelled) return t('cancelledChip', { name: title })
  if (invocation.state === 'denied') return t(invocation.deniedByReviewer ? 'reviewerDeniedChip' : 'declinedChip', { name: title })
  if (invocation.approved) return t('approvedChip', { name: title })
  return title
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

/* A step's reasoning: a plain muted line, not a button's box. */
.agent-chat-message .agent-chat__reasoning > button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
/* A step's reasoning, once opened: muted, keeping the model's line breaks, tied to its line by a rule. */
.agent-chat-message .agent-chat__reasoning-text {
  white-space: pre-wrap;
  word-break: break-word;
  padding-left: 12px;
  border-left: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* the calls a script made hang under its chip, as an open call's detail does */
.agent-chat__script-calls {
  margin: 0 0 4px 12px;
  padding-left: 12px;
  border-left: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.agent-chat-message .markdown-content ul {
  padding-left: 8px;
  margin-top: 0;
}

.agent-chat-message .agent-chat__spin {
  animation: agent-chat-spin 1s linear infinite;
}

/* an open call's detail hangs under its chip, a rule on its left tying the two */
.agent-chat__tool-call-detail {
  margin: 0 0 8px 12px;
  padding-left: 12px;
  border-left: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.agent-chat-message .agent-chat__trace-header {
  cursor: pointer;
}

@keyframes agent-chat-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
