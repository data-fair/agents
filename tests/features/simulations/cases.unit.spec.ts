/**
 * Deterministic checks on the simulation case registry. No model involved, so
 * these run in the normal suite; they prove each case is the case it claims to be.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { cases, findCases } from '../../../simulations/cases/index.ts'

test.describe('case registry', () => {
  test('is not empty', () => {
    assert.ok(cases.length > 0)
  })

  test('names are unique', () => {
    assert.equal(new Set(cases.map(c => c.name)).size, cases.length)
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
    for (const c of cases) {
      assert.equal((c as Record<string, unknown>).expected, undefined)
    }
  })

  test('findCases selects by name and rejects unknown names', () => {
    assert.equal(findCases([cases[0].name]).length, 1)
    assert.equal(findCases([]).length, cases.length)
    assert.throws(() => findCases(['no-such-case']), /no-such-case/)
  })
})
