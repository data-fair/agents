/**
 * stateful API tests: a planned task started by its trigger URL (docs/architecture/planned-tasks.md, "Webhook triggers").
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import axios from 'axios'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { awaitAgentRun } from '../../support/turn.ts'
import { putMockSettings } from '../../support/settings.ts'
import { createEnrolledAgent } from '../../support/agents.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const daily = { type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const base = (agentId: string) => `/api/autonomous-agents/organization/test1/${agentId}/tasks`
// No session: a webhook sender is anonymous.
const anonymous = axios.create({ baseURL: `http://localhost:${process.env.NGINX_PORT}/agents`, validateStatus: () => true })

const createAgent = async () => {
  const agent = await createEnrolledAgent({
    title: 'Hooked', persona: 'You answer briefly.', mcpServers: [], enabled: true
  })
  return agent
}
const createTask = async (agentId: string, prompt = 'hello', scheduling: any[] = [daily]) =>
  (await admin.post(base(agentId), { title: 'Hook', prompt, scheduling })).data
const keyOf = async (agentId: string, taskId: string) => (await admin.get(`${base(agentId)}/${taskId}/webhook-key`)).data as string
// The key travels in the x-webhook-key header only: a query string lands in access logs.
const trigger = (agentId: string, taskId: string, key: string | undefined, body?: any, headers: Record<string, string> = {}) =>
  anonymous.post(`${base(agentId)}/${taskId}/_trigger`, body, { headers: { ...(key ? { 'x-webhook-key': key } : {}), ...headers } })

test.describe('Webhook triggers', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('the key is 16 url-safe characters, read by an admin, regenerated, and absent from every task read', async () => {
    const agent = await createAgent()
    const created = await createTask(agent.id)
    assert.equal(created.webhookKey, undefined)
    const key = await keyOf(agent.id, created.id)
    assert.match(key, /^[A-Za-z0-9_-]{16}$/)
    assert.equal((await admin.get(`${base(agent.id)}/${created.id}`)).data.webhookKey, undefined)
    assert.ok((await admin.get(base(agent.id))).data.results.every((t: any) => t.webhookKey === undefined && t.pendingTriggers === undefined))
    const regenerated = (await admin.delete(`${base(agent.id)}/${created.id}/webhook-key`)).data
    assert.notEqual(regenerated, key)
    assert.equal(await keyOf(agent.id, created.id), regenerated)
  })

  test('the key routes need the write access of task routes', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const member = await axiosAuth('test1-user1', { org: 'test1' })
    await assert.rejects(member.get(`${base(agent.id)}/${task.id}/webhook-key`), { status: 403 })
  })

  test('a trigger starts a run whose prompt holds the payload as data, before the task\'s prompt', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'hello')
    const res = await trigger(agent.id, task.id, await keyOf(agent.id, task.id), { topic: { key: 'data-fair:dataset-data-updated:abc' } })
    assert.equal(res.status, 202)
    assert.equal(res.data.status, 'started')
    const run = await awaitAgentRun(orgAdmin, agent.id, res.data.runId)
    assert.equal(run.trigger, 'webhook')
    assert.equal(run.triggeredBy, undefined)
    assert.equal(run.status, 'done')
    const prompt = run.messages[0].parts[0].text as string
    assert.match(prompt, /^Webhook calls received since the last run\./)
    assert.match(prompt, /<webhook-payload received="[^"]+">\n\{\n {2}"topic": \{\n {4}"key": "data-fair:dataset-data-updated:abc"/)
    assert.ok(prompt.endsWith('\n\nhello'))
  })

  test('the key is refused in the query string, where access logs would keep it', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const res = await anonymous.post(`${base(agent.id)}/${task.id}/_trigger?key=${await keyOf(agent.id, task.id)}`, 'x', { headers: { 'content-type': 'text/plain' } })
    assert.equal(res.status, 403)
  })

  test('a text body reaches the run as data', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const res = await trigger(agent.id, task.id, await keyOf(agent.id, task.id), 'dataset updated', { 'content-type': 'text/plain' })
    assert.equal(res.status, 202)
    const run = await awaitAgentRun(orgAdmin, agent.id, res.data.runId)
    assert.match(run.messages[0].parts[0].text, /\ndataset updated\n<\/webhook-payload>/)
  })

  test('refusals: unknown task 404, wrong or missing key 403, a regenerated key revokes the old one', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const key = await keyOf(agent.id, task.id)
    assert.equal((await trigger(agent.id, 'nope', key)).status, 404)
    assert.equal((await trigger(agent.id, task.id, 'x'.repeat(16))).status, 403)
    assert.equal((await trigger(agent.id, task.id, undefined)).status, 403)
    await admin.delete(`${base(agent.id)}/${task.id}/webhook-key`)
    assert.equal((await trigger(agent.id, task.id, key)).status, 403)
  })

  test('refusals: disabled agent, disabled task 409; a body over 64 KB 413', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const key = await keyOf(agent.id, task.id)
    assert.equal((await trigger(agent.id, task.id, key, 'x'.repeat(70_000), { 'content-type': 'text/plain' })).status, 413)
    assert.equal((await trigger(agent.id, task.id, key, { big: 'x'.repeat(70_000) })).status, 413)
    await admin.put(`${base(agent.id)}/${task.id}`, { title: 'Hook', prompt: 'hello', scheduling: [daily], enabled: false })
    assert.equal((await trigger(agent.id, task.id, key)).status, 409)
    await admin.put(`${base(agent.id)}/${task.id}`, { title: 'Hook', prompt: 'hello', scheduling: [daily], enabled: true })
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: 'Hooked', persona: 'You answer briefly.', mcpServers: [], enabled: false })
    assert.equal((await trigger(agent.id, task.id, key)).status, 409)
  })

  test('an exhausted credit cap refuses every trigger but records one skipped run, not one per call', async () => {
    // A caller retrying, or a noisy integration, would otherwise insert a run per call for as long as the cap lasts.
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const key = await keyOf(agent.id, task.id)
    await orgAdmin.post('/api/v1/limits/organization/test1?key=secretlimits', {
      name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 5, consumption: 5 }
    })
    for (let i = 0; i < 3; i++) assert.equal((await trigger(agent.id, task.id, key)).status, 409)
    const runs = (await orgAdmin.get(`/api/autonomous-agents/organization/test1/${agent.id}/runs`)).data.results
    assert.equal(runs.length, 1)
    assert.equal(runs[0].status, 'skipped')
  })

  test('triggers during a run merge: one follow-up run, after the minimum interval, carrying them all in order', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'slow hello')
    const key = await keyOf(agent.id, task.id)
    const first = await trigger(agent.id, task.id, key, 'first', { 'content-type': 'text/plain' })
    assert.equal(first.data.status, 'started')
    for (const payload of ['a', 'b', 'c']) {
      const res = await trigger(agent.id, task.id, key, payload, { 'content-type': 'text/plain' })
      assert.equal(res.status, 202)
      assert.equal(res.data.status, 'pending')
    }
    const firstRun = await awaitAgentRun(orgAdmin, agent.id, first.data.runId)
    assert.doesNotMatch(firstRun.messages[0].parts[0].text, /\na\n/)
    // The run's end set the slot at its start + the minimum interval (3600 s by default).
    const pending = (await admin.get(`${base(agent.id)}/${task.id}`)).data
    assert.equal(pending.nextRunAt, new Date(new Date(firstRun.startedAt).getTime() + 3600_000).toISOString())
    const passed = (await admin.post('/api/test-env/scheduler-pass', { now: new Date(Date.now() + 2 * 3600_000).toISOString() })).data
    assert.equal(passed.fired, 1)
    const runs = (await admin.get(`/api/autonomous-agents/organization/test1/${agent.id}/runs`, { params: { taskId: task.id } })).data.results
    assert.equal(runs.length, 2)
    const second = await awaitAgentRun(orgAdmin, agent.id, runs[0].id)
    assert.equal(second.trigger, 'webhook')
    const text = second.messages[0].parts[0].text as string
    assert.ok(text.indexOf('\na\n') < text.indexOf('\nb\n') && text.indexOf('\nb\n') < text.indexOf('\nc\n'))
  })

  test('a trigger inside the minimum interval after a run waits, with the slot at last start + interval', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const runId = (await admin.post(`${base(agent.id)}/${task.id}/run`)).data.runId
    const run = await awaitAgentRun(orgAdmin, agent.id, runId)
    const res = await trigger(agent.id, task.id, await keyOf(agent.id, task.id), 'later', { 'content-type': 'text/plain' })
    assert.equal(res.data.status, 'pending')
    const after = (await admin.get(`${base(agent.id)}/${task.id}`)).data
    assert.equal(after.nextRunAt, new Date(new Date(run.startedAt).getTime() + 3600_000).toISOString())
  })

  test('a paused task refuses triggers but keeps earlier pending payloads for its first run after resume', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    await admin.post('/api/test-env/task-pending-trigger', { taskId: task.id, nextRunAt: '2030-01-01T00:00:00.000Z', payload: 'kept' })
    await admin.post('/api/test-env/pause-task', { taskId: task.id })
    assert.equal((await trigger(agent.id, task.id, await keyOf(agent.id, task.id))).status, 409)
    await admin.put(`${base(agent.id)}/${task.id}`, { title: 'Hook', prompt: 'hello', scheduling: [daily], enabled: true })
    const runId = (await admin.post(`${base(agent.id)}/${task.id}/run`)).data.runId
    const run = await awaitAgentRun(orgAdmin, agent.id, runId)
    assert.match(run.messages[0].parts[0].text, /\nkept\n<\/webhook-payload>/)
  })

  test('the events log never records a trigger key, wrong or right', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id)
    const key = await keyOf(agent.id, task.id)
    const wrong = 'w'.repeat(16)
    assert.equal((await trigger(agent.id, task.id, wrong)).status, 403)
    assert.equal((await trigger(agent.id, task.id, key)).status, 202)
    // dev-api writes the events log to its stdout, captured in dev/logs/dev-api.log, at warn level in dev: the
    // refusal's entry is there (written asynchronously, so polled briefly), the accepted call's info entry is not.
    const { readFile } = await import('node:fs/promises')
    const refused = /"code":"forbidden-req","message":"wrong trigger key"/
    let log = ''
    for (let i = 0; i < 30 && !refused.test(log); i++) {
      if (i) await new Promise(resolve => setTimeout(resolve, 100))
      log = await readFile('dev/logs/dev-api.log', 'utf8')
    }
    assert.match(log, refused)
    assert.ok(!log.includes(wrong))
    assert.ok(!log.includes(key))
  })
})
