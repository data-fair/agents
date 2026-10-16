<template>
  <v-alert
    v-if="enrolError"
    type="warning"
    variant="tonal"
    class="mb-2"
    data-testid="autonomous-agent-enrol-error"
    :title="t('enrolFailed')"
    :text="enrolError"
  />
  <!-- Persistent: the agent and its identity now disagree, and only a later successful sync (or a reload)
       makes this stale. -->
  <v-alert
    v-if="syncError"
    type="warning"
    variant="tonal"
    class="mb-2"
    data-testid="autonomous-agent-identity-sync-error"
    :text="syncError"
  />

  <df-section-tabs
    id="autonomous-agent-configuration"
    v-model="tab"
    :title="t('title')"
  >
    <template #actions>
      <div class="d-flex flex-wrap align-center ga-2">
        <!-- The identity is created in simple-directory from here, so the admin never leaves this UI.
             Not while editing: enrolling re-reads the agent, which would drop the unsaved edits. The hint
             is on a wrapper because a disabled button receives no hover. -->
        <span
          v-if="!agent.nhi?.clientId"
          :title="hasDiff ? t('saveFirst') : undefined"
        >
          <v-btn
            color="warning"
            variant="tonal"
            data-testid="autonomous-agent-enrol"
            :disabled="hasDiff"
            :loading="enrolling"
            :text="t('enrol')"
            @click="createIdentity()"
          />
        </span>
        <form-actions
          :has-diff="hasDiff"
          :valid="valid"
          :loading="save.loading.value"
          @save="save.execute()"
          @cancel="reset()"
        />
      </div>
    </template>
    <!-- The tabs drawn here rather than through the `tabs` prop, which cannot carry a test id. -->
    <template #extension>
      <v-tabs
        v-model="tab"
        :optional="false"
        color="primary"
        show-arrows
      >
        <v-tab
          v-for="tabInfo in tabs"
          :key="tabInfo.key"
          :value="tabInfo.key"
          :prepend-icon="tabInfo.icon"
          :base-color="tabInfo.color"
          :color="tabInfo.color"
          :text="tabInfo.title"
          :data-testid="`autonomous-agent-config-tab-${tabInfo.key}`"
        />
      </v-tabs>
    </template>
    <template #windows>
      <!-- eager: every tab's form stays mounted, so the validity of the tabs not shown still gates the save -->
      <v-tabs-window-item
        value="mission"
        eager
      >
        <v-form v-model="tabValid.mission">
          <vjsf-autonomous-agent-form-mission
            :model-value="parts.mission"
            :options="vjsfOptions"
            :locale="locale"
            @update:model-value="(data: any) => onPartUpdate('mission', data)"
          />
        </v-form>
      </v-tabs-window-item>
      <v-tabs-window-item
        value="tools"
        eager
      >
        <v-form v-model="tabValid.tools">
          <vjsf-autonomous-agent-form-tools
            :model-value="parts.tools"
            :options="vjsfOptions"
            :locale="locale"
            @update:model-value="(data: any) => onPartUpdate('tools', data)"
          >
            <template #mcp-profiles="{ node, statefulLayout }">
              <mcp-profiles-tree
                :account-type="accountType"
                :account-id="accountId"
                :agent-id="agent.id"
                :server-id="serverIdOf(node.dataPath)"
                :model-value="(node.data as string[] | undefined) ?? []"
                @update:model-value="(value: string[]) => statefulLayout.input(node, value)"
              />
            </template>
          </vjsf-autonomous-agent-form-tools>
        </v-form>
        <v-alert
          v-if="webWithUnapprovedWrites"
          type="warning"
          variant="tonal"
          class="mt-4"
          :title="t('webRiskTitle')"
          :text="t('webRisk')"
          data-testid="autonomous-agent-web-risk"
        />
      </v-tabs-window-item>
      <v-tabs-window-item
        value="security"
        eager
      >
        <v-form v-model="tabValid.security">
          <vjsf-autonomous-agent-form-security
            :model-value="parts.security"
            :options="vjsfOptions"
            :locale="locale"
            @update:model-value="(data: any) => onPartUpdate('security', data)"
          />
        </v-form>
      </v-tabs-window-item>
      <v-tabs-window-item
        value="memory"
        eager
      >
        <v-form v-model="tabValid.memory">
          <vjsf-autonomous-agent-form-memory
            :model-value="parts.memory"
            :options="vjsfOptions"
            :locale="locale"
            @update:model-value="(data: any) => onPartUpdate('memory', data)"
          />
        </v-form>
        <!-- Memory is the autonomous agent's own and admin-only: it can hold what other instructors said.
             Shown even with memory turned off: the store keeps its notes, and the way to inspect or clean a
             suspect one is to switch memory off and then open it here. It saves on its own (a versioned
             store), so it is outside the draft and never counts in hasDiff. -->
        <agent-memory-panel
          class="mt-4"
          :agent="agent"
          :account-type="accountType"
          :account-id="accountId"
          :can-configure="true"
        />
      </v-tabs-window-item>
    </template>
  </df-section-tabs>
