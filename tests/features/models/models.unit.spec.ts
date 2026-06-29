/**
 * stateless unit tests for pure model helpers (api/src/models/operations.ts)
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { scalewayBaseURL, streamedToolCallsBroken } from '../../../api/src/models/operations.ts'

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

test.describe('streamedToolCallsBroken (Scaleway GLM streamed tool-call workaround)', () => {
  test('flags GLM on the direct scaleway provider', () => {
    assert.equal(streamedToolCallsBroken('scaleway', 'glm-5.2'), true)
  })

  test('flags GLM on the openai-compatible (LiteLLM) passthrough', () => {
    assert.equal(streamedToolCallsBroken('openai-compatible', 'glm-5.2-scw'), true)
    assert.equal(streamedToolCallsBroken('openai-compatible', 'GLM-4.6'), true)
  })

  test('does not flag other Scaleway models (qwen, gpt-oss, devstral)', () => {
    assert.equal(streamedToolCallsBroken('scaleway', 'qwen3-235b-a22b-instruct-2507'), false)
    assert.equal(streamedToolCallsBroken('scaleway', 'gpt-oss-120b'), false)
    assert.equal(streamedToolCallsBroken('scaleway', 'devstral-2-123b-instruct-2512'), false)
  })

  test('does not flag GLM on unaffected provider types', () => {
    // A native GLM endpoint (e.g. z.ai) streams tool calls fine; the bug is Scaleway-specific.
    assert.equal(streamedToolCallsBroken('openai', 'glm-5.2'), false)
    assert.equal(streamedToolCallsBroken('anthropic', 'glm-5.2'), false)
  })
})
