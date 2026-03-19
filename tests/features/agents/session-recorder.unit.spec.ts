/**
 * Unit tests for SessionRecorder
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SessionRecorder } from '../../../ui/src/traces/session-recorder.ts'

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

    const step = recorder.getTrace().turns[0].steps[0]
    assert.equal(step.finishReason, 'stop')
    assert.deepEqual(step.usage, { inputTokens: 20, outputTokens: 10 })
    assert.equal(step.toolCalls.length, 1)
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
    assert.equal(trace.turns[0].steps[0].toolCalls.length, 1)
    assert.equal(trace.turns[0].steps[0].toolCalls[0].toolName, 'search')
    assert.equal(trace.turns[0].steps[0].toolCalls[0].durationMs, 120)
  })

  test('records sub-agent traces within a tool call', () => {
    const recorder = new SessionRecorder()
    recorder.startTurn('analyze')
    recorder.startToolCall('tc1', 'subagent_analyst', { task: 'analyze data' })
    recorder.startSubAgent('tc1', 'analyst', 'You are an analyst', 'analyze data', [])
    recorder.startSubAgentToolCall('tc1', 'stc1', 'queryData', { sql: 'SELECT *' })
    recorder.finishSubAgentToolCall('tc1', 'stc1', { rows: [] })
    recorder.finishSubAgentStep('tc1')
    recorder.addSubAgentStepMessages('tc1', [{ role: 'assistant', content: [{ type: 'text', text: 'done' }] }], { inputTokens: 5, outputTokens: 3 })
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
