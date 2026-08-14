/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import type { AIProviders, Settings } from '#types'
import { cipher, decipher } from '../cipher/operations.ts'

/**
 * Source of truth for the quotas/moderation values applied to an account that
 * has never been configured (see `emptySettings` and the settings PUT routes in
 * ./service.ts and ./router.ts). They live in this pure module so that both
 * service.ts and the upgrade scripts' drift test can import them without
 * pulling in #mongo/#config.
 */
export const defaultQuotas: NonNullable<Settings['quotas']> = {
  admin: { unlimited: true, monthlyLimit: 0 },
  contrib: { unlimited: false, monthlyLimit: 0 },
  user: { unlimited: false, monthlyLimit: 0 },
  external: { unlimited: false, monthlyLimit: 0 },
  anonymous: { unlimited: false, monthlyLimit: 0 },
  untrusted: { unlimited: false, monthlyLimit: 0 }
}

export const defaultModeration: NonNullable<Settings['moderation']> = {
  enabled: false,
  categories: ['anonymous', 'external']
}

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
