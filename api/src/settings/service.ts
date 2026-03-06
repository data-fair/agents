import type { AccountKeys, SessionStateAuthenticated } from '@data-fair/lib-express'
import mongo from '#mongo'
import { assertAccountRole } from '@data-fair/lib-express'
import { cipher, decipher } from '../utils/cipher.ts'
import type { SettingsPut } from '#doc/settings/put-req/index.ts'
import type { AIProviders } from '#types'

function encryptProviderApiKeys (providers: AIProviders, existingProviders: AIProviders): AIProviders {
  return providers.map(provider => {
    const encryptedProvider = { ...provider }
    const existingProvider = existingProviders.find(p => p.id === provider.id)

    if (provider.apiKey) {
      if (existingProvider?.apiKey && provider.apiKey.match(/^\*+$/)) {
        // case where we received the obfuscated API key, keep existing value
        encryptedProvider.apiKey = existingProvider.apiKey
      } else {
        encryptedProvider.apiKey = JSON.stringify(cipher(provider.apiKey))
      }
    }

    return encryptedProvider
  })
}

export function decryptProviderApiKeys (providers: AIProviders): AIProviders {
  return providers.map(provider => {
    const decryptedProvider = { ...provider }
    if (provider.apiKey) decryptedProvider.apiKey = decipher(JSON.parse(provider.apiKey))
    return decryptedProvider
  })
}

function obfuscateProviderApiKeys (providers: AIProviders): AIProviders {
  return providers.map(provider => {
    const obfuscatedProvider = { ...provider }
    if (provider.apiKey) obfuscatedProvider.apiKey = '********'
    return obfuscatedProvider
  })
}

export const getSettingsByOwner = async (sessionState: SessionStateAuthenticated, ownerType: string, ownerId: string): Promise<any | null> => {
  assertAccountRole(sessionState, { type: ownerType as 'user' | 'organization', id: ownerId }, 'admin')

  const settings = await mongo.settings.findOne({
    'owner.type': ownerType,
    'owner.id': ownerId
  }, { projection: { _id: 0 } })

  if (!settings) return null

  return {
    ...settings,
    providers: obfuscateProviderApiKeys(settings.providers)
  }
}

export const putSettings = async (
  sessionState: SessionStateAuthenticated,
  owner: AccountKeys,
  data: SettingsPut
): Promise<any> => {
  assertAccountRole(sessionState, owner, 'admin')

  const existing = await mongo.settings.findOne(owner)

  const settings = {
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner,
    providers: encryptProviderApiKeys(data.providers || [], existing?.providers || [])
  }

  await mongo.settings.replaceOne({ owner }, settings, { upsert: true })

  return {
    ...settings,
    providers: obfuscateProviderApiKeys(settings.providers)
  }
}
