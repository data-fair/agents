<template>
  <!-- One run open (`?run=`, which a notification link carries) takes the tab's place; closing it
       returns to the list where it was. -->
  <task-run-view
    v-if="openRunId"
    :run-id="openRunId"
    :agent="agent"
    :account-type="accountType"
    :account-id="accountId"
    :task-title="taskTitle"
    @close="closeRun()"
  />

  <template v-else>
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <v-btn-toggle
        v-model="kind"
        mandatory
        density="compact"
        variant="outlined"
        divided
      >
        <v-btn
          value="task"
          :text="t('tasks')"
        />
        <v-btn
          value="conversation"
          :text="t('conversations')"
        />
      </v-btn-toggle>
      <v-spacer />
      <v-select
        v-model="status"
        :items="statusItems"
        :label="t('status')"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        style="max-width: 220px; min-width: 160px"
      />
    </div>

    <p
      v-if="runsFetch.data.value && !runs.length"
      class="text-body-2 text-medium-emphasis"
    >
      {{ t('noRuns') }}
    </p>

    <v-list
      v-else
      class="py-0"
    >
      <v-list-item
        v-for="run of runs"
        :key="run.id"
        :to="runLink(run)"
        class="border-b"
        data-testid="agent-run"
      >
        <v-list-item-title class="text-wrap">
          {{ run.kind === 'task' ? taskTitle(run.taskId) : t('conversation') }}
        </v-list-item-title>
        <run-summary
          :run="run"
          clip
        />
      </v-list-item>
    </v-list>

    <v-pagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      density="compact"
      class="mt-2"
    />
  </template>
</template>

<i18n lang="yaml">
en:
  tasks: Tasks
  conversations: Conversations
  conversation: Conversation
  status: Status
  noRuns: No run yet.
  deletedTask: Deleted task
fr:
  tasks: Tâches
  conversations: Conversations
  conversation: Conversation
  status: Statut
  noRuns: Aucune exécution pour l'instant.
  deletedTask: Tâche supprimée
</i18n>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import TaskRunView from '~/components/agent-page/TaskRunView.vue'
import RunSummary from '~/components/agent-page/RunSummary.vue'
import { runStatuses, runStatusLabel } from '~/utils/run-statuses'
import { $apiPath } from '~/context'

const props = defineProps<{
  agent: any
  accountType: string
  accountId: string
}>()

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const agentUrl = computed(() => `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/${props.agent.id}`)

const size = 20
const kind = ref<'task' | 'conversation'>('task')
const status = ref<string | null>(null)
const page = ref(1)
watch([kind, status], () => { page.value = 1 })

const runsFetch = useFetch<{ results: any[], count: number }>(() => `${agentUrl.value}/runs`, {
  query: computed(() => ({ kind: kind.value, page: page.value, size, ...(status.value ? { status: status.value } : {}) }))
})
const runs = computed(() => runsFetch.data.value?.results ?? [])
const pageCount = computed(() => Math.ceil((runsFetch.data.value?.count ?? 0) / size))

// A run records its task's id, not its title: titles come from the agent's tasks, and a run outliving
// its task says so (once the tasks are known — not while they load).
const tasksFetch = useFetch<{ results: any[] }>(() => `${agentUrl.value}/tasks`)
const taskTitle = (taskId?: string) => {
  if (!tasksFetch.data.value) return ''
  return tasksFetch.data.value.results.find(task => task.id === taskId)?.title ?? t('deletedTask')
}

// In the same words as each run's summary.
const statusItems = computed(() => runStatuses.map(value => ({ value, title: runStatusLabel(value, locale.value) })))

// A task run opens here; a conversation run is a turn of a conversation, read on its review page.
const runLink = (run: any) => run.kind === 'task'
  ? { query: { ...route.query, run: run.id } }
  : run.conversationId ? `/${props.accountType}/${props.accountId}/traces/${run.conversationId}` : undefined

const openRunId = computed(() => typeof route.query.run === 'string' ? route.query.run : null)
const closeRun = () => {
  const { run, ...query } = route.query
  // replace, not push: Back after closing a run must not reopen it.
  router.replace({ query })
  // What the open run became (finished, aborted) shows in the list it returns to.
  runsFetch.refresh()
}
</script>
