/**
 * Guards on the PUBLISHED artifact, not on the sources the rest of the suite
 * imports by relative path.
 *
 * Nothing else in the offline suite exercises what npm actually installs: every
 * other spec imports `../../../lib-sim/*.ts` directly, and this repo runs the
 * bridge as `node lib-sim/bridge/index.ts`, where node reads the file as an ES
 * module regardless of its first line. A consumer instead gets a shell-executed
 * `node_modules/.bin/` shim, so a missing shebang makes the binary dead on
 * arrival with `Syntax error: "(" unexpected` — which is exactly what shipped
 * until this guard existed.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const pkg = JSON.parse(readFileSync('lib-sim/package.json', 'utf8')) as { bin: Record<string, string> }

test.describe('published package', () => {
  // Iterating the bin map rather than listing paths: a third bin added later is
  // covered the moment it is declared, with no test to remember to update.
  test('every declared bin has a shebang in its source', () => {
    const bins = Object.entries(pkg.bin)
    assert.ok(bins.length > 0, 'package.json declares no bin — this guard would be vacuous')

    for (const [name, target] of bins) {
      // `bin` points at the compiled .js, which is gitignored and may not exist;
      // tsc copies the shebang through verbatim, so the .ts source is the thing
      // to guard and the thing a developer would edit.
      const source = path.join('lib-sim', target.replace(/\.js$/, '.ts'))
      const firstLine = readFileSync(source, 'utf8').split('\n')[0]
      assert.equal(
        firstLine,
        '#!/usr/bin/env node',
        `bin "${name}" (${source}) must start with #!/usr/bin/env node, or the installed ` +
        'node_modules/.bin shim is executed by /bin/sh and dies on the first import'
      )
    }
  })

  test('every bin target is a .js path inside the package', () => {
    for (const [name, target] of Object.entries(pkg.bin)) {
      assert.match(target, /^[\w./-]+\.js$/, `bin "${name}" target ${target}`)
      assert.ok(!target.startsWith('/') && !target.startsWith('..'), `bin "${name}" escapes the package`)
    }
  })
})

/**
 * `df-agents-sim-init` copies these into a consumer's .claude/ directory, and
 * this repo uses the live .claude/ copies directly — so the two can drift with
 * nothing to notice. Editing the working copy would silently ship a stale
 * template to both consumer repositories.
 */
const SYNCED = [
  { template: 'lib-sim/templates/simulation-judge.md', live: '.claude/agents/simulation-judge.md' },
  { template: 'lib-sim/templates/agents-sim-skill.md', live: '.claude/skills/agents-sim/SKILL.md' }
]

test.describe('shipped templates', () => {
  for (const { template, live } of SYNCED) {
    test(`${template} is identical to ${live}`, () => {
      assert.equal(
        readFileSync(template, 'utf8'),
        readFileSync(live, 'utf8'),
        `${template} and ${live} have drifted. This repo edits ${live}; the package ships ` +
        `${template}. Copy ${live} over ${template} (or the other way round if the template ` +
        'is the corrected one), so consumers of df-agents-sim-init do not get a stale copy.'
      )
    })
  }

  test('every template the init bin copies is covered above', () => {
    // Guards the guard: a third template added to bin/init.ts would otherwise
    // ship unchecked.
    const init = readFileSync('lib-sim/bin/init.ts', 'utf8')
    const copied = [...init.matchAll(/from: '([^']+)'/g)].map(m => m[1])
    assert.ok(copied.length > 0, 'could not read the template list out of bin/init.ts')
    for (const name of copied) {
      assert.ok(
        SYNCED.some(s => s.template.endsWith(`/${name}`)),
        `bin/init.ts copies templates/${name}, but no sync assertion covers it`
      )
    }
  })
})
