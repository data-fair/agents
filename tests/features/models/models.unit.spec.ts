/**
 * stateless unit tests for pure model helpers (api/src/models/operations.ts)
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { scalewayBaseURL, streamedToolCallsBroken, errorMessage, describeFetchError, contextBudget, type CatalogModel } from '../../../api/src/models/operations.ts'
import { commandLine } from '../../../api/src/models/mock-model.ts'

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

// Context window resolution itself belongs to the catalog (see
// global-config/catalog.unit.spec.ts); here only the budget arithmetic on top of
// a resolved entry is exercised.
function entryWith (contextWindow: number): CatalogModel {
  return { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' }, usage: ['assistant'], multiplier: 1, contextWindow, inputPricePerMillion: 0.4, outputPricePerMillion: 0.8, cachedInputPricePerMillion: 0.08, source: 'org' }
}

test.describe('contextBudget', () => {
  test('applies the configured percent', () => {
    assert.equal(contextBudget(entryWith(200000), 70), 140000)
  })

  test('the percent is supplied by the caller, not read from settings', () => {
    assert.equal(contextBudget(entryWith(200000), 50), 100000)
    assert.equal(contextBudget(entryWith(200000), 100), 200000)
  })

  test('rounds down to an integer', () => {
    assert.equal(contextBudget(entryWith(32001), 55), Math.floor(32001 * 0.55))
  })
})

test.describe('mock directives survive a prepended host block', () => {
  // A page that publishes host state puts a <host-state> block ahead of the
  // visible message on the activation turn. Directives anchored on the whole
  // message stop matching the moment their dev page starts publishing — adding
  // one useAgentState call to the sub-agent dev page made its chaining test fail
  // with "what do you mean ?" instead of calling the sub-agent. `hello` had
  // already been fixed this way; the tool directives had not.
  const withHostState = (command: string) =>
    `<host-state>\nCurrent state of the application…\n- dataset: {"id":"air-quality"}\n</host-state>\n\n${command}`

  test('reads the directive the test typed, not the block above it', () => {
    assert.equal(commandLine(withHostState('call tool subagent_data_analyst {"task":"x"}')),
      'call tool subagent_data_analyst {"task":"x"}')
  })

  test('is unchanged for a plain single-line message', () => {
    assert.equal(commandLine('call tools a b'), 'call tools a b')
  })

  test('tolerates trailing blank lines', () => {
    assert.equal(commandLine('parallel subagents\n\n'), 'parallel subagents')
  })

  test('is empty for a message that is only a host block', () => {
    assert.equal(commandLine('   \n\n  '), '')
  })
})
