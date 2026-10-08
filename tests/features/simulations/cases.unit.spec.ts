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
import { cases, spokeDuringWait, approvalDecided, planTaskDecided, memoryCarriedOver, outcomeReported } from '../../../simulations/cases/index.ts'
import devConfig from '../../../api/config/development.js'
import { parseConversationExport } from '../../../lib-sim/conversation-export.ts'
import { buildConversationExport, EXTRACT_THRESHOLD } from '../../../api/src/review/operations.ts'
import { interruptedWaitResult } from '../../../api/src/conversations/interrupted-turn.ts'
import { runAsMessages } from '../../../api/src/tasks/run-messages.ts'

/** One conversation's export holding these assistant parts, parsed as the runner parses it. */
const exportOf = (id: string, parts: unknown[]) => parseConversationExport({
  conversationId: id,
  jsonl: buildConversationExport({
    conversation: { id },
    messages: [{ seq: 1, role: 'assistant', parts }],
    runs: []
  })
})
const toolPart = (toolName: string, over: Record<string, unknown> = {}) =>
  ({ type: 'dynamic-tool', toolCallId: `${toolName}-1`, toolName, state: 'output-available', input: {}, output: 'ok', ...over })

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
      // An unattended case opens no page, but its route still names the agent its task belongs to,
      // through the same parser — so it has the autonomous agent's shape.
      if (c.surface === 'autonomous-agent' || c.surface === 'unattended') {
        assert.match(c.route, /^\/agents\/(user|organization)\/[^/]+\/chat\?agentId=[^/&]+$/, `${c.name}: route ${c.route}`)
        assert.ok(c.user, `${c.name}: an autonomous agent case must name a user who may instruct it`)
      } else {
        assert.ok(c.route.startsWith('/agents/_dev/'), `${c.name}: route ${c.route}`)
      }
      if (c.surface === 'unattended') continue
      assert.ok(c.maxTurns >= 2 && c.maxTurns <= 12, `${c.name}: maxTurns ${c.maxTurns}`)
    }
  })

  test('an unattended case runs a task and nothing else; only it declares one', () => {
    // Nobody is in the loop of an unattended run: a turn budget would be a promise of persona turns the
    // runner never takes, and a task on a chat case would be silently ignored.
    for (const c of cases) {
      if (c.surface === 'unattended') {
        assert.equal(c.maxTurns, 0, `${c.name}: an unattended case has no turns`)
        assert.ok(c.task?.prompt, `${c.name}: an unattended case must declare its task`)
        assert.ok(!c.conversations, `${c.name}: an unattended case has no conversations`)
      } else {
        assert.equal(c.task, undefined, `${c.name}: only an unattended case runs a task`)
      }
    }
  })

  test('several conversations are a chat case\'s, with turns enough for each', () => {
    for (const c of cases) {
      if (!c.conversations || c.conversations === 1) continue
      assert.notEqual(c.surface, 'unattended')
      // Each conversation needs at least an opening message and the DONE that closes it.
      assert.ok(c.maxTurns >= c.conversations * 2, `${c.name}: ${c.maxTurns} turns for ${c.conversations} conversations`)
    }
  })

  test('an agent configuration is for autonomous-agent cases, and names servers a run can reach', () => {
    const catalog = new Set((devConfig as any).mcpServers.map((server: { id: string }) => server.id))
    for (const c of cases) {
      if (!c.agent) continue
      assert.ok(c.surface === 'autonomous-agent' || c.surface === 'unattended', `${c.name}: only an autonomous-agent or unattended case seeds an agent`)
      for (const ref of c.agent.mcpServers ?? []) {
        assert.ok(catalog.has(ref.serverId), `${c.name}: ${ref.serverId} is not in the dev catalog`)
        // The per-spec fixture (dev-*-mcp without review) is not running during a simulation; only the
        // long-running `npm run dev-mcp` is.
        assert.match(ref.serverId, /^dev-review-/, `${c.name}: ${ref.serverId} is not served during a simulation`)
      }
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

  test('the approval premise holds only when the person decided on the card', () => {
    const decision = (approved: boolean) => ({ toolMetadata: { decision: { userId: 'test1-user1', approved, at: '2026-10-08T00:00:00.000Z' } } })
    // Approved and run, then rejected: both are the person deciding.
    assert.equal(approvalDecided.holds([exportOf('c', [toolPart('wipe_everything', { approval: { id: 'a', approved: true }, ...decision(true) })])]), true)
    assert.equal(approvalDecided.holds([exportOf('c', [toolPart('wipe_everything', { state: 'output-denied', output: undefined, approval: { id: 'a', approved: false }, ...decision(false) })])]), true)
    // Read through a lifted part too: a big result moves the whole part, decision included, to a blob.
    const big = 'x'.repeat(EXTRACT_THRESHOLD + 1)
    assert.equal(approvalDecided.holds([exportOf('c', [toolPart('wipe_everything', { output: big, ...decision(true) })])]), true)
    // Still pending, talked past (rejected with no decision recorded), or never gated: not the case.
    assert.equal(approvalDecided.holds([exportOf('c', [toolPart('wipe_everything', { state: 'approval-requested', output: undefined, approval: { id: 'a' } })])]), false)
    assert.equal(approvalDecided.holds([exportOf('c', [toolPart('wipe_everything', { state: 'output-denied', output: undefined, approval: { id: 'a', approved: false, reason: 'The person sent a new message instead of deciding.' } })])]), false)
    assert.equal(approvalDecided.holds([exportOf('c', [toolPart('list_road_closures', decision(true))])]), false)
    assert.equal(cases.find(c => c.name === 'autonomous-agent-approval')?.premise, approvalDecided)
  })

  test('the plan-task premise holds only when the person decided on a plan_task card', () => {
    const decision = (approved: boolean) => ({ toolMetadata: { decision: { userId: 'test1-user1', approved, at: '2026-10-08T00:00:00.000Z' } } })
    assert.equal(planTaskDecided.holds([exportOf('c', [toolPart('plan_task', { approval: { id: 'a', approved: true }, ...decision(true) })])]), true)
    assert.equal(planTaskDecided.holds([exportOf('c', [toolPart('plan_task', { state: 'output-denied', output: undefined, approval: { id: 'a', approved: false }, ...decision(false) })])]), true)
    // Pending, talked past, another tool decided, or never gated: not the case.
    assert.equal(planTaskDecided.holds([exportOf('c', [toolPart('plan_task', { state: 'approval-requested', output: undefined, approval: { id: 'a' } })])]), false)
    assert.equal(planTaskDecided.holds([exportOf('c', [toolPart('plan_task', { state: 'output-denied', output: undefined, approval: { id: 'a', approved: false, reason: 'The person sent a new message instead of deciding.' } })])]), false)
    assert.equal(planTaskDecided.holds([exportOf('c', [toolPart('wipe_everything', decision(true))])]), false)
    assert.equal(cases.find(c => c.name === 'autonomous-agent-plans-task')?.premise, planTaskDecided)
  })

  test('the memory premise holds only for a write in a conversation before the last', () => {
    const write = toolPart('memory', { input: { command: 'create', path: 'MEMORY.md', file_text: 'tables, street first' } })
    const view = toolPart('memory', { input: { command: 'view' } })
    const asked = toolPart('list_road_closures')
    assert.equal(memoryCarriedOver.holds([exportOf('first', [write]), exportOf('second', [view, asked])]), true)
    // Written only in the last conversation (the person restated it), or with no later conversation.
    assert.equal(memoryCarriedOver.holds([exportOf('first', [asked]), exportOf('second', [write])]), false)
    assert.equal(memoryCarriedOver.holds([exportOf('only', [write])]), false)
    // A read is not a write, and a refused write wrote nothing.
    assert.equal(memoryCarriedOver.holds([exportOf('first', [view]), exportOf('second', [asked])]), false)
    const refused = toolPart('memory', { state: 'output-error', output: undefined, errorText: 'over the cap', input: { command: 'create', path: 'MEMORY.md', file_text: 'x' } })
    assert.equal(memoryCarriedOver.holds([exportOf('first', [refused]), exportOf('second', [asked])]), false)
    assert.equal(cases.find(c => c.name === 'autonomous-agent-memory')?.premise, memoryCarriedOver)
  })

  test('the outcome premise reads a task run export, built as the run export route builds it', () => {
    // runAsMessages is what GET /runs/:runId/export presents a task run through: the prompt, then the parts.
    const taskRunExport = (parts: unknown[]) => parseConversationExport({
      conversationId: 'run1',
      jsonl: buildConversationExport({
        conversation: { kind: 'task', id: 'run1', taskId: 't1', agentId: 'test-fixture' },
        messages: runAsMessages({ id: 'run1', prompt: 'list the closures', parts }),
        runs: [{ id: 'run1', kind: 'task', status: 'done' }]
      })
    })
    const reported = toolPart('report_outcome', { input: { status: 'done', summary: '3 closures' } })
    assert.equal(outcomeReported.holds([taskRunExport([toolPart('list_road_closures'), reported])]), true)
    // Refused (invalid input) and never retried, or never called: no outcome was reported.
    assert.equal(outcomeReported.holds([taskRunExport([toolPart('report_outcome', { state: 'output-error', output: undefined, errorText: 'bad status' })])]), false)
    assert.equal(outcomeReported.holds([taskRunExport([toolPart('list_road_closures')])]), false)
    assert.equal(cases.find(c => c.name === 'scheduled-task-run')?.premise, outcomeReported)
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
