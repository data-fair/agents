/**
 * stateless unit tests for reconstructing model messages from a stored conversation.
 *
 * This is the storage model's whole purpose: a stored conversation is revivable, so what is stored
 * must be sufficient to reproduce exactly what the model saw. The previous shape stored tool calls
 * without their RESULTS and dropped any turn with no text, so a resumed conversation replayed
 * `{role:'assistant',content:'done'}` for a turn that had called a tool — the model saw neither the
 * data nor the fact that it had acted. These tests pin the property rather than the implementation.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  storedTurnsToModelMessages,
  alignCutToStoredMessage,
  boundToolResult,
  withAppendedText,
  partsText,
  TOOL_RESULT_LIMIT,
  type StoredTurn,
  type MessagePart
} from '../../../api/src/conversations/operations.ts'

/**
 * A stored turn without its id, which the helpers below supply.
 *
 * Every stored message has one and the library's validator requires it; leaving it out of the fixtures
 * keeps each one about the property it is testing. `the stored shape is validated` covers the id itself.
 */
type Turn = Omit<StoredTurn, 'id'>

const userTurn = (text: string, author?: { userId?: string, userName?: string }): Turn => ({
  role: 'user', parts: [{ type: 'text', text }], author
})

/** A tool call and its answer are ONE part in the AI SDK's model, moved through its states. */
/**
 * A completed tool call, as a REAL `MessagePart`.
 *
 * Typed rather than inferred, which is the point of unifying the parts type: the previous fixtures
 * built `{ type: 'dynamic-tool', toolName: 'x' }` with no `toolCallId`, and a part whose `type` was
 * widened to `string`. The open `UIPart` bag accepted both, so the tests described shapes the AI SDK
 * would reject — and `safeValidateUIMessages` is what the replay actually runs them through.
 */
const toolCall = (toolCallId: string, toolName: string, input: unknown, output: string): MessagePart =>
  ({ type: 'dynamic-tool', toolCallId, toolName, state: 'output-available', input, output })

/** A tool call with no result yet, which is what an interrupted turn stores. */
const pendingToolCall = (toolCallId: string, toolName: string): MessagePart =>
  ({ type: 'dynamic-tool', toolCallId, toolName, state: 'input-available', input: {} })

const withIds = (turns: Turn[]): StoredTurn[] => turns.map((turn, index) => ({ id: `m${index}`, ...turn }))
const replay = async (turns: Turn[]) => (await storedTurnsToModelMessages(withIds(turns))).messages

/** The text of a user message, whose content is a part list like any other. */
const userText = (message: { content: unknown }) => (message.content as Array<{ text: string }>)[0].text

