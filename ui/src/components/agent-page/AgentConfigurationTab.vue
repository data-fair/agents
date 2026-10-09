<template>
  <div class="d-flex flex-wrap align-center ga-2 mb-4">
    <!-- Actionable rather than merely informative: the identity is created in simple-directory from
         here, so the admin never leaves this UI. -->
    <v-btn
      v-if="!agent.nhi?.clientId"
      color="warning"
      variant="tonal"
      :loading="enrolling"
      :text="t('enrol')"
      @click="startEnrol()"
    />
    <!-- Memory is the agent's own and admin-only: it can hold what other instructors said. Offered
         even with memory turned off: the store keeps its notes, and the way to inspect or clean a
         suspect one is to switch memory off and then open it here. -->
    <v-btn
      variant="tonal"
      data-testid="autonomous-agent-memory"
      :text="t('memory')"
      @click="memoryDialog = true"
    />
    <v-spacer />
    <form-actions
      :has-diff="hasDiff"
      :valid="valid"
      :loading="save.loading.value"
      @save="save.execute()"
      @cancel="reset()"
    />
  </div>

  <autonomous-agent-form
    v-model="draft"
    v-model:valid="valid"
    :account-type="accountType"
    :account-id="accountId"
    @state="onFormState"
  />

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

  <agent-memory-dialog
    v-model="memoryDialog"
    :agent="agent"
    :account-type="accountType"
    :account-id="accountId"
    :can-configure="true"
  />
</template>

<i18n lang="yaml">
en:
  saved: Changes have been saved
  memory: Memory
  cancel: Cancel
  enrol: Enrol an identity
  enrolTitle: Enrol a non-human identity
  enrolExplain: An autonomous agent acts under its own identity, registered in the directory. Creating one here binds it to this agent; you can also reuse an identity that already exists.
  reuseExisting: Reuse an existing identity
  reuseHint: Leave empty to create a new one for this autonomous agent.
  createIdentity: Create and enrol
  attach: Attach
fr:
  saved: Les modifications ont été enregistrées
  memory: Mémoire
  cancel: Annuler
  enrol: Enregistrer une identité
  enrolTitle: Enregistrer une identité non humaine
  enrolExplain: Un agent autonome agit sous sa propre identité, enregistrée dans l'annuaire. En créer une ici la lie à cet agent ; vous pouvez aussi réutiliser une identité existante.
  reuseExisting: Réutiliser une identité existante
  reuseHint: Laissez vide pour en créer une nouvelle pour cet agent autonome.
  createIdentity: Créer et enregistrer
  attach: Rattacher
</i18n>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@data-fair/lib-vue/async-action.js'
import { useLeaveGuard } from '@data-fair/lib-vue/leave-guard.js'
import AgentMemoryDialog from '~/components/AgentMemoryDialog.vue'
import AutonomousAgentForm from '~/components/AutonomousAgentForm.vue'
import FormActions from '~/components/FormActions.vue'
import { autonomousAgentEditDraft } from '~/utils/autonomous-agent-draft'
import { canonical } from '~/composables/use-settings-form'
import { useAutonomousAgentEnrolment } from '~/composables/use-autonomous-agent-enrolment'
import { $apiPath, $fetch } from '~/context'

const props = defineProps<{
  agent: any
  accountType: string
  accountId: string
}>()
// The page owns the agent (its header shows the same state), so a change here asks it to re-read.
const emit = defineEmits<{ changed: [] }>()

const { t, locale } = useI18n()

// FormActions keeps Save disabled until the form reports itself valid, so no submit is unvalidated.
const valid = ref<boolean | null>(null)
const draft = ref<any>({})
const saved = ref<any>({})

// The projection lives in a tested function, not inline: the write route treats its body as the whole
// writable document, so a property added to the schema and forgotten here would be silently wiped —
// and for nhi that un-enrols the agent.
let normalizing = false
const reset = () => {
  draft.value = autonomousAgentEditDraft(props.agent)
  saved.value = autonomousAgentEditDraft(props.agent)
  normalizing = true
}
watch(() => props.agent, reset, { immediate: true })

/**
 * The baseline is the stored agent AS THE FORM HOLDS IT. vjsf materializes schema defaults (approval
 * levels, memory and web switches, an empty instructors list) into an agent stored without them —
 * any agent created through the API — so comparing against the raw document reported an unsaved
 * change on a page merely opened, and the leave guard then fired on every navigation away.
 *
 * vjsf signals its state synchronously and hands the normalized data back through v-model a tick
 * later, so the baseline is read once that has landed.
 */
const onFormState = () => {
  if (!normalizing) return
  normalizing = false
  setTimeout(() => { saved.value = JSON.parse(JSON.stringify(draft.value)) })
}

const hasDiff = computed(() => JSON.stringify(canonical(draft.value)) !== JSON.stringify(canonical(saved.value)))
useLeaveGuard(hasDiff, { locale })

const save = useAsyncAction(async () => {
  await $fetch(`${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/${props.agent.id}`, {
    method: 'PUT', body: draft.value, credentials: 'include'
  })
  emit('changed')
}, { success: t('saved') })

const memoryDialog = ref(false)

// ---- enrolment (federated with simple-directory, client-side) ----
const { enrolling, error: enrolError, listNhis, enrol, attach } = useAutonomousAgentEnrolment(props.accountType, props.accountId)
const enrolDialog = ref(false)
const reuseClientId = ref<string | null>(null)
const reusableNhis = ref<{ id: string, label: string }[]>([])

const startEnrol = async () => {
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
  try {
    if (reuseClientId.value) await attach(props.agent, reuseClientId.value)
    else await enrol(props.agent)
    enrolDialog.value = false
    emit('changed')
  } catch {
    // enrolError carries simple-directory's own message; the dialog stays open showing it.
  }
}
</script>
