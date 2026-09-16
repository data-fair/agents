import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bridgeSettings } from '../../../simulations/runner/settings.ts'

test.describe('bridge settings', () => {
  test('points every model role at the bridge provider', () => {
    const s = bridgeSettings('sonnet', 'haiku') as any
    for (const role of ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']) {
      assert.ok(s.models[role].model.id, `${role} model`)
      assert.equal(s.models[role].model.provider.id, 'bridge', `${role} provider`)
    }
  })

  test('runs the background roles on the cheaper model, as a deployment would', () => {
    // Sub-agents, compaction and the moderation guard are where a deployment
    // puts a small model, so a case that only works on the assistant's tier is
    // a case that does not work.
    const s = bridgeSettings('sonnet', 'haiku') as any
    assert.equal(s.models.assistant.model.id, 'sonnet')
    assert.equal(s.models.evaluator.model.id, 'sonnet')
    assert.equal(s.models.tools.model.id, 'haiku')
    assert.equal(s.models.summarizer.model.id, 'haiku')
    assert.equal(s.models.moderator.model.id, 'haiku')
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
