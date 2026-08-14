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
      v-if="editedSettings"
      data-iframe-height
    >
      <div id="section-configuration">
        <h3 class="text-title-large mb-4">
          {{ t('configuration') }}
        </h3>
        <v-alert
          v-if="modelErrors.length"
          type="warning"
          variant="tonal"
          class="mb-4"
          :title="t('modelErrorsTitle')"
        >
          <ul class="ms-4 mt-2">
            <li
              v-for="err in modelErrors"
              :key="err.providerId"
            >
              {{ errorLabel(err) }}
            </li>
          </ul>
        </v-alert>
        <v-row>
          <v-col>
            <v-form v-model="valid">
              <vjsf-put-req
                v-model="editedSettings"
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
        <v-list-item v-if="hasDiff">
          <v-btn
            width="100%"
            color="accent"
            :disabled="!valid"
            :loading="save.loading.value"
            @click="save.execute()"
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
  modelErrorsTitle: Certains fournisseurs n'ont pas pu lister leurs modèles
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
  modelErrorsTitle: Some providers could not list their models
</i18n>

<script lang="ts" setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'
import type { Settings } from '#api/types'
import DfNavigationRight from '@data-fair/lib-vuetify/navigation-right.vue'
import DfToc from '@data-fair/lib-vuetify/toc.vue'
import { useSettingsForm } from '~/composables/use-settings-form'
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

/**
 * The subset of the settings document this (superadmin) form owns. The rest —
 * modelMapping/quotas/moderation/storeTraces — belongs to the org admin and is
 * written through PUT /api/settings/:type/:id/org (see OrgConfigSection.vue).
 *
 * The projection mirrors the form's own normalization: `models` is hidden — and
 * thus pruned by vjsf — until the account has at least one provider, and
 * materialized to its `[]` default as soon as it has one. See
 * `useSettingsForm` for why the projection is needed at all.
 */
type OwnedSettings = Pick<Settings, 'providers' | 'models'>

const projectOwned = (settings: Settings): OwnedSettings => {
  const providers = structuredClone(settings.providers ?? [])
  return providers.length ? { providers, models: structuredClone(settings.models ?? []) } : { providers }
}

const { settingsFetch, edited: editedSettings, hasDiff, save, valid, vjsfOptions } = useSettingsForm<OwnedSettings>({
  accountType: () => accountType.value,
  accountId: () => accountId.value,
  project: projectOwned,
  savedMessage: t('saved'),
  locale
})

// Per-provider model-listing failures, so an empty/short model dropdown is
// explained (e.g. a wrong key or project) instead of silently empty. Refreshed
// on account change and whenever settings are saved (updatedAt changes).
type ProviderModelsError = { providerId: string, providerName: string, providerType: string, status?: number, message: string }
const modelErrors = ref<ProviderModelsError[]>([])
const loadModelErrors = async () => {
  try {
    const res = await fetch(`${$apiPath}/models/${accountType.value}/${accountId.value}`, { credentials: 'include' })
    modelErrors.value = res.ok ? (await res.json()).errors ?? [] : []
  } catch { modelErrors.value = [] }
}
const errorLabel = (err: ProviderModelsError) =>
  `${err.providerName} (${err.providerType}${err.status ? `, HTTP ${err.status}` : ''}): ${err.message}`
watch(
  () => [accountType.value, accountId.value, settingsFetch.data.value?.updatedAt] as const,
  () => { if (settingsFetch.data.value) loadModelErrors() },
  { immediate: true }
)

const sections = computed(() => [
  { id: 'section-configuration', title: t('configuration') },
  { id: 'section-global', title: t('globalUsage') },
  { id: 'section-individual', title: t('individualUsage') },
  { id: 'section-moderation', title: t('moderation') },
  { id: 'section-traces', title: t('traces') }
])
</script>
