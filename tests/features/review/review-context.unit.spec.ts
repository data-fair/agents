/**
 * stateless unit tests of how the review page marks what the model read that the stored messages do not say
 * (ui/src/utils/review-context.ts), from the runs' `context`.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { annotateTranscript, turnContextLines, type ContextLabels } from '../../../ui/src/utils/review-context.ts'

const labels: ContextLabels = {
  recapNote: turn => `recap from turn ${turn}`,
  notSent: (reason, turn, step) => `${reason} from turn ${turn} step ${step}`,
  noteInstructions: 'instructions',
  noteInjected: 'injected',
  reminderNote: 'reminder',
  recapLine: (seq, generation, written) => `recap #${seq} g${generation}${written ? ' written' : ''}`,
  removedLine: (step, tool, reason) => `step ${step} ${tool} ${reason}`,
  stepInstructions: step => `step ${step} instructions`,
  stepInjected: step => `step ${step} injected`
}
const call = (id: string) => ({ type: 'dynamic-tool', toolCallId: id, toolName: 'bulk', state: 'output-available', input: {}, output: 'x' })
const stored = [
  { seq: 1, role: 'user' as const, parts: [{ type: 'text', text: 'one' }] },
  { seq: 2, role: 'assistant' as const, runId: 'r1', parts: [{ type: 'step-start' }, call('c1')] },
  { seq: 3, role: 'user' as const, parts: [{ type: 'text', text: 'two' }] },
  { seq: 4, role: 'assistant' as const, runId: 'r2', parts: [{ type: 'step-start' }, call('c2'), { type: 'step-start' }, { type: 'text', text: 'done' }] },
  { seq: 5, role: 'user' as const, parts: [{ type: 'text', text: 'three' }] },
  { seq: 6, role: 'assistant' as const, runId: 'r3', parts: [{ type: 'step-start' }, { type: 'text', text: 'ok' }] }
]
const runs = [
  { id: 'r1' },
  { id: 'r2', context: { removed: [{ toolCallId: 'c1', step: 1, reason: 'cleared' }], steps: [{ step: 2, injected: 'you repeat yourself' }] } },
  { id: 'r3', context: { recap: { generation: 1, coversUpToSeq: 4, summary: 'what happened', written: true }, removed: [{ toolCallId: 'c1', step: 1, reason: 'cleared' }] } }
]

test.describe('annotateTranscript', () => {
  test('each turn\'s record goes above the first message it wrote, a turn that wrote none with the next one', () => {
    const turns = annotateTranscript(stored, runs, labels).map(chat => chat.turns)
    assert.deepEqual(turns, [undefined, [0], undefined, [1], undefined, [2]])
    // r2 wrote nothing (it failed before answering): its record goes with r3's, in order
    const withSilent = annotateTranscript(stored.filter(message => message.runId !== 'r2'), runs, labels).map(chat => chat.turns)
    assert.deepEqual(withSilent, [undefined, [0], undefined, undefined, [1, 2]])
    // and a last turn that wrote nothing goes on the last message
    assert.deepEqual(annotateTranscript(stored.slice(0, 5), runs, labels).map(chat => chat.turns), [undefined, [0], undefined, [1], [2]])
  })

  test('a removed result is marked on its call, from the turn and step it was first removed', () => {
    const chats = annotateTranscript(stored, runs, labels)
    assert.equal(chats[1].toolInvocations![0].notSent, 'cleared from turn 2 step 1')
    assert.equal(chats[3].toolInvocations![0].notSent, undefined)
  })

  test('a recap is folded above the first message after its coverage, with its summary', () => {
    const chats = annotateTranscript(stored, runs, labels)
    assert.deepEqual(chats[4].contextNote, { label: 'recap from turn 3', text: 'what happened' })
    assert.equal(chats.filter(chat => chat.contextNote).length, 1)
  })

  test('a later run naming a generation shows the summary its writer recorded', () => {
    const later = [...runs, { id: 'r4', context: { recap: { generation: 1, coversUpToSeq: 4 } } }]
    assert.deepEqual(turnContextLines(later[3], later, stored, labels), [{ label: 'recap #4 g1', text: 'what happened' }])
  })

  test('what the service added to a step is a note at the start of that step', () => {
    const blocks = annotateTranscript(stored, runs, labels)[3].blocks!
    assert.deepEqual(blocks.map(block => block.type), ['tools', 'note', 'text'])
    assert.deepEqual(blocks[1], { type: 'note', label: 'injected', text: 'you repeat yourself' })
  })

  test('a task run\'s outcome reminder is a note where it was sent', () => {
    const task = [{ seq: 2, role: 'assistant' as const, runId: 't', parts: [{ type: 'step-start' }, { type: 'text', text: 'hi' }, { type: 'data-outcome-reminder', data: { text: 'Call report_outcome' } }, { type: 'step-start' }, call('r')] }]
    const blocks = annotateTranscript(task, [{ id: 't' }], labels)[0].blocks!
    assert.deepEqual(blocks.map(block => block.type), ['text', 'note', 'tools'])
    assert.equal((blocks[1] as any).text, 'Call report_outcome')
  })

  test('the turn detail lists each removal by tool, and each step\'s addition', () => {
    assert.deepEqual(turnContextLines(runs[1], runs, stored, labels), [
      { label: 'step 1 bulk cleared' },
      { label: 'step 2 injected', text: 'you repeat yourself' }
    ])
  })
})
