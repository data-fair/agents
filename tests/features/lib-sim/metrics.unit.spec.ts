/**
 * Facts derived from a recorded run. They are evidence handed to the judge, not
 * a score: nothing here decides whether a run was good.
 *
 * The exports are built by the API's own `buildConversationExport`, not written by hand: the sim reads
 * the file a maintainer downloads, so a change to that format must break here rather than leave the
 * harness quietly reporting zero activity.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { writeEvidence } from '../../../lib-sim/transcript.ts'
import { computeMetrics } from '../../../lib-sim/metrics.ts'
import { parseConversationExport, recordedToolCalls } from '../../../lib-sim/conversation-export.ts'
import { buildConversationExport, EXTRACT_THRESHOLD } from '../../../api/src/review/operations.ts'

const toolPart = (toolName: string, input: unknown, over: Record<string, unknown> = {}) =>
  ({ type: 'dynamic-tool', toolName, toolCallId: `${toolName}-${JSON.stringify(input)}`, state: 'output-available', input, output: 'ok', ...over })

const call = (modelRole: string, over: Record<string, unknown> = {}) =>
  ({ modelRole, model: `${modelRole}-model`, inputTokens: 100, outputTokens: 10, ...over })

/** One conversation's export, through the real builder. */
const exported = (opts: { parts?: unknown[], calls?: unknown[], credits?: number } = {}) => parseConversationExport({
  conversationId: 'c1',
  agentId: 'personal',
  jsonl: buildConversationExport({
    conversation: { id: 'c1', agentId: 'personal' },
    messages: [
      { seq: 1, role: 'user', parts: [{ type: 'text', text: 'hello' }] },
      { seq: 2, role: 'assistant', parts: [...(opts.parts ?? []), { type: 'text', text: 'done' }] }
    ],
    runs: [{ id: 'r1', status: 'done', stopReason: 'completed', credits: opts.credits ?? 0, systemPrompt: 'be brief', calls: opts.calls ?? [call('assistant')] }]
  })
})

const conversation = (...roles: string[]) => roles.map(role => ({ role, text: role === 'user' ? 'hi' : 'answer' }))