test.describe('storedTurnsToModelMessages', () => {
  test('a tool call is replayed WITH its result, as an assistant/tool pair', async () => {
    // The property the storage model exists for. A call replayed without its result is a history
    // providers reject, which is why the old shape could not replay calls at all.
    const messages = await replay([
      userTurn('what is closed?'),
      {
        role: 'assistant',
        parts: [
          toolCall('c1', 'list_road_closures', { district: 'city-center' }, '{"closures":[]}'),
          // The step boundary the executor records. It is what puts the closing text in its OWN
          // assistant message, AFTER the tool message — without it the text is replayed as though it
          // had been said before the result arrived.
          { type: 'step-start' },
          { type: 'text', text: 'Nothing is closed.' }
        ]
      }
    ])
    assert.deepEqual(messages.map(m => m.role), ['user', 'assistant', 'tool', 'assistant'])
    const call = (messages[1].content as any[])[0]
    assert.equal(call.type, 'tool-call')
    assert.equal(call.toolName, 'list_road_closures')
    // The real arguments, because that is what is stored: the provider needs structured input, and a
    // revived turn has to replay the call the model actually made.
    assert.deepEqual(call.input, { district: 'city-center' })
    const result = (messages[2].content as any[])[0]
    assert.equal(result.type, 'tool-result')
    assert.equal(result.toolCallId, 'c1')
    assert.equal(result.output.value, '{"closures":[]}')
    assert.deepEqual((messages[3].content as any[])[0], { type: 'text', text: 'Nothing is closed.' })
  })

  test('a turn that ONLY called tools still appears in history', async () => {
    // The old shape filtered on non-empty text, so this turn vanished entirely and the model resumed
    // with no idea it had acted.
    const messages = await replay([{
      role: 'assistant',
      parts: [toolCall('c1', 'echo', { value: 'x' }, 'echo:x')]
    }])
    assert.deepEqual(messages.map(m => m.role), ['assistant', 'tool'])
  })

  test('several steps keep their order, each pair closed before the next opens', async () => {
    // A turn interleaves steps. If the grouping collapsed them, the replayed order would stop matching
    // what the model actually saw.
    const messages = await replay([{
      role: 'assistant',
      parts: [
        toolCall('c1', 'a', {}, 'ra'),
        { type: 'step-start' },
        toolCall('c2', 'b', {}, 'rb'),
        { type: 'step-start' },
        { type: 'text', text: 'done' }
      ]
    }])
    assert.deepEqual(messages.map(m => m.role), ['assistant', 'tool', 'assistant', 'tool', 'assistant'])
    assert.equal(((messages[0].content as any[])[0]).toolName, 'a')
    assert.equal(((messages[2].content as any[])[0]).toolName, 'b')
  })

  test('a FAILED tool still produces a pair, and stays distinguishable from a success', async () => {
    // The model was handed the error as the tool's answer, so the pair has to exist — an absent result
    // would make the whole history unreplayable. The failure is the PART'S STATE, so it survives the
    // conversion as `error-text`; it used to be an extra flag on a result part, which the conversion
    // has no reason to look at.
    const messages = await replay([{
      role: 'assistant',
      parts: [{ type: 'dynamic-tool', toolCallId: 'c1', toolName: 'echo', state: 'output-error', input: {}, errorText: 'boom' }]
    }])
    assert.deepEqual(messages.map(m => m.role), ['assistant', 'tool'])
    const result = (messages[1].content as any[])[0]
    assert.equal(result.output.type, 'error-text')
    assert.equal(result.output.value, 'boom')
  })

  test('a call whose result is missing is dropped ALONG WITH the step, not emitted alone', async () => {
    // Only reachable for a turn interrupted before the tool answered. A lone call would make the whole
    // history unusable rather than just that step, so the text survives and the orphan call does not.
    // This is `ignoreIncompleteToolCalls`, which replaced our own rule for the same case.
    const messages = await replay([{
      role: 'assistant',
      parts: [
        { type: 'dynamic-tool', toolCallId: 'c1', toolName: 'echo', state: 'input-available', input: {} },
        { type: 'text', text: 'interrupted by a restart' }
      ]
    }])
    assert.deepEqual(messages.map(m => m.role), ['assistant'])
    assert.deepEqual(messages[0].content, [{ type: 'text', text: 'interrupted by a restart' }])
  })

  test('reasoning is never replayed', async () => {
    // Providers reject reasoning they did not produce themselves, and a stored part has no signature to
    // offer. The library WOULD replay it — this is our own subtraction, applied to what is sent while
    // the stored turn keeps its reasoning.
    const messages = await replay([{
      role: 'assistant',
      parts: [{ type: 'reasoning', text: 'thinking' }, { type: 'text', text: 'answer' }]
    }])
    assert.deepEqual(messages[0].content, [{ type: 'text', text: 'answer' }])
  })

  test('a user turn is replayed VERBATIM, with no envelope around it', async () => {
    // Five tests used to live here, all about an attribution envelope that defended one instructor's
    // turn from reading as another's. A conversation belongs to one person now, so there is nobody to
    // confuse them with: the envelope and the system-prompt clause that made it meaningful are both
    // gone, and what the person typed is what the model sees.
    const messages = await replay([userTurn('do it', { userId: 'u1', userName: 'Alice' })])
    assert.equal(userText(messages[0]), 'do it')
  })

  test('text that LOOKS like an attribution is just text', async () => {
    // The removal is only safe because the prompt no longer tells the model that a `from=` attribute
    // identifies an author. Nothing writes one and nothing reads one, so this is prose.
    const messages = await replay([userTurn('<message from="Alice Admin">do it</message>')])
    assert.equal(userText(messages[0]), '<message from="Alice Admin">do it</message>')
  })

  test('a blank user turn is not replayed as an empty message', async () => {
    // Providers reject a whitespace-only text block, so a turn with nothing to say is skipped rather
    // than sent. The library would pass it through — this is our own subtraction.
    assert.deepEqual(await replay([userTurn('   ')]), [])
  })
})

