/**
 * stateless unit tests for the personal assistant as an agent, and for the one port this design keeps.
 *
 * The claim under test is the one the whole prototype rests on: a personal conversation and a
 * configured agent's conversation differ only in WHO the agent acts as. If anything else has to differ,
 * the loop cannot serve both and the collapse does not happen.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { standardAgent, isStandardAgentId, STANDARD_AGENTS, PERSONAL_AGENT_ID } from '../../../api/src/agent-session/standard-agents.ts'
import { forwardedSessionProvider } from '../../../api/src/agent-identity/operations.ts'
import { createAgentSession } from '../../../api/src/agent-session/session.ts'

/** A catalog, passed in rather than read from config — which is what keeps this unit testable. */
const CATALOG = [{ id: 'dev-public-mcp' }, { id: 'dev-session-mcp' }]

test.describe('standard agents', () => {
  test('an unknown id is not a standard agent', () => {
    // What makes the registry the gate: a conversation naming something else falls through to the
    // store, and a configured agent cannot shadow a standard id because the registry is checked first.
    assert.equal(standardAgent('not-a-standard-agent', CATALOG), undefined)
    assert.equal(isStandardAgentId('not-a-standard-agent'), false)
    assert.equal(isStandardAgentId(PERSONAL_AGENT_ID), true)
  })

  test('every standard agent has a persona and no identity of its own', () => {
    const ids = Object.keys(STANDARD_AGENTS)
    assert.ok(ids.length >= 1)
    for (const id of ids) {
      const agent = standardAgent(id, CATALOG)!
      assert.ok(agent.persona.length > 0, `${id} needs a persona`)
      assert.equal(agent.nhi, undefined, `${id} must act as the person, not as itself`)
    }
  })

  test('a persona does NOT restate the permission ceiling, which the prompt adds once', () => {
    // The ceiling still has to be stated — the model needs to know it, because the honest answer to a
    // refused action is to say so rather than to look for another route. It is stated by
    // buildSystemPrompt for any agent without an NHI (asserted in the runtime spec), which is derived
    // from the identity rather than from a sentence each persona has to remember.
    //
    // This asserts the ABSENCE because the two together are what went wrong: a persona carrying its
    // own copy put two near-identical sentences in consecutive paragraphs of the real prompt.
    for (const id of Object.keys(STANDARD_AGENTS)) {
      assert.doesNotMatch(
        standardAgent(id, CATALOG)!.persona,
        /permissions|never more|not permitted/i,
        `${id} must not duplicate the permission clause the prompt already adds`
      )
    }
  })

  test('is shaped like any other agent the tool gatherer accepts', () => {
    // The structural claim. If this needed its own branch in the tool path, there would be two loops
    // again by another name.
    const agent = standardAgent(PERSONAL_AGENT_ID, CATALOG)!
    assert.equal(agent.id, PERSONAL_AGENT_ID)
    assert.ok(agent.persona.length > 0, 'it needs a persona, like any agent')
    assert.ok(Array.isArray(agent.mcpServers))
    assert.equal(agent.enabled, true)
  })

  test('the default agent has NO non-human identity, which is the defining difference', () => {
    // It acts as the person using it. An nhi here would mean it acts as itself, with permissions the
    // person may not have — the confused deputy this design must not create.
    assert.equal(standardAgent(PERSONAL_AGENT_ID, CATALOG)!.nhi, undefined)
  })

  test('its id is reserved, so a configured agent cannot impersonate it', () => {
    // A conversation names its agent by id. If a configured agent could be called `personal`, a thread
    // would resolve to the wrong identity.
    assert.equal(PERSONAL_AGENT_ID, 'personal')
  })

  test('it reaches every catalog entry, unfiltered', () => {
    // Narrowing here would be a second, weaker copy of an authorization decision that upstream already
    // makes — and it acts as the person, so their own permissions are already the ceiling.
    const agent = standardAgent(PERSONAL_AGENT_ID, CATALOG)!
    assert.deepEqual(agent.mcpServers, [{ serverId: 'dev-public-mcp' }, { serverId: 'dev-session-mcp' }])
    // Nothing filtered out, explicitly: a toolFilter here would be a weaker copy of an authorization
    // decision upstream already makes.
    assert.deepEqual(agent.mcpServers?.map((ref: { toolFilter?: string[] }) => ref.toolFilter), [undefined, undefined])
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
