/**
 * stateless unit tests, validate only pure functions usually imported from files named operations.ts in api/src
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { cipher, decipher, getSecurityKey } from '../../../api/src/cipher/operations.ts'
import { encryptProviderApiKeys, decryptProviderApiKeys, obfuscateProviderApiKeys } from '../../../api/src/settings/operations.ts'

const securityKey = getSecurityKey('test-cipher-password')

test.describe('Cipher operations', () => {
  test('cipher and decipher are inverses', () => {
    const original = 'sk-test-123456789'
    const encrypted = cipher(original, securityKey)
    const decrypted = decipher(encrypted, securityKey)
    assert.equal(decrypted, original)
  })

  test('getSecurityKey produces consistent keys from same password', () => {
    const key1 = getSecurityKey('my-password')
    const key2 = getSecurityKey('my-password')
    assert.deepEqual(key1, key2)
  })

  test('different passwords produce different keys', () => {
    const key1 = getSecurityKey('password1')
    const key2 = getSecurityKey('password2')
    assert.notDeepEqual(key1, key2)
  })

  test('handles empty string', () => {
    const encrypted = cipher('', securityKey)
    const decrypted = decipher(encrypted, securityKey)
    assert.equal(decrypted, '')
  })

  test('handles special characters and unicode', () => {
    const original = 'sk-ékmo@#$%^&*()😀🎉🔥'
    const encrypted = cipher(original, securityKey)
    const decrypted = decipher(encrypted, securityKey)
    assert.equal(decrypted, original)
  })
})

test.describe('Settings operations - encrypt/decrypt', () => {
  test('encrypts new API keys', () => {
    const providers = [{ id: 'p1', type: 'openai' as const, apiKey: 'sk-new-key', name: 'Test', enabled: true }]
    const existing: any[] = []
    const encrypted = encryptProviderApiKeys(providers, existing, securityKey)
    assert.notEqual(encrypted[0].apiKey, 'sk-new-key')
    assert.ok(typeof encrypted[0].apiKey === 'string')
  })

  test('preserves existing key when receiving obfuscated placeholder', () => {
    const providers = [{ id: 'p1', type: 'openai' as const, apiKey: '********', name: 'Test', enabled: true }]
    const existing = [{ id: 'p1', type: 'openai' as const, apiKey: 'sk-existing-key', name: 'Test', enabled: true }]
    const encrypted = encryptProviderApiKeys(providers, existing, securityKey)
    assert.equal(encrypted[0].apiKey, 'sk-existing-key')
  })

  test('decrypts encrypted keys correctly', () => {
    const providers = [{ id: 'p1', type: 'openai' as const, apiKey: 'sk-secret', name: 'Test', enabled: true }]
    const existing: any[] = []
    const encrypted = encryptProviderApiKeys(providers, existing, securityKey)
    const decrypted = decryptProviderApiKeys(encrypted, securityKey)
    assert.equal(decrypted[0].apiKey, 'sk-secret')
  })

  test('handles providers without API key', () => {
    const providers = [{ id: 'p1', type: 'mock' as const, name: 'Mock', enabled: true }]
    const existing: any[] = []
    const encrypted = encryptProviderApiKeys(providers, existing, securityKey)
    assert.ok(!encrypted[0].apiKey)
  })
})

test.describe('Settings operations - obfuscate', () => {
  test('obfuscates all API keys', () => {
    const providers = [
      { id: 'p1', type: 'openai' as const, apiKey: 'sk-secret-1', name: 'Test1', enabled: true },
      { id: 'p2', type: 'anthropic' as const, apiKey: 'sk-ant-secret-2', name: 'Test2', enabled: true }
    ]
    const obfuscated = obfuscateProviderApiKeys(providers)
    assert.equal(obfuscated[0].apiKey, '********')
    assert.equal(obfuscated[1].apiKey, '********')
  })

  test('handles providers without API key', () => {
    const providers = [{ id: 'p1', type: 'mock' as const, name: 'Mock', enabled: true }]
    const obfuscated = obfuscateProviderApiKeys(providers)
    assert.ok(!obfuscated[0].apiKey)
  })

  test('does not modify other provider properties', () => {
    const providers = [{ id: 'p1', type: 'openai' as const, apiKey: 'sk-test', name: 'Test', enabled: true }]
    const obfuscated = obfuscateProviderApiKeys(providers)
    assert.equal(obfuscated[0].id, 'p1')
    assert.equal(obfuscated[0].name, 'Test')
    assert.equal(obfuscated[0].enabled, true)
  })
})
