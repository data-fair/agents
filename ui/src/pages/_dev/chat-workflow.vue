<!-- ui/src/pages/_dev/chat-workflow.vue -->
<template>
  <v-container
    class="chat-workflow-container"
    fluid
  >
    <v-row class="fill-height">
      <v-col
        cols="5"
        class="d-flex flex-column"
      >
        <div class="d-flex align-center mb-2">
          <h1 class="text-headline-small">
            {{ t('title') }}
          </h1>
          <v-spacer />
          <v-btn
            size="small"
            variant="text"
            @click="leave()"
          >
            Leave page
          </v-btn>
        </div>
        <p class="text-body-medium text-medium-emphasis mb-4">
          {{ t('instructions') }}
        </p>
        <p
          class="text-body-small mb-2"
          data-testid="workflow-location"
        >
          {{ location }}
        </p>
        <WorkflowDetail
          v-if="created"
          :item="created"
          @back="back()"
        />
        <p
          v-else-if="left"
          class="text-body-small text-medium-emphasis"
        >
          {{ t('left') }}
        </p>
        <WorkflowWizard
          v-else
          @created="onCreated"
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
  title: Chat Workflow Dev
  instructions: "Un mini assistant de création : le chat pilote les étapes, l'utilisateur clique Créer. La page publie son état (location, wizard, detail) et émet item-created."
  left: "Vous avez quitté la page."
en:
  title: Chat Workflow Dev
  instructions: "A mini creation wizard: the chat drives the steps, the user clicks Create. The page publishes its state (location, wizard, detail) and emits item-created."
  left: "You left the page."
</i18n>

<script lang="ts" setup>
/**
 * Dev page for host events (docs/architecture/host-events.md): the data-fair creation
 * wizard in miniature. `location` mirrors a router; Create emits item-created then moves
 * the location; "Leave page" is the departure a pending wait must survive.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFrameServer, useAgentState, emitAgentEvent } from '@data-fair/lib-vue-agents'
import AgentChat from '~/components/AgentChat.vue'
import WorkflowWizard from '~/components/dev/WorkflowWizard.vue'
import WorkflowDetail from '~/components/dev/WorkflowDetail.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const session = useSessionAuthenticated()

useFrameServer('self')

const location = ref('/workflow')
const created = ref<{ id: string, title: string } | null>(null)
const left = ref(false)

useAgentState('location', () => ({ path: location.value }))

function onCreated (item: { id: string, title: string }) {
  emitAgentEvent('item-created', item)
  created.value = item
  location.value = `/workflow/${item.id}`
}
function back () {
  created.value = null
  location.value = '/workflow'
}
function leave () {
  created.value = null
  left.value = true
  location.value = '/elsewhere'
}
</script>

<style scoped>
.chat-workflow-container {
  height: calc(100vh - 100px);
}
</style>
