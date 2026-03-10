/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import type { AIProviders } from '#types'
import { cipher, decipher } from '../cipher/operations.ts'

export function encryptProviderApiKeys (providers: AIProviders, existingProviders: AIProviders, securityKey: Buffer): AIProviders {
  return providers.map(provider => {
    const encryptedProvider = { ...provider }
    const existingProvider = existingProviders.find(p => p.id === provider.id)

    if (typeof provider.apiKey === 'string') {
      if (existingProvider?.apiKey && provider.apiKey.match(/^\*+$/)) {
        // case where we received the obfuscated API key, keep existing value
        encryptedProvider.apiKey = existingProvider.apiKey
      } else {
        encryptedProvider.apiKey = JSON.stringify(cipher(provider.apiKey, securityKey))
      }
    }

    return encryptedProvider
  })
}

export function decryptProviderApiKeys (providers: AIProviders, securityKey: Buffer): AIProviders {
  return providers.map(provider => {
    const decryptedProvider = { ...provider }
    if (typeof provider.apiKey === 'string') decryptedProvider.apiKey = decipher(JSON.parse(provider.apiKey), securityKey)
    return decryptedProvider
  })
}

export function obfuscateProviderApiKeys (providers: AIProviders): AIProviders {
  return providers.map(provider => {
    const obfuscatedProvider = { ...provider }
    if (provider.apiKey) obfuscatedProvider.apiKey = '********'
    return obfuscatedProvider
  })
}
