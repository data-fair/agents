/**
 * Unit tests for SessionRecorder
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SessionRecorder, serializeTrace } from '../../../ui/src/traces/session-recorder.ts'
import { buildEvaluatorTools } from '../../../ui/src/traces/evaluator-tools.ts'

test.describe('SessionRecorder - recording', () => {
  test('records a simple turn with one step', () => {
    const recorder = new SessionRecorder()
    recorder.snapshotTools([{ name: 'search', description: 'Search datasets', inputSchema: { type: 'object' } }])
    recorder.startTurn('hello')
    recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'hi' }] }], 'stop')

    const trace = recorder.getTrace()
    assert.equal(trace.turns.length, 1)
    assert.equal(trace.turns[0].userMessage, 'hello')
    assert.equal(trace.turns[0].steps.length, 1)
    assert.equal(trace.turns[0].steps[0].finishReason, 'stop')
    assert.equal(trace.toolSnapshots.length, 1)
    assert.equal(trace.toolSnapshots[0][0].name, 'search')
  })

  test('setSystemPrompt stores the prompt', () => {
    const recorder = new SessionRecorder()
    recorder.setSystemPrompt('You are helpful')
    assert.equal(recorder.getTrace().systemPrompt, 'You are helpful')
  })

  test('finishStep + addStepMessages sets finishReason on the step', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('hello')
    recorder.startToolCall('tc1', 'search', { q: 'x' })
    recorder.finishToolCall('tc1', { results: [] })
    recorder.finishStep()
    recorder.addStepMessages(
      [{ role: 'assistant', content: [{ type: 'text', text: 'done' }] }],
      'stop'
    )

    const trace = recorder.getTrace()
    // Tool call step + text response step
    assert.equal(trace.turns[0].steps.length, 2)
    // First step has tool calls but no finishReason
    assert.equal(trace.turns[0].steps[0].toolCalls.length, 1)
    // Second step has the response messages with finishReason
    const responseStep = trace.turns[0].steps[1]
    assert.equal(responseStep.finishReason, 'stop')
    assert.equal(responseStep.messages.length, 1)
  })

  test('records multi-step turns', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('multi-step')
    // Step 1: tool call
    recorder.startToolCall('tc1', 'search', { q: 'a' })
    recorder.finishToolCall('tc1', { results: ['a'] })
    recorder.finishStep()
    // Step 2: another tool call
    recorder.startToolCall('tc2', 'fetch', { url: 'http://x' })
    recorder.finishToolCall('tc2', { data: 'ok' })
    recorder.finishStep()
    // Final step: text response
    recorder.addStepMessages(
      [{ role: 'assistant', content: [{ type: 'text', text: 'all done' }] }],
      'stop'
    )

    const trace = recorder.getTrace()
    assert.equal(trace.turns[0].steps.length, 3)
    assert.equal(trace.turns[0].steps[0].toolCalls[0].toolName, 'search')
    assert.equal(trace.turns[0].steps[1].toolCalls[0].toolName, 'fetch')
    assert.equal(trace.turns[0].steps[2].finishReason, 'stop')
  })

  test('records tool calls within a step', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('find data')
    recorder.startToolCall('tc1', 'search', { query: 'test' })
    recorder.finishToolCall('tc1', { results: [] }, 120)
    recorder.finishStep()
    recorder.addStepMessages([], 'stop')

    const trace = recorder.getTrace()
    // finishStep pushed 1 step, addStepMessages with empty messages doesn't push another
    assert.equal(trace.turns[0].steps.length, 1)
    assert.equal(trace.turns[0].steps[0].toolCalls.length, 1)
    assert.equal(trace.turns[0].steps[0].toolCalls[0].toolName, 'search')
    assert.equal(trace.turns[0].steps[0].toolCalls[0].durationMs, 120)
  })

  test('records sub-agent traces within a tool call', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('analyze')
    recorder.startToolCall('tc1', 'subagent_analyst', { task: 'analyze data' })
    recorder.startSubAgent('tc1', 'analyst', 'You are an analyst', 'analyze data', [])
    recorder.recordSubAgentStep('tc1', {
      messages: [{ role: 'assistant', content: [{ type: 'text', text: 'done' }] }],
      finishReason: 'stop',
      toolCalls: [{ toolCallId: 'stc1', toolName: 'queryData', input: { sql: 'SELECT *' } }],
      toolResults: [{ toolCallId: 'stc1', output: { rows: [] } }]
    })
    recorder.finishToolCall('tc1', 'analysis complete', 500)
    recorder.finishStep()
    recorder.addStepMessages([], 'stop')

    const trace = recorder.getTrace()
    const subAgent = trace.turns[0].steps[0].toolCalls[0].subAgent
    assert.ok(subAgent)
    assert.equal(subAgent.name, 'analyst')
    assert.equal(subAgent.steps.length, 1)
    assert.equal(subAgent.steps[0].toolCalls.length, 1)
    assert.equal(subAgent.steps[0].toolCalls[0].toolName, 'queryData')
    assert.deepEqual(subAgent.steps[0].toolCalls[0].input, { sql: 'SELECT *' })
    assert.deepEqual(subAgent.steps[0].toolCalls[0].output, { rows: [] })
  })

  test('records a multi-step sub-agent with correct ordering', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('analyze')
    recorder.startToolCall('tc1', 'subagent_analyst', { task: 'analyze data' })
    recorder.startSubAgent('tc1', 'analyst', 'You are an analyst', 'analyze data', [])
    recorder.recordSubAgentStep('tc1', {
      messages: [{ role: 'assistant', content: [{ type: 'text', text: 'querying' }] }],
      finishReason: 'tool-calls',
      toolCalls: [{ toolCallId: 'stc1', toolName: 'queryData', input: { sql: 'SELECT 1' } }],
      toolResults: [{ toolCallId: 'stc1', output: { rows: [1] } }]
    })
    recorder.recordSubAgentStep('tc1', {
      messages: [{ role: 'assistant', content: [{ type: 'text', text: 'the answer is 1' }] }],
      finishReason: 'stop',
      toolCalls: [],
      toolResults: []
    })
    recorder.finishToolCall('tc1', 'analysis complete', 500)
    recorder.finishStep()
    recorder.addStepMessages([], 'stop')

    const subAgent = recorder.getTrace().turns[0].steps[0].toolCalls[0].subAgent!
    assert.equal(subAgent.steps.length, 2)

    // Inject divergent timestamps mirroring the real async flow: the tool call
    // starts at T0, the sub-agent steps happen at T1/T2, and the call finishes
    // (endTimestamp) at T3. Without the endTimestamp ordering fix the sub-agent-end
    // and parent tool-result entries (stuck at T0) would sort BEFORE the steps.
    const parentTc = recorder.getTrace().turns[0].steps[0].toolCalls[0]
    parentTc.timestamp = new Date('2020-01-01T00:00:00Z')
    parentTc.subAgent!.steps[0].timestamp = new Date('2020-01-01T00:00:01Z')
    parentTc.subAgent!.steps[0].toolCalls[0].timestamp = new Date('2020-01-01T00:00:01Z')
    parentTc.subAgent!.steps[1].timestamp = new Date('2020-01-01T00:00:02Z')
    parentTc.endTimestamp = new Date('2020-01-01T00:00:03Z')

    const overview = recorder.getTraceOverview()
    const idx = (pred: (e: typeof overview[number]) => boolean) => overview.findIndex(pred)

    const subToolCallIdx = idx(e => e.type === 'tool-call' && e.label.includes('queryData'))
    const subToolResultIdx = idx(e => e.type === 'tool-result' && e.label.includes('queryData'))
    const lastSubStepIdx = overview.map((e, i) => ({ e, i })).filter(({ e }) => e.type === 'sub-agent-step').pop()!.i
    const subAgentEndIdx = idx(e => e.type === 'sub-agent-end')
    const parentToolResultIdx = idx(e => e.type === 'tool-result' && e.label.includes('subagent_analyst'))

    assert.ok(subToolCallIdx >= 0, 'sub-agent tool-call entry exists')
    assert.ok(subToolResultIdx >= 0, 'sub-agent tool-result entry exists')
    assert.ok(subAgentEndIdx >= 0, 'sub-agent-end entry exists')
    assert.ok(parentToolResultIdx >= 0, 'parent tool-result entry exists')
    // The fix: sub-agent-end and the parent tool-result must come AFTER the sub-agent's steps.
    assert.ok(subAgentEndIdx > lastSubStepIdx, 'sub-agent-end comes after the sub-agent steps')
    assert.ok(parentToolResultIdx > subAgentEndIdx, 'parent tool-result comes after sub-agent-end')

    // The sub-agent step detail exposes finishReason (so the dialog can render its chip)
    const lastSubStepEntry = overview.filter(e => e.type === 'sub-agent-step').pop()!
    assert.equal(recorder.getTraceEntry(lastSubStepEntry.index)!.content.finishReason, 'stop')
  })

  test('records multiple tool snapshots', () => {
    const recorder = new SessionRecorder()
    recorder.snapshotTools([{ name: 'a', description: 'A', inputSchema: {} }])
    recorder.snapshotTools([{ name: 'a', description: 'A', inputSchema: {} }, { name: 'b', description: 'B', inputSchema: {} }])

    const trace = recorder.getTrace()
    assert.equal(trace.toolSnapshots.length, 2)
    assert.equal(trace.toolSnapshots[1].length, 2)
  })
})

test.describe('SessionRecorder - overview and entry accessors', () => {
  function buildRecorderWithTrace () {
    const recorder = new SessionRecorder()
    recorder.setSystemPrompt('You are helpful')
    recorder.snapshotTools([{ name: 'search', description: 'Search', inputSchema: {} }])
    recorder.startTurn('hello')
    recorder.startToolCall('tc1', 'search', { query: 'test' })
    recorder.finishToolCall('tc1', { results: ['a'] }, 50)
    recorder.finishStep()
    recorder.addStepMessages(
      [{ role: 'assistant', content: [{ type: 'text', text: 'Found results' }] }],
      'stop'
    )
    return recorder
  }

  test('getTraceOverview returns flat ordered entries', () => {
    const recorder = buildRecorderWithTrace()
    const overview = recorder.getTraceOverview()

    assert.ok(overview.length >= 4)
    assert.equal(overview[0].type, 'system-prompt')
    assert.ok(overview[0].preview.includes('You are helpful'))
    assert.equal(overview[1].type, 'user-message')
    assert.ok(overview[1].preview.includes('hello'))

    const toolCall = overview.find(e => e.type === 'tool-call')
    assert.ok(toolCall)
    // label now carries only the distinguishing detail (the tool name), not a type prefix
    assert.ok(toolCall.label.includes('search'))

    const toolResult = overview.find(e => e.type === 'tool-result')
    assert.ok(toolResult)
  })

  test('getTraceEntry returns full detail for an index', () => {
    const recorder = buildRecorderWithTrace()
    const overview = recorder.getTraceOverview()
    const userEntry = overview.find(e => e.type === 'user-message')!
    const entry = recorder.getTraceEntry(userEntry.index)

    assert.ok(entry)
    assert.equal(entry.type, 'user-message')
    assert.equal(entry.content, 'hello')
  })

  test('getTraceEntries returns a range', () => {
    const recorder = buildRecorderWithTrace()
    const overview = recorder.getTraceOverview()
    const entries = recorder.getTraceEntries(0, overview.length - 1)

    assert.equal(entries.length, overview.length)
    assert.equal(entries[0].type, overview[0].type)
  })

  test('getTraceEntry returns null for invalid index', () => {
    const recorder = buildRecorderWithTrace()
    const entry = recorder.getTraceEntry(999)
    assert.equal(entry, null)
  })
})

test.describe('Evaluator tools', () => {
  function buildRecorderWithTrace () {
    const recorder = new SessionRecorder()
    recorder.setSystemPrompt('You are helpful')
    recorder.snapshotTools([{ name: 'search', description: 'Search', inputSchema: { type: 'object' } }])
    recorder.startTurn('hello')
    recorder.addStepMessages(
      [{ role: 'assistant', content: [{ type: 'text', text: 'hi there' }] }],
      'stop'
    )
    return recorder
  }

  test('getTraceOverview tool returns overview text', async () => {
    const recorder = buildRecorderWithTrace()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    assert.ok(tools.getTraceOverview)
    const result = await (tools.getTraceOverview as any).execute({})
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('user-message'))
  })

  test('getTraceEntry tool returns detail for index 0', async () => {
    const recorder = buildRecorderWithTrace()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    const result = await (tools.getTraceEntry as any).execute({ index: 0 })
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('You are helpful'))
  })

  test('getSessionConfig tool returns system prompt and tools', async () => {
    const recorder = buildRecorderWithTrace()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    const result = await (tools.getSessionConfig as any).execute({})
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('You are helpful'))
    assert.ok(result.includes('search'))
  })

  test('summarizePhysicalRequest rejects a non-physical entry without calling the model', async () => {
    const recorder = buildRecorderWithTrace()
    const tools = buildEvaluatorTools(recorder, { accountType: 'user', accountId: 'alice', apiPath: '/agents/api' })
    assert.ok(tools.summarizePhysicalRequest)
    // index 0 is the system-prompt entry, not a physical request
    const result = await (tools.summarizePhysicalRequest as any).execute({ index: 0 })
    assert.ok(typeof result === 'string')
    assert.ok(result.toLowerCase().includes('not a physical-request'))
  })
})

test.describe('SessionRecorder - physical requests', () => {
  test('records a physical request and surfaces it with inline metrics', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('hi')
    recorder.recordPhysicalRequest({
      contextId: 'main:0',
      timestamp: new Date('2020-01-01T00:00:00.500Z'),
      modelRole: 'assistant',
      requestBody: { model: 'assistant', messages: [{ role: 'user', content: 'hi' }], tools: [] },
      result: { content: 'hello', toolCalls: [], finishReason: 'stop' },
      inputTokens: 100,
      outputTokens: 20,
      messageCount: 1,
      toolCount: 0,
      bodyChars: 42,
      durationMs: 1200,
      timeToFirstChunkMs: 300
    })

    const overview = recorder.getTraceOverview()
    const pr = overview.find(e => e.type === 'physical-request')
    assert.ok(pr, 'physical-request entry exists')
    assert.ok(pr.label.includes('assistant'))
    assert.ok(pr.preview.includes('100 in'))
    assert.ok(pr.preview.includes('20 out'))

    const detail = recorder.getTraceEntry(pr.index)!
    assert.equal(detail.content.inputTokens, 100)
    assert.equal(detail.content.outputTokens, 20)
    assert.equal(detail.content.requestBody.messages.length, 1)
    assert.equal(detail.content.result.content, 'hello')
  })

  test('orders a physical request before the step it produced', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('hi')
    recorder.recordPhysicalRequest({
      contextId: 'main:0',
      timestamp: new Date('2020-01-01T00:00:00Z'),
      modelRole: 'assistant',
      requestBody: { model: 'assistant', messages: [], tools: [] },
      result: { content: 'hello', toolCalls: [], finishReason: 'stop' },
      inputTokens: 1,
      outputTokens: 1,
      messageCount: 0,
      toolCount: 0,
      bodyChars: 2,
      durationMs: 1
    })
    recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'hello' }] }], 'stop')

    // Force the assistant step to a later timestamp than the physical request.
    recorder.getTrace().turns[0].steps[recorder.getTrace().turns[0].steps.length - 1].timestamp =
      new Date('2020-01-01T00:00:01Z')

    const overview = recorder.getTraceOverview()
    const prIdx = overview.findIndex(e => e.type === 'physical-request')
    const stepIdx = overview.findIndex(e => e.type === 'assistant-step')
    assert.ok(prIdx >= 0 && stepIdx >= 0)
    assert.ok(prIdx < stepIdx, 'physical-request sorts before its assistant-step')
  })
})

test.describe('SessionRecorder - serialization', () => {
  test('serializeTrace + fromTrace round-trips and revives Date fields', () => {
    const recorder = new SessionRecorder()
    recorder.setSystemPrompt('sys')
    recorder.snapshotTools([{ name: 'search', description: 'd', inputSchema: { type: 'object' } }])
    recorder.startTurn('hello')
    recorder.startToolCall('tc1', 'search', { q: 'x' })
    recorder.finishToolCall('tc1', { ok: true })
    recorder.finishStep()
    recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'hi' }] }], 'stop')
    recorder.recordPhysicalRequest({
      contextId: 'c',
      timestamp: new Date(),
      modelRole: 'assistant',
      requestBody: { a: 1 },
      result: { content: 'hi', toolCalls: [] },
      inputTokens: 1,
      outputTokens: 2,
      messageCount: 1,
      toolCount: 1,
      bodyChars: 10,
      durationMs: 5
    })

    const json = serializeTrace(recorder.getTrace())
    const restored = SessionRecorder.fromTrace(JSON.parse(json))

    const overview = restored.getTraceOverview()
    assert.equal(overview.length, recorder.getTraceOverview().length)
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
