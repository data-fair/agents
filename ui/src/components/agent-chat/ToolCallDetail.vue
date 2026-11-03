<template>
  <div
    class="tool-call-detail"
    data-testid="tool-call-detail"
  >
    <template v-if="show !== 'output'">
      <div class="text-caption font-weight-bold mb-1">
        {{ isScript ? t('script') : t('input') }}
      </div>
      <pre
        class="tool-call-detail__pre pa-2 mb-2"
        data-testid="tool-call-input"
      >{{ inputText }}</pre>
    </template>
    <template v-if="show !== 'input'">
      <template v-if="invocation.errorText !== undefined">
        <v-alert
          v-if="invocation.tripwire"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-2"
          data-testid="tool-call-tripwire"
        >
          <div class="font-weight-bold">
            {{ t('tripwire') }}
          </div>
          <div class="text-caption">
            {{ t('tripwireSource', { tool: invocation.tripwire.source.tool, server: invocation.tripwire.source.server }) }}<template v-if="invocation.tripwire.source.url">
              — {{ invocation.tripwire.source.url }}
            </template>
          </div>
          <!-- Text only: this is what the tool returned, and it is addressed to the model, not to be obeyed or rendered. -->
          <pre
            class="tool-call-detail__pre pa-2 mt-1"
            data-testid="tool-call-tripwire-excerpt"
          >{{ invocation.tripwire.excerpt }}</pre>
        </v-alert>
        <div class="text-caption font-weight-bold text-error mb-1">
          {{ t('error') }}
        </div>
        <pre
          class="tool-call-detail__pre pa-2 mb-2"
          data-testid="tool-call-error"
        >{{ invocation.errorText }}</pre>
      </template>
      <div
        v-else-if="invocation.state === 'denied'"
        class="text-caption text-error mb-2"
        data-testid="tool-call-denied"
      >
        <template v-if="invocation.deniedByReviewer">
          {{ invocation.deniedReason ? t('reviewerDeniedBecause', { reason: invocation.deniedReason }) : t('reviewerDenied') }}
        </template>
        <template v-else>
          {{ invocation.deniedReason ? t('deniedBecause', { reason: invocation.deniedReason }) : t('denied') }}
        </template>
      </div>
      <template v-else-if="'output' in invocation">
        <div class="text-caption font-weight-bold mb-1">
          {{ isScript ? t('returned') : t('output') }}
        </div>
        <pre
          class="tool-call-detail__pre pa-2 mb-2"
          data-testid="tool-call-output"
        >{{ format(invocation.output) }}</pre>
      </template>
      <div
        v-else
        class="text-caption text-medium-emphasis mb-2"
      >
        {{ t('noOutput') }}
      </div>
    </template>
  </div>
</template>

<i18n lang="yaml">
fr:
  input: Entrée
  script: Script
  output: Sortie
  returned: Valeur retournée
  error: Erreur
  denied: Refusé.
  deniedBecause: "Refusé : {reason}"
  reviewerDenied: Refusé par le relecteur.
  reviewerDeniedBecause: "Refusé par le relecteur : {reason}"
  tripwire: Injection de prompt suspectée — masquée à l'agent
  tripwireSource: "Source : {tool} ({server})"
  noOutput: Aucun résultat enregistré.
en:
  input: Input
  script: Script
  output: Output
  returned: Returned value
  error: Error
  denied: Declined.
  deniedBecause: "Declined: {reason}"
  reviewerDenied: Denied by the reviewer.
  reviewerDeniedBecause: "Denied by the reviewer: {reason}"
  tripwire: Suspected prompt injection — withheld from the agent
  tripwireSource: "Source: {tool} ({server})"
  noOutput: No result recorded.
</i18n>

<script lang="ts" setup>
/**
 * One tool call as it was recorded: what went in, and what came back — the result, the error, or the
 * refusal. Verbatim, so a reviewer reads exactly what the model was given, wrapper included.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChatMessage } from '~/utils/chat-message'

const props = defineProps<{
  invocation: NonNullable<ChatMessage['toolInvocations']>[number]
  /** One half only: a script's panel shows its source above the calls it made and its value below them. */
  show?: 'input' | 'output'
}>()

const { t } = useI18n()

const isScript = computed(() => props.invocation.toolName === 'code_mode' && typeof (props.invocation.input as any)?.js === 'string')
const format = (value: unknown) => typeof value === 'string' ? value : JSON.stringify(value, null, 2)
const inputText = computed(() => isScript.value ? (props.invocation.input as any).js : format(props.invocation.input ?? {}))
</script>

<style scoped>
.tool-call-detail__pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  max-height: 20rem;
  overflow: auto;
}
</style>