</template>

<i18n lang="yaml">
en:
  title: Configuration
  saved: Changes have been saved
  tabs:
    mission: Mission
    tools: Tools
    security: Security
    memory: Memory
  enrol: Create the identity
  enrolFailed: The identity of this autonomous agent could not be created
  saveFirst: Save or cancel your changes before creating the identity.
  syncFailed: "The agent is saved, but the directory did not accept the new {field}: {message}. The identity keeps the previous value."
  fields:
    name: name
    role: role
    both: name and role
  webRiskTitle: This agent reads the web and can write without approval
  webRisk: "A page it reads can contain instructions, and the agent may follow them with its identity and all its tools. Prefer read-only tools for an agent with web access, or set approval to \"Every operation that makes changes\"."
fr:
  title: Configuration
  saved: Les modifications ont été enregistrées
  tabs:
    mission: Mission
    tools: Outils
    security: Sécurité
    memory: Mémoire
  enrol: Créer l'identité
  enrolFailed: L'identité de cet agent autonome n'a pas pu être créée
  saveFirst: Enregistrez ou annulez vos modifications avant de créer l'identité.
  syncFailed: "L'agent est enregistré, mais l'annuaire n'a pas accepté le nouveau {field} : {message}. L'identité garde l'ancienne valeur."
  fields:
    name: nom
    role: rôle
    both: nom et rôle
  webRiskTitle: Cet agent lit le web et peut écrire sans approbation
  webRisk: "Une page qu'il lit peut contenir des instructions, et l'agent peut les suivre avec son identité et tous ses outils. Préférez des outils en lecture seule pour un agent qui accède au web, ou réglez l'approbation sur « Toutes les opérations qui effectuent des modifications »."
</i18n>

<script lang="ts" setup>
import { computed, ref, shallowRef, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiBrain, mdiCardAccountDetailsOutline, mdiShieldLockOutline, mdiToolboxOutline } from '@mdi/js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import { useAsyncAction } from '@data-fair/lib-vue/async-action.js'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useLeaveGuard } from '@data-fair/lib-vue/leave-guard.js'
import { DEFAULT_APPROVAL_LEVEL } from '@agents/shared/approval-policy'
import { identityPatch } from '@agents/shared/autonomous-agent-identity'
import missionSlice from '../../../../api/doc/autonomous-agents/autonomous-agent-form-mission/schema.js'
import toolsSlice from '../../../../api/doc/autonomous-agents/autonomous-agent-form-tools/schema.js'
import securitySlice from '../../../../api/doc/autonomous-agents/autonomous-agent-form-security/schema.js'
import memorySlice from '../../../../api/doc/autonomous-agents/autonomous-agent-form-memory/schema.js'
import VjsfAutonomousAgentFormMission from '~/components/vjsf/vjsf-autonomous-agent-form-mission.vue'
import VjsfAutonomousAgentFormTools from '~/components/vjsf/vjsf-autonomous-agent-form-tools.vue'
import VjsfAutonomousAgentFormSecurity from '~/components/vjsf/vjsf-autonomous-agent-form-security.vue'
import VjsfAutonomousAgentFormMemory from '~/components/vjsf/vjsf-autonomous-agent-form-memory.vue'
import AgentMemoryPanel from '~/components/AgentMemoryPanel.vue'
import FormActions from '~/components/FormActions.vue'
import McpProfilesTree from '~/components/McpProfilesTree.vue'
import { autonomousAgentEditDraft, pruneHiddenSelections } from '~/utils/autonomous-agent-draft'
import { enrolmentErrorMessage } from '~/utils/autonomous-agent-enrolment-error'
import { rewriteSimpleDirectoryUrl } from '~/utils/simple-directory-url'
import { canonical } from '~/composables/use-settings-form'
import { useAutonomousAgentEnrolment } from '~/composables/use-autonomous-agent-enrolment'
import { $apiPath, $fetch, $sdUrl } from '~/context'

const props = defineProps<{
  agent: any
  accountType: string
  accountId: string
}>()
// The page owns the agent (its header shows the same state), so a change here asks it to re-read.
const emit = defineEmits<{ changed: [] }>()

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

// ---- one draft, edited through one vjsf form per tab ----

