/**
 * stateless unit tests for limitsKeyMatches: the shared-secret predicate
 * that gates the /api/v1/limits routes. This pins the dangerous branch that
 * cannot be exercised through the running dev server, where SECRET_LIMITS is
 * always set: an unconfigured secret must never authenticate anyone, even a
 * keyless request.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { limitsKeyMatches } from '../../../api/src/limits/operations.ts'

test.describe('limitsKeyMatches', () => {
  test('matches when the query key equals the configured secret', () => {
    assert.equal(limitsKeyMatches('secretlimits', 'secretlimits'), true)
  })

  test('rejects a wrong key when a secret is configured', () => {
    assert.equal(limitsKeyMatches('wrong-key', 'secretlimits'), false)
  })

  test('rejects a missing key when a secret is configured', () => {
    assert.equal(limitsKeyMatches(undefined, 'secretlimits'), false)
  })

  test('never matches when no secret is configured, even with a missing query key', () => {
    // this is the dangerous branch: `undefined !== undefined` would be false,
    // i.e. "keys match", if compared naively. It must stay false here.
    assert.equal(limitsKeyMatches(undefined, undefined), false)
  })

  test('never matches when no secret is configured, even with an empty-string query key', () => {
    assert.equal(limitsKeyMatches('', undefined), false)
  })

  test('never matches when no secret is configured, whatever the query key', () => {
    assert.equal(limitsKeyMatches('anything', undefined), false)
  })
})
