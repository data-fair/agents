/**
 * stateless unit tests for the personal assistant as an agent, and for the socket's session cookie.
 *
 * The claim under test is the one the whole prototype rests on: a personal conversation and a
 * configured agent's conversation differ only in WHO the agent acts as. If anything else has to differ,
 * the loop cannot serve both and the collapse does not happen.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { personalAgent, isStandardAgentId, PERSONAL_AGENT_ID } from '../../../api/src/agent-session/standard-agents.ts'
import { createAgentSession } from '../../../api/src/agent-session/session.ts'

/** A catalog, passed in rather than read from config — which is what keeps this unit testable. */
const CATALOG = [{ id: 'dev-public-mcp' }, { id: 'dev-session-mcp' }]

test.describe('standard agents', () => {
  test('an unknown id is not a standard agent', () => {
    // What makes the id the gate: a conversation naming something else falls through to the store,
    // and a configured agent cannot shadow the personal id because it is checked first.
    assert.equal(isStandardAgentId('not-a-standard-agent'), false)
    assert.equal(isStandardAgentId(PERSONAL_AGENT_ID), true)
  })

  test('the persona does NOT restate the permission ceiling, which the prompt adds once', () => {
    // buildSystemPrompt states the ceiling for any agent without an NHI (asserted in the runtime spec),
    // derived from the identity rather than from a sentence the persona has to remember. A persona
    // carrying its own copy put two near-identical sentences in consecutive paragraphs of the real prompt.
    assert.doesNotMatch(personalAgent(CATALOG).persona, /permissions|never more|not permitted/i)
  })

  test('is shaped like any other agent the tool gatherer accepts', () => {
    // The structural claim. If this needed its own branch in the tool path, there would be two loops
    // again by another name.
    const agent = personalAgent(CATALOG)!
    assert.equal(agent.id, PERSONAL_AGENT_ID)
    assert.ok(agent.persona.length > 0, 'it needs a persona, like any agent')
    assert.ok(Array.isArray(agent.mcpServers))
    assert.equal(agent.enabled, true)
  })

  test('the default agent has NO non-human identity, which is the defining difference', () => {
    // It acts as the person using it. An nhi here would mean it acts as itself, with permissions the
    // person may not have — the confused deputy this design must not create.
    assert.equal(personalAgent(CATALOG)!.nhi, undefined)
  })

  test('its id is reserved, so a configured agent cannot impersonate it', () => {
    // A conversation names its agent by id. If a configured agent could be called `personal`, a thread
    // would resolve to the wrong identity.
    assert.equal(PERSONAL_AGENT_ID, 'personal')
  })

  test('it reaches every catalog entry, unfiltered', () => {
    // Narrowing here would be a second, weaker copy of an authorization decision that upstream already
    // makes — and it acts as the person, so their own permissions are already the ceiling.
    const agent = personalAgent(CATALOG)!
    assert.deepEqual(agent.mcpServers, [{ serverId: 'dev-public-mcp' }, { serverId: 'dev-session-mcp' }])
    // Nothing filtered out, explicitly: a toolFilter here would be a weaker copy of an authorization
    // decision upstream already makes.
    assert.deepEqual(agent.mcpServers?.map((ref: { toolFilter?: string[] }) => ref.toolFilter), [undefined, undefined])
  })
})

test.describe('the session cookie', () => {
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
