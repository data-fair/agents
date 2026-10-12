/**
 * service.ts contains high level stateful functions (uses #mongo, #config and memory caches)
 *  it can be used from various router.ts or other service.ts
 * it is tested by api integration tests
 */

import type { AccountKeys } from '@data-fair/lib-express'
import memoize from 'memoizee'
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

/**
 * How long an account's settings are reused before they are read again.
 *
 * A turn read them two or three times — the socket's hello, the quota gate, the model resolution — and
 * every read also DECRYPTED the provider API keys. A write through the settings routes clears the
 * entry at once (`invalidateSettings`), so this bounds only what another API instance's write takes
 * to be seen here.
 */
const SETTINGS_TTL_MS = 10_000

const readRawSettings = memoize(async (owner: AccountKeys): Promise<Settings | null> => {
  const settings = await mongo.settings.findOne({ 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0 } })
  if (!settings) return null
  return { ...settings, providers: decryptProviderApiKeys(settings.providers, securityKey) }
}, { promise: true, maxAge: SETTINGS_TTL_MS, max: 1000, normalizer: ([owner]) => `${owner.type}:${owner.id}` })

/** Forget an account's cached settings — after writing them, so the writer reads its own write. */
export const invalidateSettings = (owner?: AccountKeys) => {
  if (owner) readRawSettings.delete(owner)
  else readRawSettings.clear()
}

export const getRawSettings = async (owner: AccountKeys): Promise<Settings | null> => {
  // A COPY: callers mutate what they get (the routes obfuscate the API keys in place before replying),
  // and a shared object would carry that into every later reader.
  const settings = await readRawSettings(owner)
  return settings && structuredClone(settings)
}

/**
 * Settings as consumers should read them: an account with no stored document
 * still has the global catalog available, so it gets the empty defaults rather
 * than null.
 */
export const getSettings = async (owner: AccountKeys): Promise<Settings> => {
  return (await getRawSettings(owner)) ?? emptySettings(owner)
}
