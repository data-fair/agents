/**
 * Unit tests for SessionRecorder read-only surface.
 * The live-capture API (startTurn, recordPhysicalRequest, etc.) was removed;
 * traces are now reconstructed server-side and loaded via SessionRecorder.fromTrace().
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SessionRecorder, serializeTrace, type SessionTrace } from '../../../ui/src/traces/session-recorder.ts'
import { buildEvaluatorTools } from '../../../ui/src/traces/evaluator-tools.ts'
import { buildSourceTools } from '../../../ui/src/traces/source-tools.ts'

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

    // system-prompt + user-message + tool-call + tool-result + assistant-step + tools-changed + physical-request = 7
    assert.equal(overview.length, 7)
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

test.describe('SessionRecorder - buildCache coverage for compaction / moderation / hidden-context / tools-changed', () => {
  test('hidden-context: turn.hiddenContext produces a hidden-context entry', () => {
    const now = new Date('2020-01-01T00:00:00Z')
    const trace: SessionTrace = {
      systemPrompt: '',
      toolSnapshots: [],
      toolChanges: [],
      turns: [{
        userMessage: 'hello',
        hiddenContext: 'this is injected context',
        timestamp: now,
        steps: []
      }],
      physicalRequests: []
    }
    const recorder = SessionRecorder.fromTrace(trace)
    const overview = recorder.getTraceOverview()

    const hcEntry = overview.find(e => e.type === 'hidden-context')
    assert.ok(hcEntry, 'hidden-context entry must exist when turn.hiddenContext is set')
    assert.ok(hcEntry!.preview.includes('injected context'))

    // hidden-context must appear before the user-message for the same turn
    const hcIdx = overview.findIndex(e => e.type === 'hidden-context')
    const umIdx = overview.findIndex(e => e.type === 'user-message')
    assert.ok(hcIdx < umIdx, 'hidden-context entry should precede the user-message entry (same timestamp, same insertion order)')

    const detail = recorder.getTraceEntry(hcEntry!.index)!
    assert.equal(detail.type, 'hidden-context')
    assert.ok(typeof detail.content === 'string' && detail.content.includes('injected context'))
  })

  test('tools-changed: toolChanges entries produce tools-changed overview entries', () => {
    const t0 = new Date('2020-01-01T00:00:00Z')
    const t1 = new Date('2020-01-01T00:01:00Z')
    const trace: SessionTrace = {
      systemPrompt: '',
      toolSnapshots: [],
      toolChanges: [
        { timestamp: t0, tools: [{ name: 'search', description: 'Search', inputSchema: { type: 'object' } }] },
        { timestamp: t1, tools: [{ name: 'search', description: 'Search', inputSchema: { type: 'object' } }, { name: 'write', description: 'Write', inputSchema: { type: 'object' } }] }
      ],
      turns: [],
      physicalRequests: []
    }
    const recorder = SessionRecorder.fromTrace(trace)
    const overview = recorder.getTraceOverview()

    const tcEntries = overview.filter(e => e.type === 'tools-changed')
    assert.equal(tcEntries.length, 2, 'one tools-changed entry per toolChanges event')

    // First event: 1 tool
    assert.equal(tcEntries[0].label, '1')
    assert.ok(tcEntries[0].preview.includes('search'))

    // Second event: 2 tools
    assert.equal(tcEntries[1].label, '2')
    assert.ok(tcEntries[1].preview.includes('write'))

    const detail = recorder.getTraceEntry(tcEntries[1].index)!
    assert.equal(detail.type, 'tools-changed')
    assert.equal(detail.content.tools.length, 2)
  })

  test('compaction: step.compaction produces a compaction entry', () => {
    const now = new Date('2020-01-01T00:00:00Z')
    const compactionStep: any = {
      timestamp: now,
      messages: [],
      toolCalls: [],
      compaction: {
        summary: 'Compacted history summary',
        originalMessages: [{ role: 'user', content: 'old message' }],
        originalCharCount: 500,
        compactedCharCount: 80
      }
    }
    const trace: SessionTrace = {
      systemPrompt: '',
      toolSnapshots: [],
      toolChanges: [],
      turns: [{
        userMessage: 'continue',
        timestamp: now,
        steps: [compactionStep]
      }],
      physicalRequests: []
    }
    const recorder = SessionRecorder.fromTrace(trace)
    const overview = recorder.getTraceOverview()

    const cEntry = overview.find(e => e.type === 'compaction')
    assert.ok(cEntry, 'compaction entry must exist when step.compaction is set')
    assert.ok(cEntry!.preview.includes('500'), 'preview shows originalCharCount')
    assert.ok(cEntry!.preview.includes('80'), 'preview shows compactedCharCount')

    const detail = recorder.getTraceEntry(cEntry!.index)!
    assert.equal(detail.type, 'compaction')
    assert.equal(detail.content.summary, 'Compacted history summary')
    assert.equal(detail.content.originalCharCount, 500)
    assert.equal(detail.content.compactedCharCount, 80)
    assert.equal(detail.content.originalMessages.length, 1)
  })

  test('moderation: step.moderation produces a moderation entry (action case)', () => {
    const now = new Date('2020-01-01T00:00:00Z')
    const moderationStep: any = {
      timestamp: now,
      messages: [],
      toolCalls: [],
      moderation: {
        action: 'block',
        category: 'profanity',
        reason: 'offensive language',
        skipped: false
      }
    }
    const trace: SessionTrace = {
      systemPrompt: '',
      toolSnapshots: [],
      toolChanges: [],
      turns: [{
        userMessage: 'bad input',
        timestamp: now,
        steps: [moderationStep]
      }],
      physicalRequests: []
    }
    const recorder = SessionRecorder.fromTrace(trace)
    const overview = recorder.getTraceOverview()

    const mEntry = overview.find(e => e.type === 'moderation')
    assert.ok(mEntry, 'moderation entry must exist when step.moderation is set')
    assert.equal(mEntry!.label, 'block', 'label should be the action when not skipped')
    assert.ok(mEntry!.preview.includes('profanity'))
    assert.ok(mEntry!.preview.includes('offensive language'))

    const detail = recorder.getTraceEntry(mEntry!.index)!
    assert.equal(detail.type, 'moderation')
    assert.equal(detail.content.action, 'block')
    assert.equal(detail.content.category, 'profanity')
    assert.equal(detail.content.reason, 'offensive language')
  })

  test('moderation: step.moderation with failOpen uses "skipped" as label', () => {
    const now = new Date('2020-01-01T00:00:00Z')
    const moderationStep: any = {
      timestamp: now,
      messages: [],
      toolCalls: [],
      moderation: {
        action: undefined,
        category: undefined,
        reason: undefined,
        failOpen: 'timeout'
      }
    }
    const trace: SessionTrace = {
      systemPrompt: '',
      toolSnapshots: [],
      toolChanges: [],
      turns: [{
        userMessage: 'neutral input',
        timestamp: now,
        steps: [moderationStep]
      }],
      physicalRequests: []
    }
    const recorder = SessionRecorder.fromTrace(trace)
    const overview = recorder.getTraceOverview()

    const mEntry = overview.find(e => e.type === 'moderation')
    assert.ok(mEntry, 'moderation entry must exist')
    assert.equal(mEntry!.label, 'skipped', 'label should be "skipped" when moderation.skipped is true')
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

test.describe('Evaluator tools - compare mode', () => {
  function buildRecorderWith (systemPrompt: string) {
    const trace: SessionTrace = {
      systemPrompt,
      toolSnapshots: [[{ name: 'search', description: 'Search', inputSchema: { type: 'object' } }]],
      toolChanges: [],
      turns: [{ userMessage: 'hi', timestamp: new Date(), steps: [{ timestamp: new Date(), messages: [{ role: 'assistant', content: [{ type: 'text', text: 'ok' }] }], finishReason: 'stop', toolCalls: [] }] }],
      physicalRequests: []
    }
    return SessionRecorder.fromTrace(trace)
  }
  const opts = { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' }

  test('single mode: trace-scoped tools have no trace param', () => {
    const tools = buildEvaluatorTools(buildRecorderWith('PROMPT-A'), opts)
    const schema = (tools.getTraceEntry as any).inputSchema.jsonSchema
    assert.ok(!schema.properties.trace, 'single mode should not expose a trace param')
    assert.deepEqual(schema.required, ['index'])
  })

  test('compare mode: trace-scoped tools gain a required trace param', () => {
    const tools = buildEvaluatorTools(buildRecorderWith('PROMPT-A'), opts, buildRecorderWith('PROMPT-B'))
    const schema = (tools.getTraceEntry as any).inputSchema.jsonSchema
    assert.deepEqual(schema.properties.trace.enum, ['A', 'B'])
    assert.ok(schema.required.includes('trace'))
    // readArchitectureDoc stays un-scoped
    assert.ok(!(tools.readArchitectureDoc as any).inputSchema.jsonSchema.properties.trace)
  })

  test('compare mode: getSessionConfig routes to A or B by the trace param', async () => {
    const tools = buildEvaluatorTools(buildRecorderWith('PROMPT-A'), opts, buildRecorderWith('PROMPT-B'))
    const ra = await (tools.getSessionConfig as any).execute({ trace: 'A' })
    const rb = await (tools.getSessionConfig as any).execute({ trace: 'B' })
    assert.ok(ra.includes('PROMPT-A'))
    assert.ok(rb.includes('PROMPT-B'))
    assert.ok(!ra.includes('PROMPT-B'))
  })

  test('compare mode: getTraceOverview routes to B', async () => {
    const traceA: SessionTrace = {
      systemPrompt: 'PROMPT-A',
      toolSnapshots: [],
      toolChanges: [],
      turns: [{ userMessage: 'hello from A', timestamp: new Date(), steps: [] }],
      physicalRequests: []
    }
    const traceB: SessionTrace = {
      systemPrompt: 'PROMPT-B',
      toolSnapshots: [],
      toolChanges: [],
      turns: [{ userMessage: 'hello from B', timestamp: new Date(), steps: [] }],
      physicalRequests: []
    }
    const a = SessionRecorder.fromTrace(traceA)
    const b = SessionRecorder.fromTrace(traceB)
    const tools = buildEvaluatorTools(a, opts, b)
    const resultB = await (tools.getTraceOverview as any).execute({ trace: 'B' })
    assert.ok(typeof resultB === 'string')
    assert.ok(resultB.includes('hello from B'), 'result should contain B user message')
    assert.ok(!resultB.includes('hello from A'), 'result should NOT contain A user message')
    // Also verify routing to A works
    const resultA = await (tools.getTraceOverview as any).execute({ trace: 'A' })
    assert.ok(resultA.includes('hello from A'), 'result should contain A user message')
    assert.ok(!resultA.includes('hello from B'), 'result should NOT contain B user message')
  })

  test('compare mode: trace-scoped tool throws when trace param is omitted', async () => {
    const tools = buildEvaluatorTools(buildRecorderWith('PROMPT-A'), opts, buildRecorderWith('PROMPT-B'))
    await assert.rejects(
      async () => (tools.getTraceOverview as any).execute({}),
      /trace.*parameter.*required|required.*trace.*parameter/i
    )
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

test.describe('source tools', () => {
  test('explore_github exposes path/query/raw with only path required', () => {
    const tools = buildSourceTools({ apiPath: '/agents/api' })
    assert.ok(tools.explore_github, 'explore_github tool present')
    const schema = (tools.explore_github as any).inputSchema.jsonSchema
    assert.deepEqual(schema.required, ['path'])
    assert.ok(schema.properties.path)
    assert.ok(schema.properties.query)
    assert.ok(schema.properties.raw)
  })

  test('explore_github description lists the whitelisted repos', () => {
    const tools = buildSourceTools({ apiPath: '/agents/api' })
    const desc = (tools.explore_github as any).description as string
    assert.match(desc, /data-fair\/agents/)
    assert.match(desc, /data-fair\/data-fair/)
    assert.match(desc, /data-fair\/portals/)
  })
})
