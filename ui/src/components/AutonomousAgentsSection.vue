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
              <v-list-item
                v-for="agent of agents"
                :key="agent.id"
                :title="agent.title"
                :subtitle="subtitle(agent)"
              >
                <template #prepend>
                  <v-icon :icon="agent.enabled ? mdiRobotOutline : mdiRobotOffOutline" />
                </template>
                <template #append>
                  <!-- Not enabled is shown explicitly: it is a real kill switch, so an admin must
                       see at a glance that an autonomous agent is stopped. -->
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
                    class="mr-2"
                    :text="t('notEnrolled')"
                  />
                  <v-btn
                    :to="`/${accountType}/${accountId}/autonomous-agents/${agent.id}`"
                    variant="text"
                    size="small"
                    :text="t('open')"
                  />
                  <v-btn
                    v-if="canConfigure"
                    icon
                    variant="text"
                    size="small"
                    :title="t('edit')"
                    @click="startEdit(agent)"
                  >
                    <v-icon :icon="mdiPencil" />
                  </v-btn>
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
    <v-card :title="editing ? t('edit') : t('add')">
      <v-card-text>
        <v-form
          ref="formRef"
          v-model="valid"
        >
          <vjsf-autonomous-agent-write-req
            v-model="draft"
            :locale="locale"
            :options="vjsfOptions"
          />
        </v-form>
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
  edit: Edit
  open: Open
  save: Save
  cancel: Cancel
  none: No autonomous agent yet.
  disabled: Disabled
  notEnrolled: No identity
  gated: Autonomous agents are still being rolled out. A superadmin in admin mode configures them for now.
  servers: "{count} MCP server(s)"
fr:
  autonomousAgents: Agents autonomes
  list: Agents autonomes
  add: Créer un agent autonome
  edit: Modifier
  open: Ouvrir
  save: Enregistrer
  cancel: Annuler
  none: Aucun agent autonome pour le moment.
  disabled: Désactivé
  notEnrolled: Pas d'identité
  gated: Les agents autonomes sont en cours de déploiement progressif. Pour l'instant, un superadministrateur en mode administration les configure.
  servers: "{count} serveur(s) MCP"
</i18n>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiPencil, mdiRobotOffOutline, mdiRobotOutline } from '@mdi/js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useSession } from '@data-fair/lib-vue/session.js'
import VjsfAutonomousAgentWriteReq from '~/components/vjsf/vjsf-autonomous-agent-write-req.vue'
import { $apiPath, $fetch, $uiConfig } from '~/context'

const props = defineProps<{
  id: string
  accountType: string
  accountId: string
}>()

const { t, locale } = useI18n()
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
const editing = ref<any | null>(null)
const draft = ref<any>({})
const valid = ref<boolean | null>(null)
const saving = ref(false)
/**
 * `context` is load-bearing, not decoration: the MCP server picker is an autocomplete whose
 * getItems url interpolates ${context.apiPath}/${context.accountType}/${context.accountId}, so
 * without these the picker fetches a broken url and silently offers nothing.
 */
const vjsfOptions = computed(() => ({
  validateOn: 'input' as const,
  updateOn: 'blur' as const,
  density: 'comfortable' as const,
  titleDepth: 4,
  readOnlyPropertiesMode: 'hide' as const,
  initialValidation: 'always' as const,
  context: { apiPath: $apiPath, accountType: props.accountType, accountId: props.accountId }
}))

const startCreate = () => {
  editing.value = null
  draft.value = { toolDisclosure: 'static', enabled: true, mcpServers: [] }
  dialog.value = true
}

const startEdit = (agent: any) => {
  editing.value = agent
  // The whole writable document, INCLUDING nhi: the write route rebuilds that field from the body,
  // so a PUT that omits it silently un-enrols the autonomous agent and its next turn refuses.
  draft.value = {
    title: agent.title,
    persona: agent.persona,
    instructions: agent.instructions,
    mcpServers: agent.mcpServers ?? [],
    toolDisclosure: agent.toolDisclosure,
    enabled: agent.enabled,
    instructors: agent.instructors,
    ...(agent.nhi?.clientId ? { nhi: { clientId: agent.nhi.clientId } } : {})
  }
  dialog.value = true
}

const save = async () => {
  saving.value = true
  try {
    const url = editing.value ? `${apiBase.value}/${editing.value.id}` : apiBase.value
    await $fetch(url, { method: editing.value ? 'PUT' : 'POST', body: draft.value, credentials: 'include' })
    dialog.value = false
    await agentsFetch.refresh()
  } finally {
    saving.value = false
  }
}
</script>
