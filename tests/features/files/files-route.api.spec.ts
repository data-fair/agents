/**
 * stateful API tests: the signed file URL route MCP servers fetch, the files of a deleted conversation,
 * and the sweep.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, anonymousAx } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { FIXTURE_PORT, createFilesAgent } from '../../support/files.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const CONTENT = 'street,reason\nRue A,works\n'
let fixture: McpFixture

/** A conversation holding /notes.csv. */
const withFile = async () => {
  const agent = await createFilesAgent()
  const { conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, `call tool write_file {"file_path":"/notes.csv","content":${JSON.stringify(CONTENT)}}`)
  return { scope: { ownerType: 'organization', ownerId: 'test1', scopeId: conversationId }, conversationId }
}
const sign = async (scope: any, name: string, now = new Date()) =>
  (await anonymousAx.post('/api/test-env/sign-file-url', { scope, name, now: now.toISOString() })).data.url as string
const get = (url: string, method: 'get' | 'head' = 'get') => anonymousAx.request({ url, method, validateStatus: () => true, responseType: 'text', transformResponse: r => r })

test.describe('Signed file URLs', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a valid URL serves the file with its exact length and type, without a session', async () => {
    const { scope } = await withFile()
    const url = await sign(scope, 'notes.csv')
    assert.ok(url.startsWith(`http://localhost:${process.env.DEV_API_PORT}/api/files/organization/test1/${scope.scopeId}/notes.csv?exp=`))
    const res = await get(url)
    assert.equal(res.status, 200)
    assert.equal(res.data, CONTENT)
    assert.equal(res.headers['content-length'], String(Buffer.byteLength(CONTENT)))
    assert.match(String(res.headers['content-type']), /^text\/csv/)
    assert.equal(res.headers['cache-control'], 'private, no-store')
    const head = await get(url, 'head')
    assert.equal(head.status, 200)
    assert.equal(head.headers['content-length'], String(Buffer.byteLength(CONTENT)))
  })

  test('an expired, forged or re-targeted URL is refused', async () => {
    const { scope } = await withFile()
    const expired = await sign(scope, 'notes.csv', new Date(Date.now() - 11 * 60_000))
    assert.equal((await get(expired)).status, 403)
    assert.match((await get(expired)).data, /expired/)
    const valid = new URL(await sign(scope, 'notes.csv'))
    const forged = new URL(valid)
    forged.searchParams.set('sig', valid.searchParams.get('sig')!.slice(0, -2) + 'AA')
    assert.equal((await get(forged.href)).status, 403)
    const retargeted = new URL(valid.href.replace('/notes.csv?', '/other.csv?'))
    assert.equal((await get(retargeted.href)).status, 403)
    const noSig = new URL(valid)
    noSig.searchParams.delete('sig')
    assert.equal((await get(noSig.href)).status, 403)
  })

  test('a path that is not a stored file name is refused before any signature check', async () => {
    const { scope } = await withFile()
    const valid = new URL(await sign(scope, 'notes.csv'))
    const traversal = `${valid.origin}/api/files/organization/test1/${scope.scopeId}/..%2F..%2Fsecret.csv${valid.search}`
    assert.equal((await get(traversal)).status, 400)
    assert.equal((await get(`${valid.origin}/api/files/group/test1/${scope.scopeId}/notes.csv${valid.search}`)).status, 400)
  })

  test('a validly signed URL for a file that does not exist is a 404', async () => {
    const { scope } = await withFile()
    assert.equal((await get(await sign(scope, 'missing.csv'))).status, 404)
  })

  test('deleting the conversation removes its files at once, though the conversation is archived', async () => {
    const { scope, conversationId } = await withFile()
    assert.equal((await anonymousAx.get(`/api/test-env/files/organization/test1/${scope.scopeId}`)).data.results.length, 1)
    await orgAdmin.delete(`/api/conversations/organization/test1/${conversationId}`)
    assert.deepEqual((await anonymousAx.get(`/api/test-env/files/organization/test1/${scope.scopeId}`)).data.results, [])
  })

  test('the sweep removes what was last written more than 7 days ago, and keeps the rest', async () => {
    const { scope } = await withFile()
    const prefix = 'agent-files/organization/test1/'
    const sixDays = new Date(Date.now() + 6 * 24 * 3600_000).toISOString()
    assert.equal((await anonymousAx.post('/api/test-env/sweep-files', { now: sixDays, prefix })).data.removed, 0)
    const eightDays = new Date(Date.now() + 8 * 24 * 3600_000).toISOString()
    assert.equal((await anonymousAx.post('/api/test-env/sweep-files', { now: eightDays, prefix })).data.removed, 1)
    assert.deepEqual((await anonymousAx.get(`/api/test-env/files/organization/test1/${scope.scopeId}`)).data.results, [])
  })
})
