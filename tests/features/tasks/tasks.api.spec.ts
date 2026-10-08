/**
 * stateful API tests: planned tasks, edited by admins, read by instructors.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const instructor = await axiosAuth('test1-user1', { org: 'test1' })

const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const createAgent = async () => (await admin.post('/api/autonomous-agents/organization/test1', {
  title: 'Tasker',
  persona: 'x',
  mcpServers: [],
  enabled: true,
  instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }]
})).data
const tasks = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`

test.describe('Planned tasks', () => {
  test.beforeEach(async () => { await clean(); await putMockSettings(admin, 'organization/test1') })

  test('an admin creates a task; its next run is planned and the creator recorded', async () => {
    const agent = await createAgent()
    const task = (await admin.post(tasks(agent.id), { title: 'Daily digest', prompt: 'summarise', scheduling: [daily] })).data
    assert.equal(task.enabled, true)
    assert.ok(new Date(task.nextRunAt) > new Date())
    assert.equal(task.createdBy.userId, 'superadmin')
    const listed = (await orgAdmin.get(tasks(agent.id))).data
    assert.deepEqual(listed.results.map((t: any) => t.id), [task.id])
  })

  test('an instructor reads tasks but cannot write them', async () => {
    const agent = await createAgent()
    const task = (await admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily] })).data
    assert.equal((await instructor.get(tasks(agent.id))).data.results.length, 1)
    assert.equal((await instructor.get(`${tasks(agent.id)}/${task.id}`)).data.id, task.id)
    await assert.rejects(instructor.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily] }), { status: 403 })
    await assert.rejects(instructor.put(`${tasks(agent.id)}/${task.id}`, { title: 't', prompt: 'p', scheduling: [daily] }), { status: 403 })
    await assert.rejects(instructor.delete(`${tasks(agent.id)}/${task.id}`), { status: 403 })
  })

  test('a schedule tighter than the minimum interval is refused with the reason', async () => {
    const agent = await createAgent()
    const tooOften = { ...daily, minute: 10 }
    await assert.rejects(admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily, tooOften] }), (err: any) => {
      assert.equal(err.status, 400)
      assert.match(JSON.stringify(err.data), /interval/)
      return true
    })
  })

  test('a rule carrying a key its type does not have is refused, and nothing is stored', async () => {
    const agent = await createAgent()
    // daily + hourStep would run every 2 hours while every description of it says once a day
    await assert.rejects(admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [{ ...daily, hourStep: 2 }] }), { status: 400 })
    assert.equal((await admin.get(tasks(agent.id))).data.count, 0)
  })

  test('at most maxPerAgent tasks per agent', async () => {
    const agent = await createAgent()
    for (let i = 0; i < 20; i++) await admin.post(tasks(agent.id), { title: `t${i}`, prompt: 'p', scheduling: [{ ...daily, hour: i % 24 }] })
    await assert.rejects(admin.post(tasks(agent.id), { title: 'one more', prompt: 'p', scheduling: [daily] }), { status: 400 })
  })

  test('disabling then re-enabling replans the next run; deleting the agent deletes its tasks', async () => {
    const agent = await createAgent()
    const task = (await admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily] })).data
    const off = (await admin.put(`${tasks(agent.id)}/${task.id}`, { title: 't', prompt: 'p', scheduling: [daily], enabled: false })).data
    assert.equal(off.enabled, false)
    assert.equal(off.nextRunAt, undefined)
    const on = (await admin.put(`${tasks(agent.id)}/${task.id}`, { title: 't', prompt: 'p', scheduling: [daily], enabled: true })).data
    assert.ok(on.nextRunAt)
    await admin.delete(`/api/autonomous-agents/organization/test1/${agent.id}`)
    await assert.rejects(admin.get(`${tasks(agent.id)}/${task.id}`), { status: 404 })
  })

  test('a task of an unknown agent is a 404; deleting a task removes it', async () => {
    await assert.rejects(admin.post(tasks('nope'), { title: 't', prompt: 'p', scheduling: [daily] }), { status: 404 })
    const agent = await createAgent()
    const task = (await admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily] })).data
    assert.equal((await admin.delete(`${tasks(agent.id)}/${task.id}`)).status, 204)
    assert.equal((await admin.get(tasks(agent.id))).data.count, 0)
  })

  test('a title-only edit keeps the planned next run', async () => {
    const agent = await createAgent()
    const task = (await admin.post(tasks(agent.id), { title: 't', prompt: 'p', scheduling: [daily] })).data
    // same rule, keys in another order
    const reordered = { timeZone: 'Europe/Paris', minute: 0, hour: 8, dayOfMonth: '*', dayOfWeek: '*', month: '*', type: 'daily' }
    const edited = (await admin.put(`${tasks(agent.id)}/${task.id}`, { title: 'renamed', prompt: 'p', scheduling: [reordered] })).data
    assert.equal(edited.title, 'renamed')
    assert.equal(edited.nextRunAt, task.nextRunAt)
  })
})
