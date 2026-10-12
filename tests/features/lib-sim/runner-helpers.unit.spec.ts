/**
 * The runner helpers host repos used to copy: gateway errors, bridge settings,
 * silent passes, case selection from the environment. No model and no network.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { errorsInSseBody, errorsInResponse } from '../../../lib-sim/gateway-errors.ts'
import { bridgeSettings, MODEL_ROLES } from '../../../lib-sim/bridge-settings.ts'
import { passActions, withSilentPasses } from '../../../lib-sim/silent-passes.ts'
import { simCaseNames } from '../../../lib-sim/cases.ts'

test.describe('gateway errors', () => {
  test('errorsInSseBody keeps only error chunks', () => {
    const body = [
      'data: {"choices":[{"delta":{"content":"Bonjour"}}]}',
      'data: not json',
      'data: {"error":{"message":"rate limited"}}',
      'data: [DONE]'
    ].join('\n')
    assert.deepEqual(errorsInSseBody(body), ['rate limited'])
  })

  test('errorsInResponse treats a refused request as an error, with its reason', () => {
    assert.deepEqual(errorsInResponse(429, '{"allowed":false,"reason":"Account credit limit exceeded"}'), ['HTTP 429: Account credit limit exceeded'])
    assert.deepEqual(errorsInResponse(502, '<html>Bad Gateway</html>'), ['HTTP 502'])
    assert.deepEqual(errorsInResponse(200, 'data: {"choices":[]}\n\ndata: [DONE]\n'), [])
  })

  test('errorsInResponse leaves auth refusals to the judge', () => {
    // The agents service refusing a visitor (e.g. an anonymous action token not yet
    // valid) is product behaviour the person sees, not a provider failure.
    assert.deepEqual(errorsInResponse(401, '{"reason":"anonymous action token not yet valid"}'), [])
    assert.deepEqual(errorsInResponse(403, 'forbidden'), [])
  })
})

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

  test('runs the background roles on the tools model, the evaluator on the assistant model', () => {
    const { org } = bridgeSettings('sonnet', 'haiku')
    assert.equal(org.modelMapping.assistant.id, 'sonnet')
    assert.equal(org.modelMapping.evaluator.id, 'sonnet')
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

  test('prices the run at zero, stores no traces, and quotas no role', () => {
    const { superadmin, org } = bridgeSettings('sonnet', 'haiku')
    for (const entry of superadmin.models) {
      assert.equal(entry.inputPricePerMillion, 0)
      assert.equal(entry.outputPricePerMillion, 0)
    }
    assert.equal(org.storeTraces, false)
    // portal visitors are anonymous, back-office cases admins
    for (const quota of Object.values(org.quotas)) assert.equal(quota.unlimited, true)
  })
})

test.describe('silent passes', () => {
  // A judged run: the person clicked « Valider le brouillon » in the pass that resolved the
  // assistant's wait, the message they wrote then was dropped, and the next pass read a
  // conversation where the assistant validated with nothing from them in between. They told
  // it « Vous avez validé à ma place ».
  test('passActions names what the person did in one pass, not what they looked at', () => {
    const observations = [
      { turn: 1, tool: 'click', args: { name: 'Apparence' }, result: 'clicked "Apparence"' },
      { turn: 2, tool: 'look', args: {}, result: '…' },
      { turn: 2, tool: 'click', args: { name: 'Valider le brouillon' }, result: 'clicked "Valider le brouillon"' },
      { turn: 2, tool: 'type', args: { name: 'Titre', text: 'Agenda' }, result: 'typed' },
      { turn: 2, tool: 'screenshot', args: {}, result: 'screenshot of tab 1' }
    ]
    assert.deepEqual(passActions(observations, 2), ['clicked "Valider le brouillon"', 'typed "Agenda" into "Titre"'])
  })

  test('withSilentPasses puts what the person did where they did it', () => {
    const conversation = [
      { role: 'user', text: 'Mets le portail en vert' },
      { role: 'assistant', text: 'Vérifiez, puis cliquez sur « Valider le brouillon »' },
      { role: 'assistant', text: 'Le brouillon a été validé' },
      { role: 'user', text: 'Merci' }
    ]
    const merged = withSilentPasses(conversation, [{ at: 2, actions: ['clicked "Valider le brouillon"'] }])
    assert.deepEqual(merged.map(m => m.role), ['user', 'assistant', 'user', 'assistant', 'user'])
    assert.match(merged[2].text, /clicked "Valider le brouillon"/)
    assert.match(merged[2].text, /without writing a message/)
    // the conversation read from the chat is left as it is
    assert.equal(conversation.length, 4)
    // a pass with no action leaves nothing
    assert.deepEqual(withSilentPasses(conversation, [{ at: 2, actions: [] }]), conversation)
  })
})

test('simCaseNames reads SIM_CASES', () => {
  assert.deepEqual(simCaseNames({}), [])
  assert.deepEqual(simCaseNames({ SIM_CASES: ' a, b ,,' }), ['a', 'b'])
})
