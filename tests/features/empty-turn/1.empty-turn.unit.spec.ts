import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { applyStreamPart, type StreamScope } from '../../../ui/src/composables/agent-stream-parts.ts'

const makeScope = (): StreamScope => ({
  messages: [],
  current: null,
  producedText: false,
  stepHadTool: false,
  lastStepHadTool: false,
  setActivity: () => {}
})

const text = (t: string) => ({ type: 'text-delta', text: t }) as any
const toolCall = (name: string) => ({ type: 'tool-call', toolName: name, toolCallId: 'c1', input: {} }) as any
const finishStep = () => ({ type: 'finish-step' }) as any

/**
 * `use-agent-chat` surfaces its empty-turn fallback on
 * `!producedText || lastStepHadTool`. These tests pin the second half: a turn whose last
 * step called a tool is a turn the model meant to continue, whatever it said before. They
 * are the regression guard for the observed failure — a lead that announces a delegation,
 * launches two sub-agents, and never comes back, leaving no answer and no error.
 */
test.describe('empty-turn detection (unit)', () => {
  test('a turn that never spoke is empty', () => {
    const scope = makeScope()
    applyStreamPart(toolCall('search'), scope)
    applyStreamPart(finishStep(), scope)
    assert.equal(scope.producedText, false)
  })

  test('a turn whose last step answered is not flagged', () => {
    const scope = makeScope()
    applyStreamPart(toolCall('search'), scope)
    applyStreamPart(finishStep(), scope)
    applyStreamPart(text('Voici le résultat.'), scope)
    applyStreamPart(finishStep(), scope)
    assert.equal(scope.producedText, true)
    assert.equal(scope.lastStepHadTool, false)
  })

  test('a turn that announced a delegation in the same step and never came back is flagged', () => {
    const scope = makeScope()
    // The observed failure: text and the sub-agent calls land in ONE step, so any
    // text-based signal reads this as a turn that answered.
    applyStreamPart(text('Je délègue l\'analyse approfondie.'), scope)
    applyStreamPart(toolCall('subagent_schema_annotator'), scope)
    applyStreamPart(toolCall('subagent_property_config_advisor'), scope)
    applyStreamPart(finishStep(), scope)
    assert.equal(scope.producedText, true, 'it did speak in that step')
    assert.equal(scope.lastStepHadTool, true, 'but it meant to continue and never did')
  })

  test('the flag resets once a later step answers without calling a tool', () => {
    const scope = makeScope()
    applyStreamPart(text('Je regarde.'), scope)
    applyStreamPart(toolCall('search'), scope)
    applyStreamPart(finishStep(), scope)
    assert.equal(scope.lastStepHadTool, true)
    applyStreamPart(text('Voilà la réponse.'), scope)
    applyStreamPart(finishStep(), scope)
    assert.equal(scope.lastStepHadTool, false)
  })

  test('reasoning alone leaves the turn silent', () => {
    const scope = makeScope()
    applyStreamPart({ type: 'reasoning-delta', text: 'hmm' } as any, scope)
    applyStreamPart(finishStep(), scope)
    assert.equal(scope.producedText, false)
    assert.equal(scope.lastStepHadTool, false)
  })
})
