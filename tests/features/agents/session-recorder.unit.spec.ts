/**
 * Unit tests for SessionRecorder
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SessionRecorder } from '../../../ui/src/traces/session-recorder.ts'
import { buildEvaluatorTools } from '../../../ui/src/traces/evaluator-tools.ts'

test.describe('SessionRecorder - recording', () => {
  test('records a simple turn with one step', () => {
    const recorder = new SessionRecorder()
    recorder.snapshotTools([{ name: 'search', description: 'Search datasets', inputSchema: { type: 'object' } }])
    recorder.startTurn('hello')
    recorder.addStepMessages([{ role: 'assistant', content: [{ type: 'text', text: 'hi' }] }], { inputTokens: 10, outputTokens: 5 }, 'stop')

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

  test('finishStep + addStepMessages sets usage and finishReason on the step', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('hello')
    recorder.startToolCall('tc1', 'search', { q: 'x' })
    recorder.finishToolCall('tc1', { results: [] })
    recorder.finishStep()
    recorder.addStepMessages(
      [{ role: 'assistant', content: [{ type: 'text', text: 'done' }] }],
      { inputTokens: 20, outputTokens: 10 },
      'stop'
    )

    const trace = recorder.getTrace()
    // Tool call step + text response step
    assert.equal(trace.turns[0].steps.length, 2)
    // First step has tool calls but no usage/finishReason
    assert.equal(trace.turns[0].steps[0].toolCalls.length, 1)
    assert.equal(trace.turns[0].steps[0].usage, undefined)
    // Second step has the response messages with usage/finishReason
    const responseStep = trace.turns[0].steps[1]
    assert.equal(responseStep.finishReason, 'stop')
    assert.deepEqual(responseStep.usage, { inputTokens: 20, outputTokens: 10 })
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
      { inputTokens: 30, outputTokens: 15 },
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
    recorder.addStepMessages([], { inputTokens: 20, outputTokens: 10 }, 'stop')

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
      usage: { inputTokens: 5, outputTokens: 3 },
      finishReason: 'stop',
      toolCalls: [{ toolCallId: 'stc1', toolName: 'queryData', input: { sql: 'SELECT *' } }],
      toolResults: [{ toolCallId: 'stc1', output: { rows: [] } }]
    })
    recorder.finishToolCall('tc1', 'analysis complete', 500)
    recorder.finishStep()
    recorder.addStepMessages([], undefined, 'stop')

    const trace = recorder.getTrace()
    const subAgent = trace.turns[0].steps[0].toolCalls[0].subAgent
    assert.ok(subAgent)
    assert.equal(subAgent.name, 'analyst')
    assert.equal(subAgent.steps.length, 1)
    assert.equal(subAgent.steps[0].toolCalls.length, 1)
    assert.equal(subAgent.steps[0].toolCalls[0].toolName, 'queryData')
    assert.deepEqual(subAgent.steps[0].toolCalls[0].input, { sql: 'SELECT *' })
    assert.deepEqual(subAgent.steps[0].toolCalls[0].output, { rows: [] })
    assert.deepEqual(subAgent.steps[0].usage, { inputTokens: 5, outputTokens: 3 })
  })

  test('records a multi-step sub-agent with per-step usage and correct ordering', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('analyze')
    recorder.startToolCall('tc1', 'subagent_analyst', { task: 'analyze data' })
    recorder.startSubAgent('tc1', 'analyst', 'You are an analyst', 'analyze data', [])
    // Step 1: a tool call inside the sub-agent
    recorder.recordSubAgentStep('tc1', {
      messages: [{ role: 'assistant', content: [{ type: 'text', text: 'querying' }] }],
      usage: { inputTokens: 5, outputTokens: 2 },
      finishReason: 'tool-calls',
      toolCalls: [{ toolCallId: 'stc1', toolName: 'queryData', input: { sql: 'SELECT 1' } }],
      toolResults: [{ toolCallId: 'stc1', output: { rows: [1] } }]
    })
    // Step 2: final text answer
    recorder.recordSubAgentStep('tc1', {
      messages: [{ role: 'assistant', content: [{ type: 'text', text: 'the answer is 1' }] }],
      usage: { inputTokens: 8, outputTokens: 4 },
      finishReason: 'stop',
      toolCalls: [],
      toolResults: []
    })
    recorder.finishToolCall('tc1', 'analysis complete', 500)
    recorder.finishStep()
    recorder.addStepMessages([], undefined, 'stop')

    const subAgent = recorder.getTrace().turns[0].steps[0].toolCalls[0].subAgent!
    assert.equal(subAgent.steps.length, 2)
    assert.deepEqual(subAgent.steps[0].usage, { inputTokens: 5, outputTokens: 2 })
    assert.deepEqual(subAgent.steps[1].usage, { inputTokens: 8, outputTokens: 4 })

    // Overview: sub-agent tool-call/result entries appear, and the PARENT
    // tool-result appears AFTER the sub-agent-end (ordering fix).
    const overview = recorder.getTraceOverview()
    const subToolCall = overview.find(e => e.type === 'tool-call' && e.label.includes('queryData'))
    const subToolResult = overview.find(e => e.type === 'tool-result' && e.label.includes('queryData'))
    assert.ok(subToolCall, 'sub-agent tool-call entry exists')
    assert.ok(subToolResult, 'sub-agent tool-result entry exists')

    const subAgentEndIdx = overview.findIndex(e => e.type === 'sub-agent-end')
    const parentToolResultIdx = overview.findIndex(
      e => e.type === 'tool-result' && e.label.includes('subagent_analyst')
    )
    assert.ok(subAgentEndIdx >= 0, 'sub-agent-end entry exists')
    assert.ok(parentToolResultIdx >= 0, 'parent tool-result entry exists')
    assert.ok(parentToolResultIdx > subAgentEndIdx, 'parent tool-result comes after sub-agent-end')
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
      { inputTokens: 10, outputTokens: 5 },
      'stop'
    )
    return recorder
  }

  test('getTraceOverview returns flat ordered entries', () => {
    const recorder = buildRecorderWithTrace()
    const overview = recorder.getTraceOverview()

    assert.ok(overview.length >= 4)
    assert.equal(overview[0].type, 'system-prompt')
    assert.ok(overview[0].label.includes('system prompt'))
    assert.equal(overview[1].type, 'user-message')
    assert.ok(overview[1].label.includes('user message'))
    assert.ok(overview[1].preview.includes('hello'))

    const toolCall = overview.find(e => e.type === 'tool-call')
    assert.ok(toolCall)
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
      { inputTokens: 10, outputTokens: 5 },
      'stop'
    )
    return recorder
  }

  test('getTraceOverview tool returns overview text', async () => {
    const recorder = buildRecorderWithTrace()
    const tools = buildEvaluatorTools(recorder)
    assert.ok(tools.getTraceOverview)
    const result = await (tools.getTraceOverview as any).execute({})
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('user message'))
  })

  test('getTraceEntry tool returns detail for index 0', async () => {
    const recorder = buildRecorderWithTrace()
    const tools = buildEvaluatorTools(recorder)
    const result = await (tools.getTraceEntry as any).execute({ index: 0 })
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('You are helpful'))
  })

  test('getSessionConfig tool returns system prompt and tools', async () => {
    const recorder = buildRecorderWithTrace()
    const tools = buildEvaluatorTools(recorder)
    const result = await (tools.getSessionConfig as any).execute({})
    assert.ok(typeof result === 'string')
    assert.ok(result.includes('You are helpful'))
    assert.ok(result.includes('search'))
  })
})
