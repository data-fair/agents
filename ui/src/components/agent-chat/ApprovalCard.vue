<template>
  <v-card
    variant="outlined"
    color="warning"
    class="my-2"
    data-testid="approval-card"
  >
    <v-card-title
      class="text-body-large"
      data-testid="approval-title"
    >
      {{ t('heading', { name: heading }) }}
    </v-card-title>
    <!-- Not for a planning call: the task below says what it does, and the description and server are
         written for the model. -->
    <v-card-subtitle
      v-if="!taskSections && (clippedDescription || serverId)"
      class="approval-card__subtitle"
    >
      <div
        v-if="clippedDescription"
        data-testid="approval-description"
      >
        {{ clippedDescription }}
      </div>
      <div
        v-if="serverId"
        class="text-caption"
      >
        {{ t('server', { server: serverId }) }}
      </div>
    </v-card-subtitle>
    <v-card-text>
      <v-alert
        v-if="serverId === WEB_SERVER_ID"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-2"
        :text="t('webWarning')"
        data-testid="approval-web-warning"
      />
      <v-row
        v-if="taskSections"
        dense
        data-testid="approval-task"
      >
        <v-col
          v-for="section in taskSections"
          :key="section.label ?? 'task'"
          cols="12"
          :md="taskSections.length > 1 ? 6 : 12"
        >
          <div
            v-if="section.label"
            class="text-label-large mb-1"
          >
            {{ section.label }}
          </div>
          <div
            v-if="section.missing"
            class="text-body-medium text-medium-emphasis"
          >
            {{ t('taskMissing') }}
          </div>
          <v-progress-linear
            v-else-if="!section.task"
            indeterminate
          />
          <template v-else>
            <div class="text-body-medium font-weight-medium">
              {{ section.task.title }}
            </div>
            <pre class="text-body-small approval-card__prompt">{{ section.task.prompt }}</pre>
            <div class="text-body-small">
              {{ schedule(section.task.scheduling) }}
            </div>
            <div
              class="text-body-small text-medium-emphasis"
              data-testid="approval-task-state"
            >
              {{ state(section) }}
            </div>
          </template>
        </v-col>
      </v-row>
      <div
        v-else-if="!args.length"
        class="text-body-small text-medium-emphasis"
      >
        {{ t('noArguments') }}
      </div>
      <dl
        v-else
        class="text-body-small approval-card__args"
      >
        <template
          v-for="[key, value, isFile] in args"
          :key="key"
        >
          <dt class="font-weight-medium">
            {{ key }}
          </dt>
          <dd :data-testid="isFile ? 'approval-file' : undefined">
            {{ value }}
          </dd>
        </template>
      </dl>
      <v-text-field
        v-if="rejecting"
        v-model="reason"
        :label="t('reason')"
        density="compact"
        maxlength="1000"
        hide-details
        class="mt-2"
        data-testid="approval-reason"
      />
    </v-card-text>
    <v-card-text
      v-if="readonly"
      class="text-body-small text-medium-emphasis pt-0"
      data-testid="approval-readonly"
    >
      {{ t('readonly') }}
    </v-card-text>
    <v-card-actions v-else>
      <template v-if="!rejecting">
        <v-btn
          color="success"
          variant="flat"
          data-testid="approval-approve"
          :loading="sending === 'approve'"
          :disabled="!!sending || locked"
          @click="decide({ approved: true }, 'approve')"
        >
          {{ t('approve') }}
        </v-btn>
        <v-btn
          variant="text"
          data-testid="approval-reject"
          :disabled="!!sending || locked"
          @click="rejecting = true"
        >
          {{ t('reject') }}
        </v-btn>
      </template>
      <template v-else>
        <v-btn
          color="error"
          variant="flat"
          data-testid="approval-confirm-reject"
          :loading="sending === 'reject'"
          :disabled="!!sending || locked"
          @click="decide({ approved: false, ...(reason.trim() ? { reason: reason.trim() } : {}) }, 'reject')"
        >
          {{ t('confirmReject') }}
        </v-btn>
        <v-btn
          variant="text"
          :disabled="!!sending || locked"
          @click="rejecting = false"
        >
          {{ t('cancel') }}
        </v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>

