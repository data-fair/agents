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
    <v-container data-iframe-height>
      <p class="text-medium-emphasis">
        {{ t('selectAccount') }}
      </p>

      <df-section-tabs
        id="section-platform"
        class="mt-6"
        :title="t('platformUsage')"
      >
        <template #content>
          <div class="pa-4">
            <monitoring-platform-section />
          </div>
        </template>
      </df-section-tabs>
    </v-container>
  </div>
</template>

<i18n lang="yaml">
fr:
  agents: Agents
  selectAccount: Sélectionnez une organisation pour gérer la configuration de ses agents.
  platformUsage: Consommation de la plateforme
en:
  agents: Agents
  selectAccount: Select an organization to manage its agents configuration.
  platformUsage: Platform usage
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import AccountSelector from '~/components/AccountSelector.vue'
import MonitoringPlatformSection from '~/components/MonitoringPlatformSection.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const router = useRouter()
const session = useSession()

// superadmin gate
if (!session.state.user?.isAdmin) router.replace('/')

setBreadcrumbs([{ text: t('agents') }])
</script>
