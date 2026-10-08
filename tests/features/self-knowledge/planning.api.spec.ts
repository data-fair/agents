/**
 * stateful API tests: a configured autonomous agent plans, changes and deletes its own tasks in a chat,
 * each change approved by an administrator of the organization through the approval gate, driven by the
 * mock model.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { decideOverSocket, decideOverSocketToRun, runOf, turnOverSocket } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
// An instructor, not an admin of the organization: never offered the planning tools, which only an
// administrator may approve.
const instructor = await axiosAuth('test1-user1', { org: 'test1' })
// The same administrator from their personal account: their role there is not the organization's.
const adminElsewhere = await axiosAuth('test1-admin1')
const AGENTS = '/api/autonomous-agents/organization/test1'
const PLANNING_TOOLS = ['plan_task', 'update_task', 'delete_task']
const weekly = { type: 'weekly', month: '*', dayOfWeek: '1', dayOfMonth: '*', hour: 8, minute: 0, timeZone: 'Europe/Paris' }
const daily = (hour: number, minute: number) => ({ type: 'daily', month: '*', dayOfWeek: '*', dayOfMonth: '*', hour, minute, timeZone: 'Europe/Paris' })
const digest = { title: 'Weekly digest', prompt: 'Summarize the week.', scheduling: [weekly] }

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post(AGENTS, {
    title: 'Planner',
    persona: 'You answer briefly.',
    mcpServers: [],
    enabled: true,
    // test1-admin1 by name too, so the same person may instruct from their personal account.
    instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }, { mode: 'member', type: 'user', id: 'test1-admin1' }],
    ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const tasksOf = async (agentId: string) => (await admin.get(`${AGENTS}/${agentId}/tasks`)).data.results
const callPart = (message: any, toolName: string) => message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)
const offeredTools = (run: any): string[] => run.calls.flatMap((c: any) => c.toolNames ?? [])
const messageAt = async (conversationId: string, seq: number) =>
  (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results.find((m: any) => m.seq === seq)
const awaitRun = async (conversationId: string, runId: string) => {
  for (let i = 0; i < 120; i++) {
    const run = await runOf(orgAdmin, conversationId, runId)
    if (run.status !== 'running') return run
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never ended')
}

/** An administrator asks for a call; the turn ends on its approval card. */
const ask = async (agentId: string, toolName: string, input: unknown) => {
  const { run, conversationId, assistant } = await turnOverSocket(orgAdmin, { agentId }, `call tool ${toolName} ${JSON.stringify(input)}`)
  const part = callPart(assistant, toolName)
  return { run, conversationId, seq: assistant.seq as number, part }
}
/** Decide the pending call and wait for the continuation; the call's part as settled on its message. */
const decide = async (asked: Awaited<ReturnType<typeof ask>>, toolName: string, decision: { approved: boolean, reason?: string }) => {
  const { runId } = await decideOverSocketToRun(orgAdmin, asked.conversationId, asked.part.approval.id, decision)
  const run = await awaitRun(asked.conversationId, runId)
  return { run, part: callPart(await messageAt(asked.conversationId, asked.seq), toolName) }
}