<i18n lang="yaml">
fr:
  heading: "Approuver « {name} » ?"
  server: "Serveur : {server}"
  noArguments: aucun argument
  before: Avant
  after: Après
  willDelete: Cette tâche sera supprimée
  taskMissing: Cette tâche n'existe plus
  enabled: activée
  disabled: désactivée
  paused: "en pause : {reason}"
  resumes: "activée : cette modification lève la pause et planifie la prochaine exécution"
  readonly: En attente de la décision de la personne
  approve: Approuver
  reject: Refuser
  reason: Raison (facultative)
  confirmReject: Confirmer le refus
  cancel: Annuler
  fileMissing: "fichier introuvable"
  webWarning: "L'agent pourra lire ces adresses, et un texte peut contenir des instructions : leurs auteurs pourront de fait lui en donner, avec son identité et tous ses outils. Seul un administrateur de l'organisation peut approuver."
en:
  heading: "Approve \"{name}\"?"
  server: "Server: {server}"
  noArguments: no arguments
  before: Before
  after: After
  willDelete: This task will be deleted
  taskMissing: This task no longer exists
  enabled: enabled
  disabled: disabled
  paused: "paused: {reason}"
  resumes: "enabled: this change lifts the pause and plans the next run"
  readonly: Awaiting the person's decision
  approve: Approve
  reject: Reject
  reason: Reason (optional)
  confirmReject: Confirm rejection
  cancel: Cancel
  fileMissing: "no such file"
  webWarning: "The agent will be able to read these addresses, and text can contain instructions: their authors will in effect be able to instruct it, with its identity and all its tools. Only an administrator of the organization can approve."
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { describeScheduling, type ScheduleRule } from '@agents/shared/task-schedule'
import { $fetch } from '~/context'

const props = defineProps<{
  toolName: string
  /** The tool's declared annotation title, when it has one. */
  toolTitle?: string
  /** The tool's description, recorded on the gated call: what the call will do, in the tool's words. */
  description?: string
  input?: unknown
  /** The files the call would send, by argument (path, type, size). */
  files?: Record<string, { path: string, mimeType?: string, size?: number, missing?: boolean }>
  serverId?: string
  /** The configured agent's API path, where a planning call's current task is read from. */
  agentPath?: string
  // `locked`: the turn that asked is still finishing, and the server refuses a decision until it has.
  locked?: boolean
  failure?: string | null
  /** Read by someone who cannot answer it (the admin review): no buttons. */
  readonly?: boolean
}>()
const emit = defineEmits<{ decide: [decision: { approved: boolean, reason?: string }] }>()

const { t, locale } = useI18n()
// The source the service's web tools record (WEB_SERVER_ID in api/src/web/operations.ts): the only one of
// them that asks for approval is the request to allow more of the web.
const WEB_SERVER_ID = 'agent-web'
// The agent's writes to its own tasks (SELF_KNOWLEDGE_SERVER_ID and PLANNING_TOOL_NAMES in
// api/src/self-knowledge/operations.ts): shown as the task they create, change or delete.
const SELF_SERVER_ID = 'agent-self'
const PLANNING_TOOL_NAMES = ['plan_task', 'update_task', 'delete_task']

const rejecting = ref(false)
const reason = ref('')
// Set once a decision is sent: the card stays, locked, until the server re-sends the message with the
// call decided (which removes the card). Only a failure — the chat's error — gives it back, so the
// person can read why and retry.
const sending = ref<'approve' | 'reject' | null>(null)
const decide = (decision: { approved: boolean, reason?: string }, which: 'approve' | 'reject') => {
  if (sending.value || props.locked) return
  sending.value = which
  emit('decide', decision)
}
watch(() => props.failure, failure => { if (failure) sending.value = null })

// Written for the person deciding, not for a developer: the tool's own title and description rather
// than its name and a JSON dump.
const heading = computed(() => props.toolTitle || props.toolName.replace(/_/g, ' '))
const clippedDescription = computed(() => {
  const description = props.description ?? ''
  return description.length > 300 ? description.slice(0, 299) + '…' : description
})

