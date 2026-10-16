<template>
  <v-form
    ref="formRef"
    v-model="valid"
  >
    <vjsf-autonomous-agent-write-req
      v-model="draft"
      :locale="locale"
      :options="vjsfOptions"
    >
      <template #mcp-profiles="{ node, statefulLayout }">
        <mcp-profiles-tree
          :account-type="accountType"
          :account-id="accountId"
          :agent-id="draft?.id"
          :server-id="serverIdOf(node.dataPath)"
          :model-value="(node.data as string[] | undefined) ?? []"
          @update:model-value="(value: string[]) => statefulLayout.input(node, value)"
        />
      </template>
    </vjsf-autonomous-agent-write-req>
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
</template>

<i18n lang="yaml">
en:
  webRiskTitle: This agent reads the web and can write without approval
  webRisk: "A page it reads can contain instructions, and the agent may follow them with its identity and all its tools. Prefer read-only tools for an agent with web access, or set approval to \"Every operation that makes changes\"."
fr:
  webRiskTitle: Cet agent lit le web et peut écrire sans approbation
  webRisk: "Une page qu'il lit peut contenir des instructions, et l'agent peut les suivre avec son identité et tous ses outils. Préférez des outils en lecture seule pour un agent qui accède au web, ou réglez l'approbation sur « Toutes les opérations qui effectuent des modifications »."
</i18n>

<script lang="ts" setup>
// The agent form, shared by the create dialog and the agent page so both are the same form.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEFAULT_APPROVAL_LEVEL } from '@agents/shared/approval-policy'
import VjsfAutonomousAgentWriteReq from '~/components/vjsf/vjsf-autonomous-agent-write-req.vue'
import McpProfilesTree from '~/components/McpProfilesTree.vue'
import { rewriteSimpleDirectoryUrl } from '~/utils/simple-directory-url'
import { pruneHiddenSelections } from '~/utils/autonomous-agent-draft'
import { $apiPath, $sdUrl } from '~/context'

const props = defineProps<{
  accountType: string
  accountId: string
}>()
const draft = defineModel<any>({ required: true })
const valid = defineModel<boolean | null>('valid', { default: null })

const { t, locale } = useI18n()
const formRef = ref<any>(null)

// Web access with writes still allowed without approval: what a page says could make the agent act. A
// warning, never a block — the admin decides. An unset level is the default a turn applies.
const webWithUnapprovedWrites = computed(() => !!draft.value?.web?.enabled &&
  (draft.value.approvalLevel ?? DEFAULT_APPROVAL_LEVEL) !== 'write')

/**
 * `context` is load-bearing, not decoration: the MCP server picker is an autocomplete whose
 * getItems url interpolates ${context.apiPath}/${context.accountType}/${context.accountId}, and
 * the access-ref variants of the instructors field use ${context.owner.*} and gate their
 * `layout.if` on context.owner.type — without these the pickers fetch a broken url and silently
 * offer nothing.
 *
 * `fetch` is json-layout's getItems fetcher, not the app's $fetch (which carries our API baseURL
 * and would prefix simple-directory urls into it, see use-autonomous-agent-enrolment.ts). The
 * access-ref schema names simple-directory root-absolute, so it is rewritten onto $sitePath here.
 */
// Which catalog servers are profiled: their references show the profile tree instead of the tool filter
// (the profiles and toolFilter layouts read context.profiledServers).
const catalogFetch = useFetch<{ results: { id: string, profiled: boolean }[] }>(() => `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/mcp-servers`)
const profiledServers = computed(() => catalogFetch.data.value?.results.filter(s => s.profiled).map(s => s.id) ?? [])
// A reference keeps only the selection its server takes (pruneHiddenSelections): switching a reference's server
// would otherwise leave a hidden toolFilter or profiles the save refuses. Only once the catalog is known: before,
// every server would look unprofiled and every profiles selection would be dropped.
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

/**
 * Validate explicitly rather than disabling Save while v-form still reports null: a disabled button
 * on an unvalidated form blocks a legitimate save, while an unvalidated submit would 400.
 */
const validate = async () => {
  const validation = await formRef.value?.validate()
  return !(validation && validation.valid === false)
}
defineExpose({ validate })
</script>
