import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { transformSettingsDoc, eurosPerCreditFromEnv, DEFAULT_QUOTAS, DEFAULT_MODERATION, DEFAULT_EUROS_PER_CREDIT } from '../../../upgrade/0.10.0/better-config.js'
import defaultConfig from '../../../api/config/default.js'
import { defaultQuotas, defaultModeration } from '../../../api/src/settings/operations.ts'
import { assertRoleQuota } from '../../../api/src/auth.ts'

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
  test('converts role models to deduped defs + mapping, carrying the prices across', () => {
    const result = transformSettingsDoc(structuredClone(oldDoc))!
    assert.equal(result.settings.models.length, 2) // gpt-x, gpt-mini (dedup: summarizer+moderator share gpt-mini)
    const mini = result.settings.models.find((m: any) => m.model.id === 'gpt-mini')
    // deepEqual on the whole entry: in the old shape the prices were siblings of `model`,
    // not inside it, so a narrower assertion would pass even if the transform put them in
    // the wrong place. gpt-mini is shared by summarizer (priced) and moderator (unpriced)
    // and dedupes onto the first role seen, so it keeps summarizer's prices.
    assert.deepEqual(mini, {
      model: { id: 'gpt-mini', name: 'GPT Mini', provider: { type: 'openai', name: 'OpenAI', id: 'p1' } },
      usage: ['summarizer', 'moderator'],
      inputPricePerMillion: 0.1,
      outputPricePerMillion: 0.4
    })
    assert.deepEqual(result.settings.modelMapping.assistant, { provider: 'p1', id: 'gpt-x', name: 'GPT X' })
  })

  test('carries a cache price when the old entry had one', () => {
    const doc: any = structuredClone(oldDoc)
    doc.models.assistant.cachedInputPricePerMillion = 0.2
    const result = transformSettingsDoc(doc)!
    const gptx = result.settings.models.find((m: any) => m.model.id === 'gpt-x')
    assert.equal(gptx.cachedInputPricePerMillion, 0.2)
  })

  test('an old role entry with no prices migrates to zero, not to undefined', () => {
    // These models are billable-at-nothing until an admin prices them; the release
    // note calls for a post-upgrade review. Zero is what they cost before the
    // migration too, since the old resolver read every price `?? 0`. The key must be
    // present, not absent: the settings schema now requires it.
    const doc: any = structuredClone(oldDoc)
    doc.models = { assistant: { model: { id: 'm', name: 'M', provider: { type: 'mock', id: 'p', name: 'P' } } } }
    const result = transformSettingsDoc(doc)!
    assert.deepEqual(result.settings.models[0], {
      model: { id: 'm', name: 'M', provider: { type: 'mock', id: 'p', name: 'P' } },
      usage: ['assistant'],
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    })
  })
  test('quotas.global becomes the credit limit, converted from euros at the default peg', () => {
    const result = transformSettingsDoc(structuredClone(oldDoc))!
    assert.equal(result.creditLimit, 1250) // 10 € / 0.008
    assert.equal(result.settings.quotas.global, undefined)
  })
  test('role caps are converted from euros too, 0 and unlimited entries left alone', () => {
    const result = transformSettingsDoc(structuredClone(oldDoc))!
    assert.deepEqual(result.settings.quotas.contrib, { unlimited: false, monthlyLimit: 625 })
    assert.deepEqual(result.settings.quotas.untrusted, { unlimited: false, monthlyLimit: 250 })
    assert.deepEqual(result.settings.quotas.admin, { unlimited: true, monthlyLimit: 0 })
    assert.deepEqual(result.settings.quotas.user, { unlimited: false, monthlyLimit: 0 })
  })
  test('the conversion follows the peg it is given', () => {
    const result = transformSettingsDoc(structuredClone(oldDoc), 1)!
    assert.equal(result.creditLimit, 10)
    assert.equal(result.settings.quotas.contrib.monthlyLimit, 5)
    assert.equal(transformSettingsDoc(structuredClone(oldDoc), 0.03)!.creditLimit, 333.33)
  })
  test('the peg comes from EUROS_PER_CREDIT, like the service config', () => {
    const previous = process.env.EUROS_PER_CREDIT
    try {
      delete process.env.EUROS_PER_CREDIT
      assert.equal(eurosPerCreditFromEnv(), DEFAULT_EUROS_PER_CREDIT)
      process.env.EUROS_PER_CREDIT = '0.01'
      assert.equal(eurosPerCreditFromEnv(), 0.01)
      process.env.EUROS_PER_CREDIT = 'abc'
      assert.throws(() => eurosPerCreditFromEnv())
      process.env.EUROS_PER_CREDIT = '0'
      assert.throws(() => eurosPerCreditFromEnv())
    } finally {
      if (previous === undefined) delete process.env.EUROS_PER_CREDIT
      else process.env.EUROS_PER_CREDIT = previous
    }
  })
  test('unlimited global becomes -1', () => {
    const doc = structuredClone(oldDoc); doc.quotas.global = { unlimited: true, monthlyLimit: 0 }
    assert.equal(transformSettingsDoc(doc)!.creditLimit, -1)
  })
  test('a falsy monthlyLimit (0) also becomes -1: the old enforcement treated 0 as "no cap", not "cap at zero"', () => {
    const doc = structuredClone(oldDoc); doc.quotas.global = { unlimited: false, monthlyLimit: 0 }
    assert.equal(transformSettingsDoc(doc)!.creditLimit, -1)
  })
  test('a missing monthlyLimit key also becomes -1 (same "falsy = no cap" convention)', () => {
    const doc: any = structuredClone(oldDoc); doc.quotas.global = { unlimited: false }
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
    assert.equal(result.creditLimit, 1250)
  })
  test('an old-shape doc with role-keyed models but no quotas.global (or no quotas at all) still migrates the models to an array', () => {
    // pre-quotas-feature legacy data: the old top-level schema only required
    // owner + providers, so quotas (and quotas.global) could be entirely
    // absent. Without this, models would stay a plain object and crash
    // getModelCatalog's `for (const om of orgModels)` at request time.
    const doc: any = structuredClone(oldDoc)
    delete doc.quotas
    const result = transformSettingsDoc(doc)!
    assert.notEqual(result, null)
    assert.equal(Array.isArray(result.settings.models), true)
    assert.equal(result.settings.models.length, 2)
    assert.equal(result.settings.quotas.global, undefined)
    // such a doc had no account-wide cap before the upgrade, so it must be
    // seeded unlimited rather than left unseeded: an unseeded account falls
    // through to config.defaultLimits.credits, which defaults to 0 (capped),
    // and an org that worked before the upgrade must not be refused by it.
    assert.equal(result.creditLimit, -1)
  })
  test('a doc with no quotas at all migrates to quotas that still grant admins access', () => {
    // regression: writing the leftovers as-is produced `quotas: {}`, which is
    // truthy, so the readers' `settings.quotas ?? defaultQuotas` fallback never
    // fired again and assertRoleQuota 403'd every caller — admins included —
    // with no UI affordance to repair it.
    const doc: any = structuredClone(oldDoc)
    delete doc.quotas
    const result = transformSettingsDoc(doc)!
    assert.deepEqual(result.settings.quotas, defaultQuotas)
    assert.doesNotThrow(() => assertRoleQuota('admin', result.settings.quotas))
  })
  test('quotas present but partial are completed with the defaults, stored values winning', () => {
    const doc: any = structuredClone(oldDoc)
    doc.quotas = { global: { unlimited: true, monthlyLimit: 0 }, contrib: { unlimited: false, monthlyLimit: 5 } }
    const result = transformSettingsDoc(doc)!
    assert.equal(result.settings.quotas.global, undefined)
    assert.deepEqual(result.settings.quotas.contrib, { unlimited: false, monthlyLimit: 625 })
    assert.deepEqual(result.settings.quotas.admin, defaultQuotas.admin)
    assert.doesNotThrow(() => assertRoleQuota('admin', result.settings.quotas))
  })
  test('a doc predating the moderation feature gains the default moderation', () => {
    const doc: any = structuredClone(oldDoc)
    delete doc.moderation
    const result = transformSettingsDoc(doc)!
    assert.deepEqual(result.settings.moderation, defaultModeration)
  })
  test('the duplicated defaults do not drift from api/src/settings/operations.ts', () => {
    // this script cannot import from api/src (see its header comment), so the
    // copies are checked here instead
    assert.deepEqual(DEFAULT_QUOTAS, defaultQuotas)
    assert.deepEqual(DEFAULT_MODERATION, defaultModeration)
    assert.equal(DEFAULT_EUROS_PER_CREDIT, defaultConfig.eurosPerCredit)
  })
})
