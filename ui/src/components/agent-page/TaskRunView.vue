<template>
  <div data-testid="task-run-view">
    <div class="d-flex flex-wrap align-center ga-2 mb-2">
      <v-btn
        variant="text"
        :prepend-icon="mdiArrowLeft"
        :text="t('back')"
        @click="emit('close')"
      />
      <v-spacer />
      <v-btn
        v-if="run?.status === 'running'"
        variant="text"
        color="warning"
        :prepend-icon="mdiStop"
        :loading="aborting"
        :text="t('abort')"
        @click="abort()"
      />
      <!-- A plain link, as on the review page: the browser's own download handles the file. -->
      <v-btn
        v-if="run"
        variant="text"
        :prepend-icon="mdiDownload"
        :href="`${runUrl}/export`"
        download
        :text="t('export')"
      />
    </div>

    <!-- Only when there is no run to show: a failed re-read of a running run keeps the run on screen. -->
    <v-alert
      v-if="runFetch.error.value && !run"
      type="warning"
      variant="tonal"
      :text="t('notFound')"
    />

    <template v-else-if="run">
      <h3 class="text-title-medium text-wrap">
        {{ taskTitle(run.taskId) }}
      </h3>
      <run-summary
        :run="run"
        class="mb-4"
      />

      <!-- The run through the SAME renderer the chat and the review page use: one way to display a
           turn. Read-only — no composer, and no card to decide, since a task run is offered no tool
           that needs an approval. -->
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
      />
    </template>
  </div>
</template>

<i18n lang="yaml">
en:
  back: Back to history
  abort: Abort
  export: Export
  notFound: This run does not exist, or no longer does.
  abortFailed: The run could not be aborted
fr:
  back: Retour à l'historique
  abort: Arrêter
  export: Exporter
  notFound: Cette exécution n'existe pas, ou plus.
  abortFailed: L'exécution n'a pas pu être arrêtée
</i18n>

<script lang="ts" setup>
/**
 * One task run, read like a conversation: the record's header, then the prompt and what the model did
 * as the two messages the run route presents it as.
 */
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiArrowLeft, mdiDownload, mdiStop } from '@mdi/js'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import AgentChatMessages from '~/components/agent-chat/AgentChatMessages.vue'
import RunSummary from '~/components/agent-page/RunSummary.vue'
import { createToolTitleMemo } from '~/composables/tool-titles'
import { autonomousAgentMessageToChat } from '~/utils/autonomous-agent-chat-message'
import { apiErrorMessage } from '~/utils/api-error'
import { $apiPath, $fetch } from '~/context'

const props = defineProps<{
  runId: string
  agent: any
  accountType: string
  accountId: string
  taskTitle: (taskId?: string) => string
}>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { sendUiNotif } = useUiNotif()

const runUrl = computed(() => `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/${props.agent.id}/runs/${props.runId}`)
// The alert above says what went wrong, so no notification on top of it.
const runFetch = useFetch<any>(runUrl, { notifError: false })
const run = computed(() => runFetch.data.value)
const messages = computed(() => (run.value?.messages ?? []).map((message: any) => autonomousAgentMessageToChat(message)))

// No live tool set to ask here, so the name is the title — as on the review page.
const toolTitle = createToolTitleMemo(() => undefined)

// A running run has no socket to push its end: read it again until it ends, so the page does not keep
// showing a run that is long over as running. An interval, not a read chained on the last one: a
// failed read changes nothing on the record, and must not stop the polling.
let poll: ReturnType<typeof setInterval> | undefined
watch(() => run.value?.status === 'running', (running) => {
  clearInterval(poll)
  poll = running ? setInterval(() => runFetch.refresh(), 2000) : undefined
}, { immediate: true })
onScopeDispose(() => clearInterval(poll))

const aborting = ref(false)
const abort = async () => {
  aborting.value = true
  try {
    await $fetch(`${runUrl.value}/abort`, { method: 'POST', credentials: 'include' })
    await runFetch.refresh()
  } catch (error) {
    sendUiNotif({ type: 'error', msg: apiErrorMessage(error) ?? t('abortFailed'), error: error as any })
  } finally {
    aborting.value = false
  }
}
</script>
