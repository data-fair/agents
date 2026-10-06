import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  STEP_LIMIT,
  REPEATED_CALL_NUDGE_AT,
  REPEATED_CALL_LIMIT,
  trailingRepeatCount,
  isRepeatingCalls,
  repeatedCallGuard,
  repeatedCallNudge,
  loopGuardPrepareStep,
  createIdleWatchdog
} from '../../../api/src/conversations/loop-guards.ts'

/** One step that made one tool call and got one result back. */
const step = (toolName = 'get_schema', input: unknown = { dataset: 'test' }, output: unknown = { fields: [] }) =>
  ({ toolCalls: [{ toolName, input }], toolResults: [{ toolName, output }] })

/** Steps that each made the same call and got the same result. */
const repeated = (n: number, toolName = 'get_schema', input: unknown = { dataset: 'test' }) =>
  Array.from({ length: n }, () => step(toolName, input))

test.describe('loop guard constants', () => {
  test('the step limit is a generous backstop, well above the repeat guard', () => {
    // The whole point of separating the two guards: real fine-grained work (a form
    // filled one field per call) must fit, only the runaway shape is stopped early.
    assert.ok(STEP_LIMIT >= 50)
    assert.ok(REPEATED_CALL_NUDGE_AT < REPEATED_CALL_LIMIT)
    assert.ok(REPEATED_CALL_LIMIT < STEP_LIMIT)
  })
})

