<template>
  <v-container
    v-if="isAdmin"
    data-iframe-height
  >
    <v-alert
      v-if="agentFetch.error.value"
      type="warning"
      variant="tonal"
      data-testid="autonomous-agent-unavailable"
      :text="unavailable"
    />

    <template v-else-if="agent && !deleted">
      <div class="d-flex flex-wrap align-center ga-2 mb-4">
        <h1 class="text-h5">
          {{ agent.title }}
        </h1>
        <autonomous-agent-state-chips :agent="agent" />
        <v-spacer />
        <!-- The agent's on/off state, not a field of the configuration: it saves at once, on its own. -->
        <v-switch
          v-if="canConfigure"
          :model-value="agent.enabled"
          :label="t('enabled')"
          :loading="toggling"
          :disabled="toggling"
          color="primary"
          density="compact"
          hide-details
          inline
          class="flex-grow-0"
          data-testid="autonomous-agent-enabled"
          @update:model-value="(value: boolean | null) => toggleEnabled(!!value)"
        />
        <v-menu v-if="canConfigure">
          <template #activator="{ props: activatorProps }">
            <v-btn
              v-bind="activatorProps"
              variant="text"
              :icon="mdiDotsVertical"
              :aria-label="t('actions')"
              :title="t('actions')"
              data-testid="autonomous-agent-actions"
            />
          </template>
          <v-list density="compact">
            <v-list-item
              :prepend-icon="mdiDelete"
              base-color="error"
              :title="t('delete')"
              data-testid="autonomous-agent-delete"
              @click="deleteDialog = true"
            />
          </v-list>
        </v-menu>
      </div>

      <v-alert
        v-if="!canConfigure"
        type="info"
        variant="tonal"
        data-testid="autonomous-agents-gated"
        :text="t('gated')"
      />

      <template v-else>
        <agent-configuration
          :agent="agent"
          :account-type="accountType"
          :account-id="accountId"
          @changed="agentFetch.refresh()"
        />

        <df-section-tabs
          id="autonomous-agent-activity"
          v-model="tab"
          class="mt-6"
          :title="t('activity')"
          :tabs="tabs"
        >
          <template #windows>
            <v-tabs-window-item value="tasks">
              <agent-tasks-tab
                :agent="agent"
                :account-type="accountType"
                :account-id="accountId"
              />
            </v-tabs-window-item>
            <v-tabs-window-item value="history">
              <agent-history-tab
                :agent="agent"
                :account-type="accountType"
                :account-id="accountId"
              />
            </v-tabs-window-item>
          </template>
        </df-section-tabs>
      </template>

      <v-dialog
        v-model="deleteDialog"
        max-width="480"
      >
        <v-card :title="t('deleteTitle')">
          <v-card-text>{{ t('confirmDelete') }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              :disabled="deleting"
              :text="t('cancel')"
              @click="deleteDialog = false"
            />
            <v-btn
              color="error"
              variant="flat"
              data-testid="autonomous-agent-delete-confirm"
              :loading="deleting"
              :text="t('delete')"
              @click="remove()"
            />
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </v-container>
  <chat-panel-notice
    v-else
    agent
  />
</template>

<i18n lang="yaml">
en:
  agents: Agents
  activity: Activity
  tasks: Scheduled tasks
  history: History
  enabled: Enabled
  enableFailed: The autonomous agent could not be switched on or off
  actions: Actions
  delete: Delete
  deleteTitle: Delete this autonomous agent?
  confirmDelete: Delete the autonomous agent, its conversations, its tasks and its identity?
  cancel: Cancel
  deleteFailed: The autonomous agent could not be deleted
  identityNotDeleted: "The identity of the autonomous agent could not be deleted from the directory: {reason}. Delete it there."
  gated: Autonomous agents are still being rolled out. A superadmin in admin mode configures them for now.
  notFound: This autonomous agent does not exist, or no longer does.
  notAllowed: You are not allowed to see this autonomous agent.
  loadFailed: This autonomous agent could not be loaded.
fr:
  agents: Agents
  activity: Activité
  tasks: Tâches planifiées
  history: Historique
  enabled: Activé
  enableFailed: L'agent autonome n'a pas pu être activé ou désactivé
  actions: Actions
  delete: Supprimer
  deleteTitle: Supprimer cet agent autonome ?
  confirmDelete: Supprimer l'agent, ses conversations, ses tâches et son identité ?
  cancel: Annuler
  deleteFailed: L'agent autonome n'a pas pu être supprimé
  identityNotDeleted: "L'identité de l'agent autonome n'a pas pu être supprimée de l'annuaire : {reason}. Supprimez-la depuis l'annuaire."
  gated: Les agents autonomes sont en cours de déploiement progressif. Pour l'instant, un superadministrateur en mode administration les configure.
  notFound: Cet agent autonome n'existe pas, ou plus.
  notAllowed: Vous n'êtes pas autorisé à voir cet agent autonome.
  loadFailed: Cet agent autonome n'a pas pu être chargé.
</i18n>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiCalendarClock, mdiDelete, mdiDotsVertical, mdiHistory } from '@mdi/js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import { useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import AgentConfiguration from '~/components/agent-page/AgentConfiguration.vue'
import ChatPanelNotice from '~/components/ChatPanelNotice.vue'
import AgentTasksTab from '~/components/agent-page/AgentTasksTab.vue'
import AgentHistoryTab from '~/components/agent-page/AgentHistoryTab.vue'
import AutonomousAgentStateChips from '~/components/AutonomousAgentStateChips.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'
import { autonomousAgentEditDraft } from '~/utils/autonomous-agent-draft'
import { enrolmentErrorMessage } from '~/utils/autonomous-agent-enrolment-error'
import { apiErrorMessage } from '~/utils/api-error'
import { useAutonomousAgentEnrolment } from '~/composables/use-autonomous-agent-enrolment'
import { $apiPath, $fetch, $uiConfig } from '~/context'

