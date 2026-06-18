<template>
  <v-container
    v-if="!settings && loadError"
    data-iframe-height
  >
    <p class="text-error">
      {{ loadError }}
    </p>
  </v-container>
  <v-container
    v-else-if="settings"
    data-iframe-height
  >
    <h3 class="text-title-large mb-4">
      {{ t('configuration') }}
    </h3>
    <config-summary :settings="settings" />

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
  loadError: Erreur de chargement des traces.
en:
  configuration: Configuration
  usage: Usage
  moderation: Moderation
  traces: Stored conversations
  loadError: Failed to load traces.
</i18n>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import { $apiPath } from '~/context'
import ConfigSummary from '~/components/agent-chat/ConfigSummary.vue'
import UsageCard from '~/components/UsageCard.vue'
import MonitoringGlobalSection from '~/components/MonitoringGlobalSection.vue'
import MonitoringIndividualSection from '~/components/MonitoringIndividualSection.vue'
import ModerationSection from '~/components/ModerationSection.vue'
import TracesSection from '~/components/TracesSection.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()
const accountType = route.params.type as string
const accountId = route.params.id as string

const settings = ref<any>(null)
const loadError = ref('')

const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: accountType as 'user' | 'organization', id: accountId }) === 'admin'
)

onMounted(async () => {
  if (!isAdmin.value) { router.replace(`/${accountType}/${accountId}/chat`); return }
  try {
    const sRes = await fetch(`${$apiPath}/settings/${accountType}/${accountId}`, { credentials: 'include' })
    if (!sRes.ok) { loadError.value = t('loadError'); return }
    settings.value = await sRes.json()
  } catch { loadError.value = t('loadError') }
})
</script>
