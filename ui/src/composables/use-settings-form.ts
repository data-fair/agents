/**
 * Shared wiring for the two write-scoped settings forms:
 *  - the superadmin form (providers / models), PUT /api/settings/:type/:id
 *  - the org-admin form (modelMapping / quotas / moderation / storeTraces),
 *    PUT /api/settings/:type/:id/org
 *
 * Both read the same whole document from GET /api/settings/:type/:id but are
 * generated from a NARROWED schema, so each needs the same three things: a
 * projection of the fetched document down to the fields its form owns, a
 * key-order-insensitive diff against the saved baseline, and a save that
 * re-fetches. Keeping one copy of that here avoids the two pages drifting.
 */

import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { ofetch } from 'ofetch'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useAsyncAction } from '@data-fair/lib-vue/async-action.js'
import { useLeaveGuard } from '@data-fair/lib-vue/leave-guard.js'
import type { VjsfOptions } from '@koumoul/vjsf/types.js'
import type { Settings } from '#api/types'
import { $apiPath } from '~/context'

export type SettingsFormParams<T> = {
  accountType: () => string
  accountId: () => string
  /**
   * Projects the whole fetched document down to the subset the form owns.
   * It must mirror the form's own normalization (vjsf prunes what its schema
   * does not declare, and what its `layout.if` rules hide), otherwise a
   * populated account reports a permanent unsaved change on load — and trips
   * the leave guard on every navigation away.
   */
  project: (settings: Settings) => T
  /** appended to /settings/:type/:id for the PUT: '' (superadmin) or '/org' */
  putSuffix?: string
  /** notification shown after a successful save */
  savedMessage: string
  locale: Ref<string> | ComputedRef<string>
}

/**
 * Key-order-insensitive serialization: vjsf rebuilds objects as the user edits
 * them, so a saved-then-reloaded document routinely comes back with the same
 * content in a different key order. It also drops `undefined` values, which vjsf
 * leaves behind on cleared optional fields, on both sides alike.
 */
const canonical = (value: any): any => {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}

export function useSettingsForm<T> (params: SettingsFormParams<T>) {
  const settingsFetch = useFetch<Settings>(() => `${$apiPath}/settings/${params.accountType()}/${params.accountId()}`)

  const edited = ref<T | null>(null) as Ref<T | null>
  const saved = ref<T | null>(null) as Ref<T | null>
  watch(settingsFetch.data, (settings) => {
    edited.value = settings ? params.project(settings) : null
    saved.value = settings ? params.project(settings) : null
  })

  const hasDiff = computed(() => JSON.stringify(canonical(edited.value)) !== JSON.stringify(canonical(saved.value)))

  const save = useAsyncAction(
    async () => {
      await ofetch(`${settingsFetch.fullUrl.value!}${params.putSuffix ?? ''}`, { method: 'PUT', body: edited.value })
      await settingsFetch.refresh()
    },
    { success: params.savedMessage }
  )

  useLeaveGuard(hasDiff, { locale: params.locale })

  const valid = ref(true)

  const vjsfOptions = computed<Partial<VjsfOptions>>(() => ({
    validateOn: 'input',
    updateOn: 'blur',
    density: 'comfortable',
    readOnlyPropertiesMode: 'hide',
    initialValidation: 'always',
    context: { apiPath: $apiPath, accountType: params.accountType(), accountId: params.accountId() }
  }))

  return { settingsFetch, edited, saved, hasDiff, save, valid, vjsfOptions }
}
