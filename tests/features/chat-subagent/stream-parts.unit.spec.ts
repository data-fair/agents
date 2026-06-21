import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { applyStreamPart, type StreamScope, type ActivityPhase } from '../../../ui/src/composables/agent-stream-parts.ts'

function makeScope () {
  const phases: [ActivityPhase, string | undefined][] = []
  const scope: StreamScope = {
    messages: [],
    current: null,
    producedText: false,
    stepHadTool: false,
    setActivity: (phase, toolName) => { phases.push([phase, toolName]) }
  }
  return { scope, phases }
}

test.describe('applyStreamPart', () => {
  test('text-delta builds one assistant message and flags producedText', () => {
    const { scope, phases } = makeScope()
    applyStreamPart({ type: 'text-delta', text: 'Hel' }, scope)
    applyStreamPart({ type: 'text-delta', text: 'lo' }, scope)
    assert.equal(scope.messages.length, 1)
    assert.equal(scope.messages[0].content, 'Hello')
    assert.equal(scope.producedText, true)
    assert.deepEqual(phases, [['streaming', undefined], ['streaming', undefined]])
  })

  test('tool-call pushes a pending invocation and flags stepHadTool', () => {
    const { scope, phases } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 'subagent_explorer' }, scope)
    assert.equal(scope.stepHadTool, true)
    assert.equal(scope.lastToolName, 'subagent_explorer')
    assert.deepEqual(scope.messages[0].toolInvocations, [{ toolCallId: 'c1', toolName: 'subagent_explorer', state: 'pending' }])
    assert.deepEqual(phases.at(-1), ['tool', 'subagent_explorer'])
  })

  test('final tool-result settles the matching invocation; preliminary does not', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 't' }, scope)
    applyStreamPart({ type: 'tool-result', toolCallId: 'c1', preliminary: true }, scope)
    assert.equal(scope.messages[0].toolInvocations![0].state, 'pending')
    applyStreamPart({ type: 'tool-result', toolCallId: 'c1' }, scope)
    assert.equal(scope.messages[0].toolInvocations![0].state, 'done')
  })

  test('tool-error settles the chip so it stops spinning', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 't' }, scope)
    applyStreamPart({ type: 'tool-error', toolCallId: 'c1' }, scope)
    assert.equal(scope.messages[0].toolInvocations![0].state, 'done')
  })

  test('finish-step: after a tool → analyzing(named); without → thinking; resets flags & current', () => {
    const { scope, phases } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 'subagent_x' }, scope)
    applyStreamPart({ type: 'finish-step' }, scope)
    assert.deepEqual(phases.at(-1), ['analyzing', 'subagent_x'])
    assert.equal(scope.stepHadTool, false)
    assert.equal(scope.lastToolName, undefined)
    assert.equal(scope.current, null)
    applyStreamPart({ type: 'finish-step' }, scope)
    assert.deepEqual(phases.at(-1), ['thinking', undefined])
  })

  test('a new step starts a new assistant message', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'text-delta', text: 'first' }, scope)
    applyStreamPart({ type: 'finish-step' }, scope)
    applyStreamPart({ type: 'text-delta', text: 'second' }, scope)
    assert.equal(scope.messages.length, 2)
    assert.equal(scope.messages[1].content, 'second')
  })

  test('unknown part types are ignored', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'finish' }, scope)
    applyStreamPart({ type: 'reasoning-delta', text: 'x' }, scope)
    assert.equal(scope.messages.length, 0)
  })
})
