/**
 * stateful API tests of web access as wired into autonomous agents: configuration, which tools each
 * person is offered, the allowlist inside a real turn, and extending it through an approval.
 * No request leaves the machine: a refused URL is refused before any network access, and fetching
 * itself is covered by web-access.unit.spec.ts against a local server.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { decideOverSocketToRun, runOf, turnOverSocket } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const instructor = await axiosAuth('test1-user1', { org: 'test1' })
const AGENTS = '/api/autonomous-agents/organization/test1'

const turn = async (ax: typeof orgAdmin, target: string | { agentId: string }, content: string) => {
  const { runId, conversationId, run, messages } = await turnOverSocket(ax, target, content)
  return { conversationId, run, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
}

const callPart = (message: any, toolName: string) =>
  message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)

const awaitRun = async (conversationId: string, runId: string) => {
  for (let i = 0; i < 120; i++) {
    const run = await runOf(orgAdmin, conversationId, runId)
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post(AGENTS, {
    title: 'Web probe',
    persona: 'You answer briefly.',
    mcpServers: [],
    enabled: true,
    web: { enabled: true, allowedUrls: ['github.com/data-fair'] },
    instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }],
    ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

const offeredTools = (run: any): string[] => run.calls.flatMap((c: any) => c.toolNames ?? [])

test.describe('Web access of autonomous agents', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('the allowlist is stored as it is enforced, and an invalid entry is refused', async () => {
    const agent = await createAgent({ web: { enabled: true, allowedUrls: ['GitHub.com/data-fair', 'https://www.data.gouv.fr', 'github.com/data-fair'] } })
    assert.deepEqual(agent.web.allowedUrls, ['https://github.com/data-fair', 'https://www.data.gouv.fr/'])
    await assert.rejects(admin.post(AGENTS, {
      title: 'Bad', persona: 'p', mcpServers: [], enabled: true, web: { enabled: true, allowedUrls: ['*.example.com'] }
    }), (err: any) => err.status === 400 && /web.allowedUrls: .*no wildcards/.test(err.data))
  })

  test('an admin is offered the readers and the request; an instructor only the readers; without web, neither', async () => {
    const agent = await createAgent()
    const asAdmin = await turn(orgAdmin, { agentId: agent.id }, 'hello')
    assert.ok(['fetch_url', 'list_site_pages', 'request_web_access'].every(name => offeredTools(asAdmin.run).includes(name)), offeredTools(asAdmin.run).join())

    const asInstructor = await turn(instructor, { agentId: agent.id }, 'hello')
    assert.ok(offeredTools(asInstructor.run).includes('fetch_url'))
    assert.ok(!offeredTools(asInstructor.run).includes('request_web_access'), 'only an admin can approve it, so only an admin is offered it')

    const offline = await createAgent({ web: { enabled: false, allowedUrls: ['github.com/data-fair'] } })
    const without = await turn(orgAdmin, { agentId: offline.id }, 'hello')
    assert.ok(!offeredTools(without.run).some(name => ['fetch_url', 'list_site_pages', 'request_web_access'].includes(name)))
  })

  test('a URL outside the allowlist is refused, and the model is told which URLs are allowed', async () => {
    const agent = await createAgent()
    const { assistant } = await turn(orgAdmin, { agentId: agent.id }, 'call tool fetch_url {"url":"https://github.com/other-org/repo"}')
    const part = callPart(assistant, 'fetch_url')
    assert.equal(part.state, 'output-error', JSON.stringify(part))
    assert.match(part.errorText, /is not under this agent's allowed URLs \(https:\/\/github.com\/data-fair\)/)
    assert.equal(part.toolMetadata.serverId, 'agent-web', 'recorded as the service web access, like a catalog call names its server')
  })

  test('the agent asks for more, an admin approves, the allowlist is extended', async () => {
    const agent = await createAgent()
    const { assistant, conversationId, run } = await turn(orgAdmin, { agentId: agent.id }, 'call tool request_web_access {"add":["docs.koumoul.com"],"reason":"the user guides"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    const part = callPart(assistant, 'request_web_access')
    assert.equal(part.state, 'approval-requested')
    assert.deepEqual((await admin.get(`${AGENTS}/${agent.id}`)).data.web.allowedUrls, ['https://github.com/data-fair'], 'nothing changes before the decision')

    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, part.approval.id, { approved: true })
    const continuation = await awaitRun(conversationId, runId)
    assert.equal(continuation.trigger, 'approval')
    assert.deepEqual((await admin.get(`${AGENTS}/${agent.id}`)).data.web.allowedUrls, ['https://github.com/data-fair', 'https://docs.koumoul.com/'])
  })
})
