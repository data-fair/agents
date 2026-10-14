/**
 * stateful API tests: a person's own quota bounds a turn while it runs, and nobody runs more than a few
 * turns at once.
 *
 * Quotas were checked once, before a turn's first model call; between steps only the ACCOUNT cap and the
 * per-run budget were read again. So a person, or an anonymous visitor opening many sockets, could start
 * many turns on the same nearly spent quota and each would spend up to a full per-run budget past it.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, defaultQuotas } from '../../support/axios.ts'
import { putMockSettings, mockModels } from '../../support/settings.ts'
import { awaitRun } from '../../support/turn.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { startTurnOverSocket } from '../../../dev/socket-turn.ts'
import { partsText } from '../../../api/src/conversations/operations.ts'

const admin = await superAdmin
const member = await axiosAuth('test1-user1', { org: 'test1' })

test.describe('Quotas while a turn runs', () => {
  let fixture: McpFixture
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => { await clean() })

  test('a person\'s quota crossed during a turn stops it at the next step', async () => {
    // Priced so one step costs ~90 credits, under the 500-credit per-run budget; a daily window of 150
    // (monthly / 4) is crossed by the second step. `loop forever` repeats a read-only call, which the
    // personal assistant makes without asking, until the repeated-call guard stops it at step 5.
    await putMockSettings(admin, 'organization/test1', {
      models: mockModels({ inputPricePerMillion: 1_000, outputPricePerMillion: 1_000 }),
      quotas: { ...defaultQuotas, user: { unlimited: false, monthlyLimit: 600 } }
    })
    const { conversationId, runId } = await startTurnOverSocket(member, { agentId: 'portal-assistant' }, 'loop forever')
    const run = await awaitRun(member, conversationId, runId)
    assert.notEqual(run.stopReason, 'repeated-calls', 'the quota must stop it, not the loop guard')
    assert.ok(run.steps <= 3, `stopped about one step past the quota, after ${run.steps} steps`)
    const messages = (await admin.get(`/api/test-env/conversations/organization/test1/${conversationId}/messages`)).data.results
    assert.match(partsText(messages.find((m: any) => m.role === 'assistant').parts), /quota|limit/i)
  })
})

test.describe('Turns at once', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1', { quotas: { ...defaultQuotas, user: { unlimited: true, monthlyLimit: 0 } } })
  })

  test('one person runs a bounded number of turns at once, and the next is refused until one ends', async () => {
    // api/config/default.js liveTurnsPerCaller. 'stall' holds each turn open far longer than this test.
    const started = []
    try {
      for (let i = 0; i < 5; i++) started.push(await startTurnOverSocket(member, { agentId: 'portal-assistant' }, 'stall'))
      await assert.rejects(startTurnOverSocket(member, { agentId: 'portal-assistant' }, 'stall'), (err: any) => {
        assert.equal(err.status, 429)
        return true
      })
      started.shift()!.abort()
      await new Promise(resolve => setTimeout(resolve, 500))
      started.push(await startTurnOverSocket(member, { agentId: 'portal-assistant' }, 'stall'))
    } finally {
      for (const turn of started) turn.abort()
    }
  })
})
