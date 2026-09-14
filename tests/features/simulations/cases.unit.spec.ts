/**
 * Deterministic checks on the simulation case registry. No model involved, so
 * these run in the normal suite; they prove each case is the case it claims to be.
 *
 * Selection logic itself (`selectCases`) is tested against the package in
 * tests/features/lib-sim/cases.unit.spec.ts.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cases } from '../../../simulations/cases/index.ts'

test.describe('case registry', () => {
  test('names are unique and filesystem-safe', () => {
    // Evidence files are named `sim-<name>.json`, so a duplicate name silently
    // overwrites another case's transcript and a slash writes outside the
    // evidence directory. Folds in the old "is not empty" check, which on its
    // own only restated that someone had written a case.
    assert.ok(cases.length > 0, 'the registry is empty — every simulation would report "not run"')
    assert.equal(new Set(cases.map(c => c.name)).size, cases.length, 'duplicate case name')
    for (const c of cases) {
      assert.match(c.name, /^[a-z0-9-]+$/, `${c.name}: evidence files are named after this`)
    }
  })

  test('every case has a goal, a persona and a dev route', () => {
    for (const c of cases) {
      assert.ok(c.goal.length > 20, `${c.name}: goal should describe an outcome`)
      assert.ok(c.persona.length > 20, `${c.name}: persona should describe a person`)
      assert.ok(c.route.startsWith('/agents/_dev/'), `${c.name}: route ${c.route}`)
      assert.ok(c.maxTurns >= 2 && c.maxTurns <= 12, `${c.name}: maxTurns ${c.maxTurns}`)
    }
  })

  test('no case states an expected result — runs are judged, not diffed', () => {
    // A runtime `c.expected === undefined` assertion could not fail: LocalCase
    // has no such property, so excess-property checking already rejects it at
    // the literal. The registry SOURCE is what a regression would appear in.
    const source = readFileSync('simulations/cases/index.ts', 'utf8')
    assert.equal(
      /^\s*expected\w*\s*:/m.test(source),
      false,
      'a case declares an expected result; runs are judged from their transcript, not diffed against a blob'
    )
  })
})
