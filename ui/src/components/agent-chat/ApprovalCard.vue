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
          @click="$emit('decide', { approved: true })"
        >
          {{ t('approve') }}
        </v-btn>
        <v-btn
          variant="text"
          data-testid="approval-reject"
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
          @click="$emit('decide', { approved: false, ...(reason.trim() ? { reason: reason.trim() } : {}) })"
        >
          {{ t('confirmReject') }}
        </v-btn>
        <v-btn
          variant="text"
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
en:
  title: "Approve \"{name}\"?"
  server: "Server: {server}"
  approve: Approve
  reject: Reject
  reason: Reason (optional)
  confirmReject: Confirm rejection
  cancel: Cancel
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ title: string, input?: unknown, serverId?: string }>()
defineEmits<{ decide: [decision: { approved: boolean, reason?: string }] }>()

const { t } = useI18n()
const rejecting = ref(false)
const reason = ref('')
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
