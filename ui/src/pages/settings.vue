<template>
  <v-container v-if="settingsEditFetch.data.value">
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">
          {{ t('settings') }}
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-form v-model="valid">
          <vjsf-put-req
            v-model="editSettings"
            :options="vjsfOptions"
            :locale="locale"
          />
        </v-form>
      </v-col>
    </v-row>

    <df-navigation-right>
      <v-list
        v-if="settingsEditFetch.hasDiff.value"
        bg-color="background"
      >
        <v-list-item>
          <v-btn
            width="100%"
            color="accent"
            :loading="settingsEditFetch.save.loading.value"
            @click="settingsEditFetch.save.execute()"
          >
            {{ t('save') }}
          </v-btn>
        </v-list-item>
      </v-list>
    </df-navigation-right>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  settings: Paramètres
  save: Enregistrer
  saved: Les modifications ont été enregistrées
en:
  settings: Settings
  save: Save
  saved: Changes have been saved
</i18n>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'
import { useEditFetch } from '@data-fair/lib-vue/edit-fetch.js'
import { watchDeepDiff } from '@data-fair/lib-vue/deep-diff.js'
import type { Settings } from '#api/types'
import DfNavigationRight from '@data-fair/lib-vuetify/navigation-right.vue'

interface SettingsPut {
  globalPrompt?: string
  providers: Settings['providers']
}

const { t, locale } = useI18n()
const session = useSessionAuthenticated()

const settingsEditFetch = useEditFetch<Settings>(
  () => `${$apiPath}/settings/${session.account.value.type}/${session.account.value.id}`,
  {
    patch: true,
    saveOptions: {
      success: t('saved')
    }
  }
)

const valid = ref(true)
const editSettings = ref<SettingsPut>()
watchDeepDiff(() => settingsEditFetch.data.value, () => {
  if (settingsEditFetch.data.value) {
    editSettings.value = {
      globalPrompt: settingsEditFetch.data.value.globalPrompt,
      providers: settingsEditFetch.data.value.providers
    }
  }
}, { immediate: true })
watchDeepDiff(() => editSettings.value, () => {
  if (valid.value && editSettings.value && settingsEditFetch.data.value) {
    settingsEditFetch.data.value.globalPrompt = editSettings.value.globalPrompt
    settingsEditFetch.data.value.providers = editSettings.value.providers
  }
}, {})

const vjsfOptions = {
  validateOn: 'input',
  updateOn: 'blur',
  density: 'comfortable'
}

</script>
