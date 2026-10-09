<template>
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
  webRisk: "A page it reads can contain instructions, and the agent may follow them with its identity and all its tools. Prefer read-only tools for an agent with web access, or set Writing and Destructive approvals to \"Approve each call\" or \"Never offer\"."
fr:
  webRiskTitle: Cet agent lit le web et peut écrire sans approbation
  webRisk: "Une page qu'il lit peut contenir des instructions, et l'agent peut les suivre avec son identité et tous ses outils. Préférez des outils en lecture seule pour un agent qui accède au web, ou réglez les approbations Écriture et Destruction sur « Approuver chaque appel » ou « Ne jamais proposer »."
</i18n>

<script lang="ts" setup>
// The agent form, shared by the create dialog and the agent page so both are the same form.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEFAULT_APPROVALS } from '@agents/shared/approval-policy'
import VjsfAutonomousAgentWriteReq from '~/components/vjsf/vjsf-autonomous-agent-write-req.vue'
import { rewriteSimpleDirectoryUrl } from '~/utils/simple-directory-url'
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
const webWithUnapprovedWrites = computed(() => !!draft.value?.web?.enabled && (
  (draft.value.approvals?.write ?? DEFAULT_APPROVALS.write) === 'allow' ||
  (draft.value.approvals?.destructive ?? DEFAULT_APPROVALS.destructive) === 'allow'
))

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
    owner: { type: props.accountType, id: props.accountId }
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
