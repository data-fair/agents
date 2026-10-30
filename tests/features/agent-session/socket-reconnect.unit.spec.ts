/**
 * stateless unit tests for the browser half of the agent session when its socket goes away.
 *
 * The server closes every socket when it restarts or is redeployed. A judged simulation lost its last
 * message exactly so: the API restarted while the person read the answer, the next prompt was queued
 * behind a socket that would never open again, and the chat showed Stop for ten minutes while nothing
 * reached the server. The server is built for a client that comes back (a second hello replaces the
 * first, history replays by seq); these pin that the client does.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useAgentSession } from '../../../ui/src/composables/use-agent-session.ts'

/** A WebSocket the test drives from the server's side. */
class FakeSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  static all: FakeSocket[] = []
  readyState = FakeSocket.CONNECTING
  sent: any[] = []
  onopen?: () => void
  onclose?: () => void
  onmessage?: (event: { data: string }) => void
  constructor (public url: string) { FakeSocket.all.push(this) }
  send (data: string) { this.sent.push(JSON.parse(data)) }
  close () { this.serverClose() }
  serverOpen () { this.readyState = FakeSocket.OPEN; this.onopen?.() }
  serverClose () { this.readyState = FakeSocket.CLOSED; this.onclose?.() }
  serverSend (frame: unknown) { this.onmessage?.({ data: JSON.stringify(frame) }) }
}

const setup = () => {
  FakeSocket.all = []
  ;(globalThis as any).WebSocket = FakeSocket
  const disconnects: number[] = []
  const agent = useAgentSession({
    url: 'ws://test/agent-session',
    tools: ref({}),
    account: { type: 'organization', id: 'test1' },
    onDisconnect: () => { disconnects.push(Date.now()) }
  })
  return { agent, disconnects }
}

test.describe('agent session socket, after the server closed it', () => {
  test('the next prompt reopens the socket, rebinds the thread it was in, and is delivered', () => {
    const { agent } = setup()
    agent.connect({ agentId: 'test-fixture' })
    const first = FakeSocket.all[0]
    first.serverOpen()
    // The first prompt created the thread: the server says what the connection is bound to now.
    first.serverSend({ type: 'attached', conversationId: 'conv-1' })

    first.serverClose()
    agent.prompt('are the closures still there?')

    assert.equal(FakeSocket.all.length, 2, 'a prompt after a close must open a new socket')
    const second = FakeSocket.all[1]
    second.serverOpen()
    // The thread it was in, not a fresh one with the agent: a hello naming the agent would make this
    // prompt start a second conversation.
    assert.deepEqual(second.sent.map(frame => frame.type), ['hello', 'prompt'])
    assert.equal(second.sent[0].conversationId, 'conv-1')
    assert.equal(second.sent[0].agentId, undefined)
    assert.equal(second.sent[1].content, 'are the closures still there?')
  })

  test('a close is reported, and a reopen that fails drops what it queued rather than holding it', () => {
    const { agent, disconnects } = setup()
    agent.connect({ conversationId: 'conv-1' })
    const first = FakeSocket.all[0]
    first.serverOpen()
    first.serverClose()
    assert.equal(disconnects.length, 1)

    agent.prompt('hello?')
    const second = FakeSocket.all[1]
    // The server is still down: the socket closes without ever opening.
    second.serverClose()
    assert.equal(disconnects.length, 2, 'the caller must hear that the message did not go')

    // The person sends again once the server is back: only that message goes, not the lost one too.
    agent.prompt('hello again')
    const third = FakeSocket.all[2]
    third.serverOpen()
    assert.deepEqual(third.sent.map(frame => frame.type === 'prompt' ? frame.content : frame.type), ['hello', 'hello again'])
  })

  test('a socket the page closed itself is not reopened', () => {
    const { agent, disconnects } = setup()
    agent.connect({ conversationId: 'conv-1' })
    FakeSocket.all[0].serverOpen()
    agent.close()
    agent.prompt('ignored')
    assert.equal(FakeSocket.all.length, 1)
    assert.equal(disconnects.length, 0)
  })
})
