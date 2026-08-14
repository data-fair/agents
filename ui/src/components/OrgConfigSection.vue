<template>
  <div v-if="isAdmin && editedSettings">
    <v-form v-model="valid">
      <vjsf-org-put-req
        v-model="editedSettings"
        :options="vjsfOptions"
        :locale="locale"
      />
    </v-form>
    <div class="mt-4">
      <v-btn
        v-if="hasDiff"
        color="accent"
        :disabled="!valid"
        :loading="save.loading.value"
        @click="save.execute()"
      >
        {{ t('save') }}
      </v-btn>
    </div>
  </div>
</template>

<i18n lang="yaml">
fr:
  save: Enregistrer
  saved: Les modifications ont été enregistrées
en:
  save: Save
  saved: Changes have been saved
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import type { Settings } from '#api/types'
import VjsfOrgPutReq from '~/components/vjsf/vjsf-org-put-req.vue'
import { useSettingsForm } from '~/composables/use-settings-form'

const props = defineProps<{
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
 * every owned field is always visible here, and the server always returns all
 * of them but `modelMapping`.
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

const { edited: editedSettings, hasDiff, save, valid, vjsfOptions } = useSettingsForm<OrgOwnedSettings>({
  accountType: () => props.accountType,
  accountId: () => props.accountId,
  project: projectOwned,
  putSuffix: '/org',
  savedMessage: t('saved'),
  locale
})
</script>
