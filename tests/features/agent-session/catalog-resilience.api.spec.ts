/**
 * One unreachable catalog entry must not break the personal assistant.
 *
 * A finding from building the loop (§5b.2 of the prototype design). The personal assistant takes the
 * WHOLE catalog, unfiltered, because it acts as the person and their permissions are already the
 * ceiling. That makes every configured server a dependency of the assistant working at all — so a
 * single one being down took down the assistant for a server the person never chose.
 *
 * NO MCP FIXTURE IS STARTED HERE, deliberately. That leaves the dev catalog's fixture-backed entries
 * unreachable while the `dev-review-*` entries (served by `npm run dev-mcp`) are up, which is the
 * realistic mixed case and exactly the one that first failed.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

test.describe('An unreachable catalog entry', () => {
  const sockets: AgentSessionClient[] = []

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  test('is skipped for the personal assistant, and the turn still answers', async () => {
    const conversation = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', {
      autonomousAgentId: 'personal', title: 'personal'
    })).data

    const session = await openAgentSession(await cookieOf(orgAdmin))
    sockets.push(session)
    session.send({ type: 'hello', conversationId: conversation.id, tools: [] })
    assert.equal((await session.next()).type, 'attached')

    session.send({ type: 'prompt', content: 'hello' })
    const frames: any[] = []
    for (;;) {
      const frame = await session.next(15000)
      frames.push(frame)
      if (frame.type === 'turn-end') break
    }

    const end = frames[frames.length - 1]
    assert.equal(end.stopReason, 'completed', `the turn must survive an unreachable server, got ${JSON.stringify(end)}`)
    const text = frames.filter(f => f.type === 'delta' && f.kind === 'text').map(f => f.text).join('')
    assert.equal(text, 'world')
  })

  test('still FAILS a configured agent, because its selection was deliberate', async () => {
    // The other half of the decision. An admin chose these servers, so one being unreachable is a
    // misconfiguration and must say so — a toolless turn would read as a capability problem instead.
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Configured', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })

    const conv = (await orgAdmin.post('/api/autonomous-agent-conversations/organization/test1', { autonomousAgentId: agent.id, title: 't' })).data
    const { runId } = (await orgAdmin.post(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`, { content: 'hello' })).data

    let run
    for (let i = 0; i < 100; i++) {
      run = (await orgAdmin.get(`/api/autonomous-agent-runs/organization/test1/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.equal(run.status, 'error')
    const messages = (await orgAdmin.get(`/api/autonomous-agent-conversations/organization/test1/${conv.id}/messages`)).data.results
    const assistant = messages.find((m: any) => m.role === 'assistant')
    const text = assistant.parts.find((p: any) => p.type === 'text')?.text ?? ''
    assert.match(text, /dev-public-mcp/, 'it must name the server that failed, so an admin can fix it')
  })
})
