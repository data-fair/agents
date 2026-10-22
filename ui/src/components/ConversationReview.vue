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
        <div
          v-if="showDetail"
          class="px-3 pb-3"
        >
          <div class="text-caption font-weight-bold mb-1">
            {{ t('systemPrompt') }}
          </div>
          <pre class="conversation-review__pre pa-3">{{ lastRun?.systemPrompt || '—' }}</pre>

          <!-- What the page told the model on the last turn: state and events folded into the person's
               message at call time, which the thread below does not show. -->
          <div class="text-caption font-weight-bold mt-3 mb-1">
            {{ t('hostContext') }}
          </div>
          <pre
            class="conversation-review__pre pa-3"
            data-testid="review-host-context"
          >{{ lastRun?.hostContext || '—' }}</pre>

          <div class="text-caption font-weight-bold mt-3 mb-1">
            {{ t('offeredTools', { n: offeredCount }) }}
          </div>
          <tool-group-list
            :groups="offeredGroups"
            data-testid="review-offered-tools"
          />

          <div class="text-caption font-weight-bold mt-3 mb-1">
            {{ t('modelCalls') }}
          </div>
          <v-table density="compact">
            <thead>
              <tr>
                <th>{{ t('role') }}</th>
                <th>{{ t('model') }}</th>
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
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(call, i) in allCalls"
                :key="i"
              >
                <td>{{ call.modelRole }}</td>
                <td>{{ call.model }}</td>
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
                </td>
                <td class="text-right">
                  {{ call.durationMs ? call.durationMs + 'ms' : '—' }}
                </td>
                <td>{{ call.finishReason ?? '—' }}</td>
              </tr>
            </tbody>
          </v-table>
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
        :simple-sub-agents="false"
        :show-reasoning="true"
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
  hostContext: Contexte transmis par la page au dernier tour
  offeredTools: "Outils proposés au dernier tour ({n})"
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
  hostContext: Context reported by the page on the last turn
  offeredTools: "Tools offered on the last turn ({n})"
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
import { offeredToolGroups } from '~/utils/tool-groups'
import { createToolTitleMemo } from '~/composables/tool-titles'
import { autonomousAgentMessageToChat } from '~/utils/autonomous-agent-chat-message'
import type { ChatMessage } from '~/utils/chat-message'
import { $apiPath, $fetch } from '~/context'

const props = defineProps<{
  conversationId: string
  owner: { type: string, id: string }
}>()

const emit = defineEmits<{ loaded: [{ owner: { type: string, id: string }, label: string }] }>()

const { t } = useI18n()
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
// The instructions and the page context are per run and the tools per turn; the last run is what a
// reviewer is looking at.
const lastRun = computed(() => [...runs.value].reverse().find(run => run.systemPrompt))
const offeredGroups = computed(() => offeredToolGroups(runs.value))
const offeredCount = computed(() => offeredGroups.value.reduce((count, group) => count + group.names.length, 0))

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
