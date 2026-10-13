/**
 * stateful API tests: the file tools in a real turn of a configured agent — offered, scoped to the
 * conversation, absent from the personal assistant.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { FIXTURE_PORT, createFilesAgent, callPart, outputOf } from '../../support/files.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const offered = (run: any): string[] => run.calls.flatMap((c: any) => c.toolNames ?? [])
let fixture: McpFixture

test.describe('File tools', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('written, listed and read within a conversation; another conversation has none of them', async () => {
    const agent = await createFilesAgent()
    const first = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool write_file {"file_path":"/notes.csv","content":"street,reason\\nRue A,works\\n"}')
    assert.ok(['ls', 'read_file', 'write_file'].every(name => offered(first.run).includes(name)), offered(first.run).join())
    assert.match(outputOf(callPart(first.assistant, 'write_file')), /Wrote \/notes\.csv \(text\/csv, 26 B\)/)

    const read = await turnOverSocket(orgAdmin, first.conversationId, 'call tool read_file {"file_path":"/notes.csv"}')
    assert.match(outputOf(callPart(read.assistant, 'read_file')), /2\tRue A,works/)
    const listed = await turnOverSocket(orgAdmin, first.conversationId, 'call tool ls {}')
    assert.match(outputOf(callPart(listed.assistant, 'ls')), /- \/notes\.csv — text\/csv, 26 B/)
    assert.equal(callPart(listed.assistant, 'ls').toolMetadata.serverId, 'agent-files')

    const other = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool read_file {"file_path":"/notes.csv"}')
    const part = callPart(other.assistant, 'read_file')
    assert.equal(part.state, 'output-error')
    assert.match(outputOf(part), /There is no file named \/notes\.csv here\. You have no files yet\./)
  })

  test('get_my_configuration says files are on', async () => {
    const agent = await createFilesAgent()
    const { assistant } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool get_my_configuration {}')
    assert.match(outputOf(callPart(assistant, 'get_my_configuration')), /## Files\nOn:/)
  })

  test('the personal assistant is offered no file tool', async () => {
    const { run } = await turnOverSocket(orgAdmin, { agentId: 'personal' }, 'hello')
    assert.ok(!offered(run).some(name => ['ls', 'read_file', 'write_file'].includes(name)), offered(run).join())
  })
})
