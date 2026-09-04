import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  resolveStepBudget,
  mainStepBudget,
  DEFAULT_SUBAGENT_STEPS,
  DEFAULT_MAIN_STEPS,
  MAX_DECLARED_STEPS,
  isRepeatingCalls,
  repeatedCallGuard,
  REPEATED_CALL_LIMIT
} from '../../../ui/src/composables/agent-step-budget.ts'

/** Steps that each made one identical tool call. */
const repeated = (n: number, toolName = 'get_schema', input: unknown = { dataset: 'test' }) =>
  Array.from({ length: n }, () => ({ toolCalls: [{ toolName, input }] }))

test.describe('resolveStepBudget (page-declared sub-agent budget)', () => {
  test('falls back to the default when the page declares nothing', () => {
    assert.equal(resolveStepBudget(undefined), DEFAULT_SUBAGENT_STEPS)
  })

  test('honours a declared budget above the default', () => {
    // The point of the whole mechanism: a fine-grained page (a json-layout form
    // filled one field per call) gets the rounds it asked for.
    assert.equal(resolveStepBudget(60), 60)
  })

  test('honours a declared budget below the default', () => {
    // Declaring less is legitimate too — a one-shot sub-agent can cap its own spend.
    assert.equal(resolveStepBudget(3), 3)
  })

  test('clamps a declared budget to the host ceiling', () => {
    // The page is untrusted: it can raise the budget, but only up to the host's limit.
    assert.equal(resolveStepBudget(10_000), MAX_DECLARED_STEPS)
  })

  test('falls back on malformed declarations instead of throwing', () => {
    // A hand-written or typo'd config must degrade to the default, never break the turn.
    for (const bad of [null, NaN, Infinity, 0, -5, '40', {}, []]) {
      assert.equal(resolveStepBudget(bad), DEFAULT_SUBAGENT_STEPS, `bad input: ${String(bad)}`)
    }
  })

  test('floors a fractional declaration', () => {
    assert.equal(resolveStepBudget(12.9), 12)
  })

  test('uses the caller-supplied fallback when one is given', () => {
    assert.equal(resolveStepBudget(undefined, 7), 7)
  })
})

test.describe('mainStepBudget (flattened sub-agents run in the main loop)', () => {
  test('is the plain default when nothing was flattened', () => {
    assert.equal(mainStepBudget([]), DEFAULT_MAIN_STEPS)
  })

  test('ignores flattened sub-agents that declare nothing', () => {
    assert.equal(mainStepBudget([undefined, undefined]), DEFAULT_MAIN_STEPS)
  })

  test('raises the main budget to the largest flattened declaration', () => {
    // Without this, turning the flatten toggle on would silently re-truncate a
    // form-filling sub-agent back down to the main default.
    assert.equal(mainStepBudget([undefined, 60, 30]), 60)
  })

  test('never lowers the main budget below its default', () => {
    // A small flattened declaration must not starve the main conversation.
    assert.equal(mainStepBudget([2]), DEFAULT_MAIN_STEPS)
  })

  test('clamps the flattened maximum to the host ceiling', () => {
    assert.equal(mainStepBudget([10_000]), MAX_DECLARED_STEPS)
  })
})

test.describe('isRepeatingCalls (runaway loop detection)', () => {
  test('does not fire below the limit', () => {
    assert.equal(isRepeatingCalls(repeated(REPEATED_CALL_LIMIT - 1)), false)
  })

  test('fires on the same call repeated to the limit', () => {
    assert.equal(isRepeatingCalls(repeated(REPEATED_CALL_LIMIT)), true)
  })

  test('only considers the trailing run, so an early repeat is forgiven', () => {
    // A model that repeated itself, recovered, and moved on is not looping.
    const steps = [
      ...repeated(REPEATED_CALL_LIMIT),
      { toolCalls: [{ toolName: 'query_data', input: { q: 'a' } }] }
    ]
    assert.equal(isRepeatingCalls(steps), false)
  })

  test('does not fire when the same tool is called with different arguments', () => {
    // The shape of real progress: setFieldValue on a different path every step.
    const steps = Array.from({ length: REPEATED_CALL_LIMIT + 3 }, (_, i) => ({
      toolCalls: [{ toolName: 'setFieldValue', input: { path: `/field${i}`, value: i } }]
    }))
    assert.equal(isRepeatingCalls(steps), false)
  })

  test('does not fire when a step made no tool call', () => {
    // A text-only step means the model spoke; it is not spinning on a call.
    const steps = [...repeated(REPEATED_CALL_LIMIT - 1), { toolCalls: [] }]
    assert.equal(isRepeatingCalls(steps), false)
  })

  test('tolerates malformed step input instead of throwing', () => {
    for (const bad of [null, undefined, 'steps', 42, {}]) {
      assert.equal(isRepeatingCalls(bad), false, `bad input: ${String(bad)}`)
    }
    assert.equal(isRepeatingCalls([null, undefined, {}]), false)
  })

  test('respects a custom limit', () => {
    assert.equal(isRepeatingCalls(repeated(3), 3), true)
    assert.equal(isRepeatingCalls(repeated(2), 3), false)
  })

  test('repeatedCallGuard reads the steps a stopWhen condition receives', () => {
    const guard = repeatedCallGuard(3)
    assert.equal(guard({ steps: repeated(2) }), false)
    assert.equal(guard({ steps: repeated(3) }), true)
  })
})
