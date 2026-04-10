<template>
  <v-container
    v-if="settingsEditFetch.data.value"
    data-iframe-height
  >
    <div id="section-configuration">
      <h3 class="text-h6 mb-4">
        {{ t('configuration') }}
      </h3>
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

      <v-row>
        <v-col>
          <usage-card
            :account-type="accountType"
            :account-id="accountId"
          />
        </v-col>
      </v-row>
    </div>

    <div id="section-global">
      <h3 class="text-h6 mt-6 mb-4">
        {{ t('globalUsage') }}
      </h3>
      <monitoring-global-section
        :account-type="accountType"
        :account-id="accountId"
      />
    </div>

    <div id="section-individual">
      <h3 class="text-h6 mt-6 mb-4">
        {{ t('individualUsage') }}
      </h3>
      <monitoring-individual-section
        :account-type="accountType"
        :account-id="accountId"
      />
    </div>

    <df-navigation-right>
      <v-list-item v-if="settingsEditFetch.hasDiff.value">
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
      <df-toc :sections="sections" />
    </df-navigation-right>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  settings: Paramètres
  save: Enregistrer
  saved: Les modifications ont été enregistrées
  configuration: Configuration
  globalUsage: Consommation globale
  individualUsage: Consommation individuelle
en:
  settings: Settings
  save: Save
  saved: Changes have been saved
  configuration: Configuration
  globalUsage: Global usage
  individualUsage: Individual usage
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'
import { useEditFetch } from '@data-fair/lib-vue/edit-fetch.js'
import type { Settings } from '#api/types'
import DfNavigationRight from '@data-fair/lib-vuetify/navigation-right.vue'
import DfToc from '@data-fair/lib-vuetify/toc.vue'
import type { VjsfOptions } from '@koumoul/vjsf/types.js'
import UsageCard from '~/components/UsageCard.vue'
import MonitoringGlobalSection from '~/components/MonitoringGlobalSection.vue'
import MonitoringIndividualSection from '~/components/MonitoringIndividualSection.vue'

const { t, locale } = useI18n()
const route = useRoute()
useSessionAuthenticated()

const accountType = route.params.type as string
const accountId = route.params.id as string

const settingsEditFetch = useEditFetch<Settings>(
  () => `${$apiPath}/settings/${accountType}/${accountId}`,
  {
    saveOptions: {
      success: t('saved')
    }
  }
)
useLeaveGuard(settingsEditFetch.hasDiff, { locale })

const valid = ref(true)

const vjsfOptions = computed<Partial<VjsfOptions>>(() => ({
  validateOn: 'input',
  updateOn: 'blur',
  density: 'comfortable',
  readOnlyPropertiesMode: 'hide',
  initialValidation: 'always',
  context: { apiPath: $apiPath, accountType, accountId }
}))

const sections = computed(() => [
  { id: 'section-configuration', title: t('configuration') },
  { id: 'section-global', title: t('globalUsage') },
  { id: 'section-individual', title: t('individualUsage') }
])
</script>