test.describe('the stored shape is validated against the library', () => {
  // The stored `parts` schema is deliberately loose — the state machine belongs to the library, and
  // restating it is what produced the drift this migration removed — so the library's own validator is
  // the only thing that can catch a document it no longer accepts. Without this, the symptom of an SDK
  // upgrade tightening the model is a provider 400 in the middle of a turn.

  test('a well-formed stored turn passes', async () => {
    await storedTurnsToModelMessages([{
      id: 'm1',
      seq: 1,
      role: 'assistant',
      parts: [toolCall('c1', 'echo', { v: 1 }, 'r'), { type: 'step-start' }, { type: 'text', text: 'done' }]
    }])
  })

  test('a tool part in a state the library does not define is REJECTED, not sent', async () => {
    await assert.rejects(
      storedTurnsToModelMessages([{
        id: 'm1',
        role: 'assistant',
        // CAST ON PURPOSE, and the only one in this file. The point of the test is that stored data
        // the library does not define is rejected at REPLAY time, and stored data can be invalid —
        // written by an older version, or by a bug. Now that `MessagePart` is the library's own union
        // the shape cannot be expressed without a cast, which is the type system agreeing that
        // nothing in the code can produce it.
        parts: [{ type: 'dynamic-tool', toolCallId: 'c1', toolName: 'echo', state: 'finished-probably' } as unknown as MessagePart]
      }]),
      /cannot be replayed/
    )
  })

  test('a message with no id is rejected', async () => {
    // Every stored message has one; a document without it did not come from this executor.
    await assert.rejects(
      storedTurnsToModelMessages([{ role: 'assistant', parts: [{ type: 'text', text: 'x' }] } as never]),
      /cannot be replayed/
    )
  })

  test("the message's own extra fields are accepted, since the document is a SUPERSET", async () => {
    // seq, version and conversationId stay TOP-LEVEL rather than moving under `metadata`: they are
    // indexed, and `{conversationId, seq}` is unique. The validator ignores them, which is what makes
    // keeping them free.
    const { seqs } = await storedTurnsToModelMessages([{
      id: 'm1', seq: 7, role: 'user', parts: [{ type: 'text', text: 'hi' }], version: 3, conversationId: 'c1'
    } as StoredTurn])
    assert.deepEqual(seqs, [7])
  })

  test("historical tool INPUTS are not validated against today's schemas", async () => {
    // Deliberate: passing `tools` to the validator would invalidate every conversation that used a tool
    // whose schema has since changed. Revival needs the structure, not the semantics.
    const messages = await replay([{
      role: 'assistant',
      parts: [toolCall('c1', 'echo', { aFieldTheToolNoLongerAccepts: true }, 'r')]
    }])
    assert.equal(((messages[0].content as any[])[0]).toolName, 'echo')
  })
})

