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
                  <!-- Actionable rather than merely informative: the identity is created in
                       simple-directory from here, so the admin never leaves this UI. -->
                  <v-btn
                    v-if="canConfigure && !agent.nhi?.clientId"
                    size="small"
                    color="warning"
                    variant="tonal"
                    class="mr-2"
                    :loading="enrolling && enrolTarget === agent.id"
                    :text="t('enrol')"
                    @click="startEnrol(agent)"
                  />
                  <v-chip
                    v-else-if="!agent.nhi?.clientId"
                    size="small"
                    color="warning"
                    variant="tonal"
                    class="mr-2"
                    :text="t('notEnrolled')"
                  />
                  <v-chip
                    v-else
                    size="small"
                    variant="tonal"
                    class="mr-2"
                    :title="agent.nhi.clientId"
                    :text="t('enrolled')"
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
    v-model="enrolDialog"
    max-width="620"
  >
    <v-card :title="t('enrolTitle')">
      <v-card-text>
        <p class="text-body-2 mb-4">
          {{ t('enrolExplain') }}
        </p>
        <v-alert
          v-if="enrolError"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
          data-testid="autonomous-agent-enrol-error"
          :text="enrolError"
        />
        <v-select
          v-model="reuseClientId"
          :items="reusableNhis"
          item-title="label"
          item-value="id"
          clearable
          :label="t('reuseExisting')"
          :hint="t('reuseHint')"
          persistent-hint
          data-testid="autonomous-agent-enrol-reuse"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :text="t('cancel')"
          @click="enrolDialog = false"
        />
        <v-btn
          color="primary"
          variant="flat"
          :loading="enrolling"
          data-testid="autonomous-agent-enrol-confirm"
          :text="reuseClientId ? t('attach') : t('createIdentity')"
          @click="confirmEnrol()"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>

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
  saveFailed: Could not save this autonomous agent.
  disabled: Disabled
  notEnrolled: No identity
  enrolled: Identity enrolled
  enrol: Enrol an identity
  enrolTitle: Enrol a non-human identity
  enrolExplain: An autonomous agent acts under its own identity, registered in the directory. Creating one here binds it to this agent; you can also reuse an identity that already exists.
  reuseExisting: Reuse an existing identity
  reuseHint: Leave empty to create a new one for this autonomous agent.
  createIdentity: Create and enrol
  attach: Attach
  enrolFailed: Could not enrol this autonomous agent.
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
  saveFailed: Impossible d'enregistrer cet agent autonome.
  disabled: Désactivé
  notEnrolled: Pas d'identité
  enrolled: Identité enregistrée
  enrol: Enregistrer une identité
  enrolTitle: Enregistrer une identité non humaine
  enrolExplain: Un agent autonome agit sous sa propre identité, enregistrée dans l'annuaire. En créer une ici la lie à cet agent ; vous pouvez aussi réutiliser une identité existante.
  reuseExisting: Réutiliser une identité existante
  reuseHint: Laissez vide pour en créer une nouvelle pour cet agent autonome.
  createIdentity: Créer et enregistrer
  attach: Rattacher
  enrolFailed: Impossible d'enregistrer cet agent autonome.
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
import { getUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import VjsfAutonomousAgentWriteReq from '~/components/vjsf/vjsf-autonomous-agent-write-req.vue'
import { autonomousAgentEditDraft } from '~/utils/autonomous-agent-draft'
import { useAutonomousAgentEnrolment } from '~/composables/use-autonomous-agent-enrolment'
import { $apiPath, $fetch, $uiConfig } from '~/context'

const props = defineProps<{
  id: string
  accountType: string
  accountId: string
}>()

const { t, locale } = useI18n()
const session = useSession()
const { sendUiNotif } = getUiNotif()

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

const formRef = ref<any>(null)
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
  // 'input', not 'blur': this is a dialog the admin saves and closes, so a toggle that only reaches
  // the model on blur would be read as unchanged by save() — a checkbox flipped and then saved
  // directly did nothing at all.
  updateOn: 'input' as const,
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
  // The projection lives in a tested function, not inline: the write route treats its body as the
  // whole writable document, so a property added to the schema and forgotten here would be silently
  // wiped — and for nhi that un-enrols the agent.
  draft.value = autonomousAgentEditDraft(agent)
  dialog.value = true
}

// ---- enrolment (federated with simple-directory, client-side) ----
const { enrolling, error: enrolError, listNhis, enrol, attach } = useAutonomousAgentEnrolment(props.accountType, props.accountId)
const enrolDialog = ref(false)
const enrolTarget = ref<string | null>(null)
const reuseClientId = ref<string | null>(null)
const reusableNhis = ref<{ id: string, label: string }[]>([])

const startEnrol = async (agent: any) => {
  enrolTarget.value = agent.id
  reuseClientId.value = null
  reusableNhis.value = []
  enrolError.value = null
  enrolDialog.value = true
  try {
    // Offered, not required: listing is mongo-only in simple-directory, so on a file-storage
    // deployment this comes back empty and the admin simply creates a new identity.
    const existing = await listNhis()
    reusableNhis.value = existing.map(nhi => ({ id: nhi.id, label: `${nhi.name ?? nhi.id} — ${nhi.nhi?.subject ?? ''}` }))
  } catch { /* leave the list empty; creating a new identity still works */ }
}

const confirmEnrol = async () => {
  const agent = agents.value.find((a: any) => a.id === enrolTarget.value)
  if (!agent) return
  try {
    if (reuseClientId.value) await attach(agent, reuseClientId.value)
    else await enrol(agent)
    enrolDialog.value = false
    await agentsFetch.refresh()
  } catch {
    // enrolError carries simple-directory's own message; the dialog stays open showing it.
  }
}

const save = async () => {
  // Validate explicitly rather than disabling Save while v-form still reports null: a disabled
  // button on an unvalidated form blocks a legitimate save, while an unvalidated submit would 400.
  const validation = await formRef.value?.validate()
  if (validation && validation.valid === false) return
  saving.value = true
  try {
    const url = editing.value ? `${apiBase.value}/${editing.value.id}` : apiBase.value
    await $fetch(url, { method: editing.value ? 'PUT' : 'POST', body: draft.value, credentials: 'include' })
    dialog.value = false
    await agentsFetch.refresh()
  } catch (error) {
    // Bare $fetch does not notify, unlike useFetch. Without this the admin clicks Save, the spinner
    // stops, the dialog stays open and nothing says why — and there are several real 400/403s here:
    // an unknown MCP server, a failed enrolment check, the rollout gate.
    sendUiNotif({ type: 'error', msg: t('saveFailed'), error })
  } finally {
    saving.value = false
  }
}
</script>
