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
      <!-- What the record holds that the bar does not: a task run's outcome, its abort. -->
      <slot name="header" />
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
          v-if="mayExport"
          size="small"
          variant="text"
          :prepend-icon="mdiDownload"
          :href="exportUrl"
          :title="t('downloadExportHint')"
        >
          {{ t('downloadExport') }}
        </v-btn>
      </div>

      <!-- Who the conversation was between: the agent, and the person who wrote to it. -->
      <div
        v-if="participants"
        class="px-3 pt-2 text-body-2"
        data-testid="review-participants"
      >
        {{ participants }}
      </div>

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
        show-tool-details
        readonly
        :agent-path="agentPath"
      >
        <!-- Each turn's record, folded where the turn happened, above what it wrote: why it ran and how it
             ended, each model call, and what the model was given — each part folded again. A turn given the
             same instructions, page context or tools as the one before says so rather than repeating them. -->
        <template #turn="{ index }">
          <details
            v-for="turn in [turns[index]]"
            :key="turn.run.id ?? index"
            class="conversation-review__turn mb-2"
            data-testid="review-turn"
          >
            <summary class="conversation-review__summary text-caption">
              <span class="font-weight-bold">{{ t('turn', { n: index + 1 }) }}</span>
              <v-chip
                size="small"
                variant="tonal"
                :color="turn.run.status === 'done' ? 'success' : turn.run.status === 'running' ? 'info' : 'error'"
              >
                {{ turn.run.status }}{{ turn.run.stopReason ? ` · ${turn.run.stopReason}` : '' }}
              </v-chip>
              <span class="text-medium-emphasis">
                {{ turnLine(turn.run) }}
              </span>
            </summary>
            <div class="conversation-review__turn-body pa-3">
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

              <div
                v-if="turn.samePrompt"
                class="text-caption mb-2"
              >
                <span class="font-weight-bold">{{ t('systemPrompt') }}</span> · {{ t('sameAsPrevious') }}
              </div>
              <details
                v-else
                class="mb-2"
                data-testid="review-system-prompt"
              >
                <summary class="text-caption font-weight-bold">
                  {{ t('systemPrompt') }}
                </summary>
                <pre class="conversation-review__pre pa-3 my-1">{{ turn.run.systemPrompt || '—' }}</pre>
              </details>

              <!-- What the page told the model: state and events folded into the person's message at call
                   time, which the thread does not show. -->
              <div
                v-if="turn.sameHostContext"
                class="text-caption mb-2"
              >
                <span class="font-weight-bold">{{ t('hostContext') }}</span> · {{ t('sameAsPrevious') }}
              </div>
              <details
                v-else
                class="mb-2"
                data-testid="review-host-context"
              >
                <summary class="text-caption font-weight-bold">
                  {{ t('hostContext') }}
                </summary>
                <pre class="conversation-review__pre pa-3 my-1">{{ turn.run.hostContext || '—' }}</pre>
              </details>

              <!-- What the model read that the stored messages do not say (the run's context): the transcript marks
                   each where it applies; here, the turn's whole list. -->
              <template v-if="turn.contextLines.length">
                <div class="text-caption font-weight-bold mb-1">
                  {{ t('contextChanges') }}
                </div>
                <ul
                  class="text-body-2 mb-2 ps-4"
                  data-testid="review-context-changes"
                >
                  <li
                    v-for="(line, k) in turn.contextLines"
                    :key="k"
                  >
                    {{ line.label }}
                    <details v-if="line.text">
                      <summary class="text-caption text-medium-emphasis">
                        {{ t('showText') }}
                      </summary>
                      <pre class="conversation-review__pre pa-3 my-1">{{ line.text }}</pre>
                    </details>
                  </li>
                </ul>
              </template>
              <div class="text-caption font-weight-bold mb-1">
                {{ t('offeredTools', { n: turn.toolCount }) }}
              </div>
              <div
                v-if="turn.sameTools"
                class="text-caption text-medium-emphasis mb-2"
              >
                {{ t('sameAsPrevious') }}
              </div>
              <template v-else>
                <tool-group-list
                  :groups="turn.toolGroups"
                  data-testid="review-offered-tools"
                />
                <!-- Each tool as the model was told about it: its description and the schema of its input. -->
                <details
                  v-if="turn.definitions.length"
                  class="mt-1 mb-2"
                  data-testid="review-tool-definitions"
                >
                  <summary class="text-caption text-medium-emphasis">
                    {{ t('toolDefinitions') }}
                  </summary>
                  <details
                    v-for="tool in turn.definitions"
                    :key="tool.name"
                    class="ms-3 my-1"
                    data-testid="review-tool-definition"
                  >
                    <summary class="text-body-2">
                      {{ tool.name }}
                    </summary>
                    <pre class="conversation-review__pre pa-3 my-1">{{ tool.description ?? '—' }}</pre>
                    <pre
                      v-if="tool.inputSchema"
                      class="conversation-review__pre pa-3 my-1"
                    >{{ JSON.stringify(tool.inputSchema, null, 2) }}</pre>
                  </details>
                </details>
              </template>
            </div>
          </details>
        </template>
      </agent-chat-messages>
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
  withAgent: "Agent : {agent}"
  withPerson: "Personne : {person}"
  startedAt: "commencée le {at}"
  anonymous: visiteur anonyme
  systemPrompt: Instructions données au modèle
  hostContext: Contexte transmis par la page
  offeredTools: "Outils proposés ({n})"
  turn: "Tour {n}"
  sameAsPrevious: Identique au tour précédent.
  contextChanges: Ce que le modèle a lu en plus ou à la place des messages enregistrés
  showText: Afficher le texte
  toolDefinitions: Descriptions et schémas d'entrée, tels que le modèle les a reçus
  recapLine: "Les messages jusqu'au n° {seq} ont été remplacés par un résumé (génération {generation}{written})"
  recapWritten: ", écrit pendant ce tour"
  recapNote: "Jusqu'ici, à partir du tour {turn}, le modèle a reçu un résumé à la place de ces messages"
  recapNoteRun: Jusqu'ici, le modèle a reçu un résumé à la place de ces messages
  removedLine: "Étape {step} : résultat de {tool} ({reason})"
  removedReason:
    cleared: retiré pour libérer du contexte, remplacé par un espace réservé
    image-earlier: image non renvoyée, une image plus récente l'a remplacée
    image-unsupported: image non envoyée, ce modèle ne lit pas les images
  notSent:
    cleared: "Non renvoyé au modèle à partir du tour {turn}, étape {step} : retiré pour libérer du contexte"
    image-earlier: "Image non renvoyée au modèle à partir du tour {turn}, étape {step}"
    image-unsupported: "Image non envoyée au modèle (il ne lit pas les images)"
  notSentRun:
    cleared: "Non renvoyé au modèle à partir de l'étape {step} : retiré pour libérer du contexte"
    image-earlier: "Image non renvoyée au modèle à partir de l'étape {step}"
    image-unsupported: "Image non envoyée au modèle (il ne lit pas les images)"
  stepInstructions: "Étape {step} : d'autres instructions que celles ci-dessus"
  stepInjected: "Étape {step} : message ajouté par le service après l'historique"
  noteInstructions: Instructions de cette étape, différentes de celles du tour
  noteInjected: Message ajouté par le service à cette étape
  reminderNote: Rappel envoyé au modèle
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
  withAgent: "Agent: {agent}"
  withPerson: "Person: {person}"
  startedAt: "started {at}"
  anonymous: anonymous visitor
  systemPrompt: Instructions given to the model
  hostContext: Context reported by the page
  offeredTools: "Tools offered ({n})"
  turn: "Turn {n}"
  sameAsPrevious: Same as the previous turn.
  contextChanges: What the model read besides or instead of the stored messages
  showText: Show the text
  toolDefinitions: Descriptions and input schemas, as the model was given them
  recapLine: "The messages up to #{seq} were replaced by a summary (generation {generation}{written})"
  recapWritten: ", written during this turn"
  recapNote: "Up to here, from turn {turn} on, the model was sent a summary instead of these messages"
  recapNoteRun: Up to here, the model was sent a summary instead of these messages
  removedLine: "Step {step}: result of {tool} ({reason})"
  removedReason:
    cleared: removed to free context, replaced by a placeholder
    image-earlier: image not sent again, a later image replaced it
    image-unsupported: image not sent, this model does not read images
  notSent:
    cleared: "Not sent to the model again from turn {turn}, step {step}: removed to free context"
    image-earlier: "Image not sent to the model again from turn {turn}, step {step}"
    image-unsupported: "Image not sent to the model (it does not read images)"
  notSentRun:
    cleared: "Not sent to the model again from step {step}: removed to free context"
    image-earlier: "Image not sent to the model again from step {step}"
    image-unsupported: "Image not sent to the model (it does not read images)"
  stepInstructions: "Step {step}: other instructions than the ones above"
  stepInjected: "Step {step}: a message the service added after the history"
  noteInstructions: This step's instructions, other than the turn's
  noteInjected: A message the service added at this step
  reminderNote: Reminder sent to the model
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
import { annotateTranscript, turnContextLines, type ContextLabels } from '~/utils/review-context'
import type { ChatMessage } from '~/utils/chat-message'
import { $apiPath, $fetch } from '~/context'

/**
 * Two sources, one rendering: a conversation, which this component loads by its id, or a task run, which
 * the run page loads (it re-reads a running run and aborts it) and hands over as `run` — read as a
 * conversation of one turn, since the run route presents its content as the same messages.
 */
const props = defineProps<{
  owner: { type: string, id: string }
  conversationId?: string
  run?: any
  /** The task run's agent, for its export route and the approval cards' task reads. */
  agentId?: string
}>()

const emit = defineEmits<{ loaded: [{ owner: { type: string, id: string }, label: string }] }>()

const { t, locale } = useI18n()
const session = useSession()

const agentUrl = (agentId: string) => `${$apiPath}/autonomous-agents/${props.owner.type}/${props.owner.id}/${agentId}`
const exportUrl = computed(() => props.run
  ? `${agentUrl(props.agentId ?? props.run.agentId)}/runs/${props.run.id}/export`
  : `${$apiPath}/review/${props.owner.type}/${props.owner.id}/${props.conversationId}/export`)
// What each export route requires: a conversation's is for a superadmin in admin mode (it is a platform
// engineering file), a task run's for the agent's admins, who are the only ones on the run page.
const mayExport = computed(() => !!props.run || !!session.state.user?.adminMode)

const loaded = ref(false)
const loadError = ref('')
const conversation = ref<any>()
const agentTitle = ref<string>()
const messages = ref<ChatMessage[]>([])
const runs = ref<any[]>([])
// The tool sets the runs reference (toolDefinitionsRef), as the review and run routes resolve them.
const toolDefinitions = ref<Record<string, Array<{ name: string, description?: string, inputSchema?: unknown }>>>({})
// The stored messages as loaded, for what the transcript is annotated with (each call's tool name).
const storedMessages = ref<any[]>([])

// What the model read that the stored messages do not say, marked where it applies (~/utils/review-context).
const isTaskRun = computed(() => !!props.run)
const contextLabels = computed<ContextLabels>(() => ({
  recapNote: turn => isTaskRun.value ? t('recapNoteRun') : t('recapNote', { turn }),
  notSent: (reason, turn, step) => t(`${isTaskRun.value ? 'notSentRun' : 'notSent'}.${reason}`, { turn, step }),
  noteInstructions: t('noteInstructions'),
  noteInjected: t('noteInjected'),
  reminderNote: t('reminderNote'),
  recapLine: (seq, generation, written) => t('recapLine', { seq, generation, written: written ? t('recapWritten') : '' }),
  removedLine: (step, tool, reason) => t('removedLine', { step, tool, reason: t(`removedReason.${reason}`) }),
  stepInstructions: step => t('stepInstructions', { step }),
  stepInjected: step => t('stepInjected', { step })
}))
const buildMessages = (stored: any[], allRuns: any[]): ChatMessage[] => annotateTranscript(stored, allRuns, contextLabels.value)
const contextLinesOf = (run: any) => turnContextLines(run, runs.value, storedMessages.value, contextLabels.value)
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
    definitions: run.toolDefinitionsRef ? toolDefinitions.value[run.toolDefinitionsRef] ?? [] : [],
    contextLines: contextLinesOf(run),
    samePrompt: !!previous && !!run.systemPrompt && run.systemPrompt === previous.systemPrompt,
    sameHostContext: !!previous && !!run.hostContext && run.hostContext === previous.hostContext,
    sameTools: !!previous && tools.names.length > 0 && toolsKey(tools) === toolsKey(turnTools(previous))
  }
}))

