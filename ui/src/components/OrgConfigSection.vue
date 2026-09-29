<template>
  <df-section-tabs
    v-if="isAdmin && editedSettings"
    :id="id"
    v-model="tab"
    :title="t('title')"
    :subtitle="t('subtitle')"
    :tabs="tabs"
  >
    <template #actions>
      <form-actions
        :has-diff="hasDiff"
        :valid="valid"
        :loading="save.loading.value"
        @save="save.execute()"
        @cancel="cancel()"
      />
    </template>
    <template #windows>
      <!-- eager: every tab's form stays mounted, so the validity of the tabs
           not currently shown still gates the save -->
      <v-tabs-window-item
        value="quotas"
        eager
      >
        <v-form v-model="tabValid.quotas">
          <quotas-table
            :model-value="parts.quotas.quotas"
            :account-type="accountType"
            :account-id="accountId"
            @update:model-value="(quotas) => onPartUpdate('quotas', { quotas })"
          />
        </v-form>
      </v-tabs-window-item>
      <v-tabs-window-item
        value="moderation"
        eager
      >
        <v-form v-model="tabValid.moderation">
          <vjsf-org-form-moderation
            :model-value="parts.moderation"
            :options="vjsfOptions"
            :locale="locale"
            @update:model-value="(data: any) => onPartUpdate('moderation', data)"
          />
        </v-form>
      </v-tabs-window-item>
      <v-tabs-window-item
        value="models"
        eager
      >
        <df-tutorial-alert
          id="agents-config-models-defaults"
          :text="t('modelsHint')"
          persistent
        />
        <v-form v-model="tabValid.models">
          <vjsf-org-form-models
            :model-value="parts.models"
            :options="vjsfOptions"
            :locale="locale"
            @update:model-value="(data: any) => onPartUpdate('models', data)"
          />
        </v-form>
      </v-tabs-window-item>
    </template>
  </df-section-tabs>
</template>

<i18n lang="yaml">
fr:
  title: Configuration
  subtitle: Quotas de consommation par profil d'utilisateur, modération, enregistrement des conversations et modèles utilisés.
  saved: Les modifications ont été enregistrées
  tabs:
    models: Modèle par rôle
    quotas: Quotas
    moderation: Modération et traces
  modelsHint: Laissez les rôles vides pour utiliser les modèles par défaut affichés dans les champs. C'est le choix recommandé, ne sélectionnez un autre modèle que si vous avez une raison précise de le faire.
  defaultModel: "Par défaut : {model}"
en:
  title: Configuration
  subtitle: Consumption quotas per user profile, moderation, conversation storage and models in use.
  saved: Changes have been saved
  tabs:
    models: Model per role
    quotas: Quotas
    moderation: Moderation and traces
  modelsHint: Leave the roles empty to use the default models shown in the fields. This is the recommended choice, only select another model if you have a specific reason to.
  defaultModel: "Default: {model}"
</i18n>

<script lang="ts" setup>
import { computed, ref, shallowRef, toRaw, watch } from 'vue'
import { mdiGauge, mdiRobotOutline, mdiShieldCheckOutline } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import DfSectionTabs from '@data-fair/lib-vuetify/section-tabs.vue'
import type { Settings } from '#api/types'
import VjsfOrgFormModels from '~/components/vjsf/vjsf-org-form-models.vue'
import QuotasTable from '~/components/QuotasTable.vue'
import DfTutorialAlert from '@data-fair/lib-vuetify/tutorial-alert.vue'
import VjsfOrgFormModeration from '~/components/vjsf/vjsf-org-form-moderation.vue'
import FormActions from '~/components/FormActions.vue'
import { useSettingsForm } from '~/composables/use-settings-form'
import { $apiPath } from '~/context'

const props = defineProps<{
  id: string
  accountType: string
  accountId: string
}>()

const { t, locale } = useI18n()
const session = useSession()

/**
 * PUT /api/settings/:type/:id/org is org-admin gated; render nothing for anyone
 * else (the page itself redirects non-admins away, this is defense in depth).
 */
const isAdmin = computed(() =>
  !!session.state.user?.isAdmin ||
  getAccountRole(session.state, { type: props.accountType as 'user' | 'organization', id: props.accountId }) === 'admin'
)

/**
 * The subset of the settings document an org admin owns; `providers`/`models`
 * are the superadmin's (see ui/src/pages/admin/[type]/[id]/index.vue).
 *
 * All four fields travel together in a single save because the org PUT treats
 * its body as the FULL org-owned representation: an omitted field is reset to
 * its default, so a partial body would silently wipe the others.
 */
type OrgOwnedSettings = Pick<Settings, 'modelMapping' | 'quotas' | 'moderation' | 'storeTraces'>

