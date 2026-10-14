<template>
  <div class="d-flex flex-wrap align-center ga-2 mb-4">
    <v-spacer />
    <v-btn
      color="primary"
      variant="flat"
      :prepend-icon="mdiPlus"
      :text="t('newTask')"
      @click="openForm()"
    />
  </div>

  <p
    v-if="tasksFetch.data.value && !tasks.length"
    class="text-body-2 text-medium-emphasis"
  >
    {{ t('noTasks') }}
  </p>

  <v-card
    v-for="task of tasks"
    :key="task.id"
    variant="outlined"
    class="mb-3"
    data-testid="agent-task"
  >
    <v-card-item>
      <v-card-title class="text-wrap">
        {{ task.title }}
      </v-card-title>
      <v-card-subtitle class="text-wrap">
        {{ describeScheduling(task.scheduling, lang) }}
      </v-card-subtitle>
    </v-card-item>
    <v-card-text class="pb-0">
      <div
        v-if="task.nextRunAt"
        class="text-body-2"
        data-testid="agent-task-next-run"
      >
        {{ t('nextRun', { date: new Date(task.nextRunAt).toLocaleString(locale) }) }}
      </div>
      <!-- Paused by the server (the failure streak, or a schedule it could not compute) while still
           enabled: the admin is told why, and that the way out is to save it (updateTask resumes a
           paused task on any save that leaves it enabled). A task switched off reads as disabled: its
           pause is kept, but "saving resumes it" would not be true of it. -->
      <div
        v-if="task.pausedReason && task.enabled"
        class="d-flex flex-wrap align-center ga-2 mt-2"
      >
        <v-chip
          size="small"
          color="warning"
          variant="tonal"
          data-testid="agent-task-paused"
          :text="t('paused')"
        />
        <span class="text-body-2">{{ task.pausedReason }}</span>
        <span class="text-body-2 text-medium-emphasis">{{ t('resumeHint') }}</span>
      </div>
      <v-alert
        v-if="runErrors[task.id]"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-2"
        closable
        data-testid="agent-task-run-error"
        :text="runErrors[task.id]"
        @click:close="delete runErrors[task.id]"
      />
    </v-card-text>
    <v-card-actions class="flex-wrap">
      <v-switch
        :model-value="task.enabled"
        :label="t('enabled')"
        color="primary"
        density="compact"
        hide-details
        class="flex-grow-0 ms-2 me-2"
        :loading="busy[task.id] === 'enabled'"
        :disabled="!!busy[task.id]"
        @update:model-value="setEnabled(task, !!$event)"
      />
      <v-spacer />
      <v-btn
        variant="text"
        :prepend-icon="mdiPlay"
        :loading="busy[task.id] === 'run'"
        :disabled="!!busy[task.id]"
        :text="t('runNow')"
        @click="runNow(task)"
      />
      <v-btn
        variant="text"
        :prepend-icon="mdiWebhook"
        :text="t('triggerUrl')"
        @click="openTrigger(task)"
      />
      <v-btn
        variant="text"
        :prepend-icon="mdiPencil"
        :text="t('edit')"
        @click="openForm(task)"
      />
      <v-menu max-width="400">
        <template #activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            variant="text"
            color="error"
            :prepend-icon="mdiDelete"
            :disabled="!!busy[task.id]"
            :text="t('delete')"
          />
        </template>
        <v-card>
          <v-card-text>{{ t('confirmDelete', { title: task.title }) }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn :text="t('cancel')" />
            <v-btn
              color="error"
              variant="flat"
              :text="t('confirmDeletion')"
              @click="remove(task)"
            />
          </v-card-actions>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>

  <!-- The one task form, for create and edit. A refusal (the per-agent cap, the minimum interval, a
       schedule with no next slot) is shown here and keeps the dialog open with the admin's input. -->
  <v-dialog
    v-model="formDialog"
    max-width="720"
    scrollable
  >
    <v-card :title="editedId ? t('editTask') : t('newTask')">
      <v-card-text>
        <v-form
          ref="formRef"
          v-model="valid"
        >
          <vjsf-task-write-req
            v-model="draft"
            :locale="locale"
            :options="vjsfOptions"
          />
        </v-form>
        <v-alert
          v-if="formError"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4"
          data-testid="agent-task-form-error"
          :text="formError"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :text="t('cancel')"
          @click="formDialog = false"
        />
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="valid === false"
          :text="t('save')"
          @click="saveForm()"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- The task's trigger URL (docs/architecture/planned-tasks.md, "Webhook triggers"): its key is fetched on
       demand from the key route, never part of the task read. -->
  <v-dialog
    v-model="triggerDialog"
    max-width="720"
  >
    <v-card :title="t('triggerUrl')">
      <v-card-text>
        <p class="mb-2">
          {{ t('triggerHelp') }}
        </p>
        <code
          class="d-block text-break"
          data-testid="task-trigger-url"
        >{{ triggerUrl }}</code>
      </v-card-text>
      <v-card-actions class="flex-wrap">
        <v-btn
          variant="text"
          :prepend-icon="mdiContentCopy"
          :text="t('copy')"
          @click="copyTriggerUrl()"
        />
        <v-menu max-width="400">
          <template #activator="{ props: activatorProps }">
            <v-btn
              v-bind="activatorProps"
              variant="text"
              color="warning"
              :prepend-icon="mdiRefresh"
              :text="t('regenerate')"
            />
          </template>
          <v-card>
            <v-card-text>{{ t('confirmRegenerate') }}</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn :text="t('cancel')" />
              <v-btn
                color="warning"
                variant="flat"
                :text="t('confirm')"
                @click="regenerateKey()"
              />
            </v-card-actions>
          </v-card>
        </v-menu>
        <v-spacer />
        <v-btn
          variant="text"
          :text="t('close')"
          @click="triggerDialog = false"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
en:
  newTask: New task
  editTask: Edit task
  noTasks: No planned task yet. A task runs an instruction on a schedule, without anyone in the conversation.
  nextRun: "Next run: {date}"
  paused: Paused
  resumeHint: Saving the task resumes it.
  enabled: Enabled
  runNow: Run now
  runStarted: The run has started. Its result will be in the history.
  edit: Edit
  delete: Delete
  confirmDelete: "Delete the task \"{title}\"? Its past runs stay in the history."
  confirmDeletion: Confirm deletion
  cancel: Cancel
  save: Save
  saved: The task has been saved
  deleted: The task has been deleted
  failed: The task could not be saved
  triggerUrl: Trigger URL
  triggerHelp: "A POST to this secret URL runs the task, with the request body given to the agent as data. Paste it into an events webhook subscription on a dataset topic to run the task when the dataset changes. Triggers closer than the minimum interval are merged into one run."
  copy: Copy
  copied: Copied
  regenerate: Regenerate
  confirmRegenerate: The current URL will stop working at once.
  confirm: Confirm
  close: Close
fr:
  newTask: Nouvelle tâche
  editTask: Modifier la tâche
  noTasks: Aucune tâche planifiée. Une tâche exécute une consigne selon une planification, sans personne dans la conversation.
  nextRun: "Prochaine exécution : {date}"
  paused: En pause
  resumeHint: Enregistrer la tâche la reprend.
  enabled: Activée
  runNow: Exécuter maintenant
  runStarted: L'exécution a démarré. Son résultat sera dans l'historique.
  edit: Modifier
  delete: Supprimer
  confirmDelete: "Supprimer la tâche « {title} » ? Ses exécutions passées restent dans l'historique."
  confirmDeletion: Confirmer la suppression
  cancel: Annuler
  save: Enregistrer
  saved: La tâche a été enregistrée
  deleted: La tâche a été supprimée
  failed: La tâche n'a pas pu être enregistrée
  triggerUrl: URL de déclenchement
  triggerHelp: "Une requête POST sur cette URL secrète exécute la tâche, et le corps de la requête est transmis à l'agent comme donnée. Collez-la dans un abonnement webhook du service d'événements sur un sujet de jeu de données pour exécuter la tâche quand le jeu de données change. Les déclenchements plus rapprochés que l'intervalle minimal sont regroupés en une seule exécution."
  copy: Copier
  copied: Copié
  regenerate: Régénérer
  confirmRegenerate: L'URL actuelle cessera immédiatement de fonctionner.
  confirm: Confirmer
  close: Fermer
</i18n>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiContentCopy, mdiDelete, mdiPencil, mdiPlay, mdiPlus, mdiRefresh, mdiWebhook } from '@mdi/js'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { describeScheduling } from '@agents/shared/task-schedule'
import VjsfTaskWriteReq from '~/components/vjsf/vjsf-task-write-req.vue'
import { apiErrorMessage } from '~/utils/api-error'
import { $apiPath, $fetch } from '~/context'

