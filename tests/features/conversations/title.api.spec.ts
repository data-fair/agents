/**
 * stateful API tests: a conversation is titled from its first exchange, once.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const conversationOf = async (conversationId: string) => (await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)).data.conversation
const titled = async (conversationId: string) => {
  for (let i = 0; i < 50; i++) {
    const conversation = await conversationOf(conversationId)
    if (conversation.titledAt && conversation.title !== 'New conversation') return conversation
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('never titled')
}

test.describe('Conversation titles', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('the first exchange titles the conversation, and a later turn keeps that title', async () => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Titled', persona: 'x', mcpServers: [], enabled: true })).data
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'road closures in the city centre')
    const first = await titled(conversationId)
    assert.ok(first.title.length > 0 && first.title.length <= 80, first.title)
    await turnOverSocket(orgAdmin, conversationId, 'hello')
    await new Promise(resolve => setTimeout(resolve, 300))
    const later = await conversationOf(conversationId)
    assert.equal(later.titledAt, first.titledAt)
    assert.equal(later.title, first.title)
  })
})
