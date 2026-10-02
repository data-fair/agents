/**
 * `shared/` holds what BOTH SIDES OF THE SOCKET consume. Nothing else.
 *
 * The rule is unchanged; what it ranges over is. It used to mean "both LOOPS" — one in the browser,
 * one on the server — and when the browser loop was deleted, four modules (the loop guards, the
 * sub-agent output format, and the two compaction modules) stopped having a ui consumer and moved to
 * `api/src/conversations/`, which is this guard having done its job. What legitimately remains is the
 * wire protocol and the things both ends of it must agree about: host events, the hidden-context
 * wrapper, tool results, activity.
 *
 * Measured before this rule existed: of ten modules, five had an api and a ui consumer and five had only
 * the ui. So `shared/` meant "where things go" for half its contents, which is why it stopped signalling
 * anything — and it is what produced a third hand-written copy of the message-parts union, justified by
 * avoiding an alias the module's only consumers did not need.
 *
 * This is a precondition for one shared agent loop rather than a tidy-up: the engine's contract is
 * "everything in `shared/` is platform-neutral by construction", which is only true if something checks.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'

const root = new URL('../../../', import.meta.url).pathname

/** Every source file under a directory, recursively. */
function sourceFiles (dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`
    if (statSync(full).isDirectory()) { out.push(...sourceFiles(full)); continue }
    if (/\.(ts|vue)$/.test(entry)) out.push(full)
  }
  return out
}

const sharedModules = readdirSync(`${root}shared`)
  .filter(name => name.endsWith('.ts'))
  .map(name => name.replace(/\.ts$/, ''))

const importers = (dir: string): Map<string, string[]> => {
  const byModule = new Map<string, string[]>()
  for (const file of sourceFiles(`${root}${dir}`)) {
    const source = readFileSync(file, 'utf8')
    for (const name of sharedModules) {
      if (!source.includes(`@agents/shared/${name}`)) continue
      byModule.set(name, [...(byModule.get(name) ?? []), file.slice(root.length)])
    }
  }
  return byModule
}

const apiImporters = importers('api/src')
const uiImporters = importers('ui/src')

test.describe('the shared/ contract', () => {
  test('every shared module has an api consumer', () => {
    // A module only the browser uses belongs under ui/src. Keeping it here is what made the directory
    // stop meaning anything.
    const uiOnly = sharedModules.filter(name => !apiImporters.has(name))
    assert.deepEqual(uiOnly, [], `these have no api consumer and belong under ui/src: ${uiOnly.join(', ')}`)
  })

  test('every shared module has a ui consumer', () => {
    // And the mirror image: a module only the server uses belongs under api/src, where it can import
    // #types and #config like anything else there.
    const apiOnly = sharedModules.filter(name => !uiImporters.has(name))
    assert.deepEqual(apiOnly, [], `these have no ui consumer and belong under api/src: ${apiOnly.join(', ')}`)
  })

  test('the directory is not empty, so the two checks above are not vacuous', () => {
    assert.ok(sharedModules.length >= 5, `expected real shared modules, found ${sharedModules.length}`)
  })

  test('shared modules import nothing platform-specific', () => {
    // The property the engine will rest on. `#types`/`#config` resolve only inside the api workspace and
    // `~/` only inside the ui, so either one in here is a module that has already stopped being neutral
    // — it would just fail to resolve for the other consumer.
    for (const name of sharedModules) {
      const source = readFileSync(`${root}shared/${name}.ts`, 'utf8')
      assert.doesNotMatch(source, /from '#/, `shared/${name}.ts must not import an api-only alias`)
      assert.doesNotMatch(source, /from '~\//, `shared/${name}.ts must not import a ui-only alias`)
      assert.doesNotMatch(source, /from '(\.\.\/)+(api|ui)\//, `shared/${name}.ts must not reach into a workspace`)
    }
  })
})
