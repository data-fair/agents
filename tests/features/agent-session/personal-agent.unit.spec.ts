/**
 * stateless unit tests for the personal assistant as an agent, and for the socket's session cookie.
 *
 * The claim under test is the one the whole prototype rests on: a personal conversation and a
 * configured agent's conversation differ only in WHO the agent acts as. If anything else has to differ,
 * the loop cannot serve both and the collapse does not happen.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { personalAgent, PORTAL_ASSISTANT_ID, BACK_OFFICE_ASSISTANT_ID, PERSONAL_AGENT_IDS, isPersonalAgentId } from '../../../api/src/agent-session/personal-agent.ts'
import { isAuditedAgentId } from '../../../shared/agent-audit.ts'
import { assertPersonalAssistantsConfig } from '../../../api/src/mcp-servers/operations.ts'
import { createAgentSession } from '../../../api/src/agent-session/session.ts'

/** The assistants' servers, passed in rather than read from config — which is what keeps this unit testable. */
const ASSISTANTS = {
  portal: { mcpServers: [{ serverId: 'data-fair-catalog' }] },
  backOffice: { mcpServers: [{ serverId: 'data-fair-catalog' }, { serverId: 'data-fair-write', toolFilter: ['postDataset'] }] }
}
const portal = () => personalAgent(PORTAL_ASSISTANT_ID, ASSISTANTS)!

test.describe('the personal assistant', () => {
  test('the persona does NOT restate the permission ceiling, which the prompt adds once', () => {
    // buildSystemPrompt states the ceiling for any agent without an NHI (asserted in the runtime spec),
    // derived from the identity rather than from a sentence the persona has to remember. A persona
    // carrying its own copy put two near-identical sentences in consecutive paragraphs of the real prompt.
    assert.doesNotMatch(portal().persona, /permissions|never more|not permitted/i)
  })

  test('is shaped like any other agent the tool gatherer accepts', () => {
    // The structural claim. If this needed its own branch in the tool path, there would be two loops
    // again by another name.
    const agent = portal()
    assert.equal(agent.id, PORTAL_ASSISTANT_ID)
    assert.ok(agent.persona.length > 0, 'it needs a persona, like any agent')
    assert.ok(Array.isArray(agent.mcpServers))
    assert.equal(agent.enabled, true)
  })

  test('it has NO non-human identity, which is the defining difference', () => {
    // It acts as the person using it. An nhi here would mean it acts as itself, with permissions the
    // person may not have — the confused deputy this design must not create.
    assert.equal(portal().nhi, undefined)
  })

  test('two of them, their ids reserved, so a configured agent cannot impersonate one', () => {
    // A conversation names its agent by id. If a configured agent could take one of these, a thread
    // would resolve to the wrong identity.
    assert.deepEqual(PERSONAL_AGENT_IDS, ['portal-assistant', 'back-office-assistant'])
    assert.ok(isPersonalAgentId(PORTAL_ASSISTANT_ID) && isPersonalAgentId(BACK_OFFICE_ASSISTANT_ID))
    assert.ok(!isPersonalAgentId('personal') && !isPersonalAgentId('some-configured-agent'))
    assert.equal(personalAgent('some-configured-agent', ASSISTANTS), undefined)
  })

  test('each gets the servers the deployment configured for it, and nothing else of the catalog', () => {
    // The catalog is shared with configured agents, which need write profiles: taking all of it gave the
    // assistant every tool an operator added for an autonomous agent.
    assert.deepEqual(portal().mcpServers, [{ serverId: 'data-fair-catalog' }])
    assert.deepEqual(personalAgent(BACK_OFFICE_ASSISTANT_ID, ASSISTANTS)!.mcpServers, ASSISTANTS.backOffice.mcpServers)
  })

  test('unconfigured, an assistant has no catalog servers at all', () => {
    assert.deepEqual(personalAgent(PORTAL_ASSISTANT_ID, {})!.mcpServers, [])
  })

  test('neither assistant\'s conversations are audited; a configured agent\'s are', () => {
    assert.ok(!isAuditedAgentId(PORTAL_ASSISTANT_ID) && !isAuditedAgentId(BACK_OFFICE_ASSISTANT_ID))
    assert.ok(isAuditedAgentId('some-configured-agent'))
  })

  test('the boot refuses an assistant naming a server the catalog does not have', () => {
    const catalog = [{ id: 'data-fair-catalog' }, { id: 'data-fair-write' }]
    assertPersonalAssistantsConfig(ASSISTANTS, catalog)
    assert.throws(() => assertPersonalAssistantsConfig({ portal: { mcpServers: [{ serverId: 'typo' }] } }, catalog), /personal assistant "portal".*unknown MCP server "typo"/)
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