const { t } = useI18n()
const { sendUiNotif } = useUiNotif()
const route = useRoute('/[type]/[id]/agents/[agentId]')
const router = useRouter()
const session = useSession()
const accountType = route.params.type as string
const accountId = route.params.id as string
const agentId = route.params.agentId as string

// An admin page, as the org page is: anyone else — an instructor among them — is told to talk to the
// agent from the chat panel.
const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'
)

/**
 * Who may configure, as the routes decide it: an org admin, and while the progressive rollout gate
 * is on, only a superadmin in admin mode. Offering a form whose every save the API refuses would be
 * pretending, so an admin blocked by the gate is told why instead.
 */
const canConfigure = computed(() =>
  isAdmin.value && (!$uiConfig.autonomousAgentsRequireAdminMode || !!session.state.user?.adminMode)
)

const agentUrl = `${$apiPath}/autonomous-agents/${accountType}/${accountId}/${agentId}`
// The alert above says what went wrong, so no notification on top of it.
const agentFetch = useFetch<any>(
  () => isAdmin.value ? agentUrl : null,
  { notifError: false }
)
const agent = computed(() => agentFetch.data.value)
const unavailable = computed(() => {
  const status = (agentFetch.error.value as any)?.status
  return status === 404 ? t('notFound') : status === 403 ? t('notAllowed') : t('loadFailed')
})

const tabs = computed(() => [
  { key: 'tasks', title: t('tasks'), icon: mdiCalendarClock },
  { key: 'history', title: t('history'), icon: mdiHistory }
])

// The Activity tab lives in the query under `tab`, so a notification url (`?tab=history&run=…`, built in
// api/src/tasks/operations.ts) opens the right one and a reload keeps it.
const tab = computed({
  get: () => {
    const queried = route.query.tab
    return tabs.value.some(tabInfo => tabInfo.key === queried) ? queried as string : 'tasks'
  },
  // An open run belongs to the history: leaving the tab closes it.
  set: (value) => {
    const { run, ...query } = route.query
    router.replace({ query: { ...(value === 'history' ? route.query : query), tab: value } })
  }
})

// ---- the on/off switch: saved at once, from the stored agent, never from the configuration's draft ----

const toggling = ref(false)
const toggleEnabled = async (enabled: boolean) => {
  toggling.value = true
  try {
    await $fetch(agentUrl, { method: 'PUT', body: { ...autonomousAgentEditDraft(agent.value), enabled }, credentials: 'include' })
  } catch (error) {
    sendUiNotif({ type: 'error', msg: apiErrorMessage(error) ?? t('enableFailed'), error: error as any })
  } finally {
    // re-read in both cases: on a failure the switch goes back to the stored state
    await agentFetch.refresh()
    toggling.value = false
  }
}

// ---- delete ----

const { removeIdentity } = useAutonomousAgentEnrolment(accountType, accountId)
const deleteDialog = ref(false)
const deleting = ref(false)
// Set once deleted: the page content (the configuration's leave guard with it) is gone before leaving.
const deleted = ref(false)
const remove = async () => {
  deleting.value = true
  try {
    // The agent first: if that fails, the agent keeps its working identity and nothing is half-done. Its
    // identity goes after, best effort: one whose subject names a deleted agent is inert (nothing signs
    // for it), so a directory that refuses only leaves the admin a clean-up to do there.
    const clientId = agent.value.nhi?.clientId
    await $fetch(agentUrl, { method: 'DELETE', credentials: 'include' })
    if (clientId) {
      try {
        await removeIdentity(clientId)
      } catch (error) {
        sendUiNotif({ type: 'warning', msg: t('identityNotDeleted', { reason: enrolmentErrorMessage(error) }) })
      }
    }
  } catch (error) {
    sendUiNotif({ type: 'error', msg: apiErrorMessage(error) ?? t('deleteFailed'), error: error as any })
    deleting.value = false
    return
  }
  deleted.value = true
  deleteDialog.value = false
  await nextTick()
  await router.push(`/${accountType}/${accountId}`)
}

watch(agent, (value) => {
  if (!value) return
  // Host routes: data-fair frames the account page at /agents-activity, named Agents there.
  setBreadcrumbs([
    { text: t('agents'), to: '/agents-activity' },
    { text: value.title }
  ])
}, { immediate: true })
</script>
