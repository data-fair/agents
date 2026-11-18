<template>
  <v-container
    data-iframe-height
    data-testid="task-run-view"
  >
    <v-btn
      variant="text"
      class="mb-2"
      :prepend-icon="mdiArrowLeft"
      :to="`/${accountType}/${accountId}/agents/${agentId}?tab=runs`"
      :text="t('back')"
    />

    <!-- Only when there is no run to show: a failed re-read of a running run keeps the run on screen. -->
    <v-alert
      v-if="runFetch.error.value && !run"
      type="warning"
      variant="tonal"
      :text="t('notFound')"
    />

    <!-- The review page's own component: the same bar, detail and transcript as a conversation. -->
    <conversation-review
      v-else-if="run && run.kind === 'task'"
      :owner="{ type: accountType, id: accountId }"
      :run="run"
      :agent-id="agentId"
    >
      <template #header>
        <div class="d-flex flex-wrap align-start ga-2 px-3 pb-2">
          <div class="flex-grow-1">
            <h1 class="text-h6 text-wrap">
              {{ taskTitle }}
            </h1>
            <run-summary :run="run" />
          </div>
          <v-btn
            v-if="run.status === 'running'"
            variant="text"
            color="warning"
            :prepend-icon="mdiStop"
            :loading="aborting"
            :text="t('abort')"
            @click="abort()"
          />
        </div>
      </template>
    </conversation-review>
  </v-container>
</template>

<i18n lang="yaml">
en:
  agents: Agents
  back: Back to the agent
  abort: Abort
  notFound: This run does not exist, or no longer does.
  abortFailed: The run could not be aborted
  deletedTask: Deleted task
fr:
  agents: Agents
  back: Retour à l'agent
  abort: Arrêter
  notFound: Cette exécution n'existe pas, ou plus.
  abortFailed: L'exécution n'a pas pu être arrêtée
  deletedTask: Tâche supprimée
</i18n>

<script lang="ts" setup>
/**
 * One run of an autonomous agent: the page a notification links to (api/src/autonomous-agents/page-url.ts).
 * A task run is read here, through the review page's component; a conversation run is a turn of a
 * conversation, so its page sends the reader to that conversation's review.
 */
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiArrowLeft, mdiStop } from '@mdi/js'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import ConversationReview from '~/components/ConversationReview.vue'
import RunSummary from '~/components/agent-page/RunSummary.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'
import { apiErrorMessage } from '~/utils/api-error'
import { $apiPath, $fetch } from '~/context'

const { t } = useI18n()
const { sendUiNotif } = useUiNotif()
const route = useRoute('/[type]/[id]/agents/[agentId]/runs/[runId]')
const router = useRouter()
const accountType = route.params.type as string
const accountId = route.params.id as string
const agentId = route.params.agentId as string
const runId = route.params.runId as string

const agentUrl = `${$apiPath}/autonomous-agents/${accountType}/${accountId}/${agentId}`
const runUrl = `${agentUrl}/runs/${runId}`
// The alert says what went wrong, so no notification on top of it.
const runFetch = useFetch<any>(runUrl, { notifError: false })
const run = computed(() => runFetch.data.value)

watch(run, (value) => {
  if (value?.kind === 'conversation' && value.conversationId) {
    router.replace(`/${accountType}/${accountId}/review/${value.conversationId}`)
  }
}, { immediate: true })

// A run records its task's id, not its title; a run outliving its task says so.
const taskFetch = useFetch<any>(() => run.value?.taskId ? `${agentUrl}/tasks/${run.value.taskId}` : null, { notifError: false })
const taskTitle = computed(() => taskFetch.data.value?.title ?? (taskFetch.error.value ? t('deletedTask') : ''))

const agentFetch = useFetch<any>(agentUrl, { notifError: false })
watch([() => agentFetch.data.value?.title, taskTitle], ([agentTitle, task]) => {
  if (!agentTitle) return
  // Host routes: data-fair frames the account page at /agents-activity, named Agents there.
  setBreadcrumbs([{ text: t('agents'), to: '/agents-activity' }, { text: agentTitle }, ...(task ? [{ text: task }] : [])])
}, { immediate: true })

// A running run has no socket to push its end: read it again until it ends. An interval, not a read
// chained on the last one: a failed read changes nothing on the record, and must not stop the polling.
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
    await $fetch(`${runUrl}/abort`, { method: 'POST', credentials: 'include' })
    await runFetch.refresh()
  } catch (error) {
    sendUiNotif({ type: 'error', msg: apiErrorMessage(error) ?? t('abortFailed'), error: error as any })
  } finally {
    aborting.value = false
  }
}
</script>
