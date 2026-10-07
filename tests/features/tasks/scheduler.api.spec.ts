/**
 * stateful API tests: the scheduler claims a due task once, catches up once, skips an overlap.
 * Passes are triggered through a test seam with an injected "now"; nothing waits for a clock.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const hourly = { type: 'hours', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: '*', hourStep: 1, minute: 0, timeZone: 'UTC' }
const base = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`

const createAgent = async (enabled = true) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Tasker', persona: 'x', mcpServers: [], enabled })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const dueTask = async (agentId: string, prompt = 'hello', dueAt = '2026-01-15T10:00:00.000Z') => {
  const task = (await admin.post(base(agentId), { title: 'Hourly', prompt, scheduling: [hourly] })).data
  await admin.post('/api/test-env/task-next-run', { taskId: task.id, nextRunAt: dueAt })
  return task
}
const pass = async (now: string) => (await admin.post('/api/test-env/scheduler-pass', { now })).data
const runsOf = async (agentId: string, taskId: string) =>
  (await orgAdmin.get(`/api/autonomous-agents/organization/test1/${agentId}/runs`, { params: { taskId } })).data.results
// Until no run of the task is still going (a run is recorded `running` at once, and the turn is not awaited).
const settle = async (agentId: string, taskId: string) => {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    const runs = await runsOf(agentId, taskId)
    if (runs.length && !runs.some((r: any) => r.status === 'running')) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

test.describe('The scheduler', () => {
  test.beforeEach(async () => { await clean(); await putMockSettings(admin, 'organization/test1') })

  test('a due task fires once, and its next run moves past now', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id)
    assert.equal((await pass('2026-01-15T10:00:30.000Z')).fired, 1)
    await settle(agent.id, task.id)
    const runs = await runsOf(agent.id, task.id)
    assert.equal(runs.length, 1)
    assert.equal(runs[0].trigger, 'schedule')
    assert.equal(runs[0].scheduledFor, '2026-01-15T10:00:00.000Z')
    assert.equal((await admin.get(`${base(agent.id)}/${task.id}`)).data.nextRunAt, '2026-01-15T11:00:00.000Z')
  })

  test('two passes at once fire one run', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id)
    const [a, b] = await Promise.all([pass('2026-01-15T10:00:30.000Z'), pass('2026-01-15T10:00:30.000Z')])
    assert.equal(a.fired + b.fired, 1)
    await settle(agent.id, task.id)
    assert.equal((await runsOf(agent.id, task.id)).length, 1)
  })

  test('overdue by many slots: one catch-up run, then the cadence', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id, 'hello', '2026-01-14T10:00:00.000Z')
    assert.equal((await pass('2026-01-15T10:20:00.000Z')).fired, 1)
    assert.equal((await pass('2026-01-15T10:30:00.000Z')).fired, 0)
    await settle(agent.id, task.id)
    assert.equal((await runsOf(agent.id, task.id)).length, 1)
    assert.equal((await admin.get(`${base(agent.id)}/${task.id}`)).data.nextRunAt, '2026-01-15T11:00:00.000Z')
  })

  test('a due task whose previous run still runs is recorded skipped', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id, 'slow hello')
    await pass('2026-01-15T10:00:30.000Z')
    await admin.post('/api/test-env/task-next-run', { taskId: task.id, nextRunAt: '2026-01-15T11:00:00.000Z' })
    await pass('2026-01-15T11:00:10.000Z')
    await settle(agent.id, task.id)
    const runs = await runsOf(agent.id, task.id)
    assert.deepEqual(runs.map((r: any) => r.status).sort(), ['done', 'skipped'])
  })

  test('a task whose schedule cannot be computed is paused, and the pass goes on', async () => {
    const agent = await createAgent()
    const bad = await dueTask(agent.id)
    await admin.post('/api/test-env/task-next-run', { taskId: bad.id, nextRunAt: '2026-01-15T09:00:00.000Z', scheduling: [{ ...hourly, timeZone: 'Not/AZone' }] })
    const good = await dueTask(agent.id)
    assert.equal((await pass('2026-01-15T10:00:30.000Z')).fired, 1)
    await settle(agent.id, good.id)
    const paused = (await admin.get(`${base(agent.id)}/${bad.id}`)).data
    assert.match(paused.pausedReason, /^its schedule cannot be computed/)
    assert.equal(paused.nextRunAt, undefined)
    assert.equal((await runsOf(agent.id, bad.id)).length, 0)
  })

  test('an overlap is counted skipped, not fired', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id, 'slow hello')
    assert.equal((await pass('2026-01-15T10:00:30.000Z')).fired, 1)
    await admin.post('/api/test-env/task-next-run', { taskId: task.id, nextRunAt: '2026-01-15T11:00:00.000Z' })
    const second = await pass('2026-01-15T11:00:10.000Z')
    assert.deepEqual(second, { fired: 0, skipped: 1 })
    await settle(agent.id, task.id)
  })

  test('a paused task, a disabled task and a disabled agent\'s task do not fire', async () => {
    const agent = await createAgent()
    const task = await dueTask(agent.id)
    await admin.put(`${base(agent.id)}/${task.id}`, { title: 'Hourly', prompt: 'hello', scheduling: [hourly], enabled: false })
    const off = await createAgent(false)
    const offTask = await dueTask(off.id)
    const result = await pass('2026-01-15T10:00:30.000Z')
    assert.equal(result.fired, 0)
    // the disabled agent's slot was spent without a run, so it does not fire on re-enable for a stale slot
    assert.equal(result.skipped, 1)
    assert.equal((await runsOf(off.id, offTask.id)).length, 0)
    assert.equal((await admin.get(`${base(off.id)}/${offTask.id}`)).data.nextRunAt, '2026-01-15T11:00:00.000Z')
  })
})
