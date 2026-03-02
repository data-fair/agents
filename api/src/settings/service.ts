import { randomUUID } from 'node:crypto'
import type { SessionStateAuthenticated } from '@data-fair/lib-express'
import mongo from '#mongo'
import { assertAccountRole } from '@data-fair/lib-express'
import { cipher, decipher } from '../utils/cipher.ts'

function encryptProviderApiKeys (providers: any[]): any[] {
  return providers.map(provider => {
    const config = provider[provider.type]
    if (!config) return provider

    const encryptedProvider = { ...provider }

    if (config.apiKey && typeof config.apiKey === 'string' && config.apiKey) {
      encryptedProvider[provider.type] = {
        ...config,
        apiKey: cipher(config.apiKey)
      }
    }

    return encryptedProvider
  })
}

function decryptProviderApiKeys (providers: any[]): any[] {
  return providers.map(provider => {
    const config = provider[provider.type]
    if (!config) return provider

    const decryptedProvider = { ...provider }

    if (config.apiKey && typeof config.apiKey === 'object' && config.apiKey && 'iv' in config.apiKey) {
      decryptedProvider[provider.type] = {
        ...config,
        apiKey: decipher(config.apiKey)
      }
    }

    return decryptedProvider
  })
}

export const getSettingsByOwner = async (sessionState: SessionStateAuthenticated, ownerType: string, ownerId: string): Promise<any | null> => {
  assertAccountRole(sessionState, { type: ownerType as 'user' | 'organization', id: ownerId }, 'admin')

  const settings = await mongo.settings.findOne({
    'owner.type': ownerType,
    'owner.id': ownerId
  })

  if (!settings) return null

  return {
    ...settings,
    providers: decryptProviderApiKeys(settings.providers)
  }
}

export const putSettings = async (
  sessionState: SessionStateAuthenticated,
  ownerType: string,
  ownerId: string,
  data: any
): Promise<any> => {
  assertAccountRole(sessionState, { type: ownerType as 'user' | 'organization', id: ownerId }, 'admin')

  const existing = await mongo.settings.findOne({
    'owner.type': ownerType,
    'owner.id': ownerId
  })

  const settings = {
    _id: existing?._id || randomUUID(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: { type: ownerType as 'user' | 'organization', id: ownerId },
    globalPrompt: data.globalPrompt || '',
    providers: encryptProviderApiKeys(data.providers || [])
  }

  if (existing) {
    await mongo.settings.replaceOne({ _id: existing._id }, settings)
  } else {
    await mongo.settings.insertOne(settings)
  }

  return {
    ...settings,
    providers: decryptProviderApiKeys(settings.providers)
  }
}
