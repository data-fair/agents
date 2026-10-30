<template>
  <df-section-tabs
    :id="id"
    v-model="tab"
    :title="t('autonomousAgents')"
    :tabs="tabs"
    data-testid="autonomous-agents-section"
  >
    <template #windows>
      <v-tabs-window-item value="list">
        <v-card variant="flat">
          <v-card-text>
            <v-alert
              v-if="!canConfigure"
              type="info"
              variant="tonal"
              density="comfortable"
              data-testid="autonomous-agents-gated"
              :text="t('gated')"
            />
            <v-alert
              v-else-if="!agents.length"
              type="info"
              variant="tonal"
              density="comfortable"
              :text="t('none')"
            />

            <v-list
              v-if="agents.length"
              data-testid="autonomous-agent-list"
              density="comfortable"
            >
              <!-- A link to the agent's page, the one place an agent is edited. The state chips stay:
                   a stopped agent or one without an identity must be visible at a glance here. -->
              <v-list-item
                v-for="agent of agents"
                :key="agent.id"
                :title="agent.title"
                :subtitle="subtitle(agent)"
                :to="`/${accountType}/${accountId}/agents/${agent.id}`"
              >
                <template #prepend>
                  <v-icon :icon="agent.enabled ? mdiRobotOutline : mdiRobotOffOutline" />
                </template>
                <template #append>
                  <autonomous-agent-state-chips :agent="agent" />
                </template>
              </v-list-item>
            </v-list>

            <v-btn
              v-if="canConfigure"
              color="primary"
              variant="flat"
              class="mt-2"
              data-testid="autonomous-agents-add"
              :text="t('add')"
              @click="startCreate()"
            />
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </template>
  </df-section-tabs>

  <autonomous-agent-create-dialog
    v-model="dialog"
    :account-type="accountType"
    :account-id="accountId"
  />
</template>

<i18n lang="yaml">
en:
  autonomousAgents: Autonomous agents
  list: Autonomous agents
  add: Create an autonomous agent
  none: No autonomous agent yet.
  gated: Autonomous agents are still being rolled out. A superadmin in admin mode configures them for now.
  servers: "{count} MCP server(s)"
fr:
  autonomousAgents: Agents autonomes
  list: Agents autonomes
  add: Créer un agent autonome
  none: Aucun agent autonome pour le moment.
  gated: Les agents autonomes sont en cours de déploiement progressif. Pour l'instant, un superadministrateur en mode administration les configure.
  servers: "{count} serveur(s) MCP"
</i18n>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiRobotOffOutline, mdiRobotOutline } from '@mdi/js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useSession } from '@data-fair/lib-vue/session.js'
import AutonomousAgentCreateDialog from '~/components/AutonomousAgentCreateDialog.vue'
import AutonomousAgentStateChips from '~/components/AutonomousAgentStateChips.vue'
import { $apiPath, $uiConfig } from '~/context'

const props = defineProps<{
  id: string
  accountType: string
  accountId: string
}>()

const { t } = useI18n()
const session = useSession()

const tab = ref('list')
const tabs = computed(() => [{ key: 'list', title: t('list'), icon: mdiRobotOutline }])

/**
 * Whether this session may CONFIGURE an autonomous agent.
 *
 * The write routes sit behind the progressive rollout gate, which requires superadmin admin mode
 * while it is on. Offering the form to an org admin would be offering a form whose every save the
 * API refuses, so the section explains the rollout instead of pretending.
 */
const canConfigure = computed(() =>
  !$uiConfig.autonomousAgentsRequireAdminMode || !!session.state.user?.adminMode
)

const apiBase = computed(() => `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}`)
const agentsFetch = useFetch<{ results: any[] }>(apiBase)
const agents = computed(() => agentsFetch.data.value?.results ?? [])

const subtitle = (agent: any) => t('servers', { count: agent.mcpServers?.length ?? 0 })

const dialog = ref(false)
const startCreate = () => { dialog.value = true }
</script>
