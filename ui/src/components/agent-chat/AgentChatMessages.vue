<template>
  <div
    ref="messagesContainer"
    class="flex-grow-1 overflow-y-auto agent-chat-message"
    style="min-height: 0"
  >
    <!-- Welcome message -->
    <div
      v-if="!messages.length"
      class="d-flex align-center justify-center fill-height"
    >
      <p class="text-body-2 text-medium-emphasis px-4 text-center">
        {{ welcomeText }}
      </p>
    </div>

    <!-- Chat messages -->
    <div
      v-for="(message, index) in messages"
      :key="index"
      class="px-2 py-1"
    >
      <div
        v-if="message.role === 'user'"
        class="d-flex justify-end"
      >
        <v-card
          class="pa-3 text-body-2 rounded-xl"
          :class="{ 'bg-surface': !isActionPrompt(message, index) }"
          color="secondary"
          :variant="isActionPrompt(message, index) ? 'flat' : 'outlined'"
        >
          {{ message.content }}
        </v-card>
      </div>
      <div
        v-else
        class="text-body-2"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="assistant-content markdown-content"
          v-html="renderMarkdown(message.content)"
        />
        <div
          v-if="message.toolInvocations?.length"
          class="mt-2"
        >
          <template
            v-for="invocation in message.toolInvocations"
            :key="invocation.toolCallId"
          >
            <v-chip
              v-if="!invocation.toolName.startsWith('subagent_')"
              size="x-small"
              :color="invocation.state === 'done' ? 'success' : 'warning'"
              variant="tonal"
              class="mr-1 mb-1"
            >
              {{ toolTitle(invocation.toolName) }}
            </v-chip>
          </template>
        </div>
        <!-- Sub-agent expandable sections -->
        <div
          v-if="message.toolInvocations?.some(ti => ti.toolName.startsWith('subagent_'))"
          class="mt-2"
        >
          <v-expansion-panels
            variant="accordion"
            density="compact"
            flat
            tile
            class="agent-chat__subagent-panels border-secondary border-s-sm border-opacity-100"
          >
            <v-expansion-panel
              v-for="invocation in message.toolInvocations.filter(ti => ti.toolName.startsWith('subagent_'))"
              :key="invocation.toolCallId"
              density="compact"
            >
              <v-expansion-panel-title class="text-body-2 py-1">
                <v-icon
                  size="x-small"
                  :color="invocation.state === 'done' ? 'success' : 'warning'"
                  class="mr-2"
                  :icon="invocation.state === 'done' ? mdiCheck : mdiLoading"
                  :class="{ 'agent-chat__spin': invocation.state !== 'done' }"
                />
                <span class="font-weight-medium">{{ subAgentTitle(invocation.toolName) }}</span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div
                  v-if="message.subAgentMessages?.length"
                >
                  <div
                    v-for="(subMsg, subIdx) in message.subAgentMessages"
                    :key="subIdx"
                    class="py-1"
                  >
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div
                      class="text-body-2 markdown-content"
                      v-html="renderMarkdown(subMsg.content)"
                    />
                    <div
                      v-if="subMsg.toolInvocations?.length"
                      class="mt-1"
                    >
                      <v-chip
                        v-for="subInv in subMsg.toolInvocations"
                        :key="subInv.toolCallId"
                        size="x-small"
                        :color="subInv.state === 'done' ? 'success' : 'warning'"
                        variant="tonal"
                        class="mr-1 mb-1"
                      >
                        {{ toolTitle(subInv.toolName) }}
                      </v-chip>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="text-body-2 text-medium-emphasis"
                >
                  {{ invocation.state === 'done' ? t('subAgentDone') : t('subAgentRunning') }}
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>
    </div>

    <!-- Loading indicator -->
    <!--
    <div
      v-if="isStreaming"
      class="px-4 py-2"
    >
      <v-progress-linear
        indeterminate
        color="primary"
        height="2"
        class="mb-0"
      />
    </div>
    -->

    <!-- Error -->
    <div
      v-if="chatError"
      class="px-4 py-2"
    >
      <v-alert
        type="error"
        density="compact"
        variant="tonal"
      >
        {{ chatError }}
      </v-alert>
    </div>

    <!-- Session cleared info -->
    <div
      v-if="sessionClearedMessage"
      class="px-4 py-2"
    >
      <v-alert
        type="info"
        density="compact"
        variant="tonal"
      >
        {{ sessionClearedMessage }}
      </v-alert>
    </div>
  </div>
</template>

<i18n lang="yaml">
fr:
  subAgentRunning: Sous-agent en cours d'exécution...
  subAgentDone: Sous-agent terminé.
en:
  subAgentRunning: Sub-agent running...
  subAgentDone: Sub-agent finished.
</i18n>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiCheck, mdiLoading } from '@mdi/js'
import { renderMarkdown } from '~/utils/markdown'
import type { ChatMessage } from '~/composables/use-agent-chat'

const props = defineProps<{
  messages: ChatMessage[]
  isStreaming: boolean
  chatError: string | null
  welcomeText: string
  toolTitle: (toolName: string) => string
  actionVisiblePrompt: string | null
  sessionClearedMessage: string | null
}>()

const isActionPrompt = (message: ChatMessage, index: number) => {
  return index === 0 && message.role === 'user' && props.actionVisiblePrompt === message.content
}

const { t } = useI18n()

const messagesContainer = ref<HTMLElement | null>(null)

const subAgentTitle = (toolName: string) => {
  const title = props.toolTitle(toolName)
  if (title !== toolName) return title
  const name = toolName.replace(/^subagent_/, '')
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

defineExpose({ messagesContainer })

// Auto-scroll is handled by the parent watching messages changes
// but we expose the container ref for it
</script>

<style>
.agent-chat-message .assistant-content {
  word-break: break-word;
}

.agent-chat-message .markdown-content ul {
  padding-left: 8px;
  margin-top: 0;
}

.agent-chat-message .agent-chat__spin {
  animation: agent-chat-spin 1s linear infinite;
}

.agent-chat-message .agent-chat__subagent-panels .v-expansion-panel-text__wrapper {
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 0px;
  padding-bottom: 0px;
}

.agent-chat-message .agent-chat__subagent-panels .v-expansion-panel-title.v-expansion-panel-title--active {
  min-height: 48px;
}

@keyframes agent-chat-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
