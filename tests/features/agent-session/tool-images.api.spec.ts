/**
 * stateful API tests: an MCP tool's image, stored and replayed as an image.
 *
 * Turning an image-bearing MCP result into image parts was the gateway's job, so without it the model
 * was sent the result as JSON text. And storing it stringified cut the base64 at the result limit, so
 * the record lost the image and the next turn replayed garbage. The mock model's `what did you see`
 * reports how many image parts it actually received.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { runTurn } from '../../support/turn.ts'
import { startMcpFixture, SNAPSHOT_PNG, type McpFixture } from '../../support/mcp-fixture.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })
const OWNER = 'organization/test1'

test.describe('Images from MCP tools', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, OWNER)
  })

  const messagesOf = async (conversationId: string) =>
    (await orgAdmin.get(`/api/test-env/conversations/${OWNER}/${conversationId}/messages`)).data.results as any[]

  test('the image is stored whole, and the next turn sends it to the model as an image', async () => {
    const { conversationId } = await runTurn(orgAdmin, OWNER, 'call tool snapshot {}')
    assert.deepEqual(fixture.invokedTools(), ['snapshot'])

    const call = (await messagesOf(conversationId)).filter(m => m.role === 'assistant').pop()
      .parts.find((part: any) => part.type === 'dynamic-tool' && part.toolName === 'snapshot')
    assert.equal(call.state, 'output-available')
    assert.equal(call.output._agentsMediaResult, true, 'stored as the envelope, not stringified')
    assert.equal(call.output.media[0].data, SNAPSHOT_PNG, 'the image survives whole')
    assert.match(call.output.text, /a chart of closures/)

    await runTurn(orgAdmin, OWNER, 'what did you see', { conversationId })
    const report = JSON.parse((await messagesOf(conversationId)).filter(m => m.role === 'assistant').pop()
      .parts.filter((part: any) => part.type === 'text').map((part: any) => part.text).join(''))
    assert.equal(report.images, 1, 'replayed as an image part, not as base64 in text')
  })
})
