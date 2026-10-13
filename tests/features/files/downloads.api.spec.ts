/**
 * stateful API tests: fetch_url saveAs in a real turn, and the binary refusal with its hint.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { FIXTURE_PORT, FIXTURE_ORIGIN, createFilesAgent, callPart, outputOf } from '../../support/files.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
let fixture: McpFixture

test.describe('Downloads with fetch_url', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('saveAs stores the response, which read_file then reads', async () => {
    const agent = await createFilesAgent()
    const saved = await turnOverSocket(orgAdmin, { agentId: agent.id }, `call tool fetch_url {"url":"${FIXTURE_ORIGIN}/exports/closures?district=city-center","saveAs":"/closures.csv"}`)
    const output = outputOf(callPart(saved.assistant, 'fetch_url'))
    assert.match(output, /"file_path":"\/closures\.csv"/)
    assert.match(output, /"mimeType":"text\/csv"/)
    const read = await turnOverSocket(orgAdmin, saved.conversationId, 'call tool read_file {"file_path":"/closures.csv"}')
    assert.match(outputOf(callPart(read.assistant, 'read_file')), /Rue de la Paix/)
  })

  test('a binary response is refused with the hint, and saved with saveAs', async () => {
    const agent = await createFilesAgent()
    const refused = await turnOverSocket(orgAdmin, { agentId: agent.id }, `call tool fetch_url {"url":"${FIXTURE_ORIGIN}/exports/blob"}`)
    const part = callPart(refused.assistant, 'fetch_url')
    assert.equal(part.state, 'output-error')
    assert.match(outputOf(part), /application\/octet-stream, which cannot be read as text\. Save it as one of your files instead/)
    const saved = await turnOverSocket(orgAdmin, refused.conversationId, `call tool fetch_url {"url":"${FIXTURE_ORIGIN}/exports/blob","saveAs":"/blob.bin"}`)
    assert.match(outputOf(callPart(saved.assistant, 'fetch_url')), /"size":70000/)
  })

  test('saveAs stays under the allowlist and sends no credential', async () => {
    const agent = await createFilesAgent({ web: { enabled: true, allowedUrls: [`${FIXTURE_ORIGIN}/elsewhere`] } })
    fixture.resetExportRequests()
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, `call tool fetch_url {"url":"${FIXTURE_ORIGIN}/exports/blob","saveAs":"/blob.bin"}`)
    assert.match(outputOf(callPart(assistant, 'fetch_url')), /is not under this agent's allowed URLs/)
    assert.deepEqual(fixture.exportRequests(), [])
  })
})
