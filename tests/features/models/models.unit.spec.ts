/**
 * stateless unit tests for pure model helpers (api/src/models/operations.ts)
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { scalewayBaseURL } from '../../../api/src/models/operations.ts'

test.describe('Scaleway base URL', () => {
  test('uses the bare /v1 endpoint when no project is set', () => {
    assert.equal(scalewayBaseURL(), 'https://api.scaleway.ai/v1')
    assert.equal(scalewayBaseURL(''), 'https://api.scaleway.ai/v1')
  })

  test('uses the project-scoped endpoint when a project id is set', () => {
    assert.equal(
      scalewayBaseURL('9a812a7b-b670-453c-9af4-962f320a0a66'),
      'https://api.scaleway.ai/9a812a7b-b670-453c-9af4-962f320a0a66/v1'
    )
  })

  test('trims surrounding whitespace from the project id', () => {
    assert.equal(
      scalewayBaseURL('  abc-123  '),
      'https://api.scaleway.ai/abc-123/v1'
    )
  })

  test('treats a whitespace-only project id as unset', () => {
    assert.equal(scalewayBaseURL('   '), 'https://api.scaleway.ai/v1')
  })
})
