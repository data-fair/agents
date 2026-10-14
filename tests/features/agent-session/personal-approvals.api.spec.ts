/**
 * stateful API tests for the personal assistant's approval gate: it acts as the person through their own
 * session, so every call that is not a read waits for that person's approval — not only destructive ones,
 * as for a configured agent. And the person deciding is the conversation's owner, whoever they are in the
 * organization: a plain member is not an instructor of anything, and must still decide on their own thread.
 *
 * The MCP fixture is started, but which catalog entry serves a tool name is not asserted (the dev catalog
 * lists the same fixture tools under several entries): the stored call's state says whether it ran.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, defaultQuotas } from '../../support/axios.ts'
import { awaitRun } from '../../support/turn.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { decideOverSocketToRun, turnOverSocket } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const member = await axiosAuth('test1-user1', { org: 'test1' })

const callPart = (message: any, toolName: string) =>
  message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)

test.describe('The personal assistant\'s approval gate', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    // A plain member may use the assistant once their role has a model quota.
    await putMockSettings(admin, 'organization/test1', { quotas: { ...defaultQuotas, user: { unlimited: true, monthlyLimit: 0 } } })
  })

  test('a write waits for the person, who approves it on their own thread', async () => {
    const { run, assistant, conversationId } = await turnOverSocket(member, { agentId: 'portal-assistant' }, 'call tool echo {"value":"x"}')
    assert.equal(run.stopReason, 'awaiting-approval', JSON.stringify(run))
    const part = callPart(assistant, 'echo')
    assert.equal(part.state, 'approval-requested')

    const { runId } = await decideOverSocketToRun(member, conversationId, part.approval.id, { approved: true })
    const continuation = await awaitRun(member, conversationId, runId)
    assert.equal(continuation.stopReason, 'completed', JSON.stringify(continuation))
    const messages = (await member.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
    assert.equal(callPart(messages.find((m: any) => m.seq === assistant.seq), 'echo').state, 'output-available')
  })

  test('a read runs without asking', async () => {
    const { run, assistant } = await turnOverSocket(member, { agentId: 'portal-assistant' }, 'call tool slow_lookup {}')
    assert.equal(run.stopReason, 'completed', JSON.stringify(run))
    assert.equal(callPart(assistant, 'slow_lookup').state, 'output-available')
  })
})
