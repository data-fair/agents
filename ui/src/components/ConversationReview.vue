<template>
  <v-container
    fluid
    class="conversation-review pa-0"
  >
    <p
      v-if="loadError"
      class="text-error pa-3"
    >
      {{ loadError }}
    </p>
    <template v-else-if="loaded">
      <!-- What the conversation cannot say about itself: which models answered, what it cost, how
           long it took, and the instructions they were given. -->
      <div class="conversation-review__bar d-flex align-center flex-wrap ga-2 px-3 py-2">
        <v-chip
          size="small"
          variant="tonal"
        >
          {{ t('turns', { n: runs.length }) }}
        </v-chip>
        <v-chip
          size="small"
          variant="tonal"
        >
          {{ t('calls', { n: callCount }) }}
        </v-chip>
        <v-chip
          size="small"
          variant="tonal"
        >
          {{ t('credits', { n: totalCredits.toFixed(4) }) }}
        </v-chip>
        <v-chip
          v-if="cachedShare !== undefined"
          size="small"
          variant="tonal"
          data-testid="cached-share"
        >
          {{ t('cachedShare', { n: cachedShare }) }}
        </v-chip>
        <v-chip
          v-for="model in modelsUsed"
          :key="model"
          size="small"
          variant="outlined"
        >
          {{ model }}
        </v-chip>
        <v-spacer />
        <!--
          The conversation as a file, for analysis by a standalone coding agent — what replaced the
          in-browser trace evaluator. A plain link rather than a fetch-and-assemble-a-blob: the
          export of a long thread is megabytes, and the browser's own download handles that without
          holding it in memory twice.

          Shown only in admin mode, because that is exactly what the endpoint requires: rendering it
          otherwise would offer a button that answers 403.
        -->
        <v-btn
          v-if="session.state.user?.adminMode"
          size="small"
          variant="text"
          :prepend-icon="mdiDownload"
          :href="exportUrl"
          :title="t('downloadExportHint')"
        >
          {{ t('downloadExport') }}
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          @click="showDetail = !showDetail"
        >
          {{ showDetail ? t('hideDetail') : t('showDetail') }}
        </v-btn>
      </div>

      <v-expand-transition>
        <!-- Everything a turn's record holds that the thread cannot show, turn by turn: why it ran and how
             it ended, each model call, and what the model was given. A turn given the same instructions,
             page context or tools as the one before says so rather than repeating them. -->
        <div
          v-if="showDetail"
          class="px-3 pb-3"
        >
          <section
            v-for="(turn, i) in turns"
            :key="turn.run.id ?? i"
            class="conversation-review__turn pt-3"
            data-testid="review-turn"
          >
            <div class="d-flex align-center flex-wrap ga-2 mb-2">
              <span class="text-subtitle-2">{{ t('turn', { n: i + 1 }) }}</span>
              <v-chip
                size="small"
                variant="tonal"
                :color="turn.run.status === 'done' ? 'success' : turn.run.status === 'running' ? 'info' : 'error'"
              >
                {{ turn.run.status }}{{ turn.run.stopReason ? ` · ${turn.run.stopReason}` : '' }}
              </v-chip>
              <span class="text-caption text-medium-emphasis">
                {{ turnLine(turn.run) }}
              </span>
            </div>
            <div
              v-if="turn.run.error"
              class="text-body-2 text-error mb-2"
            >
              {{ turn.run.error }}
            </div>
            <div
              v-if="turn.run.abortRequestedAt"
              class="text-body-2 text-medium-emphasis mb-2"
            >
              {{ t('abortRequested', { at: formatDate(turn.run.abortRequestedAt), reason: turn.run.abortReason ?? '—' }) }}
            </div>

            <div class="text-caption font-weight-bold mb-1">
              {{ t('modelCalls') }}
            </div>
            <v-table
              density="compact"
              class="mb-2"
            >
              <thead>
                <tr>
                  <th>{{ t('role') }}</th>
                  <th>{{ t('model') }}</th>
                  <th>{{ t('provider') }}</th>
                  <th class="text-right">
                    {{ t('steps') }}
                  </th>
                  <th
                    class="text-right"
                    :title="t('messagesHint')"
                  >
                    {{ t('messages') }}
                  </th>
                  <th class="text-right">
                    {{ t('input') }}
                  </th>
                  <th class="text-right">
                    {{ t('cacheRead') }}
                  </th>
                  <th class="text-right">
                    {{ t('cacheWrite') }}
                  </th>
                  <th class="text-right">
                    {{ t('output') }}
                  </th>
                  <th class="text-right">
                    {{ t('creditsShort') }}
                  </th>
                  <th class="text-right">
                    {{ t('duration') }}
                  </th>
                  <th>{{ t('finish') }}</th>
                  <th
                    class="text-right"
                    :title="t('hostBlockHint')"
                  >
                    {{ t('hostBlock') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(call, j) in turn.run.calls ?? []"
                  :key="j"
                >
                  <td>{{ call.modelRole }}</td>
                  <td>{{ call.model }}</td>
                  <td>{{ call.provider ? `${call.provider} (${call.providerType})` : '—' }}</td>
                  <td class="text-right">
                    {{ call.steps ?? '—' }}
                  </td>
                  <td class="text-right">
                    {{ call.messageCount ?? '—' }}{{ call.historyUpToSeq !== undefined ? ` (≤ #${call.historyUpToSeq})` : '' }}
                  </td>
                  <td class="text-right">
                    {{ call.inputTokens ?? '—' }}
                  </td>
                  <td class="text-right">
                    {{ call.cacheReadTokens ?? '—' }}
                  </td>
                  <td class="text-right">
                    {{ call.cacheWriteTokens ?? '—' }}
                  </td>
                  <td class="text-right">
                    {{ call.outputTokens ?? '—' }}
                  </td>
                  <td class="text-right">
                    {{ call.credits?.toFixed(4) ?? '—' }}
                    <div
                      v-if="call.creditsInput !== undefined"
                      class="text-caption text-medium-emphasis text-no-wrap"
                    >
                      {{ t('creditBreakdown', { input: call.creditsInput.toFixed(4), cached: call.creditsCachedInput.toFixed(4), output: call.creditsOutput.toFixed(4) }) }}
                    </div>
                  </td>
                  <td class="text-right">
                    {{ call.durationMs ? call.durationMs + 'ms' : '—' }}
                  </td>
                  <td>{{ call.finishReason ?? '—' }}</td>
                  <td class="text-right">
                    {{ call.hostBlockChars ?? '—' }}
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div class="text-caption font-weight-bold mb-1">
              {{ t('systemPrompt') }}
            </div>
            <div
              v-if="turn.samePrompt"
              class="text-caption text-medium-emphasis mb-2"
            >
              {{ t('sameAsPrevious') }}
            </div>
            <pre
              v-else
              class="conversation-review__pre pa-3 mb-2"
            >{{ turn.run.systemPrompt || '—' }}</pre>

            <!-- What the page told the model: state and events folded into the person's message at call
                 time, which the thread does not show. -->
            <div class="text-caption font-weight-bold mb-1">
              {{ t('hostContext') }}
            </div>
            <div
              v-if="turn.sameHostContext"
              class="text-caption text-medium-emphasis mb-2"
            >
              {{ t('sameAsPrevious') }}
            </div>
            <pre
              v-else
              class="conversation-review__pre pa-3 mb-2"
              data-testid="review-host-context"
            >{{ turn.run.hostContext || '—' }}</pre>

            <div class="text-caption font-weight-bold mb-1">
              {{ t('offeredTools', { n: turn.toolCount }) }}
            </div>
            <div
              v-if="turn.sameTools"
              class="text-caption text-medium-emphasis mb-2"
            >
              {{ t('sameAsPrevious') }}
            </div>
            <tool-group-list
              v-else
              :groups="turn.toolGroups"
              data-testid="review-offered-tools"
            />
          </section>
        </div>
      </v-expand-transition>

      <!-- The conversation, through the SAME renderer the chat uses. There is one way to display a
           turn, so a reviewer sees what the person saw rather than a second rendering of it that can
           drift. Read-only: no streaming, no activity, no composer. -->
      <agent-chat-messages
        :messages="messages"
        :is-streaming="false"
        :chat-error="null"
        :welcome-text="''"
        :tool-title="toolTitle"
        :action-visible-prompt="null"
        :mermaid-enabled="false"
        show-traces
        :show-reasoning="true"
        show-tool-details
        readonly
        :agent-path="agentPath"
      />
    </template>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  turns: "{n} tours"
  calls: "{n} appels de modèle"
  credits: "{n} crédits"
  cachedShare: "{n} % de l'entrée en cache"
  creditsShort: Crédits
  downloadExport: Télécharger
  downloadExportHint: Télécharge la conversation complète (messages, résultats d'outils, télémétrie par appel) dans un fichier JSONL, pour analyse par un agent de code.
  hideDetail: Masquer le détail
  showDetail: Voir le détail
  systemPrompt: Instructions données au modèle
  hostContext: Contexte transmis par la page
  offeredTools: "Outils proposés ({n})"
  turn: "Tour {n}"
  sameAsPrevious: Identique au tour précédent.
  abortRequested: "Arrêt demandé le {at} : {reason}"
  by: "par {name} ({role})"
  provider: Fournisseur
  steps: Étapes
  messages: Messages
  messagesHint: Messages envoyés au modèle, et le dernier message de la conversation qu'ils couvrent
  hostBlock: Contexte page
  hostBlockHint: Taille en caractères du contexte transmis par la page
  creditBreakdown: "entrée {input} · cache {cached} · sortie {output}"
  trigger:
    user: Message
    wake: Réveil
    approval: Approbation
    schedule: Planifiée
    manual: Lancée manuellement
    webhook: Webhook
  cacheRead: Lu en cache
  cacheWrite: Écrit en cache
  modelCalls: Appels de modèle
  role: Rôle
  model: Modèle
  input: Entrée
  output: Sortie
  duration: Durée
  finish: Fin
  notFound: Conversation introuvable ou accès refusé.
en:
  turns: "{n} turns"
  calls: "{n} model calls"
  credits: "{n} credits"
  cachedShare: "{n}% of input cached"
  creditsShort: Credits
  downloadExport: Download
  downloadExportHint: Downloads the whole conversation (messages, tool results, per-call telemetry) as a JSONL file, for analysis by a coding agent.
  hideDetail: Hide detail
  showDetail: Show detail
  systemPrompt: Instructions given to the model
  hostContext: Context reported by the page
  offeredTools: "Tools offered ({n})"
  turn: "Turn {n}"
  sameAsPrevious: Same as the previous turn.
  abortRequested: "Abort requested on {at}: {reason}"
  by: "by {name} ({role})"
  provider: Provider
  steps: Steps
  messages: Messages
  messagesHint: Messages sent to the model, and the last conversation message they cover
  hostBlock: Page context
  hostBlockHint: Size in characters of the context the page reported
  creditBreakdown: "input {input} · cached {cached} · output {output}"
  trigger:
    user: Message
    wake: Wake-up
    approval: Approval
    schedule: Scheduled
    manual: Run manually
    webhook: Webhook
  cacheRead: Cache read
  cacheWrite: Cache write
  modelCalls: Model calls
  role: Role
  model: Model
  input: Input
  output: Output
  duration: Duration
  finish: Finish
  notFound: Conversation not found or access denied.
</i18n>

<script lang="ts" setup>
/**
 * Admin review of one conversation.
 *
 * This replaces a reconstruction layer. Review used to read a separate `trace-requests` collection
 * and rebuild an approximation of the exchange from stored request bodies — `reconstruct-trace.ts`
 * and `session-recorder.ts`, about 640 lines, plus a bespoke `TraceView` renderer of about 380. All
 * of it existed because the conversation was not stored server-side; once it was, the reconstruction
 * was rebuilding something it could simply read.
 *
 * It had also quietly stopped working: the executor records a REFERENCE to the history rather than
 * the messages, so `reconstruct-trace` found no messages and the page rendered empty entries. Its
 * test passed because it asserted a type-chip label, which renders either way.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSession } from '@data-fair/lib-vue/session.js'
import { mdiDownload } from '@mdi/js'
import AgentChatMessages from '~/components/agent-chat/AgentChatMessages.vue'
import ToolGroupList from '~/components/agent-chat/ToolGroupList.vue'
import { groupTools, turnTools, type SourcedTools } from '~/utils/tool-groups'
import { createToolTitleMemo } from '~/composables/tool-titles'
import { autonomousAgentMessageToChat } from '~/utils/autonomous-agent-chat-message'
import type { ChatMessage } from '~/utils/chat-message'
import { $apiPath, $fetch } from '~/context'

const props = defineProps<{
  conversationId: string
  owner: { type: string, id: string }
}>()

const emit = defineEmits<{ loaded: [{ owner: { type: string, id: string }, label: string }] }>()

const { t, locale } = useI18n()
const session = useSession()

const exportUrl = computed(() =>
  `${$apiPath}/review/${props.owner.type}/${props.owner.id}/${props.conversationId}/export`)

const loaded = ref(false)
const loadError = ref('')
const showDetail = ref(false)
const messages = ref<ChatMessage[]>([])
const runs = ref<any[]>([])
// Where an approval card left open in the thread reads the task a planning call would change.
const agentPath = ref<string>()

// The chip label for a tool name, memoised. No live tool set to ask here, so the name is the title.
const toolTitle = createToolTitleMemo(() => undefined)

const allCalls = computed(() => runs.value.flatMap(run => run.calls ?? []))
const callCount = computed(() => allCalls.value.length)
const totalCredits = computed(() => runs.value.reduce((sum, run) => sum + (run.credits ?? 0), 0))
const modelsUsed = computed(() => [...new Set(allCalls.value.map(call => call.model).filter(Boolean))])
// The share of input tokens read from the provider's cache (input counts include them). Absent when
// no call reported cache usage, which is not the same as a provider reporting none was hit.
const cachedShare = computed(() => {
  const reporting = allCalls.value.filter(call => call.cacheReadTokens !== undefined)
  const input = reporting.reduce((sum, call) => sum + (call.inputTokens ?? 0), 0)
  if (!reporting.length || !input) return undefined
  return Math.round(100 * reporting.reduce((sum, call) => sum + call.cacheReadTokens, 0) / input)
})
// Each turn with what it was given: the instructions and the page context are recorded per run, the
// tools per call (their union is the turn's). Compared with the previous turn's, so an unchanged one
// is said to be unchanged rather than repeated.
const turns = computed(() => runs.value.map((run, i) => {
  const tools = turnTools(run)
  const previous = runs.value[i - 1]
  const toolsKey = ({ names, sources }: SourcedTools) => JSON.stringify([[...names].sort(), Object.entries(sources).sort()])
  return {
    run,
    toolGroups: groupTools(tools.names, tools.sources),
    toolCount: tools.names.length,
    samePrompt: !!previous && !!run.systemPrompt && run.systemPrompt === previous.systemPrompt,
    sameHostContext: !!previous && !!run.hostContext && run.hostContext === previous.hostContext,
    sameTools: !!previous && tools.names.length > 0 && toolsKey(tools) === toolsKey(turnTools(previous))
  }
}))

const formatDate = (date: string) => new Date(date).toLocaleString(locale.value)
const turnLine = (run: any) => [
  run.startedAt && formatDate(run.startedAt),
  run.startedAt && run.endedAt && `${new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()}ms`,
  run.trigger && t(`trigger.${run.trigger}`),
  run.triggeredBy?.userName && t('by', { name: run.triggeredBy.userName, role: run.triggeredByRole ?? '—' }),
  run.steps !== undefined && t('steps') + ' ' + run.steps,
  run.credits !== undefined && t('credits', { n: run.credits.toFixed(4) })
].filter(Boolean).join(' · ')

const load = async () => {
  loaded.value = false
  loadError.value = ''
  try {
    const data = await $fetch(`${$apiPath}/review/${props.owner.type}/${props.owner.id}/${props.conversationId}`)
    messages.value = (data.messages ?? []).map((message: any) => autonomousAgentMessageToChat(message))
    runs.value = data.runs ?? []
    agentPath.value = data.conversation?.agentId
      ? `${$apiPath}/autonomous-agents/${props.owner.type}/${props.owner.id}/${data.conversation.agentId}`
      : undefined
    loaded.value = true
    emit('loaded', { owner: props.owner, label: data.conversation?.title ?? props.conversationId })
  } catch (err: any) {
    loadError.value = err?.status === 404 ? t('notFound') : (err?.message ?? t('notFound'))
  }
}

onMounted(load)
watch(() => props.conversationId, load)
</script>

<style scoped>
.conversation-review__bar {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.conversation-review__turn + .conversation-review__turn {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.conversation-review__pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  max-height: 20rem;
  overflow: auto;
}
</style>
