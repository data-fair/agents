/**
 * stateful API tests: a catalog tool's resource_link becomes a stored file, named and typed from the
 * response; credentials only on the site the call was bound to; anonymous elsewhere, under the allowlist.
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
const PORT = process.env.NGINX_PORT
const home = `http://localhost:${PORT}`
let fixture: McpFixture

/** The fixture agent with its NHI, on the site-bound entry (tests/features/autonomous-agents/multi-host.api.spec.ts). */
const enrolSiteBound = async (over: Record<string, unknown> = {}) => await admin.post('/api/test-env/autonomous-agent', {
  id: 'test-fixture',
  owner: { type: 'organization', id: 'test1' },
  clientId: 'test-autonomous-agent-nhi',
  siteUrl: home,
  issuer: `${home}/agents/api/nhi`,
  autonomousAgent: { title: 'Link probe', persona: 'x', mcpServers: [{ serverId: 'dev-session-mcp' }], enabled: true, ...over }
})

test.describe('File links', () => {
  test.beforeAll(async () => { fixture = await startMcpFixture(FIXTURE_PORT) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetExportRequests()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a link without extension is stored under the name its response gives, and the text names the stored path', async () => {
    const agent = await createFilesAgent()
    const { assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: agent.id }, 'call tool export_closures {"district":"city-center"}')
    const output = outputOf(callPart(assistant, 'export_closures'))
    assert.match(output, /The export of the road closures of city-center: \/closures-city-center\.csv/)
    assert.match(output, /Saved to your files: \/closures-city-center\.csv \(text\/csv, [\d.]+ (B|kB)\)\./)
    assert.ok(!output.includes(`${FIXTURE_ORIGIN}/exports`), 'the URL is gone from what the model reads')
    const read = await turnOverSocket(orgAdmin, conversationId, 'call tool read_file {"file_path":"/closures-city-center.csv"}')
    assert.match(outputOf(callPart(read.assistant, 'read_file')), /Rue de la Paix/)
  })

  test('a link on another origin than the call\'s site is fetched anonymously, and only under the allowlist', async () => {
    // dev-session-mcp is site-bound, but the link is on the fixture's origin, not the site's.
    await enrolSiteBound()
    const refused = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool export_closures {"district":"riverside"}')
    const part = callPart(refused.assistant, 'export_closures')
    assert.equal(part.state, 'output-error')
    assert.match(outputOf(part), /Could not save the file linked as "closures-riverside": .*is not under this agent's allowed URLs \(none\)/)
    assert.deepEqual(fixture.exportRequests(), [])

    await enrolSiteBound({ web: { enabled: true, allowedUrls: [`${FIXTURE_ORIGIN}/exports`] } })
    const saved = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool export_closures {"district":"riverside"}')
    assert.match(outputOf(callPart(saved.assistant, 'export_closures')), /Saved to your files: \/closures-riverside\.csv/)
    assert.equal(fixture.exportRequests().length, 1)
    assert.equal(fixture.exportRequests()[0].headers.cookie, undefined, 'no credential to another origin')
  })

  test('a link on the call\'s own site is fetched with the call\'s session, without the allowlist', async () => {
    await enrolSiteBound()
    const { assistant, conversationId } = await turnOverSocket(orgAdmin, { agentId: 'test-fixture' }, 'call tool export_my_profile {}')
    const output = outputOf(callPart(assistant, 'export_my_profile'))
    assert.match(output, /Saved to your files: \/me\.json \(application\/json/)
    const read = await turnOverSocket(orgAdmin, conversationId, 'call tool read_file {"file_path":"/me.json"}')
    assert.match(outputOf(callPart(read.assistant, 'read_file')), /test-autonomous-agent-nhi/)
  })
})
