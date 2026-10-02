/**
 * stateful API tests: a chat turn round-trips through the server-held loop.
 *
 * This used to point the AI SDK at `/api/gateway/.../v1` and assert on `generateText`'s result. The
 * gateway is gone, so the turn is asked for and the answer is read back off the conversation — which
 * is also a stronger assertion than before: it goes through the loop, the stored message shape and
 * the read route, rather than through a proxy that only had to forward bytes.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { runTurn } from '../../support/turn.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin

/** The text of a stored message, which is one or more text parts. */
const partsText = (parts: any[]) => (parts ?? []).filter(p => p.type === 'text').map(p => p.text).join('')

test.describe('Chat API', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('a turn reaches the model and the answer is stored', async () => {
    const { conversationId } = await runTurn(user, 'user/test-standalone1', 'hello')

    const res = await user.get(`/api/autonomous-agent-conversations/user/test-standalone1/${conversationId}/messages`)
    const messages = res.data.results as any[]

    // The person's own turn is stored, not only the answer: the server is the single source of the
    // transcript, which is what lets a reload show the conversation.
    const asked = messages.find(m => m.role === 'user')
    assert.ok(asked)
    assert.equal(partsText(asked.parts), 'hello')

    const answered = messages.find(m => m.role === 'assistant')
    assert.ok(answered)
    // The mock provider answers "world" to "hello".
    assert.equal(partsText(answered.parts), 'world')
    assert.notEqual(answered.pending, true, 'a finished turn must not still be marked pending')
  })

  test('the run reaches a terminal status, so a caller can tell the turn ended', async () => {
    const { runId } = await runTurn(user, 'user/test-standalone1', 'hello')
    assert.ok(runId, 'the POST must return a runId for the caller to follow or abort')

    // Runs are read through their own mount, not nested under the conversation.
    const res = await user.get(`/api/autonomous-agent-runs/user/test-standalone1/${runId}`)
    assert.equal(res.data.status, 'done')
    assert.equal(res.data.stopReason, 'completed')
  })
})