test.describe('parseConversationExport', () => {
  test('reads the messages and runs the API exports', () => {
    const parsed = exported({ calls: [call('assistant'), call('summarizer')] })
    assert.deepEqual(parsed.messages.map(m => m.role), ['user', 'assistant'])
    assert.equal(parsed.runs.length, 1)
    assert.deepEqual(parsed.runs[0].calls.map(c => c.modelRole), ['assistant', 'summarizer'])
  })

  test('keeps a failed run\'s error, which says why the run is not judgeable', () => {
    const parsed = parseConversationExport({
      conversationId: 'c1',
      jsonl: buildConversationExport({
        conversation: { id: 'c1', agentId: 'personal' },
        messages: [{ seq: 1, role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
        runs: [{ id: 'r1', status: 'error', stopReason: 'error', error: 'credit cap reached', credits: 0, calls: [] }]
      })
    })
    assert.equal(parsed.runs[0].status, 'error')
    assert.equal(parsed.runs[0].error, 'credit cap reached')
  })

  test('refuses a file that is not an export, rather than reporting no activity', () => {
    assert.throws(() => parseConversationExport({ conversationId: 'x', jsonl: '<html>login</html>' }))
    assert.throws(() => parseConversationExport({ conversationId: 'x', jsonl: '' }), /not a conversation export/)
  })

  test('reads a tool call whose part was lifted into a blob', () => {
    // A large result moves the whole part out of its message; the stub keeps the name but not the
    // input, so the call has to be read back from the blob.
    const big = 'x'.repeat(EXTRACT_THRESHOLD + 1)
    const calls = recordedToolCalls(exported({ parts: [toolPart('list_road_closures', { city: 'Lyon' }, { output: big })] }))
    assert.deepEqual(calls.map(({ part, ...call }) => call), [{ toolName: 'list_road_closures', input: { city: 'Lyon' }, failed: false }])
    // The whole part, from the blob — not the stub, which has no output.
    assert.equal(calls[0].part.output, big)
  })
})

test.describe('computeMetrics', () => {
  test('counts model calls by the role the server recorded', () => {
    const m = computeMetrics({ conversation: conversation('user', 'assistant') }, [exported({
      calls: [call('assistant'), call('assistant', { inputTokens: 900 }), call('summarizer', { inputTokens: 5000 })]
    })])
    assert.equal(m.modelRequests, 3)
    assert.deepEqual(m.requestsByRole, { assistant: 2, summarizer: 1 })
    assert.deepEqual(m.largestInputTokensByRole, { assistant: 900, summarizer: 5000 })
    assert.equal(m.requestsPerUserMessage, 3)
  })

  test('reports no ratio rather than dividing by zero', () => {
    assert.equal(computeMetrics({ conversation: [] }, [exported()]).requestsPerUserMessage, null)
  })

  test('counts tool calls, failures and genuine repetition', () => {
    const m = computeMetrics({ conversation: conversation('user', 'assistant') }, [exported({
      parts: [
        toolPart('search', { q: 'a' }),
        toolPart('search', { q: 'a' }),
        // the same tool with different arguments is progress, not repetition
        toolPart('search', { q: 'b' }),
        toolPart('broken', {}, { state: 'output-error', errorText: 'boom' })
      ]
    })])
    assert.equal(m.toolCalls, 4)
    assert.equal(m.failedToolCalls, 1)
    assert.equal(m.duplicateToolCalls, 1)
  })

  test('does not call the same request in two conversations a repetition', () => {
    const parts = [toolPart('search', { q: 'a' })]
    assert.equal(computeMetrics({ conversation: [] }, [exported({ parts }), exported({ parts })]).duplicateToolCalls, 0)
  })

  test('sums host blocks and credits over every call', () => {
    const m = computeMetrics({ conversation: [] }, [exported({ credits: 0.25, calls: [call('assistant', { hostBlockChars: 120 }), call('assistant', { hostBlockChars: 80 })] })])
    assert.equal(m.hostBlockChars, 200)
    assert.equal(m.credits, 0.25)
  })

  test('reports nothing rather than zero when no export was read', () => {
    // A run whose evidence could not be fetched did not make no requests.
    const m = computeMetrics({ conversation: conversation('user', 'assistant') }, [])
    assert.equal(m.conversations, 0)
    for (const key of ['modelRequests', 'requestsByRole', 'requestsPerUserMessage', 'toolCalls', 'duplicateToolCalls', 'hostBlockChars', 'credits'] as const) {
      assert.equal(m[key], null, key)
    }
  })

  test('separates textless (tool-chip) bubbles from replies with prose', () => {
    const m = computeMetrics({
      conversation: [{ role: 'user', text: 'hi' }, { role: 'assistant', text: '' }, { role: 'assistant', text: 'four' }]
    }, [])
    assert.equal(m.assistantBubbles, 2)
    assert.equal(m.textlessAssistantBubbles, 1)
    assert.equal(m.avgVisibleReplyChars, 4)
  })

  test('reports no average when the assistant never said anything', () => {
    assert.equal(computeMetrics({ conversation: [{ role: 'assistant', text: ' ' }] }, []).avgVisibleReplyChars, null)
  })
})

test.describe('writeEvidence', () => {
  test('writes each export beside the transcript and derives the metrics from it', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-evidence-'))
    const jsonl = buildConversationExport({
      conversation: { id: 'c1' },
      messages: [{ seq: 1, role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
      runs: [{ id: 'r1', calls: [call('assistant')] }]
    })
    writeEvidence('case-a', {
      case: 'case-a',
      goal: 'g',
      persona: 'p',
      route: '/r',
      conversation: conversation('user', 'assistant'),
      consoleErrors: [],
      observations: [],
      exports: [{ conversationId: 'c1', agentId: 'personal', jsonl }, { conversationId: 'c2', jsonl: 'not an export' }]
    }, { case: 'case-a', valid: true, assistantModel: 'a', userModel: 'u', turns: 1, durationMs: 1, finishedAt: 'now' }, dir)

    const transcript = JSON.parse(fs.readFileSync(path.join(dir, 'sim-case-a.json'), 'utf8'))
    assert.deepEqual(transcript.exports.map((e: any) => e.file), ['sim-case-a.c1.export.jsonl', 'sim-case-a.c2.export.jsonl'])
    // The file the judge reads is the one the server produced, byte for byte.
    assert.equal(fs.readFileSync(path.join(dir, 'sim-case-a.c1.export.jsonl'), 'utf8'), jsonl)
    // An unreadable export is named, and leaves the rest of the evidence standing.
    assert.match(transcript.evidenceErrors[0], /c2: not a conversation export/)
    const run = JSON.parse(fs.readFileSync(path.join(dir, 'sim-case-a.run.json'), 'utf8'))
    assert.equal(run.metrics.conversations, 1)
    assert.equal(run.metrics.modelRequests, 1)
  })
})