const props = defineProps<{
  agent: any
  accountType: string
  accountId: string
}>()

const { t, locale } = useI18n()
const { sendUiNotif } = useUiNotif()
const lang = computed(() => locale.value === 'fr' ? 'fr' : 'en')

const tasksUrl = computed(() => `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/${props.agent.id}/tasks`)
const tasksFetch = useFetch<{ results: any[] }>(tasksUrl)
const tasks = computed(() => tasksFetch.data.value?.results ?? [])

/**
 * The body every write sends: the PUT replaces the whole writable task, so the switch sends the task
 * as it is with only `enabled` changed, and the form starts from the same four keys.
 */
const writable = (task: any) => ({ title: task.title, prompt: task.prompt, scheduling: task.scheduling, enabled: task.enabled })

// One action at a time per task, by kind, so its button spins and the others wait.
const busy = reactive<Record<string, 'enabled' | 'run' | 'delete' | undefined>>({})
// Shown in place, next to the task: "run now" is refused rather than queued (a disabled agent, a run
// still going), and an admin pressing it must see that it did not run.
const runErrors = reactive<Record<string, string>>({})

const setEnabled = async (task: any, enabled: boolean) => {
  busy[task.id] = 'enabled'
  try {
    await $fetch(`${tasksUrl.value}/${task.id}`, { method: 'PUT', body: { ...writable(task), enabled }, credentials: 'include' })
    await tasksFetch.refresh()
  } catch (error) {
    sendUiNotif({ type: 'error', msg: apiErrorMessage(error) ?? t('failed'), error: error as any })
  } finally {
    busy[task.id] = undefined
  }
}

