/**
 * stateful API tests: consolidation tidies an agent's memory from what people said since its last pass.
 *
 * The mock model's consolidation seam records every `remember: <fact>` line of the conversations it is
 * given in MEMORY.md (api/src/models/mock-model.ts).
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings, mockModels } from '../../support/settings.ts'
import { startTurnOverSocket, runOf } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const body = { title: 'Consolidating', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true } }
const createAgent = async (memory = true) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', { ...body, memory: { enabled: memory } })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const awaitRun = async (conversationId: string, runId: string) => {
  for (let i = 0; i < 100; i++) {
    if ((await runOf(orgAdmin, conversationId, runId)).status !== 'running') return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}
/** A turn, waited for: the first of a new thread with an agent, or one in an existing thread. Returns the thread. */
const say = async (target: string | { agentId: string }, content: string) => {
  const { runId, conversationId } = await startTurnOverSocket(orgAdmin, target, content)
  await awaitRun(conversationId, runId)
  return conversationId
}
const consolidate = async (agentId: string, extra: any = {}) => (await admin.post('/api/test-env/consolidate-memory', { agentId, ...extra })).data
const sweep = async (now?: string) => (await admin.post('/api/test-env/sweep-consolidations', now ? { now } : {})).data.consolidated as number
const core = async (agentId: string) => (await orgAdmin.get(`/api/memory/organization/test1/${agentId}/document`, { params: { path: 'MEMORY.md' } }).catch(() => ({ data: undefined }))).data
const agentDoc = async (agentId: string) => (await admin.get(`/api/autonomous-agents/organization/test1/${agentId}`)).data
const inHours = (h: number) => new Date(Date.now() + h * 3600000).toISOString()

test.describe('Memory consolidation', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('records what a person asked to remember, attributed to the consolidation, and the next run sees it', async () => {
    const agent = await createAgent()
    const conversationId = await say({ agentId: agent.id }, 'remember: the sales dataset is ventes')
    assert.deepEqual(await consolidate(agent.id), { consolidated: true, reason: 'done' })
    assert.match((await core(agent.id)).content, /- the sales dataset is ventes/)
    const author = (await orgAdmin.get(`/api/memory/organization/test1/${agent.id}/versions`)).data.results[0].author
    assert.equal(author.kind, 'consolidation')
    assert.ok(author.since < author.until)
    assert.equal((await agentDoc(agent.id)).memoryConsolidation.until, author.until)
    await say(conversationId, 'hello')
    const review = (await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)).data
    assert.match(review.runs[review.runs.length - 1].systemPrompt, /the sales dataset is ventes/)
  })

  test('a pass reads only what is new since the previous one', async () => {
    const agent = await createAgent()
    const conversationId = await say({ agentId: agent.id }, 'remember: first')
    assert.equal((await consolidate(agent.id)).consolidated, true)
    assert.deepEqual(await consolidate(agent.id), { consolidated: false, reason: 'nothing-new' })
    await say(conversationId, 'remember: second')
    assert.equal((await consolidate(agent.id)).consolidated, true)
    // the seam rewrites MEMORY.md with the facts it was given: only the new one this time
    const content = (await core(agent.id)).content
    assert.match(content, /- second/)
    assert.doesNotMatch(content, /- first/)
  })

  test('the sweep consolidates at most once a day, and only after activity', async () => {
    const agent = await createAgent()
    const conversationId = await say({ agentId: agent.id }, 'remember: daily fact')
    assert.ok(await sweep() >= 1)
    assert.match((await core(agent.id)).content, /daily fact/)
    const at = (await agentDoc(agent.id)).memoryConsolidation.at
    await say(conversationId, 'remember: later fact')
    await sweep(inHours(2))
    assert.equal((await agentDoc(agent.id)).memoryConsolidation.at, at, 'not twice the same day')
    await sweep(inHours(25))
    assert.match((await core(agent.id)).content, /later fact/)
  })

  test('a planned task run is tidied after, but not read: memory from a run is the agent\'s own write', async () => {
    const agent = await createAgent()
    const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
    const tasks = `/api/autonomous-agents/organization/test1/${agent.id}/tasks`
    const task = (await admin.post(tasks, { title: 'Weekly', prompt: 'remember: the weekly report goes to finance', scheduling: [daily] })).data
    const runId = (await admin.post(`${tasks}/${task.id}/run`)).data.runId as string
    for (let i = 0; i < 100; i++) {
      const run = (await orgAdmin.get(`/api/autonomous-agents/organization/test1/${agent.id}/runs/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.deepEqual(await consolidate(agent.id), { consolidated: true, reason: 'done' })
    assert.equal(await core(agent.id), undefined, 'the task prompt was not read')
  })

  test('memory off, or the agent deleted, means no pass and nothing written', async () => {
    const off = await createAgent(false)
    await say({ agentId: off.id }, 'remember: nope')
    assert.equal((await consolidate(off.id)).reason, 'memory-off')

    const gone = await createAgent()
    await say({ agentId: gone.id }, 'remember: nope')
    await admin.delete(`/api/autonomous-agents/organization/test1/${gone.id}`)
    assert.equal((await consolidate(gone.id)).consolidated, false)
    assert.equal((await admin.get(`/api/test-env/autonomous-agent-data/${gone.id}`)).data.memories, 0)
  })

  test('an agent deleted while its consolidation is in flight gets nothing written after the cascade', async () => {
    const agent = await createAgent()
    // the seam holds the memory write back 1.5s
    await say({ agentId: agent.id }, 'remember: written too late. consolidate slowly')
    const consolidating = consolidate(agent.id)
    await new Promise(resolve => setTimeout(resolve, 300))
    await admin.delete(`/api/autonomous-agents/organization/test1/${agent.id}`)
    assert.deepEqual(await consolidating, { consolidated: false, reason: 'memory-off' })
    const data = (await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data
    assert.equal(data.memories, 0)
    assert.equal(data.memoryVersions, 0)
  })

  test('a pass withdrawn after a model step still bills that step, and moves nothing on', async () => {
    await putMockSettings(admin, 'organization/test1', {
      models: mockModels({ inputPricePerMillion: 1000, outputPricePerMillion: 1000 }),
      modelMapping: { tools: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } }
    })
    const agent = await createAgent()
    await say({ agentId: agent.id }, 'remember: billed anyway. consolidate slowly')
    const spent = async () => (await admin.get('/api/usage/organization/test1')).data.daily.cost as number
    const before = await spent()
    const consolidating = consolidate(agent.id)
    await new Promise(resolve => setTimeout(resolve, 300))
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { ...body, memory: { enabled: false } })
    assert.deepEqual(await consolidating, { consolidated: false, reason: 'memory-off' })
    assert.ok(await spent() > before, 'the step the model completed is billed')
    assert.equal((await agentDoc(agent.id)).memoryConsolidation?.until, undefined, 'and nothing is marked read')
  })
})
