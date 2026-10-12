/**
 * stateless unit tests for the conversation export.
 *
 * The format's one promise is NAVIGABILITY: a reader that read lines 1 and 2 can fetch any record by
 * line number without reading the rest. Two things can break that promise silently — a record that
 * spans more than one line, and an outline whose line numbers are off by one — and neither shows up
 * in a passing "the export contains the message" assertion. Both are asserted here against the real
 * text of the file, not against the structure it was built from.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildConversationExport, exportFilename, EXTRACT_THRESHOLD } from '../../../api/src/review/operations.ts'

const conversation = {
  id: 'conv-1',
  agentId: 'personal',
  owner: { type: 'organization', id: 'test1' },
  userId: 'test1-user1',
  title: 'A thread',
  createdAt: '2026-10-01T10:00:00.000Z',
  consentedToReview: true
}

const bigResult = 'x'.repeat(EXTRACT_THRESHOLD + 500)

const messages = [
  { id: 'm1', conversationId: 'conv-1', seq: 1, role: 'user', parts: [{ type: 'text', text: 'what are the road closures?' }] },
  {
    id: 'm2',
    conversationId: 'conv-1',
    seq: 2,
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Let me look.' },
      { type: 'dynamic-tool', toolName: 'list_road_closures', toolCallId: 'call-1', state: 'output-available', input: { city: 'Lyon' }, output: { text: bigResult } },
      { type: 'text', text: 'Three streets are closed.' }
    ]
  }
]

const runs = [
  { id: 'r1', conversationId: 'conv-1', status: 'done', credits: 2, systemPrompt: 'You are helpful.', calls: [{ modelRole: 'assistant', model: 'gpt-x', inputTokens: 10 }] },
  { id: 'r2', conversationId: 'conv-1', status: 'done', credits: 1, systemPrompt: 'You are helpful.', calls: [{ modelRole: 'assistant', model: 'gpt-x', inputTokens: 20 }] }
]

const build = () => buildConversationExport({ conversation, messages, runs }, new Date('2026-10-02T12:00:00.000Z'))
const linesOf = (text: string) => text.replace(/\n$/, '').split('\n')

/**
 * Records found by what they ARE, not by a substring of their line: the outline mentions every
 * record's seq and ref, so `line.includes('"seq":2')` matches the outline first — which is how the
 * first version of these tests read the index and thought it was reading a message.
 */
const recordsOf = (lines: string[]) => lines.slice(2).map(line => JSON.parse(line))
const messageAt = (lines: string[], seq: number) =>
  recordsOf(lines).find(record => record.type === 'message' && record.seq === seq)
const blobAt = (lines: string[], ref: string) =>
  recordsOf(lines).find(record => record.type === 'blob' && record.ref === ref)

