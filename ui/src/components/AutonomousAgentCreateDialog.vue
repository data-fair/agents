<template>
  <v-dialog
    v-model="open"
    max-width="560"
  >
    <v-card :title="t('title')">
      <v-card-text>
        <v-form
          ref="formRef"
          @submit.prevent="create()"
        >
          <v-text-field
            v-model="title"
            :label="t('name')"
            :rules="[v => !!v?.trim() || t('required')]"
            data-testid="autonomous-agent-create-title"
            autofocus
          />
          <v-select
            v-model="role"
            :items="roles"
            :label="t('role')"
            :hint="t('roleHint')"
            persistent-hint
            class="mb-4"
            data-testid="autonomous-agent-create-role"
          />
          <div class="text-subtitle-2 mb-1">
            {{ t('example') }}
          </div>
          <v-btn-toggle
            v-model="example"
            mandatory
            color="primary"
            variant="outlined"
            divided
          >
            <v-btn
              v-for="key of AUTONOMOUS_AGENT_EXAMPLE_KEYS"
              :key="key"
              :value="key"
              :text="t('examples.' + key)"
              :data-testid="`autonomous-agent-create-example-${key}`"
            />
          </v-btn-toggle>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :text="t('cancel')"
          @click="open = false"
        />
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          data-testid="autonomous-agent-save"
          :text="t('create')"
          @click="create()"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
en:
  title: Create an autonomous agent
  name: Name
  required: Required
  role: Role in the organization
  roleHint: What the autonomous agent can do in data-fair, like a member with this role.
  example: Start from an example
  examples:
    publication: Data publication
    quality: Quality monitoring
    blank: Blank
  cancel: Cancel
  create: Create
  createFailed: Could not create this autonomous agent.
  notEnrolled: "The autonomous agent was created, but its identity could not be: {reason}"
  rolesFailed: The organization's roles could not be read, only the default ones are offered.
fr:
  title: Créer un agent autonome
  name: Nom
  required: Obligatoire
  role: Rôle dans l'organisation
  roleHint: Ce que l'agent autonome peut faire dans data-fair, comme un membre ayant ce rôle.
  example: Partir d'un exemple
  examples:
    publication: Publication de données
    quality: Suivi de qualité
    blank: Vierge
  cancel: Annuler
  create: Créer
  createFailed: Impossible de créer cet agent autonome.
  notEnrolled: "L'agent autonome a été créé, mais pas son identité : {reason}"
  rolesFailed: Les rôles de l'organisation n'ont pas pu être lus, seuls les rôles par défaut sont proposés.
</i18n>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ofetch } from 'ofetch'
import { useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { $apiPath, $fetch, $sdUrl } from '~/context'
import { useAutonomousAgentEnrolment } from '~/composables/use-autonomous-agent-enrolment'
import { AUTONOMOUS_AGENT_EXAMPLE_KEYS, exampleFields } from '~/utils/autonomous-agent-examples'
import type { AutonomousAgentExampleKey } from '~/utils/autonomous-agent-examples'
import { enrolmentErrorMessage } from '~/utils/autonomous-agent-enrolment-error'

const props = defineProps<{ accountType: string, accountId: string }>()
const open = defineModel<boolean>({ default: false })

const { t, locale } = useI18n()
const router = useRouter()
const { sendUiNotif } = useUiNotif()
const { enrol } = useAutonomousAgentEnrolment(props.accountType, props.accountId)

const DEFAULT_ROLES = ['admin', 'user']
const formRef = ref<any>(null)
const title = ref('')
const role = ref('user')
const example = ref<AutonomousAgentExampleKey>('blank')
const roles = ref<string[]>(DEFAULT_ROLES)
const saving = ref(false)

// The organization's own roles (simple-directory), so a role it does not have is not offered. Cross-service:
// ofetch directly, not $fetch, whose baseURL would rewrite the path (see use-autonomous-agent-enrolment).
const loadRoles = async () => {
  try {
    const list = await ofetch<string[]>(`${$sdUrl}/api/organizations/${props.accountId}/roles`, { credentials: 'include' })
    roles.value = Array.isArray(list) && list.length ? list : DEFAULT_ROLES
  } catch {
    roles.value = DEFAULT_ROLES
    sendUiNotif({ type: 'warning', msg: t('rolesFailed') })
  }
  if (!roles.value.includes(role.value)) role.value = roles.value[0]
}

watch(open, (isOpen) => {
  if (!isOpen) return
  title.value = ''
  role.value = 'user'
  example.value = 'blank'
  loadRoles()
})

const create = async () => {
  if (!(await formRef.value?.validate())?.valid) return
  saving.value = true
  let created: { id: string, title: string, role?: string }
  try {
    const name = title.value.trim()
    // An empty instructions string is left out rather than stored: the agent page (still on the old form
    // until its rework) stalls on a saved '' where it copes with an absent field.
    const { instructions, ...fields } = exampleFields(example.value, locale.value === 'fr' ? 'fr' : 'en', name)
    created = await $fetch(`${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}`, {
      method: 'POST',
      body: { title: name, role: role.value, ...fields, ...(instructions ? { instructions } : {}), mcpServers: [], enabled: true },
      credentials: 'include'
    })
  } catch (error) {
    sendUiNotif({ type: 'error', msg: t('createFailed'), error })
    saving.value = false
    return
  }
  try {
    await enrol(created)
  } catch (error) {
    // The agent exists; only its identity does not. Say so, and land on the page, where it can be retried.
    sendUiNotif({ type: 'warning', msg: t('notEnrolled', { reason: enrolmentErrorMessage(error) }) })
  }
  open.value = false
  saving.value = false
  await router.push(`/${props.accountType}/${props.accountId}/agents/${created.id}`)
}
</script>
