<template>
  <v-container data-iframe-height>
    <h1 class="text-title-large mb-2">
      {{ autonomousAgent?.title ?? t('loading') }}
    </h1>

    <v-alert
      v-if="pageError"
      type="warning"
      variant="tonal"
      density="comfortable"
      data-testid="autonomous-agent-error"
      :text="pageError"
    />

    <v-row v-else>
      <v-col
        cols="12"
        md="3"
      >
        <v-btn
          block
          color="primary"
          variant="flat"
          class="mb-2"
          data-testid="autonomous-agent-new-conversation"
          :text="t('newConversation')"
          @click="createConversation()"
        />
        <v-list
          density="compact"
          data-testid="autonomous-agent-conversation-list"
        >
          <v-list-item
            v-for="conversation of conversations"
            :key="conversation.id"
            :active="conversation.id === currentId"
            :title="conversation.title"
            @click="currentId = conversation.id"
          />
        </v-list>
      </v-col>

      <v-col
        cols="12"
        md="9"
      >
        <template v-if="currentId">
          <div data-testid="autonomous-agent-transcript">
            <agent-chat-messages
              :messages="chatMessages"
              :is-streaming="isStreaming"
              :activity="null"
              :chat-error="conversationError"
              :welcome-text="t('welcome')"
              :tool-title="toolTitle"
              :action-visible-prompt="null"
              :mermaid-enabled="false"
            />
          </div>

          <autonomous-agent-run-status
            :account-type="accountType"
            :account-id="accountId"
            :run="latestRun"
            :messages="storedMessages"
            @aborted="refreshRun()"
          />

          <v-textarea
            v-model="draft"
            class="mt-2"
            rows="2"
            auto-grow
            hide-details
            variant="outlined"
            :label="t('composer')"
            data-testid="autonomous-agent-composer"
          />
          <v-btn
            color="primary"
            variant="flat"
            class="mt-2"
            :loading="posting"
            :disabled="!draft.trim()"
            data-testid="autonomous-agent-send"
            :text="t('send')"
            @click="send()"
          />
        </template>
        <v-alert
          v-else
          type="info"
          variant="tonal"
          density="comfortable"
          :text="t('pickOrCreate')"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
en:
  loading: Loading…
  newConversation: New conversation
  pickOrCreate: Pick a conversation, or create one.
  composer: Message
  send: Send
  welcome: Send this autonomous agent something to work on.
  forbidden: You are not allowed to instruct this autonomous agent.
  createFailed: Could not create a conversation.
fr:
  loading: Chargement…
  newConversation: Nouvelle conversation
  pickOrCreate: Choisissez une conversation, ou créez-en une.
  composer: Message
  send: Envoyer
  welcome: Confiez une tâche à cet agent autonome.
  forbidden: Vous n'êtes pas autorisé à donner des instructions à cet agent autonome.
  createFailed: Impossible de créer une conversation.
</i18n>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, effectScope, type EffectScope } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AgentChatMessages from '~/components/agent-chat/AgentChatMessages.vue'
import AutonomousAgentRunStatus from '~/components/AutonomousAgentRunStatus.vue'
import { useAutonomousAgentConversation } from '~/composables/use-autonomous-agent-conversation'
import { setBreadcrumbs } from '~/utils/breadcrumbs'
import { getUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { $apiPath, $fetch } from '~/context'

const { t } = useI18n()
const route = useRoute('/[type]/[id]/autonomous-agents/[agentId]')
const accountType = route.params.type as string
const accountId = route.params.id as string
const agentId = route.params.agentId as string
const { sendUiNotif } = getUiNotif()

const autonomousAgent = ref<any | null>(null)
const conversations = ref<any[]>([])
const currentId = ref<string | null>(null)
const draft = ref('')
const pageError = ref<string | null>(null)
const latestRun = ref<any | null>(null)

const conversationsBase = `${$apiPath}/autonomous-agent-conversations/${accountType}/${accountId}`

/** The tool chips show the raw tool name: there is no localized catalog for an MCP server's tools. */
const toolTitle = (toolName: string) => toolName

/**
 * One live conversation at a time, in its own effect scope so switching threads disposes the
 * previous subscription — otherwise every thread visited would keep a listener and its own fetch
 * loop for the life of the page.
 */
// shallowRef, not ref: a deep ref would unwrap the composable's own refs and make every access
// ambiguous between the template and the script. The accessors below are what the template uses.
const conversation = shallowRef<ReturnType<typeof useAutonomousAgentConversation> | null>(null)
let scope: EffectScope | null = null

// The scope below is created inside a watcher callback, where no scope is active — so it is detached
// from the component and will NOT be stopped automatically. Without this the last conversation's
// subscription and poll survive leaving the page, once per visit.
onUnmounted(() => { scope?.stop() })

watch(currentId, (id) => {
  scope?.stop()
  conversation.value = null
  if (!id) return
  scope = effectScope()
  scope.run(() => {
    conversation.value = useAutonomousAgentConversation({ accountType, accountId, conversationId: id })
    conversation.value.refresh().then(() => refreshRun())
  })
})

const chatMessages = computed(() => conversation.value?.chatMessages.value ?? [])
const storedMessages = computed(() => conversation.value?.messages.value ?? [])
const isStreaming = computed(() => conversation.value?.isStreaming.value ?? false)
const conversationError = computed(() => conversation.value?.error.value ?? null)
const posting = computed(() => conversation.value?.posting.value ?? false)

const refreshRun = async () => {
  // The run is only needed for the status strip and the abort button — the streaming indicator
  // comes from the messages themselves, so this never gates rendering.
  const runId = [...storedMessages.value].reverse().find((m: any) => m.runId)?.runId
  if (!runId) { latestRun.value = null; return }
  try {
    latestRun.value = await $fetch(`${$apiPath}/autonomous-agent-runs/${accountType}/${accountId}/${runId}`, { credentials: 'include' })
  } catch { latestRun.value = null }
}

// A message arriving may also mean the run moved, and the notification does not say which.
watch(() => conversation.value?.version.value, () => { refreshRun() })

const loadConversations = async () => {
  const res = await $fetch<{ results: any[] }>(`${conversationsBase}?autonomousAgentId=${agentId}`, { credentials: 'include' })
  conversations.value = res.results ?? []
  if (!currentId.value && conversations.value.length) currentId.value = conversations.value[0].id
}

const createConversation = async () => {
  try {
    const created = await $fetch<any>(conversationsBase, {
      method: 'POST',
      body: { autonomousAgentId: agentId, title: new Date().toLocaleString() },
      credentials: 'include'
    })
    await loadConversations()
    currentId.value = created.id
  } catch (error) {
    // Otherwise the button simply does nothing and the failure is an unhandled rejection.
    sendUiNotif({ type: 'error', msg: t('createFailed'), error })
  }
}

const send = async () => {
  const content = draft.value
  draft.value = ''
  await conversation.value?.post(content)
  await refreshRun()
}

onMounted(async () => {
  setBreadcrumbs([])
  try {
    autonomousAgent.value = await $fetch(`${$apiPath}/autonomous-agents/${accountType}/${accountId}/${agentId}`, { credentials: 'include' })
    await loadConversations()
  } catch (err: any) {
    // A 403 here means this session may not instruct this autonomous agent. Say so rather than
    // rendering an empty thread, which reads as "there is nothing here".
    pageError.value = err?.status === 403 || err?.response?.status === 403
      ? t('forbidden')
      : (err?.data?.message ?? err?.message ?? 'unknown error')
  }
})
</script>
