<template>
  <v-container
    v-if="isAdmin"
    data-iframe-height
  >
    <org-config-section
      id="configuration"
      :account-type="accountType"
      :account-id="accountId"
    />

    <df-section-tabs
      id="activity"
      v-model="activityTab"
      :title="t('activity')"
      :tabs="activityTabs"
    >
      <template #windows>
        <v-tabs-window-item value="usage">
          <usage-card
            :account-type="accountType"
            :account-id="accountId"
          />
          <monitoring-global-section
            :account-type="accountType"
            :account-id="accountId"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="usageIndividual">
          <monitoring-individual-section
            :account-type="accountType"
            :account-id="accountId"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="moderation">
          <moderation-section
            :account-type="accountType"
            :account-id="accountId"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="traces">
          <traces-section
            :account-type="accountType"
            :account-id="accountId"
            :base="`/${accountType}/${accountId}`"
          />
        </v-tabs-window-item>
      </template>
    </df-section-tabs>

    <df-navigation-right>
      <df-toc :sections="sections" />
    </df-navigation-right>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  configuration: Configuration
  activity: Activité
  usage: Consommation
  usageIndividual: Par utilisateur
  moderation: Modération
  traces: Conversations enregistrées
en:
  configuration: Configuration
  activity: Activity
  usage: Usage
  usageIndividual: Per user
  moderation: Moderation
  traces: Stored conversations
</i18n>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import { mdiAccountMultiple, mdiChartBar, mdiForum, mdiShieldCheckOutline } from '@mdi/js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import DfNavigationRight from '@data-fair/lib-vuetify/navigation-right.vue'
import DfToc from '@data-fair/lib-vuetify/toc.vue'
import OrgConfigSection from '~/components/OrgConfigSection.vue'
import UsageCard from '~/components/UsageCard.vue'
import MonitoringGlobalSection from '~/components/MonitoringGlobalSection.vue'
import MonitoringIndividualSection from '~/components/MonitoringIndividualSection.vue'
import ModerationSection from '~/components/ModerationSection.vue'
import TracesSection from '~/components/TracesSection.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const route = useRoute('/[type]/[id]/')
const router = useRouter()
const session = useSession()
const accountType = route.params.type as string
const accountId = route.params.id as string

setBreadcrumbs([])

// Every section of this page is admin-only (the settings, usage and traces
// endpoints it consumes are all admin-gated), so a non-admin member is sent
// back to the chat.
const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'
)

onMounted(() => {
  if (!isAdmin.value) router.replace(`/${accountType}/${accountId}/chat`)
})

const activityTab = ref('usage')
const activityTabs = computed(() => [
  { key: 'usage', title: t('usage'), icon: mdiChartBar },
  { key: 'usageIndividual', title: t('usageIndividual'), icon: mdiAccountMultiple },
  { key: 'moderation', title: t('moderation'), icon: mdiShieldCheckOutline },
  { key: 'traces', title: t('traces'), icon: mdiForum }
])

const sections = computed(() => [
  { id: 'configuration', title: t('configuration') },
  { id: 'activity', title: t('activity') }
])
</script>
