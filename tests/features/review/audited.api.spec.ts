/**
 * stateful API tests: conversations with a configured autonomous agent are never private.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { runTurn } from '../../support/turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const instructor = await axiosAuth('test1-user1', { org: 'test1' })

const createAgent = async () => (await admin.post('/api/autonomous-agents/organization/test1', {
  title: 'Audited',
  persona: 'x',
  mcpServers: [],
  enabled: true,
  instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }]
})).data

/** A thread with one exchange, by the instructor, WITHOUT any consent cookie. */
const instructorThread = async (agentId: string) =>
  (await runTurn(instructor, 'organization/test1', 'hello', { agentId })).conversationId

test.describe('Audited conversations', () => {
  test.beforeEach(async () => {
    await clean()
    // reviewPersonalAssistant deliberately OFF: an audited thread must not depend on it
    await putMockSettings(admin, 'organization/test1', { reviewPersonalAssistant: false })
  })

  test('an org admin reviews an instructor thread with no reviewPersonalAssistant and no consent', async () => {
    const agent = await createAgent()
    const conversationId = await instructorThread(agent.id)
    const list = await orgAdmin.get('/api/review/organization/test1')
    assert.equal(list.status, 200)
    assert.deepEqual(list.data.results.map((r: any) => r.conversationId), [conversationId])
    const read = await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)
    assert.equal(read.data.conversation.id, conversationId)
    const where = await orgAdmin.get(`/api/review/conversation/${conversationId}`)
    assert.deepEqual(where.data.owner, { type: 'organization', id: 'test1' })
  })

  test('a non-admin instructor cannot review, not even their own audited thread', async () => {
    const agent = await createAgent()
    await instructorThread(agent.id)
    await assert.rejects(instructor.get('/api/review/organization/test1'), { status: 403 })
  })

  test('the person deleting an audited thread archives it, and the archive sweep keeps it', async () => {
    const agent = await createAgent()
    const conversationId = await instructorThread(agent.id)
    await instructor.delete(`/api/conversations/organization/test1/${conversationId}`)
    // gone for them
    await assert.rejects(instructor.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`), { status: 404 })
    // still the organization's record, even after a sweep run far in the future
    await admin.post('/api/test-env/purge-expired-archives', { now: '2030-01-01T00:00:00.000Z' })
    const read = await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)
    assert.ok(read.data.conversation.archivedAt)
  })

  test('a personal-assistant thread stays consent-gated', async () => {
    // Review Focus 4: the audit change must not widen the personal assistant's privacy model.
    const { conversationId } = await runTurn(orgAdmin, 'organization/test1') // agentId 'personal'
    const list = await orgAdmin.get('/api/review/organization/test1')
    assert.equal(list.data.results.length, 0)
    await assert.rejects(orgAdmin.get(`/api/review/organization/test1/${conversationId}`), { status: 404 })
  })
})
