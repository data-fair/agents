import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { transformSettingsDoc } from '../../../upgrade/0.10.0/better-config.js'

const oldDoc = {
  owner: { type: 'organization', id: 'org1' },
  providers: [{ id: 'p1', type: 'openai', name: 'OpenAI', enabled: true, apiKey: '{"iv":"..","data":".."}' }],
  models: {
    assistant: { model: { id: 'gpt-x', name: 'GPT X', provider: { type: 'openai', name: 'OpenAI', id: 'p1' } }, inputPricePerMillion: 2, outputPricePerMillion: 8 },
    summarizer: { model: { id: 'gpt-mini', name: 'GPT Mini', provider: { type: 'openai', name: 'OpenAI', id: 'p1' } }, inputPricePerMillion: 0.1, outputPricePerMillion: 0.4 },
    moderator: { model: { id: 'gpt-mini', name: 'GPT Mini', provider: { type: 'openai', name: 'OpenAI', id: 'p1' } } }
  },
  quotas: {
    global: { unlimited: false, monthlyLimit: 10 },
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 5 },
    user: { unlimited: false, monthlyLimit: 0 },
    external: { unlimited: false, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 },
    untrusted: { unlimited: false, monthlyLimit: 2 }
  },
  storeTraces: true,
  moderation: { enabled: true, categories: ['anonymous'] }
}

test.describe('transformSettingsDoc', () => {
  test('converts role models to deduped defs + mapping, multiplier 1, prices dropped', () => {
    const result = transformSettingsDoc(structuredClone(oldDoc))!
    assert.equal(result.settings.models.length, 2) // gpt-x, gpt-mini (dedup: summarizer+moderator share gpt-mini)
    const mini = result.settings.models.find((m: any) => m.model.id === 'gpt-mini')
    assert.deepEqual([...mini.usage].sort(), ['moderator', 'summarizer'])
    assert.equal(mini.multiplier, 1)
    assert.equal(mini.model.inputPricePerMillion, undefined)
    assert.deepEqual(result.settings.modelMapping.assistant, { provider: 'p1', id: 'gpt-x', name: 'GPT X' })
  })
  test('quotas.global becomes the credit limit, other entries carried over', () => {
    const result = transformSettingsDoc(structuredClone(oldDoc))!
    assert.equal(result.creditLimit, 10)
    assert.equal(result.settings.quotas.global, undefined)
    assert.equal(result.settings.quotas.contrib.monthlyLimit, 5)
    assert.equal(result.settings.quotas.untrusted.monthlyLimit, 2)
  })
  test('unlimited global becomes -1', () => {
    const doc = structuredClone(oldDoc); doc.quotas.global = { unlimited: true, monthlyLimit: 0 }
    assert.equal(transformSettingsDoc(doc)!.creditLimit, -1)
  })
  test('providers, moderation, storeTraces are untouched', () => {
    const result = transformSettingsDoc(structuredClone(oldDoc))!
    assert.deepEqual(result.settings.providers, oldDoc.providers)
    assert.deepEqual(result.settings.moderation, oldDoc.moderation)
    assert.equal(result.settings.storeTraces, true)
  })
  test('already-migrated docs (models is an array) return null', () => {
    assert.equal(transformSettingsDoc({ owner: {}, providers: [], models: [] }), null)
  })
  test('a doc with no models key and no quotas.global (new-format, providers-only) returns null', () => {
    const doc = { owner: { type: 'organization', id: 'org2' }, providers: [{ id: 'p1', type: 'openai', name: 'OpenAI', enabled: true }], quotas: { admin: { unlimited: true, monthlyLimit: 0 } } }
    assert.equal(transformSettingsDoc(doc), null)
  })
  test('a legacy doc with quotas.global but no role models still migrates the quotas (empty models array)', () => {
    const doc = structuredClone(oldDoc); delete (doc as any).models
    const result = transformSettingsDoc(doc)!
    assert.deepEqual(result.settings.models, [])
    assert.equal(result.settings.modelMapping, undefined)
    assert.equal(result.creditLimit, 10)
  })
})
