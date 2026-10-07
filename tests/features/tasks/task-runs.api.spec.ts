/**
 * stateful API tests: a task run is one unattended turn, recorded on the run.
 * Whether a tool ran is read from the MCP fixture's own record of calls.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const base = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Tasker', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const createTask = async (agentId: string, prompt: string) =>
  (await admin.post(base(agentId), { title: 'Probe', prompt, scheduling: [daily] })).data
const runNow = async (agentId: string, taskId: string) =>
  (await admin.post(`${base(agentId)}/${taskId}/run`)).data.runId as string
const awaitRun = async (runId: string) => {
  for (let i = 0; i < 150; i++) {
    const run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}
const events = async () => (await admin.get('/api/test-env/pushed-events')).data as any[]

test.describe('Task runs', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await admin.delete('/api/test-env/pushed-events')
    await putMockSettings(admin, 'organization/test1')
  })

  test('run now: one turn on the task prompt, recorded on the run, outcome reported', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'call tool report_outcome {"status":"done","summary":"all good"}')
    const run = await awaitRun(await runNow(agent.id, task.id))
    assert.equal(run.kind, 'task')
    assert.equal(run.trigger, 'manual')
    assert.equal(run.status, 'done')
    assert.equal(run.prompt, task.prompt)
    assert.deepEqual(run.outcome, { status: 'done', summary: 'all good' })
    assert.ok(run.parts.some((p: any) => p.type === 'dynamic-tool' && p.toolName === 'report_outcome'))
    assert.match(run.systemPrompt, /scheduled execution/)
  })

  test('no report_outcome leaves the outcome absent, not a guessed done', async () => {
    const agent = await createAgent()
    const run = await awaitRun(await runNow(agent.id, (await createTask(agent.id, 'hello')).id))
    assert.equal(run.status, 'done')
    assert.equal(run.outcome, undefined)
  })

  test('a tool needing approval is not offered, and never runs', async () => {
    const agent = await createAgent()
    const run = await awaitRun(await runNow(agent.id, (await createTask(agent.id, 'call tool wipe_everything {}')).id))
    const part = run.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'wipe_everything')
    assert.notEqual(part?.state, 'output-available')
    assert.deepEqual(fixture.invokedTools(), [])
    // REMOVED, not gated: a gated call would end the turn on an approval nobody can give (recorded as an
    // error), and the tool would show among those offered.
    assert.equal(run.status, 'done')
    const offered = run.calls.flatMap((call: any) => call.toolNames ?? [])
    assert.ok(offered.includes('echo'), 'the telemetry lists the tools offered')
    assert.ok(!offered.includes('wipe_everything'))
  })

  test('an allowed catalog tool runs', async () => {
    const agent = await createAgent()
    await awaitRun(await runNow(agent.id, (await createTask(agent.id, 'call tool echo {"value":"x"}')).id))
    assert.deepEqual(fixture.invokedTools(), ['echo'])
  })

  test('run now is refused while a run is going, and on a disabled agent', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'slow hello')
    const runId = await runNow(agent.id, task.id)
    await assert.rejects(admin.post(`${base(agent.id)}/${task.id}/run`), { status: 409 })
    await awaitRun(runId)
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: 'Tasker', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: false })
    await assert.rejects(admin.post(`${base(agent.id)}/${task.id}/run`), { status: 409 })
  })

  test('an admin aborts a running task run', async () => {
    const agent = await createAgent()
    const runId = await runNow(agent.id, (await createTask(agent.id, 'stall')).id)
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal((await orgAdmin.post(`/api/runs/organization/test1/${runId}/abort`)).data.aborted, true)
    const run = await awaitRun(runId)
    assert.equal(run.status, 'aborted')
  })

  test('a start that finds the task locked records a skipped run, and run now is refused', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'hello')
    await admin.post('/api/test-env/lock-task', { taskId: task.id })
    try {
      await assert.rejects(admin.post(`${base(agent.id)}/${task.id}/run`), { status: 409 })
    } finally {
      await admin.post('/api/test-env/unlock-task', { taskId: task.id })
    }
    // The skipped run is recorded, closed (nothing left running to recover), and not a failure.
    assert.equal((await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data.runs, 1)
    const recovered = (await admin.post('/api/test-env/recover-ownerless-runs')).data
    assert.equal(recovered.interrupted, 0)
    assert.deepEqual(await events(), [])
  })

  test('a task run interrupted by recovery notifies as a failure', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'hello')
    await admin.post('/api/test-env/task-run', { agentId: agent.id, taskId: task.id, status: 'running' })
    await admin.post('/api/test-env/recover-ownerless-runs')
    assert.ok((await events()).some(e => e.topic.key === `agents:task-failed:${task.id}` && /interrupted by a restart/.test(e.body)))
  })

  test('needs-attention and failures notify; five failures in a row pause the task', async () => {
    const agent = await createAgent()
    const attention = await createTask(agent.id, 'call tool report_outcome {"status":"needs-attention","summary":"look"}')
    await awaitRun(await runNow(agent.id, attention.id))
    assert.ok((await events()).some(e => e.topic.key === `agents:task-needs-attention:${attention.id}`))

    const failing = await createTask(agent.id, 'stream error')
    for (let i = 0; i < 5; i++) await awaitRun(await runNow(agent.id, failing.id))
    const topics = (await events()).map(e => e.topic.key)
    assert.equal(topics.filter(t => t === `agents:task-failed:${failing.id}`).length, 5)
    assert.ok(topics.includes(`agents:task-paused:${failing.id}`))
    const paused = (await admin.get(`${base(agent.id)}/${failing.id}`)).data
    assert.match(paused.pausedReason, /5 consecutive failed runs/)
    assert.equal(paused.nextRunAt, undefined)
  })

  test('a resumed task is not re-paused by its first new failure', async () => {
    const agent = await createAgent()
    const failing = await createTask(agent.id, 'stream error')
    for (let i = 0; i < 5; i++) await awaitRun(await runNow(agent.id, failing.id))
    assert.ok((await admin.get(`${base(agent.id)}/${failing.id}`)).data.pausedReason)

    // The admin resumes it by saving it enabled: the failures that paused it no longer count.
    const resumed = (await admin.put(`${base(agent.id)}/${failing.id}`, { title: 'Probe', prompt: 'stream error', scheduling: [daily], enabled: true })).data
    assert.equal(resumed.pausedReason, undefined)
    assert.ok(resumed.resumedAt)
    assert.ok(resumed.nextRunAt)

    await admin.delete('/api/test-env/pushed-events')
    await awaitRun(await runNow(agent.id, failing.id))
    const after = (await admin.get(`${base(agent.id)}/${failing.id}`)).data
    assert.equal(after.pausedReason, undefined)
    assert.ok(after.nextRunAt)
    const topics = (await events()).map(e => e.topic.key)
    assert.ok(topics.includes(`agents:task-failed:${failing.id}`))
    assert.ok(!topics.includes(`agents:task-paused:${failing.id}`))
  })
})
