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
import { fetchConversationExports, OWNER } from '../../../simulations/runner/settings.ts'
import { parseConversationExport, recordedToolCalls } from '../../../lib-sim/conversation-export.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '../../../shared/trace-consent.ts'

const admin = await superAdmin
const user = await axiosAuth(OWNER.id)
const base = `/api/conversations/${OWNER.type}/${OWNER.id}`

/** A turn as the simulated person takes it: consent given, as the runner's cookie gives it. */
const say = async (conversationId: string, content: string, consent = true) => {
  // Through the client's cookie jar: it owns the Cookie header, and replaces one set by hand.
  await (user as any).cookieJar.setCookie(`${CONSENT_COOKIE}=${consent ? CONSENT_YES : 'no'}`, directoryUrl)
  const { runId } = (await user.post(`${base}/${conversationId}/messages`, { content })).data
  for (let i = 0; i < 100; i++) {
    if ((await user.get(`/api/runs/${OWNER.type}/${OWNER.id}/${runId}`)).data.status !== 'running') return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('run never finished')
}

test.describe('Simulation evidence', () => {
  test.beforeEach(async () => {
    await clean()
    // What bridgeSettings sets for a real run, on the mock model.
    await putMockSettings(admin, `${OWNER.type}/${OWNER.id}`, { storeTraces: true })
  })

  test('the runner downloads the export of each conversation the person consented to', async () => {
    const conversation = (await user.post(base, { agentId: 'personal', title: 't' })).data
    // 'call tool' makes the mock call a tool, so the export carries a tool call to count.
    await say(conversation.id, 'call tool echo hi')
    const declined = (await user.post(base, { agentId: 'personal', title: 'declined' })).data
    await say(declined.id, 'hello', false)

    const exports = await fetchConversationExports(OWNER, OWNER.id)
    // Only the consented thread: the runner reads what review would show, nothing more.
    assert.deepEqual(exports.map(e => e.conversationId), [conversation.id])
    assert.equal(exports[0].agentId, 'personal')

    const parsed = parseConversationExport(exports[0])
    assert.ok(parsed.runs[0].calls.some(call => call.modelRole === 'assistant'), 'the run\'s model calls are in the file')
    assert.ok(recordedToolCalls(parsed).length > 0, 'the tool call is in the file')
  })

  test('another person\'s threads on the same account are not this run\'s evidence', async () => {
    const mine = (await user.post(base, { agentId: 'personal', title: 't' })).data
    await say(mine.id, 'hello')
    assert.deepEqual(await fetchConversationExports(OWNER, 'someone-else'), [])
  })
})
