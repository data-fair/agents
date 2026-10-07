/**
 * stateful API tests: a task run (kind 'task', no conversation) is tolerated by every reader and writer of runs.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const member = await axiosAuth('test1-user1', { org: 'test1' })

const createAgent = async () => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', { title: 'Tasker', persona: 'x', mcpServers: [], enabled: true })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}
const insertTaskRun = async (agentId: string, over: any = {}) =>
  (await admin.post('/api/test-env/task-run', { agentId, taskId: 'task-1', status: 'running', ...over })).data

test.describe('Task runs in the store', () => {
  test.beforeEach(async () => { await clean(); await putMockSettings(admin, 'organization/test1') })

  test('an admin reads a task run; a member cannot', async () => {
    const agent = await createAgent()
    const run = await insertTaskRun(agent.id, { status: 'done', prompt: 'p', parts: [{ type: 'text', text: 'answer' }] })
    const read = (await orgAdmin.get(`/api/runs/organization/test1/${run.id}`)).data
    assert.equal(read.kind, 'task')
    assert.equal(read.taskId, 'task-1')
    await assert.rejects(member.get(`/api/runs/organization/test1/${run.id}`), { status: 403 })
  })

  test('recovery interrupts a task run nobody runs, and never resumes it', async () => {
    const agent = await createAgent()
    const run = await insertTaskRun(agent.id)
    const recovered = (await admin.post('/api/test-env/recover-ownerless-runs')).data
    assert.equal(recovered.resumed, 0)
    const read = (await orgAdmin.get(`/api/runs/organization/test1/${run.id}`)).data
    assert.equal(read.status, 'interrupted')
    assert.equal(read.error, 'interrupted by a restart')
  })

  test('a task run whose task lock is held is left alone', async () => {
    const agent = await createAgent()
    const run = await insertTaskRun(agent.id)
    await admin.post('/api/test-env/lock-task', { taskId: 'task-1' })
    try {
      await admin.post('/api/test-env/recover-ownerless-runs')
      assert.equal((await orgAdmin.get(`/api/runs/organization/test1/${run.id}`)).data.status, 'running')
    } finally {
      await admin.post('/api/test-env/unlock-task', { taskId: 'task-1' })
    }
  })

  test('deleting the agent erases its task runs', async () => {
    const agent = await createAgent()
    await insertTaskRun(agent.id, { status: 'done' })
    assert.equal((await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data.runs, 1)
    await admin.delete(`/api/autonomous-agents/organization/test1/${agent.id}`)
    const data = (await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data
    assert.equal(data.runs, 0)
  })

  // The stop is recorded on a running run this process does not hold, for the process that holds it to
  // read (I4 ruling); a run that has ended answers false, as for a conversation run.
  test('aborting a task run this process is not running records the stop; an ended run answers false', async () => {
    const agent = await createAgent()
    const run = await insertTaskRun(agent.id)
    const res = await orgAdmin.post(`/api/runs/organization/test1/${run.id}/abort`)
    assert.equal(res.data.aborted, true)
    assert.ok((await orgAdmin.get(`/api/runs/organization/test1/${run.id}`)).data.abortRequestedAt)
    const ended = await insertTaskRun(agent.id, { status: 'done' })
    assert.equal((await orgAdmin.post(`/api/runs/organization/test1/${ended.id}/abort`)).data.aborted, false)
  })
})
