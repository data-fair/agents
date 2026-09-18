import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bridgeSettings, splitSettingsBody } from '../../../simulations/runner/settings.ts'

test.describe('bridge settings', () => {
  test('points every model role at the bridge provider', () => {
    // The catalog is keyed by model and roles reach it through modelMapping, so
    // "this role runs on the bridge" is now two claims: the ref names the bridge
    // provider, AND it resolves to a catalog entry flagged for that role. The org
    // PUT validates exactly that pair, and an unmapped role would silently fall
    // through to the dev global config's mock model.
    const s = bridgeSettings('sonnet', 'haiku') as any
    for (const role of ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']) {
      const ref = s.modelMapping[role]
      assert.ok(ref, `${role} mapped`)
      assert.equal(ref.provider, 'bridge', `${role} provider`)
      const entry = s.models.find((m: any) => m.model.id === ref.id)
      assert.ok(entry, `${role} ref resolves to a catalog entry`)
      assert.equal(entry.model.provider.id, 'bridge', `${role} entry provider`)
      assert.ok(entry.usage.includes(role), `${role} entry flagged for the role`)
    }
  })

  test('runs the background roles on the cheaper model, as a deployment would', () => {
    // Sub-agents, compaction and the moderation guard are where a deployment
    // puts a small model, so a case that only works on the assistant's tier is
    // a case that does not work.
    const s = bridgeSettings('sonnet', 'haiku') as any
    assert.equal(s.modelMapping.assistant.id, 'sonnet')
    assert.equal(s.modelMapping.evaluator.id, 'sonnet')
    assert.equal(s.modelMapping.tools.id, 'haiku')
    assert.equal(s.modelMapping.summarizer.id, 'haiku')
    assert.equal(s.modelMapping.moderator.id, 'haiku')
  })

  test('collapses to one catalog entry when both tiers pin the same model', () => {
    // SIM_TOOLS_MODEL=sonnet is a legitimate run. Two entries sharing a
    // provider/id pair would be a duplicate catalog key.
    const s = bridgeSettings('sonnet', 'sonnet') as any
    assert.equal(s.models.length, 1)
    assert.deepEqual(
      [...s.models[0].usage].sort(),
      ['assistant', 'evaluator', 'moderator', 'summarizer', 'tools']
    )
  })

  test('every catalog entry carries the mandatory prices', () => {
    // The settings PUT 400s without them. Priced at 0 because the bridge spends a
    // subscription rather than per-token billing — stating that explicitly is the
    // point, since a model free by omission is what the mandatory prices forbid.
    for (const m of (bridgeSettings('sonnet', 'haiku') as any).models) {
      assert.equal(typeof m.inputPricePerMillion, 'number', 'input price')
      assert.equal(typeof m.outputPricePerMillion, 'number', 'output price')
    }
  })

  test('splits the body across the two write-scoped endpoints', () => {
    // The regression that killed every case: quotas and storeTraces posted to the
    // superadmin route, which owns only providers/models, 400 on additionalProperties.
    const { superadminBody, orgBody } = splitSettingsBody(bridgeSettings('sonnet', 'haiku'))
    assert.deepEqual(Object.keys(superadminBody).sort(), ['models', 'providers'])
    assert.deepEqual(Object.keys(orgBody).sort(), ['modelMapping', 'quotas', 'storeTraces'])
  })

  test('uses openai-compatible in compatible mode', () => {
    // The default mode targets /v1/responses, which the bridge does not implement.
    const s = bridgeSettings('sonnet', 'haiku') as any
    assert.equal(s.providers[0].type, 'openai-compatible')
    assert.equal(s.providers[0].compatibility, 'compatible')
  })

  test('gives the admin role unlimited quota so a long scenario is not cut off', () => {
    const s = bridgeSettings('sonnet', 'haiku') as any
    assert.equal(s.quotas.admin.unlimited, true)
  })

  test('does not perform network I/O at module load', () => {
    // Guard against regression: settings.ts must not statically import test helpers,
    // which would cause authentication (network I/O) before any test runs. Dynamic
    // imports inside functions (await import(...)) are allowed.
    const source = readFileSync('simulations/runner/settings.ts', 'utf8')
    assert.equal(
      staticTestSupportImport(source),
      false,
      'settings.ts must not statically import from tests/support (causes network I/O at module load, violating the constraint that unit tests must not hit the network)'
    )
  })

  test('the guard catches every static import form, and only those', () => {
    // The guard is only worth its line count if it fires on the forms a regression
    // would actually take. All three below authenticate at module load.
    assert.equal(staticTestSupportImport("import { superAdmin } from '../../tests/support/axios.ts'"), true, 'named import')
    assert.equal(staticTestSupportImport("import '../../tests/support/axios.ts'"), true, 'bare side-effect import')
    assert.equal(staticTestSupportImport("import {\n  superAdmin,\n  clean\n} from '../../tests/support/axios.ts'"), true, 'multi-line named import')
    assert.equal(staticTestSupportImport("import ax from 'axios'"), false, 'unrelated static import')
    assert.equal(
      staticTestSupportImport("export async function seed () {\n  const { superAdmin } = await import('../../tests/support/axios.ts')\n}"),
      false,
      'a dynamic import inside a function body is the sanctioned pattern and must stay allowed'
    )
    assert.equal(staticTestSupportImport("import('../../tests/support/axios.ts')"), false, 'a bare dynamic import is still lazy')
  })
})

/**
 * True when the source statically imports anything from tests/support.
 * Line-anchored and `(` -excluded so `await import(...)` — the sanctioned lazy
 * form — is not mistaken for a static one; the specifier is matched across
 * newlines so a multi-line named import cannot slip past.
 */
function staticTestSupportImport (source: string): boolean {
  const statements = source.matchAll(/^[ \t]*import\b(?!\s*\()[^'"]*?['"]([^'"]*)['"]/gm)
  for (const m of statements) {
    if (m[1].includes('tests/support')) return true
  }
  return false
}
