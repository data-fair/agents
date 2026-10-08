/**
 * stateful API tests: reflection maintains memory from the stored conversation.
 *
 * The mock model's reflection seam records every `remember: <fact>` line of the transcript in
 * MEMORY.md (api/src/models/mock-model.ts).
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings, mockModels } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { decideOverSocketToRun, startTurnOverSocket, runOf } from '../../support/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const BASE = '/api/conversations/organization/test1'

const createAgent = async (memory = true, over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Reflective', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: memory }, ...over
  })).data
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
const messages = async (conversationId: string) => (await orgAdmin.get(`${BASE}/${conversationId}/messages`)).data.results
const reflect = async (conversationId: string, extra: any = {}) => (await admin.post('/api/test-env/reflect-conversation', { conversationId, ...extra })).data
const core = async (agentId: string) => (await orgAdmin.get(`/api/memory/organization/test1/${agentId}/document`, { params: { path: 'MEMORY.md' } }).catch(() => ({ data: undefined }))).data

test.describe('Memory reflection', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('learns from the stored conversation, attributed to the reflection', async () => {
    const agent = await createAgent()
    const conversationId = await say({ agentId: agent.id }, 'remember: the sales dataset is ventes')
    const result = await reflect(conversationId)
    assert.equal(result.reflected, true)
    assert.match((await core(agent.id)).content, /- the sales dataset is ventes/)
    const versions = (await orgAdmin.get(`/api/memory/organization/test1/${agent.id}/versions`)).data
    assert.deepEqual({ kind: versions.results[0].author.kind, conversationId: versions.results[0].author.conversationId, fromSeq: versions.results[0].author.fromSeq },
      { kind: 'reflection', conversationId, fromSeq: 1 })
    // the next run sees it
    await say(conversationId, 'hello')
    const review = (await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)).data
    assert.match(review.runs[review.runs.length - 1].systemPrompt, /the sales dataset is ventes/)
  })

  test('a range is reflected once', async () => {
    const agent = await createAgent()
    const conversationId = await say({ agentId: agent.id }, 'remember: x')
    assert.equal((await reflect(conversationId)).reflected, true)
    assert.deepEqual(await reflect(conversationId), { reflected: false, reason: 'nothing-new' })
  })

  test('memory off, or the agent deleted, means no reflection and nothing written', async () => {
    // Review Focus 5
    const off = await createAgent(false)
    const offThread = await say({ agentId: off.id }, 'remember: nope')
    assert.equal((await reflect(offThread)).reason, 'memory-off')

    const gone = await createAgent()
    const goneThread = await say({ agentId: gone.id }, 'remember: nope')
    await admin.delete(`/api/autonomous-agents/organization/test1/${gone.id}`)
    assert.equal((await reflect(goneThread)).reflected, false)
    const data = (await admin.get(`/api/test-env/autonomous-agent-data/${gone.id}`)).data
    assert.equal(data.memories, 0)
  })

  test('an agent deleted while its reflection is in flight gets nothing written after the cascade', async () => {
    const agent = await createAgent()
    // the seam holds the reflection's memory write back 1.5s
    const conversationId = await say({ agentId: agent.id }, 'remember: written too late. reflect slowly')
    const reflecting = reflect(conversationId)
    await new Promise(resolve => setTimeout(resolve, 300))
    await admin.delete(`/api/autonomous-agents/organization/test1/${agent.id}`)
    assert.deepEqual(await reflecting, { reflected: false, reason: 'memory-off' })
    const data = (await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data
    assert.equal(data.memories, 0)
    assert.equal(data.memoryVersions, 0)
  })

  test('a pass withdrawn after a model step still bills that step', async () => {
    await putMockSettings(admin, 'organization/test1', {
      models: mockModels({ inputPricePerMillion: 1000, outputPricePerMillion: 1000 }),
      modelMapping: { tools: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } }
    })
    const body = { title: 'Reflective', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true } }
    const agent = await createAgent()
    const conversationId = await say({ agentId: agent.id }, 'remember: billed anyway. reflect slowly')
    const reflecting = reflect(conversationId)
    await new Promise(resolve => setTimeout(resolve, 300))
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { ...body, memory: { enabled: false } })
    assert.deepEqual(await reflecting, { reflected: false, reason: 'memory-off' })
    const { conversation } = (await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)).data
    assert.ok(conversation.memoryReflection?.credits > 0, 'the step the model completed is billed')
    assert.equal(conversation.memoryReflection?.upToSeq, undefined, 'and nothing is marked reflected')
  })

  test('the idle sweep reflects a thread that went quiet, and only then', async () => {
    const agent = await createAgent()
    await say({ agentId: agent.id }, 'remember: idle fact')
    // Counts are global to the dev database, so what is asserted is THIS thread's memory.
    await admin.post('/api/test-env/sweep-reflections', {}) // still active
    assert.equal(await core(agent.id), undefined)
    const later = new Date(Date.now() + 31 * 60000).toISOString()
    assert.ok((await admin.post('/api/test-env/sweep-reflections', { now: later })).data.reflected >= 1)
    assert.match((await core(agent.id)).content, /idle fact/)
  })

  test('a long thread is reflected after the turn that crosses the threshold', async () => {
    const agent = await createAgent()
    const conversationId = await say({ agentId: agent.id }, 'remember: long thread fact')
    // 1 exchange = 2 messages; 10 exchanges reach REFLECT_EVERY_MESSAGES (20)
    for (let i = 0; i < 8; i++) await say(conversationId, 'hello')
    // one exchange short of the threshold: nothing yet
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal(await core(agent.id), undefined)
    await say(conversationId, 'hello')
    let content: string | undefined
    for (let i = 0; i < 50 && !content; i++) {
      content = (await core(agent.id))?.content
      if (!content) await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.match(content ?? '', /long thread fact/)
  })
})

test.describe('Memory reflection and the approval gate', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a thread stopped on an approval is reflected only up to before that message', async () => {
    const agent = await createAgent(true, { mcpServers: [{ serverId: 'dev-public-mcp' }] })
    const conversationId = await say({ agentId: agent.id }, 'remember: before the approval')
    await say(conversationId, 'call tool wipe_everything {}')
    const asking = (await messages(conversationId)).find((m: any) => m.role === 'assistant' &&
      m.parts.some((p: any) => p.type === 'dynamic-tool' && p.state === 'approval-requested'))
    assert.ok(asking, 'the turn stopped on an approval request')

    const result = await reflect(conversationId)
    assert.equal(result.reflected, true)
    assert.equal(result.toSeq, asking.seq - 1, 'the step whose result is still to come is not read')
    assert.match((await core(agent.id)).content, /before the approval/)
    // Nothing new until it is decided.
    assert.deepEqual(await reflect(conversationId), { reflected: false, reason: 'nothing-new' })

    const approvalId = asking.parts.find((p: any) => p.state === 'approval-requested').approval.id
    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, approvalId, { approved: true })
    await awaitRun(conversationId, runId)
    assert.deepEqual(fixture.invokedTools(), ['wipe_everything'])
    const after = await reflect(conversationId)
    assert.equal(after.reflected, true)
    assert.ok(after.toSeq >= asking.seq, 'once settled, the step is read')
  })

  test('threads blocked on an approval are deferred and do not starve a reflectable one', async () => {
    const agent = await createAgent(true, { mcpServers: [{ serverId: 'dev-public-mcp' }] })
    // The OLDEST activity, so the oldest-first sweep meets it first: blocked on an undecided approval,
    // everything before it already reflected.
    const blocked = await say({ agentId: agent.id }, 'call tool wipe_everything {}')
    assert.equal((await reflect(blocked)).toSeq, 1)
    await say({ agentId: agent.id }, 'remember: not starved')

    // One candidate per pass: the first pass meets the blocked thread and defers it…
    const later = new Date(Date.now() + 31 * 60000).toISOString()
    await admin.post('/api/test-env/sweep-reflections', { now: later, batch: 1 })
    const { conversation } = (await orgAdmin.get(`/api/review/organization/test1/${blocked}`)).data
    assert.ok(conversation.memoryReflection.deferredAt, 'the blocked thread is deferred')
    assert.equal(await core(agent.id), undefined)
    // …so the next pass skips it and reaches the reflectable one.
    await admin.post('/api/test-env/sweep-reflections', { now: later, batch: 1 })
    assert.match((await core(agent.id))?.content ?? '', /not starved/)
  })

  test('a task run is reflected once, at its end, attributed to the run and its task', async () => {
    const agent = await createAgent()
    const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
    const tasks = `/api/autonomous-agents/organization/test1/${agent.id}/tasks`
    const task = (await admin.post(tasks, { title: 'Weekly', prompt: 'remember: the weekly report goes to finance', scheduling: [daily] })).data
    const runId = (await admin.post(`${tasks}/${task.id}/run`)).data.runId as string
    let content = ''
    for (let i = 0; i < 100 && !content.includes('the weekly report goes to finance'); i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      content = (await core(agent.id))?.content ?? ''
    }
    assert.match(content, /- the weekly report goes to finance/)
    const versions = (await orgAdmin.get(`/api/memory/organization/test1/${agent.id}/versions`)).data
    const author = versions.results[0].author
    assert.deepEqual({ kind: author.kind, taskId: author.taskId, runId: author.runId }, { kind: 'reflection', taskId: task.id, runId })
    // the run records that it was reflected
    const run = (await orgAdmin.get(`/api/autonomous-agents/organization/test1/${agent.id}/runs/${runId}`)).data
    assert.ok(run.memoryReflection?.at)
  })
})
