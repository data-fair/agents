/**
 * stateful API tests for the approval reviewer in a configured agent's turn
 * (docs/superpowers/specs/2026-11-03-auto-approval-design.md). The mock reviewer answers from the proposed call's
 * arguments (api/src/models/mock-model.ts): REVIEW_DENY, REVIEW_UNSURE, REVIEW_BROKEN, otherwise allow. Whether a
 * tool ran is read from the MCP fixture's own record of calls (`invokedTools`), never from what the model says.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { awaitRun } from '../../support/turn.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { decideOverSocketToRun, turnOverSocket } from '../../../dev/socket-turn.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const createAgent = async (over: any = {}) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Review probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true, ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

const turn = async (target: string | { agentId: string }, content: string) => {
  const { runId, conversationId, run, messages } = await turnOverSocket(orgAdmin, target, content)
  return { conversationId, run, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
}

const callPart = (message: any, toolName: string) =>
  message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)
const messageAt = async (conversationId: string, seq: number) =>
  (await orgAdmin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results.find((m: any) => m.seq === seq)
const reviewCalls = (run: any) => (run.calls ?? []).filter((c: any) => c.modelRole === 'moderator' && c.note === 'review')

test.describe('The approval reviewer', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.MCP_FIXTURE_PORT)) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a reviewed write runs without a card', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool set_note {"note":"ok"}')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['set_note'])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'set_note')
    assert.equal(part.state, 'output-available')
    assert.equal(part.toolMetadata.review.outcome, 'allow')
    assert.equal(reviewCalls(run).length, 1, JSON.stringify(run.calls))
  })

  test('a denied write does not run, and the model is told why', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool set_note {"note":"REVIEW_DENY"}')
    assert.equal(run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'set_note')
    assert.equal(part.state, 'output-denied', JSON.stringify(part))
    assert.equal(part.approval.approved, false)
    assert.equal(part.approval.reason, 'mock deny')
    assert.equal(part.toolMetadata.review.outcome, 'deny')
    // A later turn replays the denial, and nothing runs.
    const next = await turn(conversationId, 'hello')
    assert.equal(next.run.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), [])
  })

  test('an unsure write asks the person, with the concern on the card', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool set_note {"note":"REVIEW_UNSURE"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'set_note')
    assert.equal(part.state, 'approval-requested')
    assert.equal(part.toolMetadata.review.outcome, 'unsure')
    assert.equal(part.toolMetadata.review.code, 'judged')
  })

  test('a destructive call is reviewed, then put to the person', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool delete_note {"note":"ok"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'delete_note')
    assert.equal(part.state, 'approval-requested')
    assert.equal(part.toolMetadata.review.outcome, 'allow')
    assert.equal(part.toolMetadata.review.code, 'judged')
    assert.equal(part.approval.requestReason, 'mock allow')

    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, part.approval.id, { approved: true })
    const approvalRun = await awaitRun(orgAdmin, conversationId, runId)
    assert.equal(approvalRun.stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['delete_note'])
    assert.equal(callPart(await messageAt(conversationId, assistant.seq), 'delete_note').state, 'output-available')
    assert.deepEqual(reviewCalls(approvalRun), [], 'the person-approved call is not reviewed again')
  })

  test('a broken reviewer asks the person in a chat', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tool set_note {"note":"REVIEW_BROKEN"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const part = callPart(await messageAt(conversationId, assistant.seq), 'set_note')
    assert.equal(part.state, 'approval-requested')
    assert.equal(part.toolMetadata.review.code, 'review-failed')
    assert.equal(part.toolMetadata.review.outcome, 'unsure')
  })

  test('a denied call and a carded call in one step', async () => {
    const agent = await createAgent()
    const { run, assistant, conversationId } = await turn({ agentId: agent.id }, 'call tools set_note{"note":"REVIEW_DENY"} delete_note{"note":"ok"}')
    assert.equal(run.stopReason, 'awaiting-approval')
    assert.deepEqual(fixture.invokedTools(), [])
    const stored = await messageAt(conversationId, assistant.seq)
    const denied = callPart(stored, 'set_note')
    assert.equal(denied.state, 'output-denied', JSON.stringify(denied))
    assert.equal(denied.approval.reason, 'mock deny')
    assert.equal(denied.toolMetadata.review.outcome, 'deny')
    const carded = callPart(stored, 'delete_note')
    assert.equal(carded.state, 'approval-requested')
    assert.equal(carded.toolMetadata.review.outcome, 'allow')

    // Deciding the card runs it once; the denied call stays denied and never runs.
    const { runId } = await decideOverSocketToRun(orgAdmin, conversationId, carded.approval.id, { approved: true })
    assert.equal((await awaitRun(orgAdmin, conversationId, runId)).stopReason, 'completed')
    assert.deepEqual(fixture.invokedTools(), ['delete_note'])
    const after = await messageAt(conversationId, assistant.seq)
    assert.equal(callPart(after, 'set_note').state, 'output-denied')
    assert.equal(callPart(after, 'set_note').approval.reason, 'mock deny')
    assert.equal(callPart(after, 'delete_note').state, 'output-available')
  })

  test('three denials in a row stop the turn', async () => {
    const agent = await createAgent()
    const deny = 'set_note{"note":"REVIEW_DENY"}'
    const { run } = await turn({ agentId: agent.id }, `call tools ${deny} ${deny} ${deny}`)
    assert.equal(run.stopReason, 'review-denied')
    assert.deepEqual(fixture.invokedTools(), [])
  })
})
