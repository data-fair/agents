<template>
  <v-sheet
    v-if="run"
    class="pa-2 d-flex align-center flex-wrap"
    color="surface-light"
    rounded
    data-testid="conversation-run-status"
    :data-run-id="run.id"
  >
    <v-chip
      size="small"
      :color="statusColor"
      variant="tonal"
      class="mr-2"
      :text="run.status"
    />
    <!-- The stop reason is the part a reader cannot infer: a turn can be `done` and still have
         been cut short by a guard, a budget or the clock. -->
    <span
      v-if="run.stopReason && run.stopReason !== 'completed'"
      class="text-body-2 mr-2"
    >{{ t(`stopReason.${run.stopReason}`) }}</span>
    <span class="text-caption text-medium-emphasis mr-2">{{ t('steps', { count: run.steps ?? 0 }) }}</span>
    <span class="text-caption text-medium-emphasis mr-2">{{ t('credits', { credits: (run.credits ?? 0).toFixed(2) }) }}</span>

    <v-spacer />

    <v-btn
      v-if="run.status === 'running'"
      size="small"
      variant="text"
      color="warning"
      :loading="aborting"
      :text="t('abort')"
      @click="abort()"
    />
  </v-sheet>

  <!-- Everything the transcript cannot carry. AgentChatMessages is reused unchanged, so a failed
       tool call and what it was asked to do are surfaced here rather than by widening a component
       the in-page assistant also renders. -->
  <v-alert
    v-for="(failure, index) of failures"
    :key="index"
    type="warning"
    variant="tonal"
    density="compact"
    class="mt-2"
    data-testid="autonomous-agent-tool-failure"
  >
    <div class="text-body-2">
      {{ t('toolFailed', { tool: failure.toolName, server: failure.serverId ?? '?' }) }}
    </div>
    <div
      v-if="failure.arguments"
      class="text-caption mt-1"
    >
      <code>{{ failure.arguments }}</code>
    </div>
    <div
      v-if="failure.error"
      class="text-caption text-medium-emphasis mt-1"
    >
      {{ failure.error }}
    </div>
  </v-alert>
</template>

<i18n lang="yaml">
en:
  abort: Stop
  abortFailed: Could not stop this turn.
  steps: "{count} step(s)"
  credits: "{credits} credits"
  toolFailed: "The tool {tool} on {server} did not return a usable result."
  stopReason:
    step-limit: Stopped at its step budget.
    repeated-calls: Stopped after repeating the same tool call.
    budget: Stopped at its credit budget.
    timeout: Stopped for taking too long.
    aborted: Stopped on request.
    error: Failed.
fr:
  abort: Arrêter
  abortFailed: Impossible d'arrêter ce tour.
  steps: "{count} étape(s)"
  credits: "{credits} crédits"
  toolFailed: "L'outil {tool} sur {server} n'a pas renvoyé de résultat exploitable."
  stopReason:
    step-limit: Arrêté à son budget d'étapes.
    repeated-calls: Arrêté après avoir répété le même appel d'outil.
    budget: Arrêté à son budget de crédits.
    timeout: Arrêté car trop long.
    aborted: Arrêté à la demande.
    error: Échec.
</i18n>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { $apiPath, $fetch } from '~/context'
import { isDynamicToolUIPart } from 'ai'
import type { StoredConversationMessage } from '~/utils/autonomous-agent-chat-message'
import { summarizeToolArguments } from '~/utils/tool-arguments'

const props = defineProps<{
  accountType: string
  accountId: string
  run: any | null
  messages: StoredConversationMessage[]
}>()
const emit = defineEmits<{ aborted: [] }>()

const { t } = useI18n()
const aborting = ref(false)
const { sendUiNotif } = getUiNotif()

const statusColor = computed(() => {
  if (props.run?.status === 'running') return 'info'
  if (props.run?.status === 'done') return 'success'
  return 'warning'
})

/**
 * Failed tool calls of this run, with what the tool was asked to do.
 *
 * Read off ONE part per call: the failure is the part's own `output-error` state, alongside the server
 * and the arguments. It used to be joined from two parts — a call and a separate result holding the
 * failure — which is the shape the AI SDK's message model replaced.
 */
const failures = computed(() =>
  props.messages
    .filter(message => message.runId === props.run?.id)
    .flatMap(message => (message.parts ?? [])
      .filter(isDynamicToolUIPart)
      .filter(part => part.state === 'output-error')
      .map(part => ({
        toolName: part.toolName,
        serverId: (part.toolMetadata as { serverId?: string } | undefined)?.serverId,
        arguments: summarizeToolArguments(part.input),
        error: part.errorText
      })))
)

const abort = async () => {
  aborting.value = true
  try {
    await $fetch(`${$apiPath}/runs/${props.accountType}/${props.accountId}/${props.run.id}/abort`, {
      method: 'POST', body: {}, credentials: 'include'
    })
    emit('aborted')
  } catch (error) {
    // A 403 here is real: aborting needs the same grant as instructing.
    sendUiNotif({ type: 'error', msg: t('abortFailed'), error })
  } finally {
    aborting.value = false
  }
}
</script>
