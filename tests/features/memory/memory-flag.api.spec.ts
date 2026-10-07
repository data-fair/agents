/**
 * stateful API tests: memory is an opt-in property of a configured agent.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean } from '../../support/axios.ts'

const admin = await superAdmin
const body = (over: any = {}) => ({ title: 'm', persona: 'x', mcpServers: [], enabled: true, ...over })

test.describe('Agent memory flag', () => {
  test.beforeEach(async () => { await clean() })

  test('absent by default, which means disabled', async () => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', body())).data
    assert.equal(agent.memory, undefined)
  })

  test('round-trips through create and update', async () => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', body({ memory: { enabled: true } }))).data
    assert.deepEqual(agent.memory, { enabled: true })
    const updated = (await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, body({ memory: { enabled: false } }))).data
    assert.deepEqual(updated.memory, { enabled: false })
  })

  test('rejects unknown memory properties', async () => {
    await assert.rejects(admin.post('/api/autonomous-agents/organization/test1', body({ memory: { enabled: true, shared: true } })), { status: 400 })
  })
})
