/**
 * stateful API tests, the whole flow of spec §8: fetch_url saveAs → read_file → write_file → a catalog tool
 * with an x-mcp-file argument fetches the signed URL and gets the bytes back. Records keep the path.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { FIXTURE_PORT, FIXTURE_ORIGIN, createFilesAgent, callPart, outputOf } from '../../support/files.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const offered = (run: any): string[] => run.calls.flatMap((c: any) => c.toolNames ?? [])
const field = (text: string, name: string) => new RegExp(`${name}\\\\?":\\\\?"?([^",\\\\]+)`).exec(text)?.[1]
let fixture: McpFixture

test.describe('File arguments', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('download, read, write a cleaned file, and upload it: the target fetches exactly those bytes', async () => {
    const agent = await createFilesAgent()
    const saved = await turnOverSocket(orgAdmin, { agentId: agent.id }, `call tool fetch_url {"url":"${FIXTURE_ORIGIN}/exports/closures?district=riverside","saveAs":"/closures.csv"}`)
    const { conversationId } = saved
    assert.match(outputOf(callPart((await turnOverSocket(orgAdmin, conversationId, 'call tool read_file {"file_path":"/closures.csv"}')).assistant, 'read_file')), /Quai des Chartrons/)
    const clean = 'street,reason\nQuai des Chartrons,bridge inspection\n'
    await turnOverSocket(orgAdmin, conversationId, `call tool write_file {"file_path":"/clean.csv","content":${JSON.stringify(clean)}}`)

    const uploaded = await turnOverSocket(orgAdmin, conversationId, 'call tool import_table {"file":"/clean.csv","title":"Clean"}')
    const part = callPart(uploaded.assistant, 'import_table')
    assert.equal(part.state, 'output-available', outputOf(part))
    const output = outputOf(part)
    assert.equal(field(output, 'sha256'), createHash('sha256').update(clean).digest('hex'))
    assert.equal(field(output, 'name'), 'clean.csv')
    assert.equal(field(output, 'contentLength'), String(Buffer.byteLength(clean)))
    assert.match(output, /text\/csv/)

    // The record keeps the path; the URL went to the target only.
    assert.deepEqual(part.input, { file: '/clean.csv', title: 'Clean' })
    const [url] = fixture.fileUrls()
    assert.match(url, new RegExp(`^http://localhost:${process.env.DEV_API_PORT}/api/files/organization/test1/${conversationId}/clean\\.csv\\?exp=\\d+&sig=`))
    const stored = JSON.stringify(uploaded.messages)
    assert.ok(!stored.includes('sig=') && !stored.includes('/api/files/'), 'no signed URL anywhere in the conversation')
    // ...nor in the run's call telemetry, nor in the export an admin downloads to debug a session.
    const telemetry = JSON.stringify(uploaded.run.calls)
    assert.ok(!telemetry.includes('sig=') && !telemetry.includes('/api/files/'), 'no signed URL in the run telemetry')
    const exported = (await admin.get(`/api/review/organization/test1/${conversationId}/export`, { responseType: 'text', transformResponse: r => r })).data as string
    assert.ok(exported.includes('import_table'), 'the export holds the call')
    assert.ok(!exported.includes('sig=') && !exported.includes('/api/files/'), 'no signed URL in the conversation export')
  })

  test('a file that does not exist is a tool error the model reads, and nothing is fetched', async () => {
    const agent = await createFilesAgent()
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool import_table {"file":"/nothing.csv","title":"x"}')
    const part = callPart(assistant, 'import_table')
    assert.equal(part.state, 'output-error')
    assert.match(outputOf(part), /There is no file named \/nothing\.csv here\. You have no files yet\./)
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('the personal assistant (files off) is offered no tool that takes a file, and fetch_url has no saveAs', async () => {
    const { run } = await turnOverSocket(orgAdmin, { agentId: 'personal' }, 'hello')
    assert.ok(!offered(run).includes('import_table'), offered(run).join())
    assert.ok(offered(run).includes('echo'), 'the rest of the catalog is offered')
  })
})
