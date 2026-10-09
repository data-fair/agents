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

    <template v-else-if="agent">
      <div class="d-flex flex-wrap align-center ga-2">
        <autonomous-agent-state-chips :agent="agent" />
        <v-spacer />
        <!-- Mono-agent, exactly like a host embed. A disabled agent is still openable — the turn
             refusal is the message an admin checking the kill switch needs to see. -->
        <v-btn
          :to="{ path: `/${accountType}/${accountId}/chat`, query: { agentId } }"
          variant="text"
          :prepend-icon="mdiChatOutline"
          :text="t('openChat')"
        />
      </div>

      <v-alert
        v-if="!canConfigure"
        type="info"
        variant="tonal"
        class="mt-4"
        data-testid="autonomous-agents-gated"
        :title="agent.title"
        :text="t('gated')"
      />

      <df-section-tabs
        v-else
        id="agent"
        v-model="tab"
        :title="agent.title"
        :tabs="tabs"
      >
        <!-- Tasks and History get their windows from the components that fill them. -->
        <template #windows>
          <v-tabs-window-item value="configuration">
            <agent-configuration-tab
              :agent="agent"
              :account-type="accountType"
              :account-id="accountId"
              @changed="agentFetch.refresh()"
            />
          </v-tabs-window-item>
        </template>
      </df-section-tabs>
    </template>
  </v-container>
</template>

<i18n lang="yaml">
en:
  agents: Agents
  configuration: Configuration
  tasks: Tasks
  history: History
  openChat: Open chat
  gated: Autonomous agents are still being rolled out. A superadmin in admin mode configures them for now.
  notFound: This autonomous agent does not exist, or no longer does.
  notAllowed: You are not allowed to see this autonomous agent.
  loadFailed: This autonomous agent could not be loaded.
fr:
  agents: Agents
  configuration: Configuration
  tasks: Tâches
  history: Historique
  openChat: Ouvrir la conversation
  gated: Les agents autonomes sont en cours de déploiement progressif. Pour l'instant, un superadministrateur en mode administration les configure.
  notFound: Cet agent autonome n'existe pas, ou plus.
  notAllowed: Vous n'êtes pas autorisé à voir cet agent autonome.
  loadFailed: Cet agent autonome n'a pas pu être chargé.
</i18n>

<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiChatOutline, mdiCogOutline, mdiHistory, mdiCalendarClock } from '@mdi/js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import AgentConfigurationTab from '~/components/agent-page/AgentConfigurationTab.vue'
import AutonomousAgentStateChips from '~/components/AutonomousAgentStateChips.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'
import { $apiPath, $uiConfig } from '~/context'

const { t } = useI18n()
const route = useRoute('/[type]/[id]/agents/[agentId]')
const router = useRouter()
const session = useSession()
const accountType = route.params.type as string
const accountId = route.params.id as string
const agentId = route.params.agentId as string

// An admin page, as the org page is: anyone else — an instructor among them — is sent to the agent's
// chat, which is theirs.
const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'
)
onMounted(() => {
  if (!isAdmin.value) router.replace({ path: `/${accountType}/${accountId}/chat`, query: { agentId } })
})

/**
 * Who may configure, as the routes decide it: an org admin, and while the progressive rollout gate
 * is on, only a superadmin in admin mode. Offering a form whose every save the API refuses would be
 * pretending, so an admin blocked by the gate is told why instead.
 */
const canConfigure = computed(() =>
  isAdmin.value && (!$uiConfig.autonomousAgentsRequireAdminMode || !!session.state.user?.adminMode)
)

// The alert above says what went wrong, so no notification on top of it.
const agentFetch = useFetch<any>(
  () => isAdmin.value ? `${$apiPath}/autonomous-agents/${accountType}/${accountId}/${agentId}` : null,
  { notifError: false }
)
const agent = computed(() => agentFetch.data.value)
const unavailable = computed(() => {
  const status = (agentFetch.error.value as any)?.status
  return status === 404 ? t('notFound') : status === 403 ? t('notAllowed') : t('loadFailed')
})

const tabs = computed(() => [
  { key: 'configuration', title: t('configuration'), icon: mdiCogOutline },
  { key: 'tasks', title: t('tasks'), icon: mdiCalendarClock },
  { key: 'history', title: t('history'), icon: mdiHistory }
])

// The tab lives in the query, so a notification url (`?tab=history&run=…`) opens the right one and a
// reload keeps it.
const tab = computed({
  get: () => {
    const queried = route.query.tab
    return tabs.value.some(tabInfo => tabInfo.key === queried) ? queried as string : 'configuration'
  },
  set: (value) => { router.replace({ query: { ...route.query, tab: value } }) }
})

watch(agent, (value) => {
  if (!value) return
  // Host routes: data-fair frames the account page at /agents-activity, named Agents there.
  setBreadcrumbs([
    { text: t('agents'), to: '/agents-activity' },
    { text: value.title }
  ])
}, { immediate: true })
</script>
