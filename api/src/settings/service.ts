/**
 * service.ts contains high level stateful functions (uses #mongo, #config and memory caches)
 *  it can be used from various router.ts or other service.ts
 * it is tested by api integration tests
 */

import type { AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'
import type { Settings } from '#types'
import { securityKey } from '../cipher/service.ts'
import { decryptProviderApiKeys, defaultQuotas, defaultModeration } from './operations.ts'

// defined in operations.ts (pure, importable without #mongo/#config), re-exported
// here because service.ts is where every consumer already reads them from
export { defaultQuotas, defaultModeration }

export const emptySettings = (owner: AccountKeys): Settings => ({
  owner, providers: [], models: [], quotas: defaultQuotas, storeTraces: false, moderation: defaultModeration
})

export const getRawSettings = async (owner: AccountKeys): Promise<Settings | null> => {
  const settings = await mongo.settings.findOne({ 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0 } })
  if (!settings) return null
  return { ...settings, providers: decryptProviderApiKeys(settings.providers, securityKey) }
}

/**
 * Settings as consumers should read them: an account with no stored document
 * still has the global catalog available, so it gets the empty defaults rather
 * than null.
 */
export const getSettings = async (owner: AccountKeys): Promise<Settings> => {
  return (await getRawSettings(owner)) ?? emptySettings(owner)
}
