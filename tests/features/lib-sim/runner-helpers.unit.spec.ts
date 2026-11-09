/**
 * The runner helpers host repos used to copy: bridge settings, the review consent,
 * run errors from the conversation export, case selection from the environment.
 * No model and no network.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { bridgeSettings, MODEL_ROLES, REVIEW_CONSENT_COOKIE, REVIEW_CONSENT_YES } from '../../../lib-sim/bridge-settings.ts'
import { runErrors } from '../../../lib-sim/conversation-export.ts'
import { handsOver, runTurns } from '../../../lib-sim/run-simulation.ts'
import { DONE } from '../../../lib-sim/persona.ts'
import { simCaseNames } from '../../../lib-sim/cases.ts'
import { CONSENT_COOKIE, CONSENT_YES } from '../../../ui/src/review/review-consent.ts'

test.describe('bridge settings', () => {
  test('declares the provider openai-compatible in compatible mode', () => {
    const { superadmin } = bridgeSettings('sonnet', 'haiku', 'http://localhost:1/v1')
    assert.equal(superadmin.providers.length, 1)
    assert.equal(superadmin.providers[0].type, 'openai-compatible')
    assert.equal(superadmin.providers[0].baseURL, 'http://localhost:1/v1')
    // In 'default' mode createModel targets /v1/responses, which the bridge does not implement.
    assert.equal(superadmin.providers[0].compatibility, 'compatible')
  })

  test('maps every model role to a catalog entry that serves it', () => {
    const { superadmin, org } = bridgeSettings('sonnet', 'haiku')
    for (const role of MODEL_ROLES) {
      const ref = org.modelMapping[role]
      assert.equal(ref.provider, 'bridge', `role ${role}`)
      const entry = superadmin.models.find(m => m.model.id === ref.id)
      assert.ok(entry?.usage.includes(role), `role ${role}`)
    }
  })

  test('runs the background roles on the tools model', () => {
    const { org } = bridgeSettings('sonnet', 'haiku')
    assert.deepEqual([...MODEL_ROLES].sort(), ['assistant', 'moderator', 'summarizer', 'tools'])
    assert.equal(org.modelMapping.assistant.id, 'sonnet')
    assert.equal(org.modelMapping.tools.id, 'haiku')
    assert.equal(org.modelMapping.summarizer.id, 'haiku')
    assert.equal(org.modelMapping.moderator.id, 'haiku')
  })

  test('lists one catalog entry per model, even when both roles share it', () => {
    assert.equal(bridgeSettings('sonnet', 'haiku').superadmin.models.length, 2)
    const { models } = bridgeSettings('sonnet', 'sonnet').superadmin
    assert.equal(models.length, 1)
    assert.deepEqual([...models[0].usage].sort(), [...MODEL_ROLES].sort())
  })

  test('prices the run at zero, opens the review the export sits behind, and quotas no role', () => {
    const { superadmin, org } = bridgeSettings('sonnet', 'haiku')
    for (const entry of superadmin.models) {
      assert.equal(entry.inputPricePerMillion, 0)
      assert.equal(entry.outputPricePerMillion, 0)
    }
    // the run is read back through the conversation export, which the review gate guards
    assert.equal(org.reviewPersonalAssistant, true)
    // portal visitors are anonymous, back-office cases admins
    for (const quota of Object.values(org.quotas)) assert.equal(quota.unlimited, true)
  })
})

// The consent the export route requires, set by the runner before the chat loads: the same cookie
// the chat's consent sheet writes, so the two cannot drift.
test('the review consent cookie is the chat\'s own', () => {
  assert.equal(REVIEW_CONSENT_COOKIE, CONSENT_COOKIE)
  assert.equal(REVIEW_CONSENT_YES, CONSENT_YES)
})

// A provider failure does not throw: the turn "completes" and the run's own record says it ended in error.
test.describe('run errors from the conversation export', () => {
  const parsed = (runs: any[]) => [{ conversationId: 'c', messages: [], runs, blobs: new Map() }] as any

  test('a run that ended in error makes the case unjudgeable', () => {
    assert.deepEqual(runErrors(parsed([{ status: 'done', calls: [] }, { status: 'error', stopReason: 'provider: rate limited', calls: [] }])), ['provider: rate limited'])
  })

  test('reports the run\'s own error over its stop reason', () => {
    assert.deepEqual(runErrors(parsed([{ status: 'error', stopReason: 'error', error: 'credit cap reached', calls: [] }])), ['credit cap reached'])
  })

  test('finished and aborted runs report nothing', () => {
    assert.deepEqual(runErrors(parsed([{ status: 'done', calls: [] }, { status: 'aborted', calls: [] }])), [])
  })
})

test('simCaseNames reads SIM_CASES', () => {
  assert.deepEqual(simCaseNames({}), [])
  assert.deepEqual(simCaseNames({ SIM_CASES: ' a, b ,,' }), ['a', 'b'])
})

test('hands an approval over like a wait', () => {
  assert.equal(handsOver('approval'), true)
  assert.equal(handsOver('waiting'), true)
  assert.equal(handsOver('ended'), false)
})

/**
 * The turn loop over a fake chat: what the runner sends, and what it holds back after the person acted on a card.
 * The page's state is the fake's; the persona's passes change it, as a click on the card would.
 */
test.describe('the turn loop (runTurns)', () => {
  const fakeChat = () => {
    const page = { bubbles: [] as Array<{ role: 'user' | 'assistant', text: string }>, cards: [] as string[], outcome: 'ended' as 'ended' | 'waiting' | 'approval' }
    const sent: string[] = []
    const chat = {
      sendMessage: async (text: string) => { sent.push(text); page.bubbles.push({ role: 'user', text }, { role: 'assistant', text: 'needs your approval' }); page.cards = ['approval-1']; page.outcome = 'approval' },
      waitForTurn: async () => page.outcome,
      readConversation: async () => [...page.bubbles],
      readApprovalCards: async () => [...page.cards]
    }
    return { page, sent, chat }
  }

  test('a decision that ends on a new card (a script paused again) is a move: the message written with it is held back', async () => {
    const { page, sent, chat } = fakeChat()
    const passes: Array<() => string> = [
      () => 'update the dataset',
      // Approves the card; the resumed script pauses again: a new card, no new text bubble.
      () => { page.cards = ['approval-2']; return 'is it done?' },
      // Approves the second card; the script ends and the assistant replies.
      () => { page.cards = []; page.outcome = 'ended'; page.bubbles.push({ role: 'assistant', text: 'done' }); return 'thanks' },
      () => DONE
    ]
    const conversation: Array<{ role: string, text: string }> = []
    const { turns, error } = await runTurns({ chat, maxTurns: 6, conversation, openChat: async () => {}, nextMessage: async turn => passes[turn - 1]() })
    assert.equal(error, undefined)
    assert.deepEqual(sent, ['update the dataset'], 'nothing sent over the new card')
    assert.equal(turns, 1)
    assert.equal(conversation.at(-1)?.text, 'done')
  })

  test('a card left as it was: the person wrote instead, and the message is sent', async () => {
    const { sent, chat } = fakeChat()
    const passes = ['update the dataset', 'actually, do not', DONE]
    const { turns } = await runTurns({ chat, maxTurns: 6, conversation: [], openChat: async () => {}, nextMessage: async turn => passes[turn - 1] })
    assert.deepEqual(sent, ['update the dataset', 'actually, do not'])
    assert.equal(turns, 2)
  })
})
