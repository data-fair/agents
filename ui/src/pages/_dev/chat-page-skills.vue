<template>
  <v-container
    class="chat-page-skills-container"
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
  title: Chat Skills de page Dev
  instructions: "La page publie un skill note-guide à côté de son outil describe_note. Envoyez 'read page skill skill://note-guide/SKILL.md' pour que l'agent le charge."
en:
  title: Chat Page Skills Dev
  instructions: "The page publishes a note-guide skill beside its describe_note tool. Send 'read page skill skill://note-guide/SKILL.md' to have the agent load it."
</i18n>

<script lang="ts" setup>
/**
 * Dev page for page skills: a skill registered with useAgentSkill beside a tool, which the chat lists to
 * the agent as the page's (tests/features/chat-mcp/page-skills.e2e.spec.ts).
 */
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentTool, useAgentSkill, useFrameServer } from '@data-fair/lib-vue-agents'
import AgentChat from '~/components/AgentChat.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const session = useSessionAuthenticated()

useFrameServer('self')

onMounted(() => {
  useAgentTool({
    name: 'describe_note',
    title: 'Describe note',
    description: 'Describe the note on this page',
    inputSchema: { type: 'object', properties: {} } as any,
    execute: () => ({ note: 'A dev note' })
  } as any)
  useAgentSkill({
    name: 'note-guide',
    description: 'How to work on the note of this page. Load it before using describe_note.',
    body: '# Working on the note\n\nAlways describe the note before changing it.'
  })
})
</script>

<style scoped>
.chat-page-skills-container {
  height: calc(100vh - 100px);
}
</style>