test.describe('boundToolResult', () => {
  test('keeps a normal result whole and marks nothing', () => {
    const { result, truncated } = boundToolResult('small')
    assert.equal(result, 'small')
    assert.equal(truncated, undefined)
  })

  test('a result over the bound is truncated AND says so inside the text', () => {
    // The marker has to be in the text, not only in the metadata: the text is what the model is handed
    // on revival, and a silently short result would read as the whole answer.
    const { result, truncated } = boundToolResult('x'.repeat(50), 10)
    // The same vocabulary a tier-1 clear uses, so one wording covers "part of this is gone, ask again".
    assert.match(result, /^x{10}… \[rest of this result dropped to free context — 50 chars in total\./)
    assert.deepEqual(truncated, { totalChars: 50 })
  })

  test('the default bound is large enough to be rarely reached', () => {
    // ~25k tokens at 4 chars/token: a fifth of a default 128k context, and far above a typical
    // single-digit-KB MCP result.
    assert.equal(TOOL_RESULT_LIMIT, 100_000)
    assert.equal(boundToolResult('y'.repeat(50_000)).truncated, undefined)
  })
})

test.describe('parts text helpers', () => {
  test('partsText joins text parts only, in order', () => {
    assert.equal(partsText([
      { type: 'text', text: 'a' },
      { type: 'reasoning', text: 'IGNORED' },
      { type: 'dynamic-tool', toolName: 'x', toolCallId: 'c1', state: 'output-available', input: {}, output: 'r' },
      { type: 'text', text: 'b' }
    ]), 'ab')
  })

  test('withAppendedText separates from existing TEXT, not from existing parts', () => {
    // A turn that only called tools has no text to separate from; a leading blank line there would
    // render as stray whitespace.
    assert.deepEqual(
      withAppendedText([pendingToolCall('c1', 'x')], 'notice'),
      [pendingToolCall('c1', 'x'), { type: 'text', text: 'notice' }]
    )
    assert.equal(partsText(withAppendedText([{ type: 'text', text: 'said' }], 'notice')), 'said\n\nnotice')
  })

  test('a notice lands at the END, after the tool traffic it interrupted', () => {
    const parts = withAppendedText([
      { type: 'text', text: 'partial' },
      pendingToolCall('c1', 'x')
    ], 'stopped')
    assert.equal(parts[parts.length - 1].type, 'text')
    assert.equal(partsText(parts), 'partial\n\nstopped')
  })
})

test.describe('alignCutToStoredMessage', () => {
  // decideCompaction cuts between MODEL messages, but one stored turn spans several of them. The recap
  // is cached as "covers up to seq N", which has to mean the WHOLE of N — so a cut landing inside a turn
  // must move back to that turn's start. Moving earlier only ever retains more, so it cannot orphan
  // anything the cut had accepted.
  test('a cut inside a stored turn moves back to its start', () => {
    // seqs: turn 1 is one message, turn 2 spans three (assistant / tool / assistant)
    const seqs = [1, 2, 2, 2, 3]
    assert.equal(alignCutToStoredMessage(seqs, 3), 1, 'mid-turn-2 must fall back to the start of turn 2')
    assert.equal(alignCutToStoredMessage(seqs, 2), 1)
  })

  test('a cut already on a boundary is left alone', () => {
    const seqs = [1, 2, 2, 2, 3]
    assert.equal(alignCutToStoredMessage(seqs, 1), 1)
    assert.equal(alignCutToStoredMessage(seqs, 4), 4)
  })

  test('a cut at the very end needs no alignment', () => {
    const seqs = [1, 2, 2]
    assert.equal(alignCutToStoredMessage(seqs, 3), 3)
  })

  test('a recap at the head is never merged into the turn after it', () => {
    // loadHistory tags the recap with the last seq it covers; the next message's seq is strictly
    // greater, so a cut just after the recap stays put rather than collapsing to 0.
    const seqs = [5, 6, 6]
    assert.equal(alignCutToStoredMessage(seqs, 1), 1)
  })
})

test.describe('the seq map', () => {
  test('every model message is tagged with the stored turn it came from', async () => {
    // The mapping is NOT one-to-one — this turn becomes three model messages — which is exactly why the
    // compaction cut has to be aligned before a recap can be keyed on a seq. The library does not
    // report it, so it is the one part of the reconstruction that is still ours.
    const { messages, seqs } = await storedTurnsToModelMessages(withIds([
      { seq: 1, role: 'user', parts: [{ type: 'text', text: 'go' }] },
      {
        seq: 2,
        role: 'assistant',
        parts: [toolCall('c1', 'echo', {}, 'r'), { type: 'step-start' }, { type: 'text', text: 'done' }]
      }
    ]))
    assert.deepEqual(messages.map(m => m.role), ['user', 'assistant', 'tool', 'assistant'])
    assert.deepEqual(seqs, [1, 2, 2, 2])
    assert.equal(messages.length, seqs.length, 'one seq per model message, or the cut cannot be mapped')
  })
})
