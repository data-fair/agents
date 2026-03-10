/**
 * service.ts contains high level stateful functions (uses #mongo, #config and memory caches)
 *  it can be used from various router.ts or other service.ts
 * it is tested by api integration tests
 */

import type { AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'
import type { Settings } from '#types'
import { securityKey } from '../cipher/service.ts'
import { decryptProviderApiKeys, } from './operations.ts'

export const getRawSettings = async (owner: AccountKeys): Promise<Settings | null> => {
  const settings = await mongo.settings.findOne({ 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0 } })
  if (!settings) return null
  return { ...settings, providers: decryptProviderApiKeys(settings.providers, securityKey) }
}