const formatDate = (date: string) => new Date(date).toLocaleString(locale.value)
// A task run's page says its agent and trigger itself; a conversation says it here.
const participants = computed(() => {
  const c = conversation.value
  if (!c) return ''
  return [
    t('withAgent', { agent: agentTitle.value ?? c.agentId ?? '—' }),
    t('withPerson', { person: c.userName || c.userId || t('anonymous') }),
    c.createdAt && t('startedAt', { at: formatDate(c.createdAt) })
  ].filter(Boolean).join(' · ')
})
const turnLine = (run: any) => [
  run.startedAt && formatDate(run.startedAt),
  run.startedAt && run.endedAt && `${new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()}ms`,
  run.trigger && t(`trigger.${run.trigger}`),
  run.triggeredBy?.userName && t('by', { name: run.triggeredBy.userName, role: run.triggeredByRole ?? '—' }),
  run.steps !== undefined && t('steps') + ' ' + run.steps,
  run.credits !== undefined && t('credits', { n: run.credits.toFixed(4) })
].filter(Boolean).join(' · ')

const load = async () => {
  if (props.run) return
  loaded.value = false
  loadError.value = ''
  try {
    const data = await $fetch(`${$apiPath}/review/${props.owner.type}/${props.owner.id}/${props.conversationId}`)
    runs.value = data.runs ?? []
    conversation.value = data.conversation
    agentTitle.value = data.agentTitle
    toolDefinitions.value = data.toolDefinitions ?? {}
    storedMessages.value = data.messages ?? []
    messages.value = buildMessages(storedMessages.value, runs.value)
    agentPath.value = data.conversation?.agentId ? agentUrl(data.conversation.agentId) : undefined
    loaded.value = true
    emit('loaded', { owner: props.owner, label: data.conversation?.title ?? props.conversationId })
  } catch (err: any) {
    loadError.value = err?.status === 404 ? t('notFound') : (err?.message ?? t('notFound'))
  }
}

onMounted(load)
watch(() => props.conversationId, load)

// A task run is applied as it comes, re-read or not: no loading state in between, so a running run
// refreshing does not blink.
watch(() => props.run, (run) => {
  if (!run) return
  runs.value = [run]
  toolDefinitions.value = run.toolDefinitions ?? {}
  storedMessages.value = run.messages ?? []
  messages.value = buildMessages(storedMessages.value, runs.value)
  agentPath.value = agentUrl(props.agentId ?? run.agentId)
  loaded.value = true
}, { immediate: true })
</script>

<style scoped>
.conversation-review__bar {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.conversation-review__turn {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
.conversation-review__summary {
  cursor: pointer;
  padding: 4px 8px;
}
.conversation-review__summary > * {
  margin-right: 8px;
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