test.describe('trailingRepeatCount / isRepeatingCalls (runaway loop detection)', () => {
  test('counts the trailing run of identical steps', () => {
    assert.equal(trailingRepeatCount(repeated(4)), 4)
    assert.equal(trailingRepeatCount([]), 0)
  })

  test('does not fire below the limit', () => {
    assert.equal(isRepeatingCalls(repeated(REPEATED_CALL_LIMIT - 1)), false)
  })

  test('fires on the same call repeated to the limit', () => {
    assert.equal(isRepeatingCalls(repeated(REPEATED_CALL_LIMIT)), true)
  })

  test('only considers the trailing run, so an early repeat is forgiven', () => {
    // A model that repeated itself, recovered, and moved on is not looping.
    const steps = [...repeated(REPEATED_CALL_LIMIT), step('query_data', { q: 'a' })]
    assert.equal(isRepeatingCalls(steps), false)
    assert.equal(trailingRepeatCount(steps), 1)
  })

  test('does not fire when the same tool is called with different arguments', () => {
    // The shape of real progress: setFieldValue on a different path every step.
    const steps = Array.from({ length: REPEATED_CALL_LIMIT + 3 }, (_, i) =>
      step('setFieldValue', { path: `/field${i}`, value: i }, { ok: true }))
    assert.equal(isRepeatingCalls(steps), false)
  })

  test('does not fire when the same call keeps returning different results', () => {
    // Polling a status, or re-reading a field after each change, is progress not spinning.
    const steps = Array.from({ length: REPEATED_CALL_LIMIT + 3 }, (_, i) =>
      step('get_status', { id: 1 }, { progress: i }))
    assert.equal(isRepeatingCalls(steps), false)
  })

  test('does not fire when a step made no tool call', () => {
    // A text-only step means the model spoke; it is not spinning on a call.
    const steps = [...repeated(REPEATED_CALL_LIMIT - 1), { toolCalls: [] }]
    assert.equal(isRepeatingCalls(steps), false)
    assert.equal(trailingRepeatCount(steps), 0)
  })

  test('compares parallel calls as a set, regardless of order', () => {
    const a = { toolCalls: [{ toolName: 'x', input: 1 }, { toolName: 'y', input: 2 }], toolResults: [] }
    const b = { toolCalls: [{ toolName: 'y', input: 2 }, { toolName: 'x', input: 1 }], toolResults: [] }
    assert.equal(trailingRepeatCount([a, b, a]), 3)
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

test.describe('repeatedCallNudge / loopGuardPrepareStep (reminder before the stop)', () => {
  test('is silent while the loop is making progress', () => {
    assert.equal(repeatedCallNudge(repeated(REPEATED_CALL_NUDGE_AT - 1)), null)
    assert.equal(repeatedCallNudge([]), null)
  })

  test('names the repeated tool and the count once the nudge threshold is reached', () => {
    const nudge = repeatedCallNudge(repeated(REPEATED_CALL_NUDGE_AT))
    assert.ok(nudge, 'expected a nudge')
    assert.match(nudge, /`get_schema`/)
    assert.match(nudge, new RegExp(`${REPEATED_CALL_NUDGE_AT} times in a row`))
  })

  test('keeps nudging until the guard takes over, then stops', () => {
    // The nudge is re-injected per step (prepareStep rebuilds the messages every time),
    // and the stop condition — not another reminder — handles the limit itself.
    assert.ok(repeatedCallNudge(repeated(REPEATED_CALL_LIMIT - 1)))
    assert.equal(repeatedCallNudge(repeated(REPEATED_CALL_LIMIT)), null)
  })

  test('loopGuardPrepareStep appends the nudge as a user message, else overrides nothing', () => {
    const messages = [{ role: 'user' as const, content: 'fill the form' }]
    assert.deepEqual(loopGuardPrepareStep({ steps: repeated(1), messages }), {})

    const result = loopGuardPrepareStep({ steps: repeated(REPEATED_CALL_NUDGE_AT), messages })
    assert.equal(result.messages?.length, 2)
    assert.equal(result.messages?.[0], messages[0])
    assert.equal(result.messages?.[1]?.role, 'user')
    assert.match(String(result.messages?.[1]?.content), /same arguments/)
    // The caller's array is not mutated: the nudge lives only in that step's request.
    assert.equal(messages.length, 1)
  })
})

// The idle watchdog replaced the AI SDK's `chunkMs`, which counted a RUNNING tool as a silent stream: a
// wait_for_user_action past 90s, or a slow catalog query, was aborted as a stuck provider.
test.describe('the idle watchdog', () => {
  /** Timers we fire by hand: `pending` is what is armed right now. */
  const clock = () => {
    const armed = new Map<number, () => void>()
    let next = 0
    return {
      timers: {
        set: (fn: () => void) => { armed.set(++next, fn); return next },
        clear: (handle: unknown) => { armed.delete(handle as number) }
      },
      pending: () => armed.size,
      fire: () => { for (const [handle, fn] of [...armed]) { armed.delete(handle); fn() } }
    }
  }

  test('fires when the model goes silent', () => {
    const c = clock()
    let idle = 0
    createIdleWatchdog(1000, () => { idle++ }, c.timers)
    c.fire()
    assert.equal(idle, 1)
  })

  test('every part starts the silence over', () => {
    const c = clock()
    const watchdog = createIdleWatchdog(1000, () => {}, c.timers)
    watchdog.activity()
    watchdog.activity()
    assert.equal(c.pending(), 1, 'one timer, re-armed, never several')
  })

  test('never fires while a tool runs, however long — and resumes when it ends', () => {
    const c = clock()
    let idle = 0
    const watchdog = createIdleWatchdog(1000, () => { idle++ }, c.timers)
    watchdog.toolStarted('wait')
    watchdog.activity() // a part arriving mid-tool (another call settling) must not re-arm it
    assert.equal(c.pending(), 0)
    c.fire()
    assert.equal(idle, 0)
    watchdog.toolEnded('wait')
    c.fire()
    assert.equal(idle, 1)
  })

  test('parallel tools: silent until the LAST one ends', () => {
    const c = clock()
    const watchdog = createIdleWatchdog(1000, () => {}, c.timers)
    watchdog.toolStarted('a')
    watchdog.toolStarted('b')
    watchdog.toolEnded('a')
    assert.equal(c.pending(), 0)
    watchdog.toolEnded('b')
    assert.equal(c.pending(), 1)
  })

  test('stopped, it never fires', () => {
    const c = clock()
    let idle = 0
    const watchdog = createIdleWatchdog(1000, () => { idle++ }, c.timers)
    watchdog.stop()
    watchdog.activity()
    c.fire()
    assert.equal(idle, 0)
  })
})
