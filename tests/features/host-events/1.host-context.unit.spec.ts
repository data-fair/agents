/**
 * stateless unit tests for folding host state into a history, server-side.
 *
 * `withHostContext` is what makes the server-held loop able to READ what the page reported. Before it,
 * the socket filled the store, `wait_for_user_action` drained its events, and the retained state was
 * never told to the model at all — so the gap it closes is invisible by construction: everything still
 * ran, the assistant was simply blind to the page. Hence tests that assert the block is PRESENT and in
 * the right message, not merely that nothing threw.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { HostEventStore, withHostContext, HOST_STATE_OPEN, HOST_EVENTS_OPEN } from '@agents/shared/host-events'
import { splitHiddenContext } from '@agents/shared/hidden-context'

/**
 * A user message in the shape `convertToModelMessages` actually produces: content is an ARRAY of
 * parts, not a string.
 *
 * This file used string content, and that is why it passed while the feature was dead: the fold had
 * a guard returning the history untouched for non-string content, which is EVERY user message the
 * real pipeline builds. An api test over the socket is what found it. The string case is still
 * covered below, because a caller may hand-build one.
 */
const userTurn = (text: string) => ({ role: 'user', content: [{ type: 'text', text }] })
const stringUserTurn = (text: string) => ({ role: 'user', content: text })

/** The text of a decorated message, whichever shape it came back in. */
const textOf = (message: { content: unknown }): string => {
  if (typeof message.content === 'string') return message.content
  return (message.content as Array<{ type?: string, text?: string }>)
    .filter(part => part?.type === 'text').map(part => part.text ?? '').join('')
}

test.describe('withHostContext', () => {
  test('retained state is folded into the last user message', () => {
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'the datasets list', at: Date.now() })

    const history = withHostContext([userTurn('what am I looking at?')], store)
    assert.equal(history.length, 1, 'no message is added; the existing one is decorated')
    const content = textOf(history[0])
    assert.match(content, /the datasets list/)
    assert.ok(content.includes(HOST_STATE_OPEN))
    // And the person's own words survive, which is what the wrapper is for.
    assert.equal(splitHiddenContext(content).visible, 'what am I looking at?')
  })

  test('pending events are folded in and DRAINED', () => {
    // Drained because being told twice is worse than being told late: a model shown the same click in
    // two consecutive turns will often act on it twice.
    const store = new HostEventStore()
    store.push({ name: 'clicked save', at: Date.now() })

    const first = withHostContext([userTurn('did that work?')], store)
    assert.ok(textOf(first[0]).includes(HOST_EVENTS_OPEN))
    assert.match(textOf(first[0]), /clicked save/)

    const second = withHostContext([userTurn('and now?')], store)
    assert.doesNotMatch(textOf(second[0]), /clicked save/)
  })

  test('the LAST user message is the target, not the first', () => {
    // A multi-turn history decorated at the top would put the page's current state behind everything
    // that has been said since, which is the opposite of "what is true now".
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'one dataset', at: Date.now() })
    const history = withHostContext([
      userTurn('first'),
      { role: 'assistant', content: 'ok' },
      userTurn('second')
    ], store)
    assert.doesNotMatch(textOf(history[0]), /one dataset/)
    assert.match(textOf(history[2]), /one dataset/)
  })

  test('an empty store leaves the history untouched, by identity', () => {
    const store = new HostEventStore()
    const history = [userTurn('hello')]
    assert.equal(withHostContext(history, store), history, 'the same array, not a decorated copy')
  })

  test('a history with no user message is left alone', () => {
    // A decoration with nowhere to go is dropped rather than given a turn of its own, which would put
    // a message in the history that nobody sent.
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'somewhere', at: Date.now() })
    const history = [{ role: 'assistant', content: 'ok' }]
    assert.equal(withHostContext(history, store), history)
  })

  test('a multi-part message is decorated in its FIRST TEXT PART, not stringified', () => {
    // The shape the real pipeline produces. An earlier version returned the history untouched here
    // to avoid destroying an attachment — correct instinct, wrong consequence: it is every user
    // message, so the feature never ran.
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'somewhere', at: Date.now() })
    const history = [{ role: 'user', content: [{ type: 'text', text: 'look' }, { type: 'file', url: 'x' }] }]
    const out = withHostContext(history, store)

    const parts = out[0].content as Array<any>
    assert.equal(parts.length, 2, 'the attachment survives')
    assert.equal(parts[1].type, 'file')
    assert.match(parts[0].text, /somewhere/)
    assert.equal(splitHiddenContext(parts[0].text).visible, 'look', "and the person's words are recoverable")
  })

  test('an attachment-only message gets the context as its own part', () => {
    // Nothing to wrap around, so the blocks are prepended rather than given a fabricated visible half.
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'somewhere', at: Date.now() })
    const history = [{ role: 'user', content: [{ type: 'file', url: 'x' }] }]
    const parts = withHostContext(history, store)[0].content as Array<any>
    assert.equal(parts.length, 2)
    assert.equal(parts[0].type, 'text')
    assert.match(parts[0].text, /somewhere/)
    assert.equal(parts[1].type, 'file')
  })

  test('a string content message is still handled, for a hand-built history', () => {
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'somewhere', at: Date.now() })
    const out = withHostContext([stringUserTurn('look')], store)
    assert.match(String(out[0].content), /somewhere/)
    assert.equal(splitHiddenContext(String(out[0].content)).visible, 'look')
  })

  test('the original history is not mutated', () => {
    // The caller holds `compacted.messages`, which is also what the trace and the seq bound describe.
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'the datasets list', at: Date.now() })
    const history = [userTurn('hello')]
    withHostContext(history, store)
    assert.deepEqual(history[0].content, [{ type: 'text', text: 'hello' }])
  })
})
