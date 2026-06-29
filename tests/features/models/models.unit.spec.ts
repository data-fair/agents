/**
 * stateless unit tests for pure model helpers (api/src/models/operations.ts)
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { scalewayBaseURL, streamedToolCallsBroken, errorMessage, describeFetchError } from '../../../api/src/models/operations.ts'

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

test.describe('errorMessage / describeFetchError', () => {
  test('returns the plain message of a simple Error', () => {
    assert.equal(errorMessage(new Error('boom')), 'boom')
  })

  test('falls back to the code when the message is empty', () => {
    const err = new Error('')
    ;(err as any).code = 'ECONNREFUSED'
    assert.equal(errorMessage(err), 'ECONNREFUSED')
  })

  test('digs into the cause when message and code are absent', () => {
    const err = new Error('')
    ;(err as any).cause = new Error('connect ECONNREFUSED 127.0.0.1:1')
    assert.equal(errorMessage(err), 'connect ECONNREFUSED 127.0.0.1:1')
  })

  test('unwraps an AggregateError with an empty message (the CI dual-stack case)', () => {
    // localhost resolving to both ::1 and 127.0.0.1, both refused, yields an
    // AggregateError whose own .message is empty.
    const aggregate = new AggregateError(
      [new Error('connect ECONNREFUSED ::1:1'), new Error('connect ECONNREFUSED 127.0.0.1:1')],
      ''
    )
    assert.ok(errorMessage(aggregate).length > 0)
    assert.equal(errorMessage(aggregate), 'connect ECONNREFUSED ::1:1')
  })

  test('handles non-Error throwables', () => {
    assert.equal(errorMessage('just a string'), 'just a string')
    assert.equal(errorMessage(null), '')
  })

  test('describeFetchError always yields a non-empty message for a refused AggregateError (the CI case)', () => {
    // Mirror what the lib-node axios instance re-throws for a connection refused to
    // a dual-stack host: an error whose message is empty and whose detail lives in
    // .code / .errors, with no response.
    const err = new Error('')
    ;(err as any).code = 'ECONNREFUSED'
    ;(err as any).errors = [new Error('connect ECONNREFUSED 127.0.0.1:1')]
    const { status, message } = describeFetchError(err)
    assert.equal(status, undefined)
    assert.ok(typeof message === 'string' && message.length > 0)
  })

  test('describeFetchError reads the raw AxiosError response shape (status + data.message)', () => {
    const err: any = new Error('Request failed with status code 403')
    err.response = { status: 403, data: { message: 'insufficient permissions to access the resource' } }
    const { status, message } = describeFetchError(err)
    assert.equal(status, 403)
    assert.equal(message, 'insufficient permissions to access the resource')
  })

  test('describeFetchError reads the lib-node flattened errorContext shape (top-level status + data)', () => {
    // The lib-node axios instance rejects HTTP errors as a flattened object that
    // carries `status` and `data` directly rather than under `.response`.
    const errorContext: any = new Error('403 - {"message":"insufficient permissions to access the resource"}')
    errorContext.status = 403
    errorContext.data = { message: 'insufficient permissions to access the resource' }
    const { status, message } = describeFetchError(errorContext)
    assert.equal(status, 403)
    assert.equal(message, 'insufficient permissions to access the resource')
  })
})
