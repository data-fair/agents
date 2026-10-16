/**
 * stateful API tests: a gated call with a file argument records the file on its approval card, and the
 * approved call — in the continuation run — signs and sends it.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { awaitRun } from '../../support/turn.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket, decideOverSocketToRun } from '../../../dev/socket-turn.ts'
import { FIXTURE_PORT, createFilesAgent, callPart, outputOf } from '../../support/files.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const CONTENT = 'street,reason\nRue A,works\n'
let fixture: McpFixture

test.describe('Approving a call that sends a file', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('the card records path, type and size; the approved call sends that file', async () => {
    const agent = await createFilesAgent({ approvalLevel: 'write' })
    const { conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, `call tool write_file {"file_path":"/clean.csv","content":${JSON.stringify(CONTENT)}}`)
    const gated = await turnOverSocket(orgAdmin, conversationId, 'call tool import_table {"file":"/clean.csv","title":"Clean"}')
    assert.equal(gated.run.stopReason, 'awaiting-approval')
    const part = callPart(gated.assistant, 'import_table')
    assert.equal(part.state, 'approval-requested')
    assert.deepEqual(part.toolMetadata.files, { file: { path: '/clean.csv', mimeType: 'text/csv', size: Buffer.byteLength(CONTENT) } })
    assert.deepEqual(fixture.invokedTools(), [])

    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, part.approval.id, { approved: true })
    await awaitRun(orgAdmin, conversationId, runId)
    assert.deepEqual(fixture.invokedTools(), ['import_table'])
    const messages = (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
    const settled = messages.flatMap((m: any) => m.parts ?? []).find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'import_table')
    assert.match(outputOf(settled), new RegExp(createHash('sha256').update(CONTENT).digest('hex')))
    assert.ok(!JSON.stringify(messages).includes('sig='), 'no signed URL in the record')
  })
})