const inputObject = computed<Record<string, unknown>>(() =>
  props.input && typeof props.input === 'object' && !Array.isArray(props.input) ? props.input as Record<string, unknown> : {})
// The arguments as the model sent them — what the person approves is this exact call — one line each.
// A file argument reads as the file it sends: path, type and size (spec §4.3), never a URL.
const formatSize = (bytes: number) => {
  const format = (n: number) => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(n)
  return bytes < 1000 ? `${bytes} B` : bytes < 1_000_000 ? `${format(bytes / 1000)} kB` : `${format(bytes / 1_000_000)} MB`
}
const args = computed(() => Object.entries(inputObject.value).map(([key, value]) => {
  const file = props.files?.[key]
  if (file) return [key, file.missing ? `${file.path} — ${t('fileMissing')}` : `${file.path} — ${file.mimeType}, ${formatSize(file.size ?? 0)}`, true] as const
  return [key, typeof value === 'string' ? value : JSON.stringify(value), false] as const
}))

type TaskShape = { title?: string, prompt?: string, scheduling?: ScheduleRule[], enabled?: boolean, pausedReason?: string }
type TaskSection = { label?: string, task?: TaskShape, missing?: boolean, resumes?: boolean }
// The model's input, not a validated task: a malformed rule is skipped rather than breaking the card.
const schedule = (scheduling: unknown) => Array.isArray(scheduling)
  ? describeScheduling(scheduling.filter(rule => rule && typeof rule === 'object'), locale.value === 'fr' ? 'fr' : 'en')
  : ''

const planning = computed(() => props.serverId === SELF_SERVER_ID && PLANNING_TOOL_NAMES.includes(props.toolName) ? props.toolName : null)

// What the task is now, for a change or a deletion: undefined while reading, null when it cannot be read.
const current = ref<TaskShape | null | undefined>(undefined)
// Sources rather than one getter: a getter building an array is a new value on every input change, so the
// task was read again each time. A response that arrives after a newer read started is dropped.
let reading = 0
watch([planning, () => inputObject.value.taskId, () => props.agentPath], async ([tool, taskId, agentPath]) => {
  if (tool !== 'update_task' && tool !== 'delete_task') return
  const read = ++reading
  current.value = undefined
  if (typeof taskId !== 'string' || !agentPath) { current.value = null; return }
  let task: TaskShape | null
  try {
    task = await $fetch<TaskShape>(`${agentPath}/tasks/${encodeURIComponent(taskId)}`)
  } catch {
    task = null
  }
  if (read === reading) current.value = task
}, { immediate: true })

// After is what updateTask (api/src/tasks/service.ts) will store: the input, with a missing `enabled` keeping
// the stored one. Any update that leaves a paused task enabled also lifts its pause, so After says so.
const after = (): TaskSection => {
  if (current.value === undefined) return { label: t('after') }
  const task = { ...inputObject.value, enabled: (inputObject.value.enabled as boolean | undefined) ?? current.value?.enabled }
  return { label: t('after'), task, resumes: !!current.value?.pausedReason && task.enabled !== false }
}

const state = ({ task, resumes }: TaskSection) => {
  if (task?.enabled === false) return t('disabled')
  if (task?.pausedReason) return t('paused', { reason: task.pausedReason })
  return resumes ? t('resumes') : t('enabled')
}

const taskSections = computed<TaskSection[] | null>(() => {
  const before = { task: current.value ?? undefined, missing: current.value === null }
  if (planning.value === 'plan_task') return [{ task: inputObject.value }]
  if (planning.value === 'update_task') return [{ label: t('before'), ...before }, after()]
  if (planning.value === 'delete_task') return [{ label: t('willDelete'), ...before }]
  return null
})
</script>

<style scoped>
.approval-card__subtitle {
  white-space: normal;
}
.approval-card__prompt {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 240px;
  overflow: auto;
}
.approval-card__args {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 12px;
  row-gap: 2px;
}
.approval-card__args dd {
  word-break: break-word;
}
</style>
