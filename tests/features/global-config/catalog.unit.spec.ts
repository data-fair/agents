import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { getModelCatalog, getRoleModel, type GlobalAiProvider, type GlobalAiModel, type CatalogModel } from '../../../api/src/models/operations.ts'

const gProviders: GlobalAiProvider[] = [
  { type: 'mock', id: 'global-mock', name: 'Global Mock' },
  { type: 'mock', id: 'global-off', name: 'Disabled', enabled: false }
]
const gModels: GlobalAiModel[] = [
  { id: 'g-model', name: 'G Model', provider: 'global-mock', usage: ['assistant', 'summarizer'], multiplier: 2 },
  { id: 'off-model', name: 'Off', provider: 'global-off', usage: ['assistant'] }
]
const orgModels = [
  { model: { id: 'o-model', name: 'O Model', provider: { type: 'mock', name: 'Org Mock', id: 'uuid-1' } }, usage: ['tools'], multiplier: 3 }
]

test.describe('getModelCatalog', () => {
  test('merges global and org models with source tags', () => {
    const catalog = getModelCatalog(gProviders, gModels, orgModels)
    assert.equal(catalog.length, 2) // disabled global provider's model excluded
    assert.deepEqual(catalog.map(c => c.source), ['global', 'org'])
    assert.equal(catalog[0].multiplier, 2)
    assert.equal(catalog[1].provider.id, 'uuid-1')
  })
  test('org model multiplier defaults to 1', () => {
    const catalog = getModelCatalog([], [], [{ ...orgModels[0], multiplier: undefined }])
    assert.equal(catalog[0].multiplier, 1)
  })
})

test.describe('getRoleModel', () => {
  const catalog: CatalogModel[] = getModelCatalog(gProviders, gModels, orgModels)
  test('mapping wins over defaults', () => {
    const entry = getRoleModel(catalog, { assistant: { provider: 'uuid-1', id: 'o-model' } }, { assistant: { provider: 'global-mock', id: 'g-model' } }, 'assistant')
    assert.equal(entry.id, 'o-model')
  })
  test('falls back to defaultModels', () => {
    const entry = getRoleModel(catalog, {}, { assistant: { provider: 'global-mock', id: 'g-model' } }, 'assistant')
    assert.equal(entry.id, 'g-model')
  })
  test('tools falls back to assistant', () => {
    const entry = getRoleModel(catalog, { assistant: { provider: 'global-mock', id: 'g-model' } }, {}, 'tools')
    assert.equal(entry.id, 'g-model')
  })
  test('moderator chain: moderator -> summarizer -> assistant', () => {
    const entry = getRoleModel(catalog, { summarizer: { provider: 'global-mock', id: 'g-model' } }, {}, 'moderator')
    assert.equal(entry.id, 'g-model')
  })
  test('unresolvable mapping ref falls through to defaults for the same role', () => {
    const entry = getRoleModel(catalog, { assistant: { provider: 'gone', id: 'gone' } }, { assistant: { provider: 'global-mock', id: 'g-model' } }, 'assistant')
    assert.equal(entry.id, 'g-model')
  })
  test('throws when nothing resolves', () => {
    assert.throws(() => getRoleModel(catalog, {}, {}, 'assistant'), /No model configured for assistant/)
  })
})
