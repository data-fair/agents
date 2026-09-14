/**
 * Deterministic checks on `selectCases`, the generic half of case selection
 * that lives in the package. Registry-shape assertions about this repo's own
 * cases stay in tests/features/simulations/cases.unit.spec.ts.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { selectCases } from '../../../lib-sim/cases.ts'
import type { SimulationCase } from '../../../lib-sim/types.ts'

const cases: SimulationCase[] = [
  { name: 'a', route: '/agents/_dev/a', persona: 'persona a', goal: 'goal a', maxTurns: 4 },
  { name: 'b', route: '/agents/_dev/b', persona: 'persona b', goal: 'goal b', maxTurns: 4 }
]

test.describe('selectCases', () => {
  test('selects by name', () => {
    const selected = selectCases(cases, [cases[0].name])
    assert.equal(selected.length, 1)
    assert.equal(selected[0].name, cases[0].name)
  })

  test('an empty names array returns all cases', () => {
    assert.equal(selectCases(cases, []).length, cases.length)
  })

  test('an unknown name throws, naming it in the message', () => {
    assert.throws(() => selectCases(cases, ['no-such-case']), /no-such-case/)
  })

  test('a richer case type survives selection (type-level guard on the generic)', () => {
    type CaseWithExtra = SimulationCase & { expectedTool: string }
    const withExtra: CaseWithExtra[] = [{ ...cases[0], expectedTool: 'get_schema' }]

    // The guarantee is type-level, so `npm run check-types` is what enforces it —
    // not this file's runtime asserts. If selectCases loses its generic (reverts
    // to `(all: SimulationCase[], names: string[]): SimulationCase[]`), this
    // assignment stops compiling: TS2322 (SimulationCase[] not assignable to
    // CaseWithExtra[]) at the `const preserved` line. The runtime assert below
    // would still pass either way, since Node erases types and .find() returns
    // the whole object regardless of the declared return type — it is not what
    // catches a regression here.
    const preserved: CaseWithExtra[] = selectCases(withExtra, ['a'])
    assert.equal(preserved[0].expectedTool, 'get_schema')
  })
})
