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
