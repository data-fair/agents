/**
 * stateless unit tests: a model stream recorded as stored parts, shared by the lead's loop and a worker's.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createPartsRecorder, resultSettlement, errorSettlement } from '../../../api/src/conversations/parts-recorder.ts'
import { TOOL_RESULT_LIMIT } from '../../../api/src/conversations/operations.ts'

test.describe('createPartsRecorder', () => {
  test('merges deltas of the same kind, and opens a new part when the kind changes', () => {
    const recorder = createPartsRecorder()
    recorder.appendText('reasoning', 'let me ')
    recorder.appendText('reasoning', 'think')
    recorder.appendText('text', 'Hello')
    recorder.appendText('text', ' world')
    assert.deepEqual(recorder.parts, [{ type: 'reasoning', text: 'let me think' }, { type: 'text', text: 'Hello world' }])
  })

  test('settles a call in place by its id, with a cut result noted in its metadata', () => {
    const recorder = createPartsRecorder()
    recorder.openCall({ toolCallId: 'a', toolName: 'lookup', input: {}, toolMetadata: { serverId: 'roads' } })
    recorder.openCall({ toolCallId: 'b', toolName: 'lookup', input: {} })
    recorder.settleCall('b', errorSettlement(new Error('boom')))
    recorder.settleCall('a', resultSettlement('x'.repeat(TOOL_RESULT_LIMIT + 1)))
    const [a, b] = recorder.parts as any[]
    assert.equal(b.state, 'output-error')
    assert.equal(b.errorText, 'boom')
    assert.equal(a.state, 'output-available')
    assert.deepEqual(a.toolMetadata, { serverId: 'roads', truncated: { totalChars: TOOL_RESULT_LIMIT + 1 } })
  })

  test('a call it never opened is not its to settle', () => {
    const recorder = createPartsRecorder()
    assert.equal(recorder.hasCall('earlier'), false)
    recorder.settleCall('earlier', resultSettlement('ok'))
    assert.deepEqual(recorder.parts, [])
  })
})

test.describe('resultSettlement', () => {
  test('stringifies a structured result, and keeps an image-bearing one as its envelope', () => {
    assert.deepEqual(resultSettlement({ rows: 1 }), { state: 'output-available', output: '{"rows":1}' })
    const media = { _agentsMediaResult: true, text: 'a chart', media: [{ type: 'image', data: 'AAAA', mediaType: 'image/png' }] }
    assert.deepEqual(resultSettlement(media), { state: 'output-available', output: media })
  })
})
