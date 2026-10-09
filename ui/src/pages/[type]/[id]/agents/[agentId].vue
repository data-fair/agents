<template>
  <v-container
    v-if="agent"
    data-iframe-height
  >
    <div class="d-flex flex-wrap align-center ga-2">
      <template v-if="canConfigure">
        <!-- Not enabled is shown explicitly: it is a real kill switch, so an admin must see at a
             glance that an autonomous agent is stopped. -->
        <v-chip
          v-if="!agent.enabled"
          size="small"
          color="warning"
          variant="tonal"
          :text="t('disabled')"
        />
        <v-chip
          v-if="agent.nhi?.clientId"
          size="small"
          variant="tonal"
          :title="agent.nhi.clientId"
          :text="t('enrolled')"
        />
        <v-chip
          v-else
          size="small"
          color="warning"
          variant="tonal"
          :text="t('notEnrolled')"
        />
      </template>
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
      :text="isAdmin ? t('gated') : t('adminOnly')"
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
  </v-container>
</template>

<i18n lang="yaml">
en:
  agents: Agents
  configuration: Configuration
  tasks: Tasks
  history: History
  openChat: Open chat
  disabled: Disabled
  notEnrolled: No identity
  enrolled: Identity enrolled
  gated: Autonomous agents are still being rolled out. A superadmin in admin mode configures them for now.
  adminOnly: This page is for the organization's administrators. You can still instruct this agent in its chat.
fr:
  agents: Agents
  configuration: Configuration
  tasks: Tâches
  history: Historique
  openChat: Ouvrir la conversation
  disabled: Désactivé
  notEnrolled: Pas d'identité
  enrolled: Identité enregistrée
  gated: Les agents autonomes sont en cours de déploiement progressif. Pour l'instant, un superadministrateur en mode administration les configure.
  adminOnly: Cette page est réservée aux administrateurs de l'organisation. Vous pouvez toujours donner des instructions à cet agent dans sa conversation.
</i18n>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiChatOutline, mdiCogOutline, mdiHistory, mdiCalendarClock } from '@mdi/js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import AgentConfigurationTab from '~/components/agent-page/AgentConfigurationTab.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'
import { $apiPath, $uiConfig } from '~/context'

const { t } = useI18n()
const route = useRoute('/[type]/[id]/agents/[agentId]')
const router = useRouter()
const session = useSession()
const accountType = route.params.type as string
const accountId = route.params.id as string
const agentId = route.params.agentId as string

// An instructor may read the agent too (the route gives them a projection without its identity or
// instructors), which is what lets this page name the agent and point them to its chat.
const agentFetch = useFetch<any>(`${$apiPath}/autonomous-agents/${accountType}/${accountId}/${agentId}`)
const agent = computed(() => agentFetch.data.value)

/**
 * Who may configure, as the routes decide it: an org admin, and while the progressive rollout gate
 * is on, only a superadmin in admin mode. Offering a form whose every save the API refuses would be
 * pretending, so anyone else is told why instead.
 */
const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'
)
const canConfigure = computed(() =>
  isAdmin.value && (!$uiConfig.autonomousAgentsRequireAdminMode || !!session.state.user?.adminMode)
)

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
