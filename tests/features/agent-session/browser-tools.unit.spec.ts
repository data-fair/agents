/**
 * stateless unit tests for the tool bridge: a page's declared tool becoming one the model can call,
 * and the descriptors that travel up the socket.
 *
 * The property under test is that a page tool and an MCP tool are indistinguishable to the loop —
 * same envelope, same failure shape — because that is what lets one loop serve both surfaces.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { browserToolSet, describeBrowserTools, BROWSER_TOOL_SERVER } from '../../../api/src/agent-session/browser-tools.ts'
import { toDescriptors } from '../../../ui/src/composables/use-agent-session.ts'
import { createAgentSession } from '../../../api/src/agent-session/session.ts'
import { tool, jsonSchema } from 'ai'
import { HostEventStore } from '@agents/shared/host-events'
import type { AgentSession } from '../../../api/src/agent-session/session.ts'

/** A session that answers every browser call with a fixed value, or throws. */
const fakeSession = (over: Partial<AgentSession> = {}): AgentSession => ({
  handle: () => {},
  callBrowserTool: async () => 'the page answered',
  tools: () => [{ name: 'select_row', description: 'selects a row' }],
  sessionCookie: () => undefined,
  send: () => {},
  hostEvents: new HostEventStore(),
  attached: () => true,
  close: () => {},
  ...over
})

const run = async (tools: Record<string, any>, name: string, input: unknown = {}) =>
  await tools[name].execute(input, { toolCallId: 'c1', messages: [] })

test.describe('browserToolSet', () => {
  test('a declared tool becomes callable, and its result carries the provenance envelope', async () => {
    const tools = browserToolSet(fakeSession())
    assert.deepEqual(Object.keys(tools), ['select_row'])
    const result = await run(tools, 'select_row', { id: 7 })
    // The SAME envelope an MCP result gets, from the same implementation: a page's result is untrusted
    // input in exactly the same way, and two copies of this is how the envelope would come to differ.
    assert.match(String(result), /<tool-result server="the-page" tool="select_row">/)
    assert.match(String(result), /the page answered/)
  })

  test('the envelope names the page as a page, not by URL', async () => {
    // A URL is attacker-influenced text on a shared surface and the envelope's content reaches the
    // model. Which page it was belongs in the conversation record, not in the prompt.
    assert.equal(BROWSER_TOOL_SERVER, 'the-page')
  })

  test('what the page was asked is what the session is asked', async () => {
    const asked: Array<{ name: string, input: unknown }> = []
    const tools = browserToolSet(fakeSession({
      callBrowserTool: async (name, input) => { asked.push({ name, input }); return 'ok' }
    }))
    await run(tools, 'select_row', { id: 7, deep: { a: [1, 2] } })
    assert.deepEqual(asked, [{ name: 'select_row', input: { id: 7, deep: { a: [1, 2] } } }])
  })

  test('a page failure reaches the model as a failure, enveloped', async () => {
    const tools = browserToolSet(fakeSession({
      callBrowserTool: async () => { throw new Error('there is no such row') }
    }))
    // Rejects rather than returning an error-shaped value — the distinction the loop keys on, and the
    // one this codebase has been bitten by twice.
    await assert.rejects(run(tools, 'select_row'), (err: Error) => {
      assert.match(err.message, /there is no such row/)
      // Enveloped too: the failure text is the page's own words, so it is the one place the model would
      // otherwise be handed unattributed content from the page.
      assert.match(err.message, /<tool-result server="the-page" tool="select_row">/)
      return true
    })
  })

  test('an explicit descriptor list overrides the session, so a turn can freeze its tool set', async () => {
    // The tool set is built per turn and frozen for it, the same rule the MCP catalog follows: nothing
    // that happens mid-turn may change what the model was told it had.
    const tools = browserToolSet(fakeSession(), [{ name: 'frozen_tool' }])
    assert.deepEqual(Object.keys(tools), ['frozen_tool'])
  })

  test('a tool with no declared schema still gets a usable one', async () => {
    const tools = browserToolSet(fakeSession(), [{ name: 'no_schema' }])
    assert.deepEqual((tools.no_schema.inputSchema as any).jsonSchema, { type: 'object', properties: {} })
  })

  test('the declared schema is passed through untouched', async () => {
    const schema = { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] }
    const tools = browserToolSet(fakeSession(), [{ name: 'select_row', inputSchema: schema }])
    assert.deepEqual((tools.select_row.inputSchema as any).jsonSchema, schema)
  })
})

