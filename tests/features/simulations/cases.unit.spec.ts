/**
 * Deterministic checks on the simulation case registry. No model involved, so
 * these run in the normal suite; they prove each case is the case it claims to be.
 *
 * Selection logic itself (`selectCases`) is tested against the package in
 * tests/features/lib-sim/cases.unit.spec.ts.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cases, spokeDuringWait } from '../../../simulations/cases/index.ts'
import { parseConversationExport } from '../../../lib-sim/conversation-export.ts'
import { buildConversationExport } from '../../../api/src/review/operations.ts'
import { interruptedWaitResult } from '../../../api/src/conversations/interrupted-turn.ts'

test.describe('case registry', () => {
  test('names are unique and filesystem-safe', () => {
    // Evidence files are named `sim-<name>.json`, so a duplicate name silently
    // overwrites another case's transcript and a slash writes outside the
    // evidence directory. Folds in the old "is not empty" check, which on its
    // own only restated that someone had written a case.
    assert.ok(cases.length > 0, 'the registry is empty — every simulation would report "not run"')
    assert.equal(new Set(cases.map(c => c.name)).size, cases.length, 'duplicate case name')
    for (const c of cases) {
      assert.match(c.name, /^[a-z0-9-]+$/, `${c.name}: evidence files are named after this`)
    }
  })

  test('every case has a goal, a persona and a dev route', () => {
    for (const c of cases) {
      assert.ok(c.goal.length > 20, `${c.name}: goal should describe an outcome`)
      assert.ok(c.persona.length > 20, `${c.name}: persona should describe a person`)
      // The route depends on what the persona operates. An in-page-chat case needs a _dev page,
      // which is where the same WebMCP tools a host application registers are registered. An
      // autonomous agent has no such page: it is driven through the chat opened on it, a real
      // product route, so requiring _dev there would have been requiring the wrong thing.
      if (c.surface === 'autonomous-agent') {
        assert.match(c.route, /^\/agents\/(user|organization)\/[^/]+\/chat\?agentId=[^/&]+$/, `${c.name}: route ${c.route}`)
        assert.ok(c.user, `${c.name}: an autonomous agent case must name a user who may instruct it`)
      } else {
        assert.ok(c.route.startsWith('/agents/_dev/'), `${c.name}: route ${c.route}`)
      }
      assert.ok(c.maxTurns >= 2 && c.maxTurns <= 12, `${c.name}: maxTurns ${c.maxTurns}`)
    }
  })

  test('the speak-during-wait premise holds only when the person wrote during a wait', () => {
    const exportWith = (output: string) => parseConversationExport({
      conversationId: 'c',
      jsonl: buildConversationExport({
        conversation: { id: 'c' },
        messages: [{ seq: 1, role: 'assistant', parts: [{ type: 'dynamic-tool', toolCallId: 'w', toolName: 'wait_for_user_action', state: 'output-available', input: {}, output }] }],
        runs: []
      })
    })
    assert.equal(spokeDuringWait.holds([exportWith(interruptedWaitResult('you to click Create'))]), true)
    // Answered by the click, or declined: the case's situation never happened.
    assert.equal(spokeDuringWait.holds([exportWith('<host-events>\n- clicked Create\n</host-events>')]), false)
    assert.equal(spokeDuringWait.holds([]), false)
    assert.equal(cases.find(c => c.name === 'speak-during-wait')?.premise, spokeDuringWait)
  })

  test('no case states an expected result — runs are judged, not diffed', () => {
    // A runtime `c.expected === undefined` assertion could not fail: LocalCase
    // has no such property, so excess-property checking already rejects it at
    // the literal. The registry SOURCE is what a regression would appear in.
    const source = readFileSync('simulations/cases/index.ts', 'utf8')
    assert.equal(
      /^\s*expected\w*\s*:/m.test(source),
      false,
      'a case declares an expected result; runs are judged from their transcript, not diffed against a blob'
    )
  })
})
