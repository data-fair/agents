/**
 * stateful API tests: a task run is one unattended turn, recorded on the run.
 * Whether a tool ran is read from the MCP fixture's own record of calls.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean, axiosAuth } from '../../support/axios.ts'
import { awaitAgentRun } from '../../support/turn.ts'
import { putMockSettings } from '../../support/settings.ts'
import { OUTCOME_REMINDER } from '../../../api/src/conversations/service-tool-names.ts'
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
const events = async () => (await admin.get('/api/test-env/pushed-events')).data as any[]
// matches api/config/development.js secretKeys.limits
const LIMITS_SECRET = 'secretlimits'

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
    const run = await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, task.id))
    assert.equal(run.kind, 'task')
    assert.equal(run.trigger, 'manual')
    assert.equal(run.status, 'done')
    assert.deepEqual(run.outcome, { status: 'done', summary: 'all good' })
    assert.match(run.systemPrompt, /scheduled execution/)
    // read as the two messages the chat components render: the prompt, then the answer — and only so,
    // not also as the run's own prompt and parts
    assert.equal(run.prompt, undefined)
    assert.equal(run.parts, undefined)
    assert.deepEqual(run.messages.map((m: any) => m.role), ['user', 'assistant'])
    assert.equal(run.messages[0].parts[0].text, task.prompt)
    assert.ok(run.messages[1].parts.some((p: any) => p.type === 'dynamic-tool' && p.toolName === 'report_outcome'))
  })

  test('a notification links to the run in the agent page', async () => {
    const agent = await createAgent()
    const siteUrl = `http://localhost:${process.env.NGINX_PORT}`
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id, siteUrl })
    const task = await createTask(agent.id, 'call tool report_outcome {"status":"needs-attention","summary":"look"}')
    const run = await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, task.id))
    const event = (await events()).find(e => e.topic.key === `agents:task-needs-attention:${task.id}`)
    assert.equal(event.url, `${siteUrl}/agents/organization/test1/agents/${agent.id}?tab=history&run=${run.id}`)
  })

  test('a run that ends without report_outcome is reminded once, in the same run, and its outcome recorded', async () => {
    const agent = await createAgent()
    const run = await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, (await createTask(agent.id, 'hello')).id))
    assert.equal(run.status, 'done')
    // the mock answers the reminder by reporting (api/src/models/mock-model.ts): an outcome, not a guessed one
    assert.deepEqual(run.outcome, { status: 'done', summary: 'reported when reminded' })
    const parts = run.messages[1].parts
    const first = parts.findIndex((p: any) => p.type === 'text' && /world/.test(p.text))
    const reminder = parts.findIndex((p: any) => p.type === 'data-outcome-reminder')
    const call = parts.findIndex((p: any) => p.type === 'dynamic-tool' && p.toolName === 'report_outcome')
    assert.ok(first !== -1 && first < reminder && reminder < call, 'the first answer, then the reminder, then the call: one record')
    assert.equal(parts[reminder].data.text, OUTCOME_REMINDER)
    assert.equal(run.calls.length, 2, 'two model calls, each recorded with its own spend')
  })

  test('a run that reported its outcome is not reminded', async () => {
    const agent = await createAgent()
    const run = await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, (await createTask(agent.id, 'call tool report_outcome {"status":"done","summary":"all good"}')).id))
    assert.ok(!run.messages[1].parts.some((p: any) => p.type === 'data-outcome-reminder'))
    assert.equal(run.calls.length, 1)
  })

  test('a tool needing approval is not offered, and never runs', async () => {
    const agent = await createAgent()
    const run = await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, (await createTask(agent.id, 'call tool wipe_everything {}')).id))
    const part = run.messages[1].parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'wipe_everything')
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
    await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, (await createTask(agent.id, 'call tool echo {"value":"x"}')).id))
    assert.deepEqual(fixture.invokedTools(), ['echo'])
  })

  test('run now is refused while a run is going, and on a disabled agent', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'slow hello')
    const runId = await runNow(agent.id, task.id)
    await assert.rejects(admin.post(`${base(agent.id)}/${task.id}/run`), { status: 409 })
    await awaitAgentRun(orgAdmin, agent.id, runId)
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: 'Tasker', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: false })
    await assert.rejects(admin.post(`${base(agent.id)}/${task.id}/run`), { status: 409 })
  })

  test('an admin aborts a running task run', async () => {
    const agent = await createAgent()
    const runId = await runNow(agent.id, (await createTask(agent.id, 'stall')).id)
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal((await orgAdmin.post(`/api/autonomous-agents/organization/test1/${agent.id}/runs/${runId}/abort`)).data.aborted, true)
    const run = await awaitAgentRun(orgAdmin, agent.id, runId)
    assert.equal(run.status, 'aborted')
  })

  test('a stop recorded by another process stops the running task run within a few seconds', async () => {
    const agent = await createAgent()
    const runId = await runNow(agent.id, (await createTask(agent.id, 'stall')).id)
    await new Promise(resolve => setTimeout(resolve, 300))
    // Only the field, as another API process would write it: this process's controller is not touched.
    await admin.post('/api/test-env/request-abort', { runId })
    const requestedAt = Date.now()
    const run = await awaitAgentRun(orgAdmin, agent.id, runId)
    assert.equal(run.status, 'aborted')
    assert.equal(run.stopReason, 'aborted')
    assert.ok(Date.now() - requestedAt < 5000, 'the turn polls its run every couple of seconds')
  })

  test('disabling the agent aborts its running task run, and marks it for any other process', async () => {
    const agent = await createAgent()
    const runId = await runNow(agent.id, (await createTask(agent.id, 'stall')).id)
    await new Promise(resolve => setTimeout(resolve, 300))
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: 'Tasker', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: false })
    const run = await awaitAgentRun(orgAdmin, agent.id, runId)
    assert.equal(run.status, 'aborted')
    assert.ok(run.abortRequestedAt)
    assert.equal(run.abortReason, 'agent-stopped')
    assert.deepEqual(await events(), [], 'an abort is an admin\'s act, not a failure')
  })

  test('a run cut short by a guard is a failure: error, stop reason kept, notified', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'loop forever')
    const run = await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, task.id))
    assert.equal(run.status, 'error')
    assert.equal(run.stopReason, 'repeated-calls')
    assert.match(run.error, /repeating the same tool call/)
    assert.ok((await events()).some(e => e.topic.key === `agents:task-failed:${task.id}`))
  })

  test('an exhausted account credit cap skips the run: recorded with the reason, refused, not notified', async () => {
    const agent = await createAgent()
    const task = await createTask(agent.id, 'hello')
    await orgAdmin.post(`/api/v1/limits/organization/test1?key=${LIMITS_SECRET}`, {
      name: 'Test 1', lastUpdate: new Date().toISOString(), ai_credits: { limit: 5, consumption: 5 }
    })
    await assert.rejects(admin.post(`${base(agent.id)}/${task.id}/run`), (err: any) => {
      assert.equal(err.status, 409)
      assert.match(JSON.stringify(err.data), /credit limit/i)
      return true
    })
    const runs = (await orgAdmin.get(`/api/autonomous-agents/organization/test1/${agent.id}/runs`)).data.results
    assert.equal(runs.length, 1)
    assert.equal(runs[0].status, 'skipped')
    assert.match(runs[0].error, /credit limit/i)
    assert.deepEqual(await events(), [])
  })

  test('a quota refusal at the turn\'s gate skips the run rather than failing it', async () => {
    const agent = await createAgent()
    // The agent bills as role admin under its own usage id: cap that role, and spend past it.
    await putMockSettings(admin, 'organization/test1', { quotas: { admin: { unlimited: false, monthlyLimit: 1 } } })
    await admin.post('/api/test-env/usage', { owner: { type: 'organization', id: 'test1' }, userId: `autonomous-agent:${agent.id}`, cost: 5 })
    const task = await createTask(agent.id, 'hello')
    const run = await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, task.id))
    assert.equal(run.status, 'skipped')
    assert.match(run.error, /could not run/)
    assert.deepEqual(await events(), [])
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
    await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, attention.id))
    assert.ok((await events()).some(e => e.topic.key === `agents:task-needs-attention:${attention.id}`))

    const failing = await createTask(agent.id, 'stream error')
    for (let i = 0; i < 5; i++) await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, failing.id))
    const topics = (await events()).map(e => e.topic.key)
    assert.equal(topics.filter(t => t === `agents:task-failed:${failing.id}`).length, 5)
    assert.ok(topics.includes(`agents:task-paused:${failing.id}`))
    const paused = (await admin.get(`${base(agent.id)}/${failing.id}`)).data
    assert.match(paused.pausedReason, /5 consecutive failed runs/)
    assert.equal(paused.nextRunAt, undefined)
  })

  test('a done run notifies its subscribers, with the summary or the final answer; nothing-to-do notifies nobody', async () => {
    const agent = await createAgent()
    const reported = await createTask(agent.id, 'call tool report_outcome {"status":"done","summary":"all good"}')
    await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, reported.id))
    const done = (await events()).find(e => e.topic.key === `agents:task-done:${reported.id}`)
    assert.ok(done, JSON.stringify(await events()))
    assert.equal(done.body, 'all good')

    const bare = await createTask(agent.id, 'hello')
    await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, bare.id))
    const answered = (await events()).find(e => e.topic.key === `agents:task-done:${bare.id}`)
    assert.ok(answered?.body, 'a run that reported no outcome notifies done with its final answer')

    await admin.delete('/api/test-env/pushed-events')
    const quiet = await createTask(agent.id, 'call tool report_outcome {"status":"nothing-to-do","summary":"nothing new"}')
    await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, quiet.id))
    assert.deepEqual(await events(), [])
  })

  test('a resumed task is not re-paused by its first new failure', async () => {
    const agent = await createAgent()
    const failing = await createTask(agent.id, 'stream error')
    for (let i = 0; i < 5; i++) await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, failing.id))
    assert.ok((await admin.get(`${base(agent.id)}/${failing.id}`)).data.pausedReason)

    // The admin resumes it by saving it enabled: the failures that paused it no longer count.
    const resumed = (await admin.put(`${base(agent.id)}/${failing.id}`, { title: 'Probe', prompt: 'stream error', scheduling: [daily], enabled: true })).data
    assert.equal(resumed.pausedReason, undefined)
    assert.ok(resumed.resumedAt)
    assert.ok(resumed.nextRunAt)

    await admin.delete('/api/test-env/pushed-events')
    await awaitAgentRun(orgAdmin, agent.id, await runNow(agent.id, failing.id))
    const after = (await admin.get(`${base(agent.id)}/${failing.id}`)).data
    assert.equal(after.pausedReason, undefined)
    assert.ok(after.nextRunAt)
    const topics = (await events()).map(e => e.topic.key)
    assert.ok(topics.includes(`agents:task-failed:${failing.id}`))
    assert.ok(!topics.includes(`agents:task-paused:${failing.id}`))
  })
})
