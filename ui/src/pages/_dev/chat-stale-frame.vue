<template>
  <v-container
    class="chat-stale-frame-container"
    fluid
  >
    <v-row class="fill-height">
      <v-col
        cols="5"
        class="d-flex flex-column"
      >
        <h1 class="text-headline-small mb-2">
          {{ t('title') }}
        </h1>
        <p class="text-body-medium text-medium-emphasis mb-4">
          {{ t('instructions') }}
        </p>
        <v-btn
          v-if="portalsOpen"
          color="primary"
          data-testid="leave-portals"
          @click="leavePortals()"
        >
          {{ t('leave') }}
        </v-btn>
        <iframe
          v-if="portalsOpen"
          :src="portalsFrameSrc"
          class="frame mt-4"
        />
      </v-col>

      <v-col
        cols="7"
        class="d-flex flex-column"
      >
        <AgentChat
          :account-type="session.account.value?.type ?? 'user'"
          :account-id="session.account.value?.id ?? ''"
          :is-admin="true"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Chat Frame Disparu Dev
  instructions: "Cette page simule data-fair après un passage par la gestion des portails : une iframe « portails » expose son propre sous-agent. Cliquez sur « Quitter les portails » pour retirer cette iframe (comme une navigation vers une page de jeu de données) puis envoyez un message au chat."
  leave: Quitter les portails
en:
  title: Stale Frame Chat Dev
  instructions: "This page mimics data-fair after visiting the portals manager: a 'portals' iframe exposes its own sub-agent. Click 'Leave portals' to remove that iframe (like navigating to a dataset page), then send a chat message."
  leave: Leave portals
</i18n>

<script lang="ts" setup>
/**
 * Dev page for the stale-frame bug: a sibling frame exposes a sub-agent tool, then
 * goes away the way an iframe does when the host navigates to another route — its
 * document is destroyed without Vue unmount hooks running and without a clean
 * `mcp-server-stopped` broadcast.
 *
 * The chat's aggregator must drop that frame's tools. Otherwise the next turn's
 * `resolveSubAgents` round-trips to the dead server and waits the MCP request
 * timeout (60s, "MCP error -32001"), so no completion request is ever sent.
 *
 * The host frame itself stays alive and keeps its own sub-agent, the way data-fair's
 * dataset page keeps its tools after the portals iframe is gone.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFrameServer, useAgentTool, useAgentSubAgent } from '@data-fair/lib-vue-agents'
import AgentChat from '~/components/AgentChat.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const session = useSessionAuthenticated()

useFrameServer('data-fair')

useAgentTool({
  name: 'read_dataset_notes',
  description: 'Read the notes attached to the current dataset',
  inputSchema: { type: 'object', properties: {} } as any,
  execute: () => ({ content: [{ type: 'text' as const, text: 'No notes yet.' }] })
} as any)

useAgentSubAgent({
  name: 'dataset_notes',
  title: 'Dataset notes',
  description: 'Summarize notes about the dataset currently open',
  prompt: 'You summarize notes about the dataset the person is looking at.',
  tools: ['read_dataset_notes']
})

// `?portals=off` is the "went to the dataset page directly" control: the portals
// frame never existed, so nothing can go stale.
const portalsOpen = ref(new URLSearchParams(window.location.search).get('portals') !== 'off')

function leavePortals () {
  portalsOpen.value = false
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '')
const portalsFrameSrc = `${window.location.origin}${base}/_dev/chat-stale-tools`
</script>

<style scoped>
.chat-stale-frame-container {
  height: calc(100vh - 100px);
}

.frame {
  width: 100%;
  height: 240px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
</style>
