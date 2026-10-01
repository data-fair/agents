import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { applyStreamPart, WAIT_TOOL_NAME, repairWaitInput, type StreamScope, type ActivityPhase } from '../../../ui/src/composables/agent-stream-parts.ts'
import { WAIT_TOOL_NAME as HOST_WAIT_TOOL_NAME } from '../../../ui/src/composables/host-events.ts'

function makeScope () {
  const phases: [ActivityPhase, string | undefined][] = []
  const scope: StreamScope = {
    messages: [],
    current: null,
    producedText: false,
    stepHadTool: false,
    lastStepHadTool: false,
    lastStepToolName: undefined,
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

  test('a wait shows its message when the step wrote none', () => {
    assert.equal(WAIT_TOOL_NAME, HOST_WAIT_TOOL_NAME)
    const { scope } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'w', toolName: WAIT_TOOL_NAME, input: { message: 'Le formulaire est prêt : appuyez sur Enregistrer.', expecting: 'Clic sur Enregistrer' } } as any, scope)
    assert.equal(scope.messages[0].content, 'Le formulaire est prêt : appuyez sur Enregistrer.')
    assert.equal(scope.producedText, true)
  })

  test('a wait does not repeat a message the step already wrote', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'text-delta', text: 'Le formulaire est prêt : appuyez sur Enregistrer.' }, scope)
    applyStreamPart({ type: 'tool-call', toolCallId: 'w', toolName: WAIT_TOOL_NAME, input: { message: 'appuyez sur Enregistrer.', expecting: 'x' } } as any, scope)
    assert.equal(scope.messages[0].content, 'Le formulaire est prêt : appuyez sur Enregistrer.')
  })

  test('a wait adds its message after text that does not say it', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'text-delta', text: 'Voilà.' }, scope)
    applyStreamPart({ type: 'tool-call', toolCallId: 'w', toolName: WAIT_TOOL_NAME, input: { message: 'Appuyez sur Enregistrer.', expecting: 'x' } } as any, scope)
    assert.equal(scope.messages[0].content, 'Voilà.\n\nAppuyez sur Enregistrer.')
  })

  test('repairs the other arguments swallowed into the wait message', () => {
    // The exact arguments a Haiku run sent (JSON-decoded once, as the tool receives them).
    const raw = JSON.parse(String.raw`{"message":"Parfait ! J'ai créé les 11 champs :\\n\\n**Contact :** Email\\n\\nCliquez sur « Enregistrer ».\",\"expecting\":\"Enregistrement de la structure\",\"timeoutSeconds\":300"}`)
    const repaired = repairWaitInput(raw)
    assert.equal(repaired.message, "Parfait ! J'ai créé les 11 champs :\n\n**Contact :** Email\n\nCliquez sur « Enregistrer ».")
    assert.equal(repaired.expecting, 'Enregistrement de la structure')
    assert.equal(repaired.timeoutSeconds, 300)
    const { scope } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'w', toolName: WAIT_TOOL_NAME, input: raw } as any, scope)
    assert.ok(!scope.messages[0].content.includes('expecting'), scope.messages[0].content)
  })

  test('leaves well-formed wait arguments alone', () => {
    const input = { message: 'Appuyez sur "Enregistrer".', expecting: 'Clic', timeoutSeconds: 120 }
    assert.deepEqual(repairWaitInput(input), input)
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
    // What the finished step did is remembered for the empty-turn decision: a
    // turn whose last step called a tool meant to continue, and the name is how
    // `isEmptyTurn` tells a declared wait (paused, not silent) apart from a
    // delegation that never came back.
    assert.equal(scope.lastStepHadTool, true)
    assert.equal(scope.lastStepToolName, 'subagent_x')
    applyStreamPart({ type: 'finish-step' }, scope)
    assert.deepEqual(phases.at(-1), ['thinking', undefined])
    assert.equal(scope.lastStepHadTool, false)
    assert.equal(scope.lastStepToolName, undefined)
  })

  test('a later step that answers without a tool clears the last-step tool', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'text-delta', text: 'Je regarde.' }, scope)
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 'search' }, scope)
    applyStreamPart({ type: 'finish-step' }, scope)
    assert.equal(scope.lastStepHadTool, true)
    applyStreamPart({ type: 'text-delta', text: 'Voilà la réponse.' }, scope)
    applyStreamPart({ type: 'finish-step' }, scope)
    assert.equal(scope.lastStepHadTool, false)
    assert.equal(scope.lastStepToolName, undefined)
  })

  test('a step ending on the wait tool names it, so the turn reads as paused', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 'wait_for_user_action' }, scope)
    applyStreamPart({ type: 'finish-step' }, scope)
    assert.equal(scope.lastStepHadTool, true)
    assert.equal(scope.lastStepToolName, 'wait_for_user_action')
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
    applyStreamPart({ type: 'reasoning-start' }, scope)
    assert.equal(scope.messages.length, 0)
  })

  test('reasoning-delta accumulates onto a new assistant message and shows thinking (not producedText)', () => {
    const { scope, phases } = makeScope()
    applyStreamPart({ type: 'reasoning-delta', text: 'Let me ' }, scope)
    applyStreamPart({ type: 'reasoning-delta', text: 'think.' }, scope)
    assert.equal(scope.messages.length, 1)
    assert.equal(scope.messages[0].reasoning, 'Let me think.')
    assert.equal(scope.messages[0].content, '')
    // reasoning is not the visible answer, so the empty-turn fallback must not be suppressed
    assert.equal(scope.producedText, false)
    assert.deepEqual(phases.at(-1), ['thinking', undefined])
  })

  test('reasoning then text/tool-call share one assistant message', () => {
    const { scope } = makeScope()
    applyStreamPart({ type: 'reasoning-delta', text: 'plan' }, scope)
    applyStreamPart({ type: 'text-delta', text: 'answer' }, scope)
    applyStreamPart({ type: 'tool-call', toolCallId: 'c1', toolName: 't' }, scope)
    assert.equal(scope.messages.length, 1)
    assert.equal(scope.messages[0].reasoning, 'plan')
    assert.equal(scope.messages[0].content, 'answer')
    assert.deepEqual(scope.messages[0].toolInvocations, [{ toolCallId: 'c1', toolName: 't', state: 'pending' }])
  })
})
