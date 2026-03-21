<template>
  <v-container
    v-if="settingsEditFetch.data.value"
    data-iframe-height
  >
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">
          {{ t('settings') }}
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <usage-card
          :account-type="accountType"
          :account-id="accountId"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-form v-model="valid">
          <vjsf-put-req
            v-model="settingsEditFetch.data.value"
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
            :disabled="!valid"
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'
import { useEditFetch } from '@data-fair/lib-vue/edit-fetch.js'
import type { Settings, ModelInfo } from '#api/types'
import DfNavigationRight from '@data-fair/lib-vuetify/navigation-right.vue'
import type { VjsfOptions } from '@koumoul/vjsf/types.js'
import UsageCard from '~/components/UsageCard.vue'

const { t, locale } = useI18n()
const route = useRoute()
useSessionAuthenticated()

const accountType = computed(() => route.params.type as string)
const accountId = computed(() => route.params.id as string)

const settingsEditFetch = useEditFetch<Settings>(
  () => `${$apiPath}/settings/${accountType.value}/${accountId.value}`,
  {
    saveOptions: {
      success: t('saved')
    }
  }
)
useLeaveGuard(settingsEditFetch.hasDiff, { locale })

const modelsFetch = useFetch<{ results: ModelInfo[] }>(() => `${$apiPath}/models/${accountType.value}/${accountId.value}`)

watchDeepDiff(() => settingsEditFetch.serverData.value?.providers, () => {
  if (!settingsEditFetch.serverData.value?.providers) return
  modelsFetch.refresh()
})

const valid = ref(true)

const vjsfOptions = computed<Partial<VjsfOptions>>(() => ({
  validateOn: 'input',
  updateOn: 'blur',
  density: 'comfortable',
  readOnlyPropertiesMode: 'hide',
  initialValidation: 'always',
  context: { models: modelsFetch.data.value?.results ?? [] }
}))
</script>