/**
 * Projects the whole fetched document down to what this form owns, mirroring
 * the form's normalization so a stored config loads without a spurious unsaved
 * change (see `useSettingsForm`). The org schema strips the
 * `providers?.length` guards the superadmin form carries — an org with no
 * provider of its own still configures roles against the global catalog — so
 * every owned field is always visible here.
 *
 * `quotas`/`moderation` are expected to be present on every document the server
 * returns: both PUT routes seed them (`$setOnInsert` / explicit defaults), a
 * document that does not exist at all comes back as `emptySettings`, and
 * `upgrade/0.10.0/better-config.js` normalizes them onto every legacy document
 * it rewrites. A missing one is not fatal — it only makes vjsf materialize its
 * schema default, which then reads as a permanent unsaved change until the
 * admin saves once.
 */
const projectOwned = (settings: Settings): OrgOwnedSettings => {
  const base = {
    quotas: structuredClone(settings.quotas),
    moderation: structuredClone(settings.moderation),
    storeTraces: settings.storeTraces ?? false
  }
  // vjsf drops empty objects from its model (`defaultOn: 'empty'`), and the
  // server stores `modelMapping: {}` for an org that maps no role at all, so
  // keeping the empty object here would show a permanent unsaved change. An
  // omitted mapping means "no role mapped", which is exactly what the server
  // writes back for an absent key.
  const modelMapping = structuredClone(settings.modelMapping ?? {})
  return Object.keys(modelMapping).length ? { ...base, modelMapping } : base
}

/**
 * What each role falls back to when left unmapped, as computed by the server
 * against the SAVED mapping (the fallback chain can go through another mapped
 * role), so it is refreshed after each save. Rendered as the role pickers'
 * placeholder: leaving a role empty is the normal, recommended case.
 */
type CatalogEntry = { id: string, name: string, provider: { id: string, name: string } }
const catalogFetch = useFetch<{ defaults: Record<string, CatalogEntry> }>(() => `${$apiPath}/catalog/${props.accountType}/${props.accountId}`)
const roleDefaults = computed(() => Object.fromEntries(
  Object.entries(catalogFetch.data.value?.defaults ?? {})
    .map(([role, entry]) => [role, t('defaultModel', { model: `${entry.name} (${entry.provider.name})` })])
))

const { settingsFetch, edited: editedSettings, hasDiff, save, cancel, vjsfOptions } = useSettingsForm<OrgOwnedSettings>({
  accountType: () => props.accountType,
  accountId: () => props.accountId,
  project: projectOwned,
  putSuffix: '/org',
  savedMessage: t('saved'),
  locale,
  context: () => ({ roleDefaults: roleDefaults.value })
})

watch(() => settingsFetch.data.value?.updatedAt, (_, previous) => {
  if (previous) catalogFetch.refresh()
})

/**
 * One vjsf form per tab, each editing a slice of the org-owned document (see
 * api/doc/settings/org-form-part.js). The slices are composed back into the
 * full body the org PUT expects, since it resets any omitted field.
 *
 * Each slice is kept as the exact object its form emitted: vjsf only ignores a
 * modelValue change that is the very object it emitted last, so re-deriving the
 * slices from the composed document on every edit would reset the forms'
 * internal state. The slices are re-derived only when the document changes
 * from outside (initial load, save, cancel).
 */
type TabKey = 'models' | 'quotas' | 'moderation'
const TAB_FIELDS: Record<TabKey, (keyof OrgOwnedSettings)[]> = {
  quotas: ['quotas'],
  moderation: ['moderation', 'storeTraces'],
  models: ['modelMapping']
}
const tabKeys = Object.keys(TAB_FIELDS) as TabKey[]

const split = (settings: OrgOwnedSettings) => Object.fromEntries(tabKeys.map(tab => [
  tab,
  Object.fromEntries(TAB_FIELDS[tab].filter(key => settings[key] !== undefined).map(key => [key, settings[key]]))
])) as Record<TabKey, Partial<OrgOwnedSettings>>

const parts = shallowRef<Record<TabKey, Partial<OrgOwnedSettings>>>({ models: {}, quotas: {}, moderation: {} })
let composed: OrgOwnedSettings | null = null
watch(editedSettings, (settings) => {
  if (settings && toRaw(settings) !== composed) parts.value = split(settings)
}, { immediate: true })

const onPartUpdate = (tab: TabKey, data: Partial<OrgOwnedSettings>) => {
  parts.value = { ...parts.value, [tab]: data }
  composed = Object.assign({}, ...tabKeys.map(key => parts.value[key])) as OrgOwnedSettings
  editedSettings.value = composed
}

// v-form reports null until validated: only an explicit false blocks the save
const tabValid = ref<Record<TabKey, boolean | null>>({ models: null, quotas: null, moderation: null })
const valid = computed(() => tabKeys.every(tab => tabValid.value[tab] !== false))

const tab = ref<TabKey>('quotas')
const tabs = computed(() => ([
  { key: 'quotas', icon: mdiGauge },
  { key: 'moderation', icon: mdiShieldCheckOutline },
  { key: 'models', icon: mdiRobotOutline }
] as const).map(({ key, icon }) => ({
  key,
  icon,
  title: t(`tabs.${key}`),
  color: tabValid.value[key] === false ? 'error' : undefined
})))
</script>
