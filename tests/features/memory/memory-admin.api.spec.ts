/**
 * stateful API tests: the admin memory surface — read, write, history, restore, redact, cascade.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const instructor = await axiosAuth('test1-user1', { org: 'test1' })

const createAgent = async () => (await admin.post('/api/autonomous-agents/organization/test1', {
  title: 'Mem',
  persona: 'x',
  mcpServers: [],
  enabled: true,
  memory: { enabled: true },
  instructors: [{ mode: 'member', type: 'user', id: 'test1-user1' }]
})).data
const base = (agentId: string) => `/api/memory/organization/test1/${agentId}`
const put = (agentId: string, path: string, body: any) => admin.put(`${base(agentId)}/document`, body, { params: { path } })

test.describe('Agent memory admin API', () => {
  test.beforeEach(async () => { await clean() })

  test('an admin writes, lists and reads a document', async () => {
    const agent = await createAgent()
    const written = (await put(agent.id, 'MEMORY.md', { description: 'Core facts', content: '- the sales dataset is "ventes"' })).data
    assert.equal(written.version, 1)
    const list = (await orgAdmin.get(base(agent.id))).data
    assert.equal(list.enabled, true)
    assert.equal(list.usage.documents, 1)
    assert.equal(list.documents[0].path, 'MEMORY.md')
    assert.equal(list.documents[0].updatedBy.kind, 'user')
    const read = (await orgAdmin.get(`${base(agent.id)}/document`, { params: { path: 'MEMORY.md' } })).data
    assert.equal(read.content, '- the sales dataset is "ventes"')
  })

  test('a stale version is a 409, not a lost update', async () => {
    // Review Focus 1
    const agent = await createAgent()
    await put(agent.id, 'x.md', { description: 'd', content: 'v1' })
    await put(agent.id, 'x.md', { description: 'd', content: 'v2', version: 1 })
    await assert.rejects(put(agent.id, 'x.md', { description: 'd', content: 'v3', version: 1 }), { status: 409 })
    await assert.rejects(put(agent.id, 'x.md', { description: 'd', content: 'again' }), { status: 409 })
  })

  test('limits apply to admins too, as a 400 with the reason', async () => {
    const agent = await createAgent()
    await assert.rejects(put(agent.id, 'MEMORY.md', { description: 'd', content: 'x'.repeat(4001) }), { status: 400 })
  })

  test('history, restore and redact', async () => {
    const agent = await createAgent()
    await put(agent.id, 'x.md', { description: 'd', content: 'first' })
    await put(agent.id, 'x.md', { description: 'd', content: 'second', version: 1 })
    const versions = (await orgAdmin.get(`${base(agent.id)}/versions`, { params: { path: 'x.md' } })).data
    assert.equal(versions.count, 2)
    assert.equal(versions.results[0].content, 'second') // newest first
    const first = versions.results[1]

    const restored = (await admin.post(`${base(agent.id)}/versions/${first.id}/restore`)).data
    assert.equal(restored.content, 'first')
    assert.equal(restored.version, 3)
    const after = (await orgAdmin.get(`${base(agent.id)}/versions`, { params: { path: 'x.md' } })).data
    assert.equal(after.results[0].op, 'restore')

    // The newest version holds the live content: redacting it must not silently change the document.
    await assert.rejects(admin.post(`${base(agent.id)}/versions/${after.results[0].id}/redact`), { status: 400 })
    await admin.post(`${base(agent.id)}/versions/${versions.results[0].id}/redact`)
    const redacted = (await orgAdmin.get(`${base(agent.id)}/versions`, { params: { path: 'x.md' } })).data.results.find((v: any) => v.id === versions.results[0].id)
    assert.equal(redacted.content, '[redacted]')
    assert.ok(redacted.redacted.at)
  })

  test('delete needs the current version', async () => {
    const agent = await createAgent()
    await put(agent.id, 'x.md', { description: 'd', content: 'a' })
    await assert.rejects(admin.delete(`${base(agent.id)}/document`, { params: { path: 'x.md', version: 7 } }), { status: 409 })
    await admin.delete(`${base(agent.id)}/document`, { params: { path: 'x.md', version: 1 } })
    assert.equal((await orgAdmin.get(base(agent.id))).data.documents.length, 0)
  })

  test('an instructor who is not an admin cannot read memory', async () => {
    const agent = await createAgent()
    await assert.rejects(instructor.get(base(agent.id)), { status: 403 })
  })

  test('an org admin outside the rollout gate cannot write', async () => {
    // writes follow the agent configuration's progressive-rollout gate (reqWriteSession)
    const agent = await createAgent()
    await assert.rejects(orgAdmin.put(`${base(agent.id)}/document`, { description: 'd', content: 'a' }, { params: { path: 'x.md' } }), { status: 403 })
  })

  test('deleting the agent erases its memory and history', async () => {
    const agent = await createAgent()
    await put(agent.id, 'x.md', { description: 'd', content: 'a' })
    await admin.delete(`/api/autonomous-agents/organization/test1/${agent.id}`)
    const data = (await admin.get(`/api/test-env/autonomous-agent-data/${agent.id}`)).data
    assert.equal(data.memories, 0)
    assert.equal(data.memoryVersions, 0)
  })
})
