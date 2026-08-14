<template>
  <v-container
    v-if="isAdmin"
    data-iframe-height
  >
    <h3 class="text-title-large mb-4">
      {{ t('configuration') }}
    </h3>
    <org-config-section
      :account-type="accountType"
      :account-id="accountId"
    />

    <h3 class="text-title-large mt-6 mb-4">
      {{ t('usage') }}
    </h3>
    <usage-card
      :account-type="accountType"
      :account-id="accountId"
    />
    <monitoring-global-section
      :account-type="accountType"
      :account-id="accountId"
    />
    <monitoring-individual-section
      :account-type="accountType"
      :account-id="accountId"
    />

    <h3 class="text-title-large mt-6 mb-4">
      {{ t('moderation') }}
    </h3>
    <moderation-section
      :account-type="accountType"
      :account-id="accountId"
    />

    <h3 class="text-title-large mt-6 mb-4">
      {{ t('traces') }}
    </h3>
    <traces-section
      :account-type="accountType"
      :account-id="accountId"
      :base="`/${accountType}/${accountId}`"
    />
  </v-container>
</template>

<i18n lang="yaml">
fr:
  configuration: Configuration
  usage: Consommation
  moderation: Modération
  traces: Conversations enregistrées
en:
  configuration: Configuration
  usage: Usage
  moderation: Moderation
  traces: Stored conversations
</i18n>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import OrgConfigSection from '~/components/OrgConfigSection.vue'
import UsageCard from '~/components/UsageCard.vue'
import MonitoringGlobalSection from '~/components/MonitoringGlobalSection.vue'
import MonitoringIndividualSection from '~/components/MonitoringIndividualSection.vue'
import ModerationSection from '~/components/ModerationSection.vue'
import TracesSection from '~/components/TracesSection.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const route = useRoute()
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
</script>
