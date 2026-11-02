/**
 * The persona variants that calibrate the judge: a run picks one by name, and a name that matches none
 * must fail the run rather than silently run the default persona and report it as the variant.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { resolvePersonaVariant, PERSONA_VARIANTS } from '../../../simulations/cases/persona-variants.ts'

test.describe('resolvePersonaVariant', () => {
  test('is undefined when no variant is asked for', () => {
    assert.equal(resolvePersonaVariant({}), undefined)
  })

  test('returns the named variant', () => {
    assert.deepEqual(resolvePersonaVariant({ SIM_PERSONA_VARIANT: 'bloated' }), { name: 'bloated', persona: PERSONA_VARIANTS.bloated })
    assert.match(PERSONA_VARIANTS.bloated, /^You are a thorough data assistant\. Before each step/)
  })

  test('refuses a name it does not know', () => {
    assert.throws(() => resolvePersonaVariant({ SIM_PERSONA_VARIANT: 'nope' }), /unknown persona variant: nope \(have: bloated, lossy\)/)
  })
})
