<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-2 mb-2">
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
      class="text-caption text-medium-emphasis"
    >
      {{ t('noRuns') }}
    </p>

    <!-- The same list as the conversations tab's: a run opens on its own page, read like a conversation. -->
    <v-list
      v-else
      density="compact"
    >
      <v-list-item
        v-for="run of runs"
        :key="run.id"
        :to="`/${accountType}/${accountId}/agents/${agent.id}/runs/${run.id}`"
        data-testid="agent-run"
      >
        <v-list-item-title class="text-body-2">
          {{ taskTitle(run.taskId) }}
        </v-list-item-title>
        <run-summary
          :run="run"
          clip
          dense
        />
      </v-list-item>
    </v-list>

    <v-pagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      density="compact"
    />
  </div>
</template>

<i18n lang="yaml">
en:
  status: Status
  noRuns: No task run yet.
  deletedTask: Deleted task
fr:
  status: Statut
  noRuns: Aucune exécution de tâche pour l'instant.
  deletedTask: Tâche supprimée
</i18n>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import RunSummary from '~/components/agent-page/RunSummary.vue'
import { runStatuses, runStatusLabel } from '~/utils/run-statuses'
import { $apiPath } from '~/context'

// The agent's task runs. Its conversations are in the Conversations tab, one row per conversation
// rather than one per turn.
const props = defineProps<{
  agent: any
  accountType: string
  accountId: string
}>()

const { t, locale } = useI18n()

const agentUrl = computed(() => `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/${props.agent.id}`)

const size = 20
const status = ref<string | null>(null)
const page = ref(1)
watch(status, () => { page.value = 1 })

const runsFetch = useFetch<{ results: any[], count: number }>(() => `${agentUrl.value}/runs`, {
  query: computed(() => ({ kind: 'task', page: page.value, size, ...(status.value ? { status: status.value } : {}) }))
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
</script>