test.describe('buildConversationExport', () => {
  test('every record is exactly one line of valid JSON', () => {
    // The whole point of JSONL here: a 2.5k-char tool result must not become 40 lines, or a line
    // number stops being an address.
    const lines = linesOf(build())
    for (const [index, line] of lines.entries()) {
      assert.doesNotMatch(line, /\n/, `line ${index + 1} spans a newline`)
      assert.doesNotThrow(() => JSON.parse(line), `line ${index + 1} is not valid JSON`)
    }
  })

  test('line 1 is the meta record and line 2 is the outline', () => {
    const lines = linesOf(build())
    const meta = JSON.parse(lines[0])
    assert.equal(meta.type, 'meta')
    assert.equal(meta.exportVersion, 1)
    assert.equal(meta.conversation.id, 'conv-1')
    assert.equal(meta.counts.messages, 2)
    assert.equal(meta.counts.runs, 2)
    assert.equal(JSON.parse(lines[1]).type, 'outline')
  })

  test('the meta record states the real total line count', () => {
    const text = build()
    assert.equal(JSON.parse(linesOf(text)[0]).lines.total, linesOf(text).length)
  })

  test('every outline line number points at the record it describes', () => {
    // The off-by-one that would make every pointer in the file wrong, and that no structural
    // assertion catches.
    const lines = linesOf(build())
    const outline = JSON.parse(lines[1]).records
    for (const entry of outline) {
      const record = JSON.parse(lines[entry.line - 1])
      assert.equal(record.type, entry.record, `line ${entry.line} should be a ${entry.record}`)
      if (entry.ref) assert.equal(record.ref, entry.ref)
      if (entry.seq && entry.record === 'message') assert.equal(record.seq, entry.seq)
      assert.equal(lines[entry.line - 1].length, entry.bytes, 'the stated size is the line length')
    }
  })

  test('a part over the threshold is lifted into its own record, and the message keeps a usable stub', () => {
    const lines = linesOf(build())
    const message = messageAt(lines, 2)
    const toolPart = message.parts[1]
    assert.equal(toolPart.__ref, 'part:2:1')
    assert.equal(toolPart.toolName, 'list_road_closures', 'the stub still says which tool')
    assert.equal(toolPart.state, 'output-available', 'and whether it succeeded')
    assert.ok(toolPart.__bytes > EXTRACT_THRESHOLD)
    assert.ok(toolPart.__preview.length < 200, 'the stub is a preview, not the value')
    assert.ok(!JSON.stringify(message).includes(bigResult), 'the big value is NOT in the message line')

    const blob = blobAt(lines, 'part:2:1')
    assert.equal(blob.conversationSeq, 2)
    assert.deepEqual(blob.value.output, { text: bigResult }, 'the blob holds the value verbatim')
  })

  test('parts under the threshold stay inline, so the transcript reads as a transcript', () => {
    const lines = linesOf(build())
    const user = messageAt(lines, 1)
    assert.deepEqual(user.parts, [{ type: 'text', text: 'what are the road closures?' }])
  })

  test('a repeated system prompt is stored once and referenced by both runs', () => {
    // For a long thread this is most of the file: every run normally carries the same prompt.
    const lines = linesOf(build())
    const records = recordsOf(lines)
    const promptBlobs = records.filter(record => record.type === 'blob' && record.ref === 'prompt:1')
    const runRecords = records.filter(record => record.type === 'run')
    assert.equal(promptBlobs.length, 1, 'the prompt is stored exactly once')
    assert.equal(runRecords.length, 2)
    for (const run of runRecords) {
      assert.equal(run.systemPromptRef, 'prompt:1')
      assert.equal(run.systemPrompt, undefined, 'the prompt itself is not repeated on the run')
    }
    assert.equal(promptBlobs[0].value, 'You are helpful.')
  })

  test('the per-call telemetry survives, since it is the thing the transcript cannot show', () => {
    const run = recordsOf(linesOf(build())).find(record => record.type === 'run')
    assert.equal(run.calls[0].model, 'gpt-x')
    assert.equal(run.calls[0].inputTokens, 10)
  })

  test('the file explains itself, for an agent that has no skill loaded', () => {
    const meta = JSON.parse(linesOf(build())[0])
    assert.match(meta.guide, /JSON Lines/)
    assert.match(meta.guide, /sed -n/)
    assert.equal(meta.extractThreshold, EXTRACT_THRESHOLD)
  })

  test('an empty conversation still produces a well-formed file', () => {
    const text = buildConversationExport({ conversation, messages: [], runs: [] })
    const lines = linesOf(text)
    assert.equal(lines.length, 2)
    assert.deepEqual(JSON.parse(lines[1]).records, [])
    assert.equal(JSON.parse(lines[0]).lines.total, 2)
  })

  test('a message with no parts does not break the build', () => {
    // Stored data predates several shapes; `parts` is optional on the collection's element type.
    const text = buildConversationExport({ conversation, messages: [{ id: 'm', seq: 1, role: 'user' }], runs: [] })
    const record = JSON.parse(linesOf(text)[2])
    assert.deepEqual(record.parts, [])
  })

  test('the filename names the thread', () => {
    assert.equal(exportFilename('conv-1'), 'conversation-conv-1.jsonl')
  })
})
