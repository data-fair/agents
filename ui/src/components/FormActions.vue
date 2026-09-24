<template>
  <div
    v-if="hasDiff"
    class="d-flex ga-2"
  >
    <v-menu
      v-model="confirmCancel"
      :close-on-content-click="false"
      max-width="400"
    >
      <template #activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          color="warning"
          variant="tonal"
          :prepend-icon="mdiCancel"
        >
          {{ t('cancel') }}
        </v-btn>
      </template>
      <v-card>
        <v-card-text>{{ t('confirmCancel') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmCancel = false">
            {{ t('keep') }}
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="confirmCancel = false; emit('cancel')"
          >
            {{ t('discard') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
    <v-btn
      color="accent"
      variant="flat"
      :prepend-icon="mdiContentSave"
      :disabled="!valid"
      :loading="loading"
      @click="emit('save')"
    >
      {{ t('save') }}
    </v-btn>
  </div>
</template>

<i18n lang="yaml">
fr:
  save: Enregistrer
  cancel: Annuler
  confirmCancel: Voulez-vous annuler les modifications en cours ?
  discard: Annuler les modifications
  keep: Continuer l'édition
en:
  save: Save
  cancel: Cancel
  confirmCancel: Do you want to discard the current changes?
  discard: Discard changes
  keep: Keep editing
</i18n>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiCancel, mdiContentSave } from '@mdi/js'

// Save / cancel pair for a settings form, placed in a section header's actions
// slot. Hidden while the form has no unsaved change.
defineProps<{
  hasDiff: boolean
  // v-form reports null until it has validated
  valid: boolean | null
  loading: boolean
}>()
const emit = defineEmits<{ save: [], cancel: [] }>()

const { t } = useI18n()
const confirmCancel = ref(false)
</script>
