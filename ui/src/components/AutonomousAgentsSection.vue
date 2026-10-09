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
                  <v-chip
                    v-if="!agent.enabled"
                    size="small"
                    color="warning"
                    variant="tonal"
                    class="mr-2"
                    :text="t('disabled')"
                  />
                  <v-chip
                    v-if="!agent.nhi?.clientId"
                    size="small"
                    color="warning"
                    variant="tonal"
                    :text="t('notEnrolled')"
                  />
                  <v-chip
                    v-else
                    size="small"
                    variant="tonal"
                    :title="agent.nhi.clientId"
                    :text="t('enrolled')"
                  />
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

  <v-dialog
    v-model="dialog"
    max-width="900"
    scrollable
  >
    <!-- Creating only: a page exists once the agent does, and the page is where it is edited. -->
    <v-card :title="t('add')">
      <v-card-text>
        <autonomous-agent-form
          ref="formRef"
          v-model="draft"
          v-model:valid="valid"
          :account-type="accountType"
          :account-id="accountId"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :text="t('cancel')"
          @click="dialog = false"
        />
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="valid === false"
          data-testid="autonomous-agent-save"
          @click="save()"
        >
          {{ t('save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
en:
  autonomousAgents: Autonomous agents
  list: Autonomous agents
  add: Create an autonomous agent
  save: Save
  cancel: Cancel
  none: No autonomous agent yet.
  saveFailed: Could not save this autonomous agent.
  disabled: Disabled
  notEnrolled: No identity
  enrolled: Identity enrolled
  gated: Autonomous agents are still being rolled out. A superadmin in admin mode configures them for now.
  servers: "{count} MCP server(s)"
fr:
  autonomousAgents: Agents autonomes
  list: Agents autonomes
  add: Créer un agent autonome
  save: Enregistrer
  cancel: Annuler
  none: Aucun agent autonome pour le moment.
  saveFailed: Impossible d'enregistrer cet agent autonome.
  disabled: Désactivé
  notEnrolled: Pas d'identité
  enrolled: Identité enregistrée
  gated: Les agents autonomes sont en cours de déploiement progressif. Pour l'instant, un superadministrateur en mode administration les configure.
  servers: "{count} serveur(s) MCP"
</i18n>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { mdiRobotOffOutline, mdiRobotOutline } from '@mdi/js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useSession } from '@data-fair/lib-vue/session.js'
import { useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import AutonomousAgentForm from '~/components/AutonomousAgentForm.vue'
import { $apiPath, $fetch, $uiConfig } from '~/context'

const props = defineProps<{
  id: string
  accountType: string
  accountId: string
}>()

const { t } = useI18n()
const router = useRouter()
const session = useSession()
const { sendUiNotif } = useUiNotif()

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

const formRef = ref<InstanceType<typeof AutonomousAgentForm> | null>(null)
const dialog = ref(false)
const draft = ref<any>({})
const valid = ref<boolean | null>(null)
const saving = ref(false)

const startCreate = () => {
  draft.value = { enabled: true, mcpServers: [] }
  dialog.value = true
}

const save = async () => {
  if (formRef.value && !await formRef.value.validate()) return
  saving.value = true
  try {
    const created = await $fetch<{ id: string }>(apiBase.value, { method: 'POST', body: draft.value, credentials: 'include' })
    dialog.value = false
    // Everything after creation — identity, memory, tasks — happens on the agent's page.
    await router.push(`/${props.accountType}/${props.accountId}/agents/${created.id}`)
  } catch (error) {
    // Bare $fetch does not notify, unlike useFetch. Without this the admin clicks Save, the spinner
    // stops, the dialog stays open and nothing says why — and there are several real 400/403s here:
    // an unknown MCP server, the rollout gate.
    sendUiNotif({ type: 'error', msg: t('saveFailed'), error })
  } finally {
    saving.value = false
  }
}
</script>
