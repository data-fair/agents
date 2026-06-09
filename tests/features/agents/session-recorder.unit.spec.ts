/**
 * Unit tests for SessionRecorder read-only surface.
 * The live-capture API (startTurn, recordPhysicalRequest, etc.) was removed;
 * traces are now reconstructed server-side and loaded via SessionRecorder.fromTrace().
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SessionRecorder, serializeTrace, type SessionTrace } from '../../../ui/src/traces/session-recorder.ts'
import { buildEvaluatorTools } from '../../../ui/src/traces/evaluator-tools.ts'

function buildSampleTrace (): SessionTrace {
  const now = new Date('2020-01-01T00:00:00Z')
  return {
    systemPrompt: 'You are helpful',
    toolSnapshots: [[{ name: 'search', description: 'Search', inputSchema: { type: 'object' } }]],
    toolChanges: [{ timestamp: now, tools: [{ name: 'search', description: 'Search', inputSchema: { type: 'object' } }] }],
    turns: [{
      userMessage: 'hello',
      timestamp: now,
      steps: [
        {
          timestamp: new Date('2020-01-01T00:00:01Z'),
          messages: [],
          toolCalls: [{
            id: 'tc1',
            toolName: 'search',
            input: { query: 'test' },
            output: { results: ['a'] },
            timestamp: new Date('2020-01-01T00:00:01Z'),
            endTimestamp: new Date('2020-01-01T00:00:01.050Z'),
            durationMs: 50
          }]
        },
        {
          timestamp: new Date('2020-01-01T00:00:02Z'),
          messages: [{ role: 'assistant', content: [{ type: 'text', text: 'Found results' }] }],
          finishReason: 'stop',
          toolCalls: []
        }
      ]
    }],
    physicalRequests: [{
      contextId: 'main:0',
      timestamp: new Date('2020-01-01T00:00:01.500Z'),
      modelRole: 'assistant',
      requestBody: { model: 'assistant', messages: [{ role: 'user', content: 'hello' }], tools: [] },
      result: { content: 'Found results', toolCalls: [], finishReason: 'stop' },
      inputTokens: 100,
      outputTokens: 20,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
      messageCount: 1,
      toolCount: 1,
      bodyChars: 42,
      durationMs: 1200,
      timeToFirstChunkMs: 300
    }]
  }
}

test.describe('SessionRecorder - overview and entry accessors', () => {
  test('getTraceOverview returns flat ordered entries', () => {
    const recorder = SessionRecorder.fromTrace(buildSampleTrace())
    const overview = recorder.getTraceOverview()

    assert.ok(overview.length >= 4)
    assert.equal(overview[0].type, 'system-prompt')
    assert.ok(overview[0].preview.includes('You are helpful'))
    assert.equal(overview[1].type, 'user-message')
    assert.ok(overview[1].preview.includes('hello'))

    const toolCall = overview.find(e => e.type === 'tool-call')
    assert.ok(toolCall)
    assert.ok(toolCall.label.includes('search'))

    const toolResult = overview.find(e => e.type === 'tool-result')
    assert.ok(toolResult)
  })

  test('getTraceEntry returns full detail for a user-message index', () => {
    const recorder = SessionRecorder.fromTrace(buildSampleTrace())
    const overview = recorder.getTraceOverview()
    const userEntry = overview.find(e => e.type === 'user-message')!
    const entry = recorder.getTraceEntry(userEntry.index)

    assert.ok(entry)
    assert.equal(entry.type, 'user-message')
    assert.equal(entry.content, 'hello')
  })

  test('getTraceEntries returns a range', () => {
    const recorder = SessionRecorder.fromTrace(buildSampleTrace())
    const overview = recorder.getTraceOverview()
    const entries = recorder.getTraceEntries(0, overview.length - 1)

    assert.equal(entries.length, overview.length)
    assert.equal(entries[0].type, overview[0].type)
  })

  test('getTraceEntry returns null for invalid index', () => {
    const recorder = SessionRecorder.fromTrace(buildSampleTrace())
    const entry = recorder.getTraceEntry(999)
    assert.equal(entry, null)
  })

  test('physical-request entry has correct metrics in preview', () => {
    const recorder = SessionRecorder.fromTrace(buildSampleTrace())
    const overview = recorder.getTraceOverview()
    const pr = overview.find(e => e.type === 'physical-request')
    assert.ok(pr, 'physical-request entry exists')
    assert.ok(pr.label.includes('assistant'))
    assert.ok(pr.preview.includes('100 in'))
    assert.ok(pr.preview.includes('20 out'))

    const detail = recorder.getTraceEntry(pr.index)!
    assert.equal(detail.content.inputTokens, 100)
    assert.equal(detail.content.outputTokens, 20)
    assert.equal(detail.content.result.content, 'Found results')
  })
})

test.describe('SessionRecorder - sub-agent ordering', () => {
  test('sub-agent-end sorts after sub-agent steps', () => {
    const now = new Date('2020-01-01T00:00:00Z')
    const trace: SessionTrace = {
      systemPrompt: '',
      toolSnapshots: [],
      toolChanges: [],
      turns: [{
        userMessage: 'analyze',
        timestamp: now,
        steps: [{
          timestamp: now,
          messages: [],
          toolCalls: [{
            id: 'tc1',
            toolName: 'subagent_analyst',
            input: { task: 'analyze data' },
            output: 'analysis complete',
            timestamp: new Date('2020-01-01T00:00:00Z'),
            endTimestamp: new Date('2020-01-01T00:00:03Z'),
            durationMs: 3000,
            subAgent: {
              name: 'analyst',
              systemPrompt: 'You are an analyst',
              task: 'analyze data',
              tools: [],
              steps: [
                {
                  timestamp: new Date('2020-01-01T00:00:01Z'),
                  messages: [{ role: 'assistant', content: [{ type: 'text', text: 'querying' }] }],
                  finishReason: 'tool-calls',
                  toolCalls: [{
                    id: 'stc1',
                    toolName: 'queryData',
                    input: { sql: 'SELECT 1' },
                    output: { rows: [1] },
                    timestamp: new Date('2020-01-01T00:00:01Z')
                  }]
                },
                {
                  timestamp: new Date('2020-01-01T00:00:02Z'),
                  messages: [{ role: 'assistant', content: [{ type: 'text', text: 'the answer is 1' }] }],
                  finishReason: 'stop',
                  toolCalls: []
                }
              ]
            }
          }]
        }]
      }],
      physicalRequests: []
    }

    const recorder = SessionRecorder.fromTrace(trace)
    const overview = recorder.getTraceOverview()
    const idx = (pred: (e: typeof overview[number]) => boolean) => overview.findIndex(pred)

    const lastSubStepIdx = overview.map((e, i) => ({ e, i })).filter(({ e }) => e.type === 'sub-agent-step').pop()!.i
    const subAgentEndIdx = idx(e => e.type === 'sub-agent-end')
    const parentToolResultIdx = idx(e => e.type === 'tool-result' && e.label.includes('subagent_analyst'))

    assert.ok(subAgentEndIdx >= 0, 'sub-agent-end entry exists')
    assert.ok(parentToolResultIdx >= 0, 'parent tool-result entry exists')
    assert.ok(subAgentEndIdx > lastSubStepIdx, 'sub-agent-end comes after the sub-agent steps')
    assert.ok(parentToolResultIdx > subAgentEndIdx, 'parent tool-result comes after sub-agent-end')

    // The sub-agent step detail exposes finishReason
    const lastSubStepEntry = overview.filter(e => e.type === 'sub-agent-step').pop()!
    assert.equal(recorder.getTraceEntry(lastSubStepEntry.index)!.content.finishReason, 'stop')
  })
})

test.describe('Evaluator tools', () => {
  function buildRecorder () {
    const trace: SessionTrace = {
      systemPrompt: 'You are helpful',
      toolSnapshots: [[{ name: 'search', description: 'Search', inputSchema: { type: 'object' } }]],
      toolChanges: [],
      turns: [{
        userMessage: 'hello',
        timestamp: new Date(),
        steps: [{
          timestamp: new Date(),
          messages: [{ role: 'assistant', content: [{ type: 'text', text: 'hi there' }] }],
          finishReason: 'stop',
          toolCalls: []
        }]
      }],
      physicalRequests: []
    }
    return SessionRecorder.fromTrace(trace)
  }

  test('getTraceOverview tool returns overview text', async () => {
    const recorder = buildRecorder()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    assert.ok(tools.getTraceOverview)
    const result = await (tools.getTraceOverview as any).execute({})
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('user-message'))
  })

  test('getTraceEntry tool returns detail for index 0', async () => {
    const recorder = buildRecorder()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    const result = await (tools.getTraceEntry as any).execute({ index: 0 })
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('You are helpful'))
  })

  test('getSessionConfig tool returns system prompt and tools', async () => {
    const recorder = buildRecorder()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    const result = await (tools.getSessionConfig as any).execute({})
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('You are helpful'))
    assert.ok(result.includes('search'))
  })

  test('summarizePhysicalRequest rejects a non-physical entry without calling the model', async () => {
    const recorder = buildRecorder()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    assert.ok(tools.summarizePhysicalRequest)
    // index 0 is the system-prompt entry, not a physical request
    const result = await (tools.summarizePhysicalRequest as any).execute({ index: 0 })
    assert.ok(typeof result === 'string')
    assert.ok(result.toLowerCase().includes('not a physical-request'))
  })
})

test.describe('SessionRecorder - serialization', () => {
  test('serializeTrace + fromTrace round-trips and revives Date fields', () => {
    const trace = buildSampleTrace()
    const json = serializeTrace(trace)
    const restored = SessionRecorder.fromTrace(JSON.parse(json))

    const original = SessionRecorder.fromTrace(trace)
    const overview = restored.getTraceOverview()
    assert.equal(overview.length, original.getTraceOverview().length)
    for (const e of overview) assert.ok(e.timestamp instanceof Date, `entry ${e.index} timestamp not a Date`)
    assert.ok(restored.getTrace().turns[0].timestamp instanceof Date)
    assert.ok(restored.getTrace().turns[0].steps[0].toolCalls[0].timestamp instanceof Date)
    assert.ok(restored.getTrace().turns[0].steps[0].toolCalls[0].endTimestamp instanceof Date)
    assert.ok(restored.getTrace().toolChanges[0].timestamp instanceof Date)
    assert.ok(restored.getTrace().physicalRequests[0].timestamp instanceof Date)
  })

  test('fromTrace tolerates an empty trace', () => {
    const restored = SessionRecorder.fromTrace({ systemPrompt: '', toolSnapshots: [], toolChanges: [], turns: [], physicalRequests: [] })
    assert.deepEqual(restored.getTraceOverview(), [])
  })
})