test.describe('Planning tools', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('plan_task ends the turn on an approval card, and nothing is planned yet', async () => {
    const agent = await createAgent()
    const asked = await ask(agent.id, 'plan_task', digest)
    assert.equal(asked.run.stopReason, 'awaiting-approval')
    assert.equal(asked.part.state, 'approval-requested', JSON.stringify(asked.part))
    assert.deepEqual(await tasksOf(agent.id), [])
  })

  test('approved by the administrator, the task exists, records who and where, and the scheduler fires it', async () => {
    const agent = await createAgent()
    const asked = await ask(agent.id, 'plan_task', digest)
    const { run, part } = await decide(asked, 'plan_task', { approved: true })
    assert.equal(run.stopReason, 'completed')
    assert.equal(part.state, 'output-available', JSON.stringify(part))

    const [task] = await tasksOf(agent.id)
    assert.ok(task, 'the task was created')
    assert.equal(task.title, 'Weekly digest')
    assert.equal(task.createdBy.userId, 'test1-admin1')
    assert.equal(task.createdBy.conversationId, asked.conversationId)
    // The result states the outcome, so the model reports it rather than an approval still pending.
    const by = task.createdBy.userName ?? task.createdBy.userId
    assert.ok(part.output.includes(`Approved by ${by}. Task "Weekly digest" is planned (id ${task.id}) and active: every Monday at 08:00 (Europe/Paris), next run ${task.nextRunAt}.`), part.output)

    const fired = (await admin.post('/api/test-env/scheduler-pass', { now: new Date(Date.parse(task.nextRunAt) + 30_000).toISOString() })).data
    assert.equal(fired.fired, 1)
    const runs = (await orgAdmin.get(`${AGENTS}/${agent.id}/runs`, { params: { taskId: task.id } })).data.results
    assert.equal(runs.length, 1)
    assert.equal(runs[0].trigger, 'schedule')
  })

  test('rejected with a reason, nothing is planned and the call carries the reason', async () => {
    const agent = await createAgent()
    const asked = await ask(agent.id, 'plan_task', digest)
    const { part } = await decide(asked, 'plan_task', { approved: false, reason: 'not weekly, monthly' })
    assert.equal(part.state, 'output-denied', JSON.stringify(part))
    assert.equal(part.approval.reason, 'not weekly, monthly')
    assert.deepEqual(await tasksOf(agent.id), [])
  })

  test('approved under the minimum interval, the call fails naming it and the turn ends normally', async () => {
    const agent = await createAgent()
    const asked = await ask(agent.id, 'plan_task', { ...digest, scheduling: [daily(8, 0), daily(8, 10)] })
    const { run, part } = await decide(asked, 'plan_task', { approved: true })
    assert.equal(part.state, 'output-error', JSON.stringify(part))
    assert.match(part.errorText, /minimum interval/)
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(await tasksOf(agent.id), [])
  })

  test('approved at the task cap, the call fails naming the cap', async () => {
    const agent = await createAgent()
    for (let i = 0; i < 20; i++) await admin.post(`${AGENTS}/${agent.id}/tasks`, { title: `Seeded ${i}`, prompt: 'hello', scheduling: [daily(8, 0)] })
    const asked = await ask(agent.id, 'plan_task', digest)
    const { part } = await decide(asked, 'plan_task', { approved: true })
    assert.equal(part.state, 'output-error', JSON.stringify(part))
    assert.match(part.errorText, /at most 20 planned tasks/)
    assert.equal((await tasksOf(agent.id)).length, 20)
  })

  test('update_task approved after an admin deleted the task fails with 404 and recreates nothing', async () => {
    const agent = await createAgent()
    const task = (await admin.post(`${AGENTS}/${agent.id}/tasks`, digest)).data
    const asked = await ask(agent.id, 'update_task', { taskId: task.id, ...digest, title: 'Renamed digest' })
    assert.equal(asked.part.state, 'approval-requested', JSON.stringify(asked.part))
    await admin.delete(`${AGENTS}/${agent.id}/tasks/${task.id}`)
    const { part } = await decide(asked, 'update_task', { approved: true })
    assert.equal(part.state, 'output-error', JSON.stringify(part))
    assert.match(part.errorText, /404/)
    assert.deepEqual(await tasksOf(agent.id), [])
  })

  test('update_task and delete_task, approved, change and remove the task', async () => {
    const agent = await createAgent()
    const task = (await admin.post(`${AGENTS}/${agent.id}/tasks`, digest)).data

    const updated = await decide(await ask(agent.id, 'update_task', { taskId: task.id, ...digest, title: 'Renamed digest' }), 'update_task', { approved: true })
    assert.equal(updated.part.state, 'output-available', JSON.stringify(updated.part))
    const [stored] = await tasksOf(agent.id)
    assert.equal(stored.title, 'Renamed digest')
    assert.equal(stored.updatedBy.userId, 'test1-admin1')
    const by = stored.updatedBy.userName ?? stored.updatedBy.userId
    assert.ok(updated.part.output.includes(`Approved by ${by}. Task "Renamed digest" is updated (id ${task.id}) and active: every Monday at 08:00 (Europe/Paris), next run ${stored.nextRunAt}.`), updated.part.output)

    const deleted = await decide(await ask(agent.id, 'delete_task', { taskId: task.id }), 'delete_task', { approved: true })
    assert.equal(deleted.part.state, 'output-available', JSON.stringify(deleted.part))
    assert.ok(deleted.part.output.includes(`Approved by ${by}. Task "Renamed digest" is deleted.`), deleted.part.output)
    assert.deepEqual(await tasksOf(agent.id), [])

    // Disabled by the change, it says so rather than "active".
    const paused = (await admin.post(`${AGENTS}/${agent.id}/tasks`, digest)).data
    const disabled = await decide(await ask(agent.id, 'update_task', { taskId: paused.id, ...digest, enabled: false }), 'update_task', { approved: true })
    assert.ok(disabled.part.output.includes(`Task "Weekly digest" is updated (id ${paused.id}) and disabled: it will not run until it is enabled.`), disabled.part.output)
  })

  test('a task run is offered none of the planning tools, even with every approval on allow', async () => {
    const agent = await createAgent({ approvals: { readOnly: 'allow', write: 'allow', destructive: 'allow' } })
    // In a chat they are offered, which is what makes their absence below meaningful.
    const chat = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'hello')
    for (const name of PLANNING_TOOLS) assert.ok(offeredTools(chat.run).includes(name), name)

    const task = (await admin.post(`${AGENTS}/${agent.id}/tasks`, { title: 'Probe', prompt: 'hello', scheduling: [daily(8, 0)] })).data
    const runId = (await admin.post(`${AGENTS}/${agent.id}/tasks/${task.id}/run`)).data.runId as string
    let run: any
    for (let i = 0; i < 150; i++) {
      run = (await orgAdmin.get(`${AGENTS}/${agent.id}/runs/${runId}`)).data
      if (run.status !== 'running') break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.equal(run.status, 'done')
    assert.ok(offeredTools(run).length, 'the run recorded its tool list')
    for (const name of PLANNING_TOOLS) assert.ok(!offeredTools(run).includes(name), name)
  })

  test('an instructor who is not an administrator is offered none of the planning tools', async () => {
    const agent = await createAgent()
    const { run } = await turnOverSocket(instructor, { agentId: agent.id }, 'hello')
    assert.ok(offeredTools(run).includes('get_my_configuration'), 'the run recorded its tool list')
    for (const name of PLANNING_TOOLS) assert.ok(!offeredTools(run).includes(name), name)
  })

  test('approving a planning call from where one is not an administrator is refused, and it stays pending', async () => {
    const agent = await createAgent()
    const asked = await ask(agent.id, 'plan_task', digest)
    await assert.rejects(decideOverSocket(adminElsewhere, asked.conversationId, asked.part.approval.id, { approved: true }), (err: any) => {
      assert.equal(err.status, 403)
      assert.match(String(err.message ?? err.data), /only an administrator of the organization can change the agent's planned tasks/)
      return true
    })
    assert.equal(callPart(await messageAt(asked.conversationId, asked.seq), 'plan_task').state, 'approval-requested')
    assert.deepEqual(await tasksOf(agent.id), [])
    // Rejecting stays anyone's who may decide.
    const { runId } = await decideOverSocketToRun(adminElsewhere, asked.conversationId, asked.part.approval.id, { approved: false })
    await awaitRun(asked.conversationId, runId)
    assert.equal(callPart(await messageAt(asked.conversationId, asked.seq), 'plan_task').state, 'output-denied')
  })

  test('the personal assistant is offered none of the planning tools', async () => {
    const { run } = await turnOverSocket(orgAdmin, { agentId: 'personal' }, 'hello')
    for (const name of PLANNING_TOOLS) assert.ok(!offeredTools(run).includes(name), name)
  })
})
