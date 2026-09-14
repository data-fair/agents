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
  test('selects by name, defaults to all when no names given, rejects unknown names, and preserves extra fields on a host-specific case type', () => {
    assert.equal(selectCases(cases, [cases[0].name]).length, 1)
    assert.equal(selectCases(cases, [cases[0].name])[0].name, cases[0].name)
    assert.equal(selectCases(cases, []).length, cases.length)
    assert.throws(() => selectCases(cases, ['no-such-case']), /no-such-case/)

    // A plain, non-generic `selectCases(all: SimulationCase[], ...)` signature would
    // widen the return type to SimulationCase and lose a host-specific field at the
    // type level, even though the runtime object is unchanged. This is what
    // Correction B guards against.
    type HostCase = SimulationCase & { expectedTool: string }
    const hostCases: HostCase[] = [{ ...cases[0], expectedTool: 'get_schema' }]
    const [selected] = selectCases(hostCases, ['a'])
    assert.equal(selected.expectedTool, 'get_schema')
  })
})
