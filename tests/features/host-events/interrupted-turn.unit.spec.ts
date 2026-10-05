/**
 * stateless unit tests for an interrupted turn: the results its open calls get, and the reminder.
 *
 * Ported from main's tests/features/chat-send/1.interrupted-turn.unit.spec.ts (#73, #75). The cases
 * about rebuilding an aborted turn's messages from the browser's stream are gone with that stream —
 * the server stores every turn as it goes — so what remains is the rule itself: every open call keeps
 * a result saying why, and the turn the person's message starts carries the reminder.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  PERSON_SPOKE, INTERRUPTED_RESULTS, interruptReason, interruptedWaitResult, interruptedWaitReminder,
  settleInterruptedParts, pendingWaitReminder
} from '../../../api/src/conversations/interrupted-turn.ts'

const waitCall = (state: string, input: any = { message: 'Ready: click Create.', expecting: 'you to click Create' }) =>
  ({ type: 'dynamic-tool', toolCallId: 'w', toolName: 'wait_for_user_action', state, input }) as any

test.describe('interruptReason', () => {
  test('the person speaking, Stop, and anything else are told apart', () => {
    assert.equal(interruptReason(new Error(PERSON_SPOKE)), 'message')
    // abort() with no argument leaves the platform's own AbortError: the Stop button's path.
    const controller = new AbortController()
    controller.abort()
    assert.equal(interruptReason(controller.signal.reason), 'stop')
    assert.equal(interruptReason(undefined), 'stop')
    // The clock, or an agent being disabled, is not the person stopping the reply.
    assert.equal(interruptReason(new Error('run timeout')), 'ended')
    assert.equal(interruptReason(new Error('autonomous agent stopped')), 'ended')
  })
})

test.describe('settleInterruptedParts', () => {
  test('an interrupted wait says what it waited for', () => {
    const [settled] = settleInterruptedParts([waitCall('input-available')], 'message')
    assert.equal((settled as any).state, 'output-available')
    assert.equal((settled as any).output, 'Interrupted: the person wrote to you while you were waiting for them (you to click Create).')
  })

  test('without an expecting label, it falls back to a plain description', () => {
    const [settled] = settleInterruptedParts([waitCall('input-available', { message: 'x' })], 'message')
    assert.equal((settled as any).output, interruptedWaitResult(undefined))
    assert.match((settled as any).output, /an action on the page/)
  })

  test('any other open call only says the person spoke', () => {
    const call = { type: 'dynamic-tool', toolCallId: 'c', toolName: 'select_type', state: 'input-available', input: {} } as any
    const [settled] = settleInterruptedParts([call], 'message')
    assert.equal((settled as any).output, INTERRUPTED_RESULTS.message)
  })

  test('after Stop the result says the reply was stopped — the wait included', () => {
    const [settled] = settleInterruptedParts([waitCall('input-available')], 'stop')
    assert.equal((settled as any).output, INTERRUPTED_RESULTS.stop)
  })

  test('a call whose result arrived keeps it untouched', () => {
    const done = { type: 'dynamic-tool', toolCallId: 'd', toolName: 'select_type', state: 'output-available', input: {}, output: 'Type set to note.' } as any
    const failed = { type: 'dynamic-tool', toolCallId: 'e', toolName: 'select_type', state: 'output-error', input: {}, errorText: 'boom' } as any
    assert.deepEqual(settleInterruptedParts([done, failed], 'message'), [done, failed])
  })

  test('a call still streaming its input is settled too, with an input to stand on', () => {
    // `input-streaming` may have no input yet; the settled state requires one for replay to validate.
    const [settled] = settleInterruptedParts([{ type: 'dynamic-tool', toolCallId: 's', toolName: 'select_type', state: 'input-streaming' } as any], 'stop')
    assert.equal((settled as any).state, 'output-available')
    assert.deepEqual((settled as any).input, {})
  })

  test('text and step boundaries pass through', () => {
    const parts = [{ type: 'step-start' }, { type: 'text', text: 'Voilà.' }] as any
    assert.deepEqual(settleInterruptedParts(parts, 'message'), parts)
  })
})

test.describe('pendingWaitReminder', () => {
  const assistantWait = (expecting?: string) => ({
    role: 'assistant',
    content: [{ type: 'tool-call', toolCallId: 'w', toolName: 'wait_for_user_action', input: { message: 'm', ...(expecting ? { expecting } : {}) } }]
  })
  const toolResult = (value: string) => ({
    role: 'tool',
    content: [{ type: 'tool-result', toolCallId: 'w', toolName: 'wait_for_user_action', output: { type: 'text', value } }]
  })
  const userSays = (text: string) => ({ role: 'user', content: [{ type: 'text', text }] })

  test('the turn the person starts carries the reminder to wait again', () => {
    const history = [userSays('create a list'), assistantWait('you to click Create'), toolResult(interruptedWaitResult('you to click Create')), userSays('what is it called?')] as any
    assert.equal(pendingWaitReminder(history), interruptedWaitReminder('you to click Create'))
    assert.match(String(pendingWaitReminder(history)), /declare wait_for_user_action again/)
  })

  test('nothing after Stop: the person did not answer the wait by writing', () => {
    const history = [userSays('create a list'), assistantWait('you to click Create'), toolResult(INTERRUPTED_RESULTS.stop), userSays('what now?')] as any
    assert.equal(pendingWaitReminder(history), null)
  })

  test('nothing for a wait that resolved normally', () => {
    const history = [userSays('create a list'), assistantWait('you to click Create'), toolResult('The person did: clicked Create'), userSays('thanks')] as any
    assert.equal(pendingWaitReminder(history), null)
  })

  test('an older interruption, already answered, is not reminded again', () => {
    const history = [
      userSays('create a list'), assistantWait('you to click Create'), toolResult(interruptedWaitResult('you to click Create')),
      userSays('what is it called?'), { role: 'assistant', content: [{ type: 'text', text: 'Team lunch.' }] },
      userSays('ok')
    ] as any
    assert.equal(pendingWaitReminder(history), null)
  })

  test('no user message, or only one, means nothing to remind', () => {
    assert.equal(pendingWaitReminder([] as any), null)
    assert.equal(pendingWaitReminder([userSays('hi')] as any), null)
  })
})
