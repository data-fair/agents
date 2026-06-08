<template>
  <v-bottom-sheet
    v-model="show"
    :max-width="600"
    persistent
    inset
  >
    <v-sheet
      rounded
      class="text-center pa-6"
    >
      <p>{{ t('message') }}</p>
      <p class="text-medium-emphasis text-caption">
        {{ t('details') }}
      </p>
      <div class="d-flex justify-center ga-3 mt-4">
        <v-btn
          variant="text"
          @click="choose('no')"
        >
          {{ t('decline') }}
        </v-btn>
        <v-btn
          color="primary"
          @click="choose('yes')"
        >
          {{ t('accept') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-bottom-sheet>
</template>

<i18n lang="yaml">
en:
  message: This assistant can store your conversation on the server so an administrator can review it.
  details: Your choice is remembered for 1 year. Stored conversations are deleted after 30 days. You can change your choice anytime in the chat settings.
  accept: Accept
  decline: Decline
fr:
  message: Cet assistant peut enregistrer votre conversation sur le serveur afin qu'un administrateur puisse la consulter.
  details: Votre choix est conservé pendant 1 an. Les conversations enregistrées sont supprimées au bout de 30 jours. Vous pouvez modifier votre choix à tout moment dans les paramètres du chat.
  accept: Accepter
  decline: Refuser
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { traceStorageAvailable, readConsent, writeConsent, type Consent } from '~/traces/trace-consent'

const { t } = useI18n()
const dismissed = ref(false)
const choice = ref(readConsent())
const show = computed(() => traceStorageAvailable.value && choice.value === undefined && !dismissed.value)

const choose = (value: Consent) => {
  writeConsent(value)
  choice.value = value
  dismissed.value = true
}
</script>
