<template>
  <v-card
    variant="outlined"
    color="warning"
    class="my-2"
    data-testid="approval-card"
  >
    <v-card-title class="text-body-large">
      {{ t('title', { name: title }) }}
    </v-card-title>
    <v-card-subtitle v-if="serverId">
      {{ t('server', { server: serverId }) }}
    </v-card-subtitle>
    <v-card-text>
      <v-alert
        v-if="serverId === WEB_SERVER_ID"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-2"
        :text="t('webWarning')"
        data-testid="approval-web-warning"
      />
      <pre class="text-body-small approval-card__input">{{ formattedInput }}</pre>
      <v-text-field
        v-if="rejecting"
        v-model="reason"
        :label="t('reason')"
        density="compact"
        maxlength="1000"
        hide-details
        class="mt-2"
        data-testid="approval-reason"
      />
    </v-card-text>
    <v-card-actions>
      <template v-if="!rejecting">
        <v-btn
          color="success"
          variant="flat"
          data-testid="approval-approve"
          :loading="sending === 'approve'"
          :disabled="!!sending || locked"
          @click="decide({ approved: true }, 'approve')"
        >
          {{ t('approve') }}
        </v-btn>
        <v-btn
          variant="text"
          data-testid="approval-reject"
          :disabled="!!sending || locked"
          @click="rejecting = true"
        >
          {{ t('reject') }}
        </v-btn>
      </template>
      <template v-else>
        <v-btn
          color="error"
          variant="flat"
          data-testid="approval-confirm-reject"
          :loading="sending === 'reject'"
          :disabled="!!sending || locked"
          @click="decide({ approved: false, ...(reason.trim() ? { reason: reason.trim() } : {}) }, 'reject')"
        >
          {{ t('confirmReject') }}
        </v-btn>
        <v-btn
          variant="text"
          :disabled="!!sending || locked"
          @click="rejecting = false"
        >
          {{ t('cancel') }}
        </v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>

<i18n lang="yaml">
fr:
  title: "Approuver « {name} » ?"
  server: "Serveur : {server}"
  approve: Approuver
  reject: Refuser
  reason: Raison (facultative)
  confirmReject: Confirmer le refus
  cancel: Annuler
  webWarning: "L'agent pourra lire ces adresses, et un texte peut contenir des instructions : leurs auteurs pourront de fait lui en donner, avec son identité et tous ses outils. Seul un administrateur de l'organisation peut approuver."
en:
  title: "Approve \"{name}\"?"
  server: "Server: {server}"
  approve: Approve
  reject: Reject
  reason: Reason (optional)
  confirmReject: Confirm rejection
  cancel: Cancel
  webWarning: "The agent will be able to read these addresses, and text can contain instructions: their authors will in effect be able to instruct it, with its identity and all its tools. Only an administrator of the organization can approve."
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// `locked`: the turn that asked is still finishing, and the server refuses a decision until it has.
const props = defineProps<{ title: string, input?: unknown, serverId?: string, locked?: boolean, failure?: string | null }>()
const emit = defineEmits<{ decide: [decision: { approved: boolean, reason?: string }] }>()

const { t } = useI18n()
// The source the service's web tools record (WEB_SERVER_ID in api/src/web/operations.ts): the only one of
// them that asks for approval is the request to allow more of the web.
const WEB_SERVER_ID = 'agent-web'
const rejecting = ref(false)
const reason = ref('')
// Set once a decision is sent: the card stays, locked, until the server re-sends the message with the
// call decided (which removes the card). Only a failure — the chat's error — gives it back, so the
// person can read why and retry.
const sending = ref<'approve' | 'reject' | null>(null)
const decide = (decision: { approved: boolean, reason?: string }, which: 'approve' | 'reject') => {
  if (sending.value || props.locked) return
  sending.value = which
  emit('decide', decision)
}
watch(() => props.failure, failure => { if (failure) sending.value = null })
// The arguments as the model sent them: what the person is approving is this exact call.
const formattedInput = computed(() => JSON.stringify(props.input ?? {}, null, 2))
</script>

<style scoped>
.approval-card__input {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 240px;
  overflow: auto;
}
</style>
