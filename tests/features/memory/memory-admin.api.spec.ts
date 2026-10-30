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
const command = (agentId: string, input: any) => admin.post(`/api/test-env/memory-command/${agentId}`, { input })
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

  test('an instructor who is not an admin reads memory but cannot change it', async () => {
    // The agent's memory is shared across everyone it talks with by design, and it reaches every run's
    // system prompt anyway: hiding it from an instructor hid nothing. Changing it stays the admins'.
    const agent = await createAgent()
    const written = (await put(agent.id, 'MEMORY.md', { description: 'Core facts', content: '- the sales dataset is "ventes"' })).data
    assert.equal((await instructor.get(base(agent.id))).data.documents[0].path, 'MEMORY.md')
    assert.equal((await instructor.get(`${base(agent.id)}/document`, { params: { path: 'MEMORY.md' } })).data.content, '- the sales dataset is "ventes"')
    const versions = (await instructor.get(`${base(agent.id)}/versions`)).data.results
    assert.equal(versions.length, 1)
    await assert.rejects(instructor.put(`${base(agent.id)}/document`, { description: 'd', content: 'a', version: written.version }, { params: { path: 'MEMORY.md' } }), { status: 403 })
    await assert.rejects(instructor.post(`${base(agent.id)}/versions/${versions[0].id}/redact`), { status: 403 })
  })

  test('someone who may not instruct the agent cannot read its memory', async () => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Mem', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true }
    })).data
    await assert.rejects(instructor.get(base(agent.id)), { status: 403 })
  })

  test('an org admin outside the rollout gate cannot write', async () => {
    // writes follow the agent configuration's progressive-rollout gate (reqWriteSession)
    const agent = await createAgent()
    await assert.rejects(orgAdmin.put(`${base(agent.id)}/document`, { description: 'd', content: 'a' }, { params: { path: 'x.md' } }), { status: 403 })
  })

  test('redaction follows the CONTENT: refused while another path holds the text', async () => {
    const agent = await createAgent()
    await put(agent.id, 'a.md', { description: 'd', content: 'secret' })
    await command(agent.id, { command: 'rename', path: 'a.md', new_path: 'b.md' })
    const versions = (await orgAdmin.get(`${base(agent.id)}/versions`)).data.results
    const created = versions.find((v: any) => v.path === 'a.md' && v.op === 'create')
    await assert.rejects(admin.post(`${base(agent.id)}/versions/${created.id}/redact`), { status: 400 })
    // once the live copy is gone, redaction blanks every row carrying the text
    await admin.delete(`${base(agent.id)}/document`, { params: { path: 'b.md', version: 2 } })
    await admin.post(`${base(agent.id)}/versions/${created.id}/redact`)
    const after = (await orgAdmin.get(`${base(agent.id)}/versions`)).data.results
    for (const v of after.filter((v: any) => v.op !== 'delete')) assert.equal(v.content, '[redacted]')
    // a delete row has no content to redact
    const del = after.find((v: any) => v.op === 'delete')
    await assert.rejects(admin.post(`${base(agent.id)}/versions/${del.id}/redact`), { status: 400 })
  })

  test('redacting the version a restore copied is refused, delete then recreate allows it', async () => {
    const agent = await createAgent()
    await put(agent.id, 'x.md', { description: 'd', content: 'first' })
    await put(agent.id, 'x.md', { description: 'd', content: 'second', version: 1 })
    const v1 = (await orgAdmin.get(`${base(agent.id)}/versions`, { params: { path: 'x.md' } })).data.results[1]
    await admin.post(`${base(agent.id)}/versions/${v1.id}/restore`)
    await assert.rejects(admin.post(`${base(agent.id)}/versions/${v1.id}/redact`), { status: 400 })
    // delete, recreate with other text: version numbers restart at 1, the old row is still redactable
    await admin.delete(`${base(agent.id)}/document`, { params: { path: 'x.md', version: 3 } })
    await put(agent.id, 'x.md', { description: 'd', content: 'brand new' })
    await admin.post(`${base(agent.id)}/versions/${v1.id}/redact`)
  })

  test('redacting twice is refused and the first stamp and the description are kept/blanked', async () => {
    const agent = await createAgent()
    await put(agent.id, 'x.md', { description: 'about secret', content: 'secret' })
    await put(agent.id, 'y.md', { description: 'd', content: 'other' })
    await put(agent.id, 'x.md', { description: 'd', content: 'public', version: 1 })
    await put(agent.id, 'y.md', { description: 'd', content: 'other2', version: 1 })
    const rows = (await orgAdmin.get(`${base(agent.id)}/versions`)).data.results
    const old = rows.find((v: any) => v.path === 'x.md' && v.version === 1)
    const otherOld = rows.find((v: any) => v.path === 'y.md' && v.version === 1)
    await admin.post(`${base(agent.id)}/versions/${old.id}/redact`)
    const read = async (id: string) => (await orgAdmin.get(`${base(agent.id)}/versions`)).data.results.find((v: any) => v.id === id)
    const first = await read(old.id)
    assert.equal(first.description, '[redacted]')
    await assert.rejects(admin.post(`${base(agent.id)}/versions/${old.id}/redact`), { status: 400 })
    assert.deepEqual((await read(old.id)).redacted, first.redacted)
    // an unrelated row is untouched
    assert.equal((await read(otherOld.id)).content, 'other')
  })

  test('a deleted document can be restored from its history', async () => {
    const agent = await createAgent()
    await put(agent.id, 'x.md', { description: 'd', content: 'keep me' })
    const created = (await orgAdmin.get(`${base(agent.id)}/versions`)).data.results[0]
    await admin.delete(`${base(agent.id)}/document`, { params: { path: 'x.md', version: 1 } })
    const restored = (await admin.post(`${base(agent.id)}/versions/${created.id}/restore`)).data
    assert.equal(restored.content, 'keep me')
    assert.equal(restored.version, 1)
  })

  test('the agent-side rename moves the document and logs it', async () => {
    const agent = await createAgent()
    await put(agent.id, 'old.md', { description: 'd', content: 'text' })
    await command(agent.id, { command: 'rename', path: 'old.md', new_path: 'new.md' })
    const list = (await orgAdmin.get(base(agent.id))).data
    assert.deepEqual(list.documents.map((d: any) => d.path), ['new.md'])
    const versions = (await orgAdmin.get(`${base(agent.id)}/versions`, { params: { path: 'new.md' } })).data
    assert.equal(versions.results[0].op, 'rename')
    assert.equal(versions.results[0].previousPath, 'old.md')
  })

  test('two concurrent stale writes: exactly one wins, the other is a 409', async () => {
    const agent = await createAgent()
    await put(agent.id, 'x.md', { description: 'd', content: 'v1' })
    const results = await Promise.allSettled([
      put(agent.id, 'x.md', { description: 'd', content: 'A', version: 1 }),
      put(agent.id, 'x.md', { description: 'd', content: 'B', version: 1 })
    ])
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1)
    const lost = results.find(r => r.status === 'rejected') as PromiseRejectedResult
    assert.equal(lost.reason.status, 409)
    // the lost write left no version row behind
    assert.equal((await orgAdmin.get(`${base(agent.id)}/versions`, { params: { path: 'x.md' } })).data.count, 2)
  })

  test('another account\'s agent addressed through this account\'s route is a 404', async () => {
    const agent = await createAgent()
    await assert.rejects(admin.get(`/api/memory/organization/test2/${agent.id}`), { status: 404 })
  })

  test('a loose /memories/ path reads the same document', async () => {
    const agent = await createAgent()
    await put(agent.id, 'MEMORY.md', { description: 'd', content: 'core' })
    const read = (await orgAdmin.get(`${base(agent.id)}/document`, { params: { path: '/memories/MEMORY.md' } })).data
    assert.equal(read.path, 'MEMORY.md')
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
