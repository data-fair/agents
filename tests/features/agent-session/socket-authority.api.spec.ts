/**
 * stateful API tests: who may speak into a thread is checked on EVERY prompt, not only when the thread
 * was created, and the socket itself is refused to a page of another site.
 *
 * A thread lends its agent's identity, tools and the account's credits. Checking the grant only at
 * creation let an instructor removed from the agent's list (or an agent disabled since) keep driving it
 * from any thread they had opened before. Approvals already re-checked; prompts now do too.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import WebSocket from 'ws'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { turnOverSocket, startTurnOverSocket } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgMember = await axiosAuth('test1-user1', { org: 'test1' })

const AGENTS = '/api/autonomous-agents/organization/test1'
const agentBody = (over: any = {}) => ({ title: 'Authority probe', persona: 'You answer briefly.', mcpServers: [], enabled: true, ...over })
const instructedByMember = agentBody({ instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }] })

const userMessages = async (conversationId: string) =>
  (await admin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
    .filter((m: any) => m.role === 'user').length

test.describe('Authority over a thread', () => {
  test.beforeEach(async () => { await clean() })

  test('an instructor removed from the agent can no longer prompt the thread they opened', async () => {
    const agent = (await admin.post(AGENTS, instructedByMember)).data
    const { conversationId } = await turnOverSocket(orgMember, { agentId: agent.id }, 'hello')
    await admin.put(`${AGENTS}/${agent.id}`, agentBody())

    await assert.rejects(startTurnOverSocket(orgMember, conversationId, 'still there?'), (err: any) => {
      assert.equal(err.status, 403)
      assert.match(err.data, /instruct/i)
      return true
    })
    assert.equal(await userMessages(conversationId), 1, 'the refused prompt is not stored')
  })

  test('a disabled agent takes no new prompt on an existing thread', async () => {
    const agent = (await admin.post(AGENTS, instructedByMember)).data
    const { conversationId } = await turnOverSocket(orgMember, { agentId: agent.id }, 'hello')
    await admin.put(`${AGENTS}/${agent.id}`, { ...instructedByMember, enabled: false })

    await assert.rejects(startTurnOverSocket(orgMember, conversationId, 'still there?'), { status: 403 })
    assert.equal(await userMessages(conversationId), 1)
  })
})

test.describe('The agent-session upgrade', () => {
  /** Open the socket through nginx as a browser on `origin` would. Resolves to the handshake's status. */
  const upgradeFrom = async (origin: string) => {
    const ws = new WebSocket(`ws://localhost:${process.env.NGINX_PORT}/agents/api/agent-session`, {
      headers: { cookie: await orgMember.cookieJar.getCookieString(directoryUrl) },
      origin
    })
    return await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('the upgrade was left hanging')), 3000)
      ws.once('unexpected-response', (_req, res) => { clearTimeout(timer); resolve(res.statusCode ?? 0) })
      ws.once('open', () => { clearTimeout(timer); ws.close(); resolve(101) })
      ws.once('error', reject)
    })
  }

  test('a page of the same site opens it', async () => {
    assert.equal(await upgradeFrom(`http://localhost:${process.env.NGINX_PORT}`), 101)
  })

  test('a page of another site is refused at the handshake', async () => {
    assert.equal(await upgradeFrom('http://evil.localhost'), 403)
  })
})