// Each tab edits a slice of the agent schema (api/doc/autonomous-agents/autonomous-agent-form-part.js): the
// fields of a tab are read from its slice, so they cannot drift.
type TabKey = 'mission' | 'tools' | 'security' | 'memory'
const TAB_FIELDS: Record<TabKey, string[]> = {
  mission: Object.keys(missionSlice.properties),
  tools: Object.keys(toolsSlice.properties),
  security: Object.keys(securitySlice.properties),
  memory: Object.keys(memorySlice.properties)
}
const tabKeys = Object.keys(TAB_FIELDS) as TabKey[]
const slicedFields = tabKeys.flatMap(key => TAB_FIELDS[key])

// The projection lives in a tested function, not inline: the write route treats its body as the whole
// writable document, so a property forgotten here would be silently wiped — and for nhi that un-enrols the
// agent. It also fills the defaults the forms materialize, so a page merely opened has nothing to save.
const draft = ref<Record<string, any>>({})
const saved = ref<Record<string, any>>({})
const reset = () => {
  draft.value = autonomousAgentEditDraft(props.agent)
  saved.value = autonomousAgentEditDraft(props.agent)
}

const hasDiff = computed(() => JSON.stringify(canonical(draft.value)) !== JSON.stringify(canonical(saved.value)))

// The agent is re-read after a change made outside this form — the header's enabled switch saves on its
// own. Unsaved edits survive it: the stored agent becomes the new baseline, and only `enabled` (on no tab)
// is taken into the draft, so a later Save does not revert the switch.
watch(() => props.agent, (agent) => {
  if (!hasDiff.value) return reset()
  // Keeping `nhi` from the stale draft is safe only because the enrol button is disabled while hasDiff.
  saved.value = autonomousAgentEditDraft(agent)
  draft.value = { ...draft.value, enabled: saved.value.enabled }
}, { immediate: true })
useLeaveGuard(hasDiff, { locale })
defineExpose({ hasDiff })

/**
 * As in OrgConfigSection.vue: each slice is kept as the exact object its form emitted, since vjsf only
 * ignores a modelValue that is the very object it emitted last, and re-deriving the slices on every edit
 * would reset the forms' internal state. They are re-derived when the draft changes from outside (load,
 * save, cancel, a pruned selection), and a slice whose content did not change keeps its
 * object, so that form is left alone.
 */
const pick = (source: Record<string, any>, keys: string[]) =>
  Object.fromEntries(keys.filter(key => source[key] !== undefined).map(key => [key, source[key]]))
const sameContent = (a: any, b: any) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))

const parts = shallowRef<Record<TabKey, Record<string, any>>>({ mission: {}, tools: {}, security: {}, memory: {} })
let composed: Record<string, any> | null = null
watch(draft, (value) => {
  if (toRaw(value) === composed) return
  parts.value = Object.fromEntries(tabKeys.map(key => {
    const part = pick(value, TAB_FIELDS[key])
    return [key, sameContent(part, parts.value[key]) ? parts.value[key] : part]
  })) as Record<TabKey, Record<string, any>>
}, { immediate: true })

const onPartUpdate = (tab: TabKey, data: Record<string, any>) => {
  parts.value = { ...parts.value, [tab]: data }
  // what no tab shows (nhi, enabled) travels unchanged
  const unsliced = Object.fromEntries(Object.entries(draft.value).filter(([key]) => !slicedFields.includes(key)))
  composed = Object.assign(unsliced, ...tabKeys.map(key => parts.value[key]))
  draft.value = composed!
}

// v-form reports null until validated: only an explicit false blocks the save
const tabValid = ref<Record<TabKey, boolean | null>>({ mission: null, tools: null, security: null, memory: null })
const valid = computed(() => tabKeys.every(key => tabValid.value[key] !== false))

// The tab lives in the query, apart from the page's own `tab`, so a reload or a shared link keeps it.
const tab = computed({
  get: () => tabKeys.includes(route.query.config as TabKey) ? route.query.config as string : 'mission',
  set: (value) => { router.replace({ query: { ...route.query, config: value } }) }
})
const TAB_ICONS: Record<TabKey, string> = {
  mission: mdiCardAccountDetailsOutline,
  tools: mdiToolboxOutline,
  security: mdiShieldLockOutline,
  memory: mdiBrain
}
const tabs = computed(() => tabKeys.map(key => ({
  key,
  icon: TAB_ICONS[key],
  title: t(`tabs.${key}`),
  color: tabValid.value[key] === false ? 'error' : undefined
})))

// ---- vjsf ----

