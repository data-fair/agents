/**
 * stateless unit tests for the personal assistant as an agent, and for the one port this design keeps.
 *
 * The claim under test is the one the whole prototype rests on: a personal conversation and a
 * configured agent's conversation differ only in WHO the agent acts as. If anything else has to differ,
 * the loop cannot serve both and the collapse does not happen.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { personalAgent, PERSONAL_AGENT_ID } from '../../../api/src/agent-session/personal-agent.ts'
import { forwardedSessionProvider } from '../../../api/src/agent-identity/operations.ts'
import { createAgentSession } from '../../../api/src/agent-session/session.ts'

/** A catalog, passed in rather than read from config — which is what keeps this unit testable. */
const CATALOG = [{ id: 'dev-public-mcp' }, { id: 'dev-session-mcp' }]

test.describe('the personal agent', () => {
  test('is shaped like any other agent the tool gatherer accepts', () => {
    // The structural claim. If this needed its own branch in the tool path, there would be two loops
    // again by another name.
    const agent = personalAgent(CATALOG)
    assert.equal(agent.id, PERSONAL_AGENT_ID)
    assert.ok(agent.persona.length > 0, 'it needs a persona, like any agent')
    assert.ok(Array.isArray(agent.mcpServers))
    assert.equal(agent.enabled, true)
  })

  test('has NO non-human identity, which is the defining difference', () => {
    // It acts as the person using it. An nhi here would mean it acts as itself, with permissions the
    // person may not have — the confused deputy this design must not create.
    assert.equal(personalAgent(CATALOG).nhi, undefined)
  })

  test('its id is reserved, so a configured agent cannot impersonate it', () => {
    // A conversation names its agent by id. If a configured agent could be called `personal`, a thread
    // would resolve to the wrong identity.
    assert.equal(PERSONAL_AGENT_ID, 'personal')
  })

  test('its persona says it acts with the person\'s own permissions', () => {
    // Not decoration: the model has to know its ceiling, because the honest answer to a refused action
    // is to say so rather than to look for another route.
    assert.match(personalAgent(CATALOG).persona, /permissions/i)
  })

  test('it reaches every catalog entry, unfiltered', () => {
    // Narrowing here would be a second, weaker copy of an authorization decision that upstream already
    // makes — and it acts as the person, so their own permissions are already the ceiling.
    const agent = personalAgent(CATALOG)
    assert.deepEqual(agent.mcpServers, [{ serverId: 'dev-public-mcp' }, { serverId: 'dev-session-mcp' }])
    // Nothing filtered out, explicitly: a toolFilter here would be a weaker copy of an authorization
    // decision upstream already makes.
    assert.deepEqual(agent.mcpServers?.map(ref => ref.toolFilter), [undefined, undefined])
  })
})

test.describe('the session provider — the one port', () => {
  test('a forwarded session hands back the browser\'s own cookie', async () => {
    assert.equal(await forwardedSessionProvider('id_token=abc')(), 'id_token=abc')
  })

  test('no cookie means no session, not an error', async () => {
    // Anonymous is allowed on this socket, and a catalog entry that wants no session must still work.
    assert.equal(await forwardedSessionProvider(undefined)(), undefined)
  })

  test('the contract takes no arguments, which is what lets the tool path stay identical', async () => {
    // A SessionProvider is a zero-argument async function, so `forEachListedTool` calls it the same way
    // whichever kind of agent it has. The NHI implementation is not reachable from a unit test — it
    // imports the session cache and therefore `#config` — and is covered by every autonomous-agent api
    // test, all of which go through it.
    const forwarded = forwardedSessionProvider('id_token=abc')
    assert.equal(typeof forwarded, 'function')
    assert.equal(forwarded.length, 0)
  })

  test('the socket carries the cookie it was opened with', () => {
    // Taken from the upgrade request, the only moment it is available — a websocket frame has no
    // headers — and never from anything the client sends afterwards.
    const session = createAgentSession({ send: () => {}, sessionCookie: 'id_token=abc' })
    assert.equal(session.sessionCookie(), 'id_token=abc')
  })

  test('an anonymous socket carries none', () => {
    assert.equal(createAgentSession({ send: () => {} }).sessionCookie(), undefined)
  })
})
