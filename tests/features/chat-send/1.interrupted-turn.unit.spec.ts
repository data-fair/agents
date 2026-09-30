import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { interruptedStepMessages, INTERRUPTED_RESULT } from '../../../ui/src/composables/interrupted-turn.ts'

test.describe('interruptedStepMessages', () => {
  test('an open step with nothing in it adds nothing', () => {
    assert.deepEqual(interruptedStepMessages({ text: '', calls: [], results: {} }), [])
  })

  test('text alone is kept as an assistant message', () => {
    assert.deepEqual(interruptedStepMessages({ text: 'Le formulaire est prêt.', calls: [], results: {} }), [{ role: 'assistant', content: 'Le formulaire est prêt.' }])
  })

  test('every pending call gets a result saying it was interrupted', () => {
    const [assistant, tool] = interruptedStepMessages({
      text: 'Appuyez sur Enregistrer.',
      calls: [{ toolCallId: 'c1', toolName: 'wait_for_user_action', input: { expecting: 'Clic sur Enregistrer' } }],
      results: {}
    }) as any[]
    assert.equal(assistant.role, 'assistant')
    assert.deepEqual(assistant.content.map((p: any) => p.type), ['text', 'tool-call'])
    assert.equal(tool.role, 'tool')
    assert.equal(tool.content[0].toolCallId, 'c1')
    assert.equal(tool.content[0].output.value, INTERRUPTED_RESULT)
  })

  test('a call whose result arrived keeps it', () => {
    const [, tool] = interruptedStepMessages({
      text: '',
      calls: [
        { toolCallId: 'c1', toolName: 'open_add_line_dialog', input: {} },
        { toolCallId: 'c2', toolName: 'wait_for_user_action', input: {} }
      ],
      results: { c1: 'Dialog open.' }
    }) as any[]
    assert.deepEqual(tool.content[0].output, { type: 'text', value: 'Dialog open.' })
    assert.equal(tool.content[1].output.value, INTERRUPTED_RESULT)
  })
})
