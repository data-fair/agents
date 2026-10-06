<template>
  <v-sheet
    :elevation="elevated ? 3 : 0"
    class="agent-chat-header d-flex align-center py-2 px-4"
  >
    <v-icon
      :icon="mdiRobotOutline"
      size="small"
      class="mr-2 text-secondary flex-shrink-0"
    />

    <v-menu v-if="agentPickerEnabled && agents && agents.length > 1">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          variant="text"
          class="agent-chat-agent-picker text-none px-1"
          data-testid="agent-chat-agent-picker"
        >
          <span class="text-title-medium text-truncate text-secondary">{{ activeAgentTitle }}</span>
          <v-icon
            :icon="mdiChevronDown"
            size="small"
            class="ml-1"
          />
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="agent of agents"
          :key="agent.id"
          :active="agent.id === activeAgentId"
          :title="agent.title"
          data-testid="agent-chat-agent-option"
          @click="$emit('selectAgent', agent.id)"
        />
      </v-list>
    </v-menu>
    <span
      v-else
      class="text-title-medium text-truncate text-secondary"
      data-testid="agent-chat-title"
    >
      {{ activeAgentTitle }}
    </span>

    <v-menu
      v-if="historyEnabled"
      location="bottom end"
    >
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          :icon="mdiHistory"
          variant="flat"
          density="compact"
          :title="t('history')"
          class="ml-2"
          data-testid="agent-chat-history"
        />
      </template>
      <v-list
        density="compact"
        min-width="280"
        max-height="420"
        class="overflow-y-auto"
        data-testid="agent-chat-conversations"
      >
        <v-list-item
          v-for="conversation of conversations"
          :key="conversation.id"
          :active="conversation.id === activeConversationId"
          data-testid="agent-chat-conversation"
          @click="$emit('selectConversation', conversation)"
        >
          <v-list-item-title class="text-body-medium text-truncate">
            {{ conversation.title || t('untitled') }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ agentTitle(conversation.agentId) }} · {{ formatDate(conversation.lastMessageAt ?? conversation.createdAt) }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item
          v-if="!conversations?.length"
          :title="t('noConversations')"
          disabled
        />
      </v-list>
    </v-menu>

    <!-- One control, two modes. They mean the same thing — drop this thread and start another with
         the current agent (use-session-chat's newConversation) — but the back-office gets the
         conversation-aware wording, and the front-office must keep exactly the header it always had.
         Keyed on the PICKER, not on history: history is offered to every signed-in person, mono
         embeds included, so keying on it silently took the Reset button away from them. -->
    <v-btn
      v-if="agentPickerEnabled"
      :icon="mdiPlus"
      variant="flat"
      density="compact"
      :title="t('newConversation')"
      class="ml-2"
      data-testid="agent-chat-new-conversation"
      @click="$emit('newConversation')"
    />
    <v-btn
      v-else
      :icon="mdiRefresh"
      variant="flat"
      density="compact"
      :title="t('reset')"
      class="ml-2"
      @click="$emit('reset')"
    />
    <v-btn
      :icon="mdiCog"
      variant="flat"
      density="compact"
      :title="t('settings')"
      class="ml-2"
      @click="$emit('showDebug')"
    />
    <v-spacer />
  </v-sheet>
</template>

<i18n lang="yaml">
fr:
  settings: Paramètres
  reset: Réinitialiser la conversation
  history: Historique des conversations
  newConversation: Nouvelle conversation
  noConversations: Aucune conversation
  untitled: Sans titre
en:
  settings: Settings
  reset: Reset conversation
  history: Conversation history
  newConversation: New conversation
  noConversations: No conversations
  untitled: Untitled
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiCog, mdiRefresh, mdiRobotOutline, mdiHistory, mdiPlus, mdiChevronDown } from '@mdi/js'
import type { AgentOption, ConversationSummary } from '~/utils/chat-agents'

const props = defineProps<{
  isAdmin?: boolean
  title?: string
  // Raised (box-shadow) when the transcript is scrolled under the header, mirroring
  // v-app-bar's scroll-behavior="elevate". Driven by the messages container's scroll.
  elevated?: boolean
  /** The agents this person may chat with. Always passed when signed in — the history labels its rows
   * with these titles — but only rendered as a PICKER in back-office mode. */
  agents?: AgentOption[]
  /** Whether the header offers the picker at all. Portals leave this off and keep the plain title. */
  agentPickerEnabled?: boolean
  activeAgentId?: string
  /** The person's threads, newest first, across every suggested agent. */
  conversations?: ConversationSummary[]
  activeConversationId?: string
  /** Show the history control. Distinct from a populated `conversations`: an empty list is a valid
   * answer and the control must stay there to say so. */
  historyEnabled?: boolean
}>()

defineEmits<{
  showDebug: []
  reset: []
  selectAgent: [agentId: string]
  selectConversation: [conversation: ConversationSummary]
  newConversation: []
}>()

const { t, locale } = useI18n()

const activeAgentTitle = computed(() => {
  const agent = props.agents?.find(candidate => candidate.id === props.activeAgentId)
  return agent?.title ?? props.title ?? ''
})

const agentTitle = (agentId: string) => {
  return props.agents?.find(agent => agent.id === agentId)?.title ?? agentId
}

const formatDate = (value?: string) => {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
</script>

<style scoped>
/* Sit above the transcript so the scroll-triggered shadow is cast over it, and
   ease the elevation in/out like a native app bar. */
.agent-chat-header {
  position: relative;
  z-index: 1;
  transition: box-shadow 0.2s ease;
}
/* Menus render in a body-level overlay: keep a menu from growing wider than the chat when a
   conversation title is long. */
.agent-chat-agent-picker {
  max-width: 100%;
  min-width: 0;
}
</style>
