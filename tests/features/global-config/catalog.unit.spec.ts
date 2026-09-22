import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { getModelCatalog, getRoleModel, UNKNOWN_CONTEXT_WINDOW, type GlobalAiProvider, type GlobalAiModel, type CatalogModel } from '../../../api/src/models/operations.ts'

const gProviders: GlobalAiProvider[] = [
  { type: 'mock', id: 'global-mock', name: 'Global Mock' },
  { type: 'mock', id: 'global-off', name: 'Disabled', enabled: false }
]
const gModels: GlobalAiModel[] = [
  { id: 'g-model', name: 'G Model', provider: 'global-mock', usage: ['assistant', 'summarizer'], inputPricePerMillion: 0.4, outputPricePerMillion: 0.8 },
  { id: 'off-model', name: 'Off', provider: 'global-off', usage: ['assistant'], inputPricePerMillion: 0.4, outputPricePerMillion: 0.8 }
]
const orgProviders = [{ id: 'uuid-1', enabled: true }]
const orgModels = [
  { model: { id: 'o-model', name: 'O Model', provider: { type: 'mock', name: 'Org Mock', id: 'uuid-1' } }, usage: ['tools'], inputPricePerMillion: 0.4, outputPricePerMillion: 0.8 }
]

test.describe('getModelCatalog', () => {
  test('merges global and org models with source tags', () => {
    const catalog = getModelCatalog(gProviders, gModels, orgProviders, orgModels)
    assert.equal(catalog.length, 2) // disabled global provider's model excluded
    assert.deepEqual(catalog.map(c => c.source), ['global', 'org'])
    assert.equal(catalog[1].provider.id, 'uuid-1')
  })
  test('an org model whose provider is disabled is excluded', () => {
    const catalog = getModelCatalog([], [], [{ id: 'uuid-1', enabled: false }], orgModels)
    assert.deepEqual(catalog, [])
  })
  test('an org model whose provider was deleted is excluded', () => {
    const catalog = getModelCatalog([], [], [], orgModels)
    assert.deepEqual(catalog, [])
  })
})

test.describe('context window resolution', () => {
  const mockProvider = { type: 'mock', name: 'Org Mock', id: 'uuid-1' }
  const orgModel = (extra: any) => [{ model: { id: 'o-model', name: 'O Model', provider: mockProvider, ...extra.model }, usage: ['assistant'], ...extra.entry }]

  test('the hand-entered window wins over the provider snapshot', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgModel({ model: { contextWindow: 200000 }, entry: { contextWindow: 128000 } }))
    assert.equal(catalog[0].contextWindow, 128000)
  })

  test('falls back to the snapshot the provider listing reported', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgModel({ model: { contextWindow: 200000 }, entry: {} }))
    assert.equal(catalog[0].contextWindow, 200000)
  })

  test('falls back to UNKNOWN_CONTEXT_WINDOW when nothing is known', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgModel({ model: {}, entry: {} }))
    assert.equal(catalog[0].contextWindow, UNKNOWN_CONTEXT_WINDOW)
    assert.equal(UNKNOWN_CONTEXT_WINDOW, 128000)
  })

  test('a zero is ignored, not treated as a window of zero', () => {
    // The form emits 0 for an untouched number field, so 0 means "unset".
    const catalog = getModelCatalog([], [], orgProviders, orgModel({ model: { contextWindow: 200000 }, entry: { contextWindow: 0 } }))
    assert.equal(catalog[0].contextWindow, 200000)
  })

  test('a global model carries its configured window, else the default', () => {
    const catalog = getModelCatalog(gProviders, [
      { id: 'sized', name: 'Sized', provider: 'global-mock', usage: ['assistant'], contextWindow: 32000, inputPricePerMillion: 0.4, outputPricePerMillion: 0.8 },
      { id: 'unsized', name: 'Unsized', provider: 'global-mock', usage: ['assistant'], inputPricePerMillion: 0.4, outputPricePerMillion: 0.8 }
    ], [], [])
    assert.deepEqual(catalog.map(c => c.contextWindow), [32000, UNKNOWN_CONTEXT_WINDOW])
  })
})

test.describe('getRoleModel', () => {
  const catalog: CatalogModel[] = getModelCatalog(gProviders, gModels, orgProviders, orgModels)
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
  test('a mapping pointing at an org model whose provider is disabled falls through to the global default', () => {
    // the orphan must not even reach the catalog, otherwise getRoleModel commits
    // to it and resolveRoleModel throws "Provider is disabled" — a blanket
    // outage for the org instead of the documented log-and-fall-through
    const orphanedCatalog = getModelCatalog(gProviders, gModels, [{ id: 'uuid-1', enabled: false }], orgModels)
    const entry = getRoleModel(orphanedCatalog, { tools: { provider: 'uuid-1', id: 'o-model' } }, { assistant: { provider: 'global-mock', id: 'g-model' } }, 'tools')
    assert.equal(entry.id, 'g-model')
  })
  test('throws when nothing resolves', () => {
    assert.throws(() => getRoleModel(catalog, {}, {}, 'assistant'), /No model configured for assistant/)
  })
})

test.describe('price resolution', () => {
  const mockProvider = { type: 'mock', name: 'Org Mock', id: 'uuid-1' }
  const orgEntry = (extra: any) => [{
    model: { id: 'o-model', name: 'O Model', provider: mockProvider, ...extra.model },
    usage: ['assistant'],
    inputPricePerMillion: 0.4,
    outputPricePerMillion: 0.8,
    ...extra.entry
  }]

  test('the entry cache price wins over the listing snapshot', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgEntry({ model: { cachedInputPricePerMillion: 0.3 }, entry: { cachedInputPricePerMillion: 0.08 } }))
    assert.equal(catalog[0].cachedInputPricePerMillion, 0.08)
  })

  test('falls back to the listing snapshot', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgEntry({ model: { cachedInputPricePerMillion: 0.3 }, entry: {} }))
    assert.equal(catalog[0].cachedInputPricePerMillion, 0.3)
  })

  test('an unset cache price falls back to the input price, never to 0', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgEntry({ model: {}, entry: {} }))
    assert.equal(catalog[0].cachedInputPricePerMillion, 0.4)
  })

  test('a genuinely zero input price stays zero rather than being treated as unset', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgEntry({ model: {}, entry: { inputPricePerMillion: 0, outputPricePerMillion: 0 } }))
    assert.equal(catalog[0].inputPricePerMillion, 0)
    assert.equal(catalog[0].cachedInputPricePerMillion, 0)
  })

  test('a global model carries its configured prices', () => {
    const catalog = getModelCatalog(gProviders, [
      { id: 'priced', name: 'Priced', provider: 'global-mock', usage: ['assistant'], inputPricePerMillion: 0.4, cachedInputPricePerMillion: 0.08, outputPricePerMillion: 0.8 }
    ], [], [])
    assert.deepEqual(
      [catalog[0].inputPricePerMillion, catalog[0].cachedInputPricePerMillion, catalog[0].outputPricePerMillion],
      [0.4, 0.08, 0.8]
    )
  })
})