/**
 * `context` is load-bearing, not decoration: the MCP server picker is an autocomplete whose getItems url
 * interpolates ${context.apiPath}/${context.accountType}/${context.accountId}, and the access-ref variants
 * of the instructors field and the role picker use ${context.owner.*} — without these the pickers fetch a
 * broken url and silently offer nothing.
 *
 * `fetch` is json-layout's getItems fetcher, not the app's $fetch (which carries our API baseURL and would
 * prefix simple-directory urls into it, see use-autonomous-agent-enrolment.ts). The access-ref schema and
 * the role picker name simple-directory root-absolute, so it is rewritten onto $sitePath here.
 */
// Which catalog servers are profiled: their references show the profile tree instead of the tool filter
// (the profiles and toolFilter layouts read context.profiledServers).
const catalogFetch = useFetch<{ results: { id: string, profiled: boolean }[] }>(() => `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/mcp-servers`)
const profiledServers = computed(() => catalogFetch.data.value?.results.filter(s => s.profiled).map(s => s.id) ?? [])
// A reference keeps only the selection its server takes (pruneHiddenSelections): switching a reference's
// server would otherwise leave a hidden toolFilter or profiles the save refuses. Only once the catalog is
// known: before, every server would look unprofiled and every profiles selection would be dropped.
watch([() => draft.value?.mcpServers, profiledServers], ([refs]) => {
  if (!catalogFetch.data.value || !Array.isArray(refs)) return
  const pruned = pruneHiddenSelections(refs, profiledServers.value)
  if (pruned !== refs) draft.value = { ...draft.value, mcpServers: pruned }
}, { deep: true, immediate: true })

// A reference's profiles node has the dataPath /mcpServers/<i>/profiles: the server is that reference's.
const serverIdOf = (dataPath: string): string | undefined => draft.value?.mcpServers?.[Number(dataPath.split('/')[2])]?.serverId

const vjsfOptions = computed(() => ({
  validateOn: 'input' as const,
  // 'input', not 'blur': a toggle that only reaches the model on blur is read as unchanged by a save
  // clicked right after it — a checkbox flipped and then saved directly did nothing at all.
  updateOn: 'input' as const,
  density: 'comfortable' as const,
  titleDepth: 4,
  readOnlyPropertiesMode: 'hide' as const,
  initialValidation: 'always' as const,
  context: {
    apiPath: $apiPath,
    accountType: props.accountType,
    accountId: props.accountId,
    owner: { type: props.accountType, id: props.accountId },
    profiledServers: profiledServers.value
  },
  fetch: async (url: string, fetchOptions: RequestInit) => {
    const response = await globalThis.fetch(rewriteSimpleDirectoryUrl(url, $sdUrl), { credentials: 'include', ...fetchOptions })
    return await response.json()
  }
}))

// Web access with writes still allowed without approval: what a page says could make the agent act. A
// warning, never a block — the admin decides. Read from the shared draft: the level is on another tab.
const webWithUnapprovedWrites = computed(() => !!draft.value?.web?.enabled &&
  (draft.value.approvalLevel ?? DEFAULT_APPROVAL_LEVEL) !== 'write')

// ---- identity (federated with simple-directory, client-side) ----

const { enrolling, error: enrolError, enrol, syncIdentity } = useAutonomousAgentEnrolment(props.accountType, props.accountId)

// Arriving from the creation dialog whose enrolment failed: its reason (a transient notification there) is
// shown persistently, beside the retry button.
const arrivedWith = (window.history.state as any)?.enrolError
if (typeof arrivedWith === 'string' && arrivedWith) enrolError.value = arrivedWith

const createIdentity = async () => {
  try {
    await enrol(props.agent)
    emit('changed')
  } catch {
    // enrolError carries simple-directory's own message, shown above the block.
  }
}

const syncError = ref<string | null>(null)

const save = useAsyncAction(async () => {
  const body = draft.value
  // Against the saved baseline, before it is replaced by the save: what changed for the identity.
  const patch = identityPatch(saved.value, body)
  await $fetch(`${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/${props.agent.id}`, {
    method: 'PUT', body, credentials: 'include'
  })
  const clientId = body.nhi?.clientId
  if (clientId && patch) {
    try {
      await syncIdentity(clientId, patch)
      syncError.value = null
    } catch (err) {
      // The divergence is accepted (a read-only directory refuses it), never silent.
      const field = patch.name && patch.role ? 'both' : patch.name ? 'name' : 'role'
      syncError.value = t('syncFailed', { field: t(`fields.${field}`), message: enrolmentErrorMessage(err) })
    }
  }
  // Saved: the agent re-read next is a fresh start, not a change to keep unsaved edits over.
  saved.value = body
  emit('changed')
}, { success: t('saved') })
</script>
