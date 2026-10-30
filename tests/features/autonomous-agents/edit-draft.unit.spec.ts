/**
 * stateless unit tests for the autonomous agent edit body
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { autonomousAgentEditDraft } from '../../../ui/src/utils/autonomous-agent-draft.ts'

test.describe('autonomousAgentEditDraft', () => {
  const stored = {
    id: 'a1',
    owner: { type: 'organization', id: 'test1' },
    title: 'Support triage',
    persona: 'You triage.',
    instructions: 'In French.',
    mcpServers: [{ serverId: 'dev-public-mcp' }],
    enabled: true,
    instructors: [{ mode: 'member', type: 'user', id: 'u1' }],
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
    assert.deepEqual(draft.instructors, [{ mode: 'member', type: 'user', id: 'u1' }])
    assert.deepEqual(draft.mcpServers, [{ serverId: 'dev-public-mcp' }])
    assert.equal(draft.instructions, 'In French.')
  })

  test('fills the defaults the form materializes, so an unedited agent reads as unchanged', () => {
    // An agent created through the API is stored without them, and vjsf adds exactly these on load:
    // a draft without them made the page report an unsaved change on a page merely opened.
    const { instructors, ...thin } = stored
    const draft = autonomousAgentEditDraft(thin)
    assert.deepEqual(draft.instructors, [])
    assert.equal(draft.approvalLevel, 'destructive')
    assert.equal(draft.role, 'user')
    assert.deepEqual(draft.memory, { enabled: false })
    // not allowedUrls: it is hidden while web access is off, and vjsf leaves it out
    assert.deepEqual(draft.web, { enabled: false })
    assert.deepEqual(draft.externalMcpServers, [])
  })

  test('keeps a stored value over its default, per setting', () => {
    const draft = autonomousAgentEditDraft({
      ...stored,
      approvalLevel: 'write',
      memory: { enabled: true },
      web: { enabled: true, allowedUrls: ['https://github.com/data-fair'] }
    })
    assert.equal(draft.approvalLevel, 'write')
    assert.deepEqual(draft.memory, { enabled: true })
    assert.deepEqual(draft.web, { enabled: true, allowedUrls: ['https://github.com/data-fair'] })
  })

  test('keeps a stored role over the default', () => {
    assert.equal(autonomousAgentEditDraft({ ...stored, role: 'contrib' }).role, 'contrib')
  })

  test('treats empty instructions as absent, as the form does', () => {
    // vjsf drops an empty string from its model: a draft keeping '' read as a permanent unsaved change, and
    // the leave guard then swallowed every navigation away from the page.
    assert.equal('instructions' in autonomousAgentEditDraft({ ...stored, instructions: '' }), false)
  })

  test('gives vjsf an array to add to when the agent has no MCP server', () => {
    const { mcpServers, ...none } = stored
    assert.deepEqual(autonomousAgentEditDraft(none).mcpServers, [])
  })
})
