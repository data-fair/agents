<template>
  <div
    v-if="session.state.user?.isAdmin"
    class="d-flex flex-column fill-height"
  >
    <v-container class="d-flex align-center ga-4 flex-shrink-0">
      <h2 class="text-title-large">
        {{ t('agents') }}
      </h2>
      <account-selector />
    </v-container>
    <v-container
      v-if="settingsEditFetch.data.value"
      data-iframe-height
    >
      <div id="section-configuration">
        <h3 class="text-title-large mb-4">
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
        <h3 class="text-title-large mt-6 mb-4">
          {{ t('globalUsage') }}
        </h3>
        <monitoring-global-section
          :account-type="accountType"
          :account-id="accountId"
        />
      </div>

      <div id="section-individual">
        <h3 class="text-title-large mt-6 mb-4">
          {{ t('individualUsage') }}
        </h3>
        <monitoring-individual-section
          :account-type="accountType"
          :account-id="accountId"
        />
      </div>

      <div id="section-moderation">
        <h3 class="text-title-large mt-6 mb-4">
          {{ t('moderation') }}
        </h3>
        <moderation-section
          :account-type="accountType"
          :account-id="accountId"
        />
      </div>

      <div id="section-traces">
        <h3 class="text-title-large mt-6 mb-4">
          {{ t('traces') }}
        </h3>
        <traces-section
          :account-type="accountType"
          :account-id="accountId"
          :base="`/admin/${accountType}/${accountId}`"
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
  </div>
</template>

<i18n lang="yaml">
fr:
  agents: Agents
  settings: Paramètres
  save: Enregistrer
  saved: Les modifications ont été enregistrées
  configuration: Configuration
  globalUsage: Consommation globale
  individualUsage: Consommation individuelle
  moderation: Modération
  traces: Conversations enregistrées
en:
  settings: Settings
  agents: Agents
  save: Save
  saved: Changes have been saved
  configuration: Configuration
  globalUsage: Global usage
  individualUsage: Individual usage
  moderation: Moderation
  traces: Stored conversations
</i18n>

<script lang="ts" setup>
import { ref, computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'
import { useEditFetch } from '@data-fair/lib-vue/edit-fetch.js'
import type { Settings } from '#api/types'
import DfNavigationRight from '@data-fair/lib-vuetify/navigation-right.vue'
import DfToc from '@data-fair/lib-vuetify/toc.vue'
import type { VjsfOptions } from '@koumoul/vjsf/types.js'
import AccountSelector from '~/components/AccountSelector.vue'
import UsageCard from '~/components/UsageCard.vue'
import MonitoringGlobalSection from '~/components/MonitoringGlobalSection.vue'
import MonitoringIndividualSection from '~/components/MonitoringIndividualSection.vue'
import ModerationSection from '~/components/ModerationSection.vue'
import TracesSection from '~/components/TracesSection.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()

// superadmin gate
if (!session.state.user?.isAdmin) router.replace('/')

const accountType = computed(() => route.params.type as string)
const accountId = computed(() => route.params.id as string)

watchEffect(() => {
  setBreadcrumbs([
    { text: t('agents'), to: '/admin/agents' },
    { text: accountId.value }
  ])
})

const settingsEditFetch = useEditFetch<Settings>(
  () => `${$apiPath}/settings/${accountType.value}/${accountId.value}`,
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
  context: { apiPath: $apiPath, accountType: accountType.value, accountId: accountId.value }
}))

const sections = computed(() => [
  { id: 'section-configuration', title: t('configuration') },
  { id: 'section-global', title: t('globalUsage') },
  { id: 'section-individual', title: t('individualUsage') },
  { id: 'section-moderation', title: t('moderation') },
  { id: 'section-traces', title: t('traces') }
])
</script>
