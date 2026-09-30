/**
 * stateless unit tests for the autonomous agent edit body
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { autonomousAgentEditDraft, AUTONOMOUS_AGENT_WRITABLE_KEYS } from '../../../ui/src/utils/autonomous-agent-draft.ts'
import writeReqSchema from '../../../api/doc/autonomous-agents/autonomous-agent-write-req/schema.js'

test.describe('AUTONOMOUS_AGENT_WRITABLE_KEYS', () => {
  test('covers every property the write-req schema accepts', () => {
    // The guard that matters: the PUT route treats its body as the WHOLE writable document and resets
    // anything absent. Add a property to the schema without adding it here and the next edit silently
    // wipes it — so this test fails instead.
    assert.deepEqual(
      [...AUTONOMOUS_AGENT_WRITABLE_KEYS].sort(),
      Object.keys(writeReqSchema.properties).sort()
    )
  })
})

test.describe('autonomousAgentEditDraft', () => {
  const stored = {
    id: 'a1',
    owner: { type: 'organization', id: 'test1' },
    title: 'Support triage',
    persona: 'You triage.',
    instructions: 'In French.',
    mcpServers: [{ serverId: 'dev-public-mcp' }],
    enabled: true,
    instructors: [{ userId: 'u1' }],
    nhi: { clientId: 'client-1', siteUrl: 'https://example.test/agents', issuer: 'https://example.test/agents/api/nhi' },
    createdAt: '2026-09-28T10:00:00Z'
  }

  test('carries the enrolment, so an edit does not un-enrol the agent', () => {
    assert.deepEqual(autonomousAgentEditDraft(stored).nhi, { clientId: 'client-1' })
  })

  test('sends only the writable half of nhi', () => {
    // siteUrl and issuer are derived by the server from the request that enrolled the agent.
    const draft = autonomousAgentEditDraft(stored)
    assert.equal('siteUrl' in draft.nhi, false)
    assert.equal('issuer' in draft.nhi, false)
  })

  test('omits nhi entirely when the agent was never enrolled', () => {
    const { nhi, ...unenrolled } = stored
    assert.equal('nhi' in autonomousAgentEditDraft(unenrolled), false)
  })

  test('never sends a server-owned field back', () => {
    const draft = autonomousAgentEditDraft(stored)
    for (const key of ['id', 'owner', 'createdAt', 'updatedAt']) {
      assert.equal(key in draft, false, `${key} is the server's, not the form's`)
    }
  })

  test('preserves every writable value it was given', () => {
    const draft = autonomousAgentEditDraft(stored)
    assert.equal(draft.title, 'Support triage')
    assert.equal(draft.enabled, true)
    assert.deepEqual(draft.instructors, [{ userId: 'u1' }])
    assert.deepEqual(draft.mcpServers, [{ serverId: 'dev-public-mcp' }])
    assert.equal(draft.instructions, 'In French.')
  })

  test('gives vjsf an array to add to when the agent has no MCP server', () => {
    const { mcpServers, ...none } = stored
    assert.deepEqual(autonomousAgentEditDraft(none).mcpServers, [])
  })
})
