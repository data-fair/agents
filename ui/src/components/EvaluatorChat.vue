<template>
  <div class="d-flex flex-column fill-height">
    <agent-chat-messages
      v-if="messages.length"
      :messages="messages"
      :is-streaming="isStreaming"
      :activity="activity"
      :chat-error="chatError"
      :welcome-text="t('welcome')"
      :tool-title="toolTitle"
      :action-visible-prompt="null"
      :mermaid-enabled="false"
      :simple-sub-agents="false"
      :show-reasoning="true"
      @navigate="onNavigate"
    />
    <div
      v-else
      class="flex-grow-1 d-flex flex-column align-center justify-center"
      style="min-height: 0"
    >
      <p class="text-body-medium text-medium-emphasis text-center mb-4">
        {{ t('welcome') }}
      </p>
    </div>
    <agent-chat-input
      :is-streaming="isStreaming"
      @send="handleSend"
      @abort="handleAbort"
    />
  </div>
</template>

<i18n lang="yaml">
fr:
  welcome: "Posez des questions sur la session tracée : ce qui s'est bien passé, ce qui a échoué, comment améliorer les prompts, outils ou modèles."
en:
  welcome: "Ask about the traced session: what went well, what failed, how to improve prompts, tools or models."
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentChat } from '~/composables/use-agent-chat'
import { buildEvaluatorTools } from '~/traces/evaluator-tools'
import { buildEvaluatorDataTools } from '~/traces/evaluator-data-tools'
import { architectureDocs, architectureTopics } from '~/traces/architecture-docs'
import { EVALUATOR_PROMPT, EVALUATOR_COMPARE_PREAMBLE, EVALUATOR_SOURCE_ADDENDUM } from '~/traces/evaluator-prompt'
import type { SessionRecorder } from '~/traces/session-recorder'
import { $apiPath, $sitePath } from '~/context'
import AgentChatMessages from './agent-chat/AgentChatMessages.vue'
import AgentChatInput from './agent-chat/AgentChatInput.vue'

const props = defineProps<{
  recorder: SessionRecorder
  recorderB?: SessionRecorder
  accountType: string
  accountId: string
  // The conversation owner's account. Data-exploration tools scope to it, which
  // can differ from accountType/accountId when a superadmin runs the evaluator
  // against a promoted evaluator account. Falls back to accountType/accountId.
  dataAccountType?: string
  dataAccountId?: string
  department?: string
  isSuperadmin?: boolean
}>()

const { t } = useI18n()

const baseSystemPrompt = props.recorderB ? EVALUATOR_COMPARE_PREAMBLE + EVALUATOR_PROMPT : EVALUATOR_PROMPT

const chatResult = useAgentChat({
  accountType: props.accountType,
  accountId: props.accountId,
  localTools: {
    ...buildEvaluatorTools(
      props.recorder,
      { accountType: props.accountType, accountId: props.accountId, apiPath: $apiPath, architectureDocs, architectureTopics, includeSourceTools: props.isSuperadmin },
      props.recorderB
    ),
    ...buildEvaluatorDataTools({
      accountType: props.dataAccountType ?? props.accountType,
      accountId: props.dataAccountId ?? props.accountId,
      department: props.department,
      dataFairApiPath: $sitePath + '/data-fair/api/v1'
    })
  },
  modelName: 'evaluator',
  systemPrompt: props.isSuperadmin ? baseSystemPrompt + EVALUATOR_SOURCE_ADDENDUM : baseSystemPrompt,
  // Never store the evaluator's own LLM calls: reviewing a stored trace would
  // otherwise record a confusing "meta" trace of the review itself.
  disableTraceStorage: true
})
if (!chatResult) throw new Error('Chat not supported in SSR')
const chat = chatResult

const messages = computed(() => chat.messages.value)
const isStreaming = computed(() => chat.status.value === 'streaming')
const activity = computed(() => chat.activity.value)
const chatError = computed(() => chat.error.value)

const toolTitle = (toolName: string) => {
  const tool = chat.tools.value[toolName] as any
  return tool?.title || toolName
}

const handleSend = (userMessage: string) => {
  if (isStreaming.value) return
  chat.sendMessage(userMessage)
}

const handleAbort = () => {
  chat.abort()
}

const onNavigate = (url: string) => {
  // links inside evaluator messages open in a new tab (this page is not an iframe)
  window.open(url, '_blank', 'noopener')
}
</script>
