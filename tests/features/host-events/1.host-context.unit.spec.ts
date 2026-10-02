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

const userTurn = (text: string) => ({ role: 'user', content: text })

test.describe('withHostContext', () => {
  test('retained state is folded into the last user message', () => {
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'the datasets list', at: Date.now() })

    const history = withHostContext([userTurn('what am I looking at?')], store)
    assert.equal(history.length, 1, 'no message is added; the existing one is decorated')
    const content = String(history[0].content)
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
    assert.ok(String(first[0].content).includes(HOST_EVENTS_OPEN))
    assert.match(String(first[0].content), /clicked save/)

    const second = withHostContext([userTurn('and now?')], store)
    assert.doesNotMatch(String(second[0].content), /clicked save/)
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
    assert.doesNotMatch(String(history[0].content), /one dataset/)
    assert.match(String(history[2].content), /one dataset/)
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

  test('a multi-part user message is left alone rather than stringified', () => {
    // Its content is an array of parts (an image, a file). Concatenating a string onto it would need
    // the array stringified, which destroys the message — losing the attachment to add a note about
    // the page is the wrong trade.
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'somewhere', at: Date.now() })
    const history = [{ role: 'user', content: [{ type: 'text', text: 'look' }] }]
    assert.equal(withHostContext(history, store), history)
  })

  test('the original history is not mutated', () => {
    // The caller holds `compacted.messages`, which is also what the trace and the seq bound describe.
    const store = new HostEventStore()
    store.push({ name: 'page', key: 'page', detail: 'the datasets list', at: Date.now() })
    const history = [userTurn('hello')]
    withHostContext(history, store)
    assert.equal(history[0].content, 'hello')
  })
})
