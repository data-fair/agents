import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { interruptedStepMessages, interruptedWaitResult, interruptedWaitReminder, toolResultOutput, INTERRUPTED_RESULTS } from '../../../ui/src/composables/interrupted-turn.ts'

const waitCall = { toolCallId: 'w', toolName: 'wait_for_user_action', input: { message: 'Appuyez sur Enregistrer.', expecting: 'Clic sur Enregistrer' } }

test.describe('interruptedStepMessages', () => {
  test('an open step with nothing in it adds nothing', () => {
    assert.deepEqual(interruptedStepMessages({ text: '', calls: [], results: {} }), [])
  })

  test('text alone is kept as an assistant message', () => {
    assert.deepEqual(interruptedStepMessages({ text: 'Le formulaire est prêt.', calls: [], results: {} }), [{ role: 'assistant', content: 'Le formulaire est prêt.' }])
  })

  test('an interrupted wait says what it waited for and to wait again if still to come', () => {
    const [assistant, tool] = interruptedStepMessages({ text: 'Voilà.', calls: [waitCall], results: {} }) as any[]
    assert.deepEqual(assistant.content.map((p: any) => p.type), ['text', 'tool-call'])
    assert.equal(tool.content[0].toolCallId, 'w')
    assert.equal(tool.content[0].output.value, interruptedWaitResult('Clic sur Enregistrer'))
    assert.match(tool.content[0].output.value, /\(Clic sur Enregistrer\)/)
  })

  test('the turn the person starts carries the reminder to wait again', () => {
    assert.match(interruptedWaitReminder('Clic sur Enregistrer'), /\(Clic sur Enregistrer\).*declare wait_for_user_action again/)
    assert.match(interruptedWaitReminder(undefined), /\(an action on the page\)/)
  })

  test('any other pending call only says the person spoke', () => {
    const [, tool] = interruptedStepMessages({ text: '', calls: [{ toolCallId: 'c', toolName: 'subagent_x', input: {} }], results: {} }) as any[]
    assert.equal(tool.content[0].output.value, INTERRUPTED_RESULTS.message)
  })

  test('after Stop the result says the reply was stopped', () => {
    const [, tool] = interruptedStepMessages({ text: '', calls: [waitCall], results: {} }, { reason: 'stop' }) as any[]
    assert.equal(tool.content[0].output.value, INTERRUPTED_RESULTS.stop)
  })

  test('a call whose result arrived keeps it, formatted as its tool would', () => {
    const [, tool] = interruptedStepMessages({
      text: '',
      calls: [{ toolCallId: 'c1', toolName: 'subagent_x', input: {} }, waitCall],
      results: { c1: { raw: true } }
    }, { format: (call, output) => toolResultOutput(output, () => ({ type: 'text', value: 'formatted' }), call) }) as any[]
    assert.deepEqual(tool.content[0].output, { type: 'text', value: 'formatted' })
    assert.equal(tool.content[1].output.value, interruptedWaitResult('Clic sur Enregistrer'))
  })

  test('the loop lagging behind the SDK never sends a call twice', () => {
    // The SDK reported the step finished while its parts were still in the open step.
    const finished = [
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 'c1', toolName: 'open_add_line_dialog', input: {} }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'c1', toolName: 'open_add_line_dialog', output: { type: 'text', value: 'open' } }] }
    ] as any
    const lagging = { text: 'J’ouvre le formulaire.', calls: [{ toolCallId: 'c1', toolName: 'open_add_line_dialog', input: {} }], results: { c1: 'open' } }
    assert.deepEqual(interruptedStepMessages(lagging, { finished }), [], 'that step is already in finished, text included')
    const mixed = { text: '', calls: [{ toolCallId: 'c1', toolName: 'open_add_line_dialog', input: {} }, waitCall], results: {} }
    const [assistant] = interruptedStepMessages(mixed, { finished }) as any[]
    assert.deepEqual(assistant.content.map((p: any) => p.toolCallId), ['w'])
  })
})

test.describe('toolResultOutput', () => {
  test('follows the SDK default without a toModelOutput', () => {
    assert.deepEqual(toolResultOutput('ok'), { type: 'text', value: 'ok' })
    assert.deepEqual(toolResultOutput({ a: 1 }), { type: 'json', value: { a: 1 } })
    assert.deepEqual(toolResultOutput(undefined), { type: 'json', value: null })
  })

  test('falls back to the default when toModelOutput is asynchronous', () => {
    assert.deepEqual(toolResultOutput('ok', async () => ({ type: 'text', value: 'x' }), { toolCallId: 'c', input: {} }), { type: 'text', value: 'ok' })
  })
})