test.describe('toDescriptors — the browser side of the same contract', () => {
  test('unwraps the SDK schema wrapper, which is what the wire needs', () => {
    // `jsonSchema(x)` exposes the raw document on a getter. Serialising the wrapper would send an
    // object with none of the schema in it — and the model's provider is the thing that needs it.
    const schema = { type: 'object', properties: { id: { type: 'number' } } }
    const descriptors = toDescriptors({
      select_row: tool({ description: 'selects a row', inputSchema: jsonSchema(schema as any), execute: async () => 'x' })
    })
    assert.deepEqual(descriptors, [{ name: 'select_row', description: 'selects a row', inputSchema: schema }])
  })

  test('a descriptor survives the round trip into a callable tool', async () => {
    // The bridge's end-to-end property, without a socket: what the browser advertises is what the
    // server can build and call.
    const schema = { type: 'object', properties: { id: { type: 'number' } } }
    const descriptors = toDescriptors({
      select_row: tool({ description: 'selects a row', inputSchema: jsonSchema(schema as any), execute: async () => 'local' })
    })
    const tools = browserToolSet(fakeSession(), descriptors)
    assert.equal(tools.select_row.description, 'selects a row')
    assert.match(String(await run(tools, 'select_row')), /the page answered/)
  })

  test('a tool without a description does not produce undefined on the wire', () => {
    const descriptors = toDescriptors({ x: tool({ inputSchema: jsonSchema({} as any), execute: async () => 'x' }) })
    assert.equal(descriptors[0].description, '')
  })
})

test.describe('the bridge against a real session object', () => {
  test('a model call becomes a socket frame, and the answer resolves it', async () => {
    // The two halves joined: browserToolSet over a genuine createAgentSession, so the correlation is
    // the real one rather than a fake's.
    const sent: any[] = []
    const session = createAgentSession({ send: message => { sent.push(message) } })
    session.handle({ type: 'hello', tools: [{ name: 'select_row' }] })
    const tools = browserToolSet(session)

    const pending = run(tools, 'select_row', { id: 7 })
    const asked = sent[sent.length - 1]
    assert.equal(asked.type, 'tool-call')
    session.handle({ type: 'tool-result', callId: asked.callId, result: 'row 7' })
    assert.match(String(await pending), /row 7/)
  })

  test('a tool the page stopped declaring fails at the call', async () => {
    // The mid-turn navigation case: the tool set was frozen when the turn began, so the model may ask
    // for something the page no longer offers. It must fail here rather than go to a browser that will
    // never answer.
    const session = createAgentSession({ send: () => {} })
    session.handle({ type: 'hello', tools: [{ name: 'select_row' }] })
    const tools = browserToolSet(session, [{ name: 'select_row' }])
    session.handle({ type: 'tools-changed', tools: [] })
    await assert.rejects(run(tools, 'select_row'), /does not offer a tool named select_row/)
  })
})

test.describe('describeBrowserTools', () => {
  test('names and descriptions only, never the schemas', () => {
    assert.deepEqual(
      describeBrowserTools([{ name: 'a', description: 'the a', inputSchema: { type: 'object' } }, { name: 'b' }]),
      [{ name: 'a', description: 'the a' }, { name: 'b', description: '' }]
    )
  })
})
