/**
 * The simulation runner's evidence path, against the real review routes.
 *
 * A simulation is judged on the conversation export. If the runner's download broke — a gate it does
 * not open, a body axios mangles — every case would still run, still read valid, and be judged on no
 * server record at all: exactly how the browser capture it replaced failed, unnoticed.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { turnOverSocket } from '../../../dev/socket-turn.ts'
import { fetchConversationExports, seedAutonomousAgent, runPlannedTask, fetchTaskRunExport, OWNER } from '../../../simulations/runner/settings.ts'
import { outcomeReported } from '../../../simulations/cases/index.ts'
import { parseConversationExport, recordedToolCalls } from '../../../lib-sim/conversation-export.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '../../../ui/src/review/review-consent.ts'

const admin = await superAdmin
const user = await axiosAuth(OWNER.id)

/**
 * The first turn of a thread as the simulated person takes it: consent given, as the runner's cookie
 * gives it — the socket helper reads the cookie and says it, as the chat does. Returns the thread.
 */
const say = async (content: string, consent = true) => {
  // Through the client's cookie jar: it owns the Cookie header, and replaces one set by hand.
  await (user as any).cookieJar.setCookie(`${CONSENT_COOKIE}=${consent ? CONSENT_YES : 'no'}`, directoryUrl)
  return (await turnOverSocket(user, { agentId: 'personal' }, content, { owner: `${OWNER.type}/${OWNER.id}` })).conversationId
}

test.describe('Simulation evidence', () => {
  test.beforeEach(async () => {
    await clean()
    // What bridgeSettings sets for a real run, on the mock model.
    await putMockSettings(admin, `${OWNER.type}/${OWNER.id}`, { reviewPersonalAssistant: true })
  })

  test('the runner downloads the export of each conversation the person consented to', async () => {
    // 'call tool' makes the mock call a tool, so the export carries a tool call to count.
    const conversation = { id: await say('call tool echo hi') }
    await say('hello', false)

    const exports = await fetchConversationExports(OWNER, OWNER.id)
    // Only the consented thread: the runner reads what review would show, nothing more.
    assert.deepEqual(exports.map(e => e.conversationId), [conversation.id])
    assert.equal(exports[0].agentId, 'personal')

    const parsed = parseConversationExport(exports[0])
    assert.ok(parsed.runs[0].calls.some(call => call.modelRole === 'assistant'), 'the run\'s model calls are in the file')
    assert.ok(recordedToolCalls(parsed).length > 0, 'the tool call is in the file')
  })

  test('another person\'s threads on the same account are not this run\'s evidence', async () => {
    await say('hello')
    assert.deepEqual(await fetchConversationExports(OWNER, 'someone-else'), [])
  })
})

// An unattended case's evidence path: the runner plans a task, presses "run now", waits, and reads the
// run's export. On the mock model, so it costs nothing — a broken route, body or poll would otherwise
// only show up as an invalid simulation after spending a subscription on the agent's setup.
test.describe('Simulation evidence of an unattended run', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('the runner runs a planned task and reads it back in the export format the judge reads', async () => {
    const route = '/agents/organization/test1/chat?agentId=test-fixture'
    // No catalog server: nothing to exchange an identity for, so the run needs no MCP server running.
    await seedAutonomousAgent(route, 'test1-user1', { mcpServers: [] })
    const { owner, agentId, run } = await runPlannedTask(route, {
      title: 'Probe',
      prompt: 'call tool report_outcome {"status":"done","summary":"all good"}',
      scheduling: [{ type: 'weekly', month: '*', dayOfMonth: '*', dayOfWeek: '1', hour: 8, minute: 0, timeZone: 'Europe/Paris' }]
    }, 60_000)
    assert.equal(run.status, 'done')

    const exported = await fetchTaskRunExport(owner, agentId, run.id)
    assert.equal(exported.conversationId, run.id)
    const parsed = parseConversationExport(exported)
    assert.equal(parsed.messages[0].role, 'user', 'the task prompt is the first message')
    assert.ok(parsed.runs[0].calls.length > 0, 'the run\'s model calls are in the file')
    // The premise the case is gated on, read on the real file.
    assert.equal(outcomeReported.holds([parsed]), true)
  })
})
