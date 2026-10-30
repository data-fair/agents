<template>
  <div>
    <div class="text-body-2 text-medium-emphasis">
      {{ new Date(run.startedAt).toLocaleString(locale) }} · {{ t(`trigger.${run.trigger}`) }}
      <!-- A running run has not been billed yet: a figure would read as its final cost. -->
      <span
        v-if="run.status !== 'running'"
        data-testid="agent-run-credits"
      >· {{ t('credits', { n: formatCredits(locale, run.credits ?? 0) }) }}</span>
    </div>
    <div class="d-flex flex-wrap align-center ga-2 mt-1">
      <v-chip
        size="small"
        variant="tonal"
        :color="statusColor[run.status]"
        :text="runStatusLabel(run.status, locale)"
      />
      <v-chip
        v-if="run.outcome"
        size="small"
        variant="outlined"
        :color="outcomeColor[run.outcome.status]"
        :text="t(`outcomes.${run.outcome.status}`)"
      />
      <span
        v-if="run.outcome && reminded"
        class="text-body-2 text-medium-emphasis"
        data-testid="agent-run-reminded"
      >{{ t('afterReminder') }}</span>
      <!-- Only a task run reports an outcome, and only a finished one could have: saying "none" of a
           skipped or running one would suggest it should have. -->
      <span
        v-else-if="run.kind === 'task' && run.status === 'done'"
        class="text-body-2 text-medium-emphasis"
        data-testid="agent-run-no-outcome"
      >{{ reminded ? t('noOutcomeReminded') : t('noOutcome') }}</span>
    </div>
    <div
      v-if="run.outcome?.summary"
      class="text-body-2 mt-1"
      :class="{ 'run-summary__clip': clip }"
    >
      {{ run.outcome.summary }}
    </div>
    <!-- Why it was skipped, or what failed: the same field on the run. -->
    <div
      v-if="run.error"
      class="text-body-2 mt-1"
      :class="[{ 'run-summary__clip': clip }, run.status === 'skipped' ? 'text-medium-emphasis' : 'text-error']"
      data-testid="agent-run-error"
    >
      {{ run.error }}
    </div>
  </div>
</template>

<i18n lang="yaml">
en:
  credits: "{n} credits"
  noOutcome: No outcome reported
  noOutcomeReminded: No outcome reported, even after a reminder
  afterReminder: after a reminder
  outcomes:
    done: Done
    nothing-to-do: Nothing to do
    needs-attention: Needs attention
  trigger:
    user: Message
    wake: Wake-up
    approval: Approval
    schedule: Scheduled
    manual: Run manually
    webhook: Webhook
fr:
  credits: "{n} crédits"
  noOutcome: Aucun résultat signalé
  noOutcomeReminded: Aucun résultat signalé, même après un rappel
  afterReminder: après un rappel
  outcomes:
    done: Fait
    nothing-to-do: Rien à faire
    needs-attention: Demande attention
  trigger:
    user: Message
    wake: Réveil
    approval: Approbation
    schedule: Planifiée
    manual: Lancée manuellement
    webhook: Webhook
</i18n>

<script lang="ts" setup>
/**
 * What a run's record says of it — when, why, its status and outcome, what it cost or why it failed —
 * read the same way in the history's list and at the top of an open task run.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCredits } from '~/utils/credits'
import { runStatusLabel } from '~/utils/run-statuses'

const props = defineProps<{
  run: any
  /** Clip the outcome summary and the error to two lines, as a list does. */
  clip?: boolean
}>()

const { t, locale } = useI18n()

// A run that ended without report_outcome is reminded once (executor.ts performTurn), recorded as a part of its
// answer. Only an open run carries its messages: the history's list does not, and says nothing of it.
const reminded = computed(() => (props.run.messages ?? []).some((m: any) => m.parts?.some((p: any) => p.type === 'data-outcome-reminder')))

const statusColor: Record<string, string> = { running: 'info', done: 'success', error: 'error', interrupted: 'error', aborted: 'warning', skipped: 'default' }
const outcomeColor: Record<string, string> = { done: 'success', 'nothing-to-do': 'default', 'needs-attention': 'warning' }
</script>

<style scoped>
.run-summary__clip {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