const runNow = async (task: any) => {
  busy[task.id] = 'run'
  delete runErrors[task.id]
  try {
    await $fetch(`${tasksUrl.value}/${task.id}/run`, { method: 'POST', credentials: 'include' })
    sendUiNotif({ type: 'success', msg: t('runStarted') })
  } catch (error) {
    runErrors[task.id] = apiErrorMessage(error) ?? t('failed')
  } finally {
    busy[task.id] = undefined
  }
}

const remove = async (task: any) => {
  busy[task.id] = 'delete'
  try {
    await $fetch(`${tasksUrl.value}/${task.id}`, { method: 'DELETE', credentials: 'include' })
    sendUiNotif({ type: 'success', msg: t('deleted') })
    await tasksFetch.refresh()
  } catch (error) {
    sendUiNotif({ type: 'error', msg: apiErrorMessage(error) ?? t('failed'), error: error as any })
  } finally {
    busy[task.id] = undefined
  }
}

// ---- the trigger URL ----
const triggerDialog = ref(false)
const triggerTask = ref<any>(null)
const triggerKey = ref('')
const keyUrl = (task: any) => `${tasksUrl.value}/${task.id}/webhook-key`
const triggerUrl = computed(() => triggerTask.value
  ? new URL(`${tasksUrl.value}/${triggerTask.value.id}/_trigger?key=${triggerKey.value}`, window.location.origin).href
  : '')

const openTrigger = async (task: any) => {
  try {
    triggerKey.value = await $fetch<string>(keyUrl(task), { credentials: 'include' })
    triggerTask.value = task
    triggerDialog.value = true
  } catch (error) {
    sendUiNotif({ type: 'error', msg: apiErrorMessage(error) ?? t('failed'), error: error as any })
  }
}
const regenerateKey = async () => {
  try {
    triggerKey.value = await $fetch<string>(keyUrl(triggerTask.value), { method: 'DELETE', credentials: 'include' })
  } catch (error) {
    sendUiNotif({ type: 'error', msg: apiErrorMessage(error) ?? t('failed'), error: error as any })
  }
}
const copyTriggerUrl = async () => {
  await navigator.clipboard.writeText(triggerUrl.value)
  sendUiNotif({ type: 'success', msg: t('copied') })
}

// ---- the form ----
const formDialog = ref(false)
const formRef = ref<any>(null)
const valid = ref<boolean | null>(null)
const draft = ref<any>({})
const editedId = ref<string | null>(null)
const formError = ref<string | null>(null)
const saving = ref(false)

const vjsfOptions = computed(() => ({
  // 'input', as the agent form: a value that reaches the model only on blur is missed by a Save
  // clicked right after typing it.
  validateOn: 'input' as const,
  updateOn: 'input' as const,
  density: 'comfortable' as const,
  titleDepth: 4,
  readOnlyPropertiesMode: 'hide' as const
}))

const openForm = (task?: any) => {
  editedId.value = task?.id ?? null
  draft.value = task ? writable(task) : {}
  formError.value = null
  formDialog.value = true
}

const saveForm = async () => {
  const validation = await formRef.value?.validate()
  if (validation && validation.valid === false) return
  saving.value = true
  formError.value = null
  try {
    await $fetch(editedId.value ? `${tasksUrl.value}/${editedId.value}` : tasksUrl.value, {
      method: editedId.value ? 'PUT' : 'POST', body: draft.value, credentials: 'include'
    })
    formDialog.value = false
    sendUiNotif({ type: 'success', msg: t('saved') })
    await tasksFetch.refresh()
  } catch (error) {
    formError.value = apiErrorMessage(error) ?? t('failed')
  } finally {
    saving.value = false
  }
}
</script>
