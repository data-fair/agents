import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { reconstructTrace } from '../../../ui/src/traces/reconstruct-trace.ts'

// minimal stored-request fixture
const req = (over: any) => ({
  conversation: { id: 'c1' },
  contextId: 'turn:t1',
  contextKind: 'turn',
  modelRole: 'assistant',
  operation: { name: 'chat' },
  provider: { name: 'Mock', type: 'mock' },
  request: { model: 'm', body: { model: 'assistant', messages: [], tools: [] }, messageCount: 0, toolCount: 0, bodyChars: 2 },
  response: { content: '', toolCalls: [], finishReason: 'stop' },
  usage: { inputTokens: 0, outputTokens: 0 },
  timing: { durationMs: 1 },
  createdAt: '2026-06-08T00:00:00.000Z',
  ...over
})

test.describe('reconstructTrace (unit)', () => {
  test('maps physical requests 1:1 and extracts the system prompt + tools', () => {
    const reqs = [req({
      createdAt: '2026-06-08T00:00:00.000Z',
      request: {
        model: 'm',
        body: {
          model: 'assistant',
          messages: [
            { role: 'system', content: 'You are helpful.' },
            { role: 'user', content: 'hello' }
          ],
          tools: [{ type: 'function', function: { name: 'search', description: 'find', parameters: { type: 'object' } } }]
        },
        messageCount: 2,
        toolCount: 1,
        bodyChars: 50
      },
      response: { content: 'world', toolCalls: [], finishReason: 'stop' }
    })]
    const trace = reconstructTrace(reqs as any)
    assert.equal(trace.systemPrompt, 'You are helpful.')
    assert.equal(trace.physicalRequests.length, 1)
    assert.equal(trace.physicalRequests[0].modelRole, 'assistant')
    assert.equal(trace.physicalRequests[0].result.content, 'world')
    assert.equal(trace.toolSnapshots[0][0].name, 'search')
    assert.equal(trace.turns.length, 1)
    assert.equal(trace.turns[0].userMessage, 'hello')
  })

  test('pairs a tool call with its result from the next request', () => {
    const reqs = [
      req({
        createdAt: '2026-06-08T00:00:00.000Z',
        request: { model: 'm', body: { model: 'assistant', messages: [{ role: 'user', content: 'go' }], tools: [] }, messageCount: 1, toolCount: 0, bodyChars: 20 },
        response: { content: '', toolCalls: [{ id: 'tc1', name: 'search', arguments: '{"q":"x"}' }], finishReason: 'tool-calls' }
      }),
      req({
        createdAt: '2026-06-08T00:00:01.000Z',
        request: {
          model: 'm',
          body: {
            model: 'assistant',
            messages: [
              { role: 'user', content: 'go' },
              { role: 'assistant', content: '', tool_calls: [{ id: 'tc1', type: 'function', function: { name: 'search', arguments: '{"q":"x"}' } }] },
              { role: 'tool', tool_call_id: 'tc1', content: '{"hits":3}' }
            ],
            tools: []
          },
          messageCount: 3,
          toolCount: 0,
          bodyChars: 80
        },
        response: { content: 'found 3', toolCalls: [], finishReason: 'stop' }
      })
    ]
    const trace = reconstructTrace(reqs as any)
    const calls = trace.turns[0].steps.flatMap(s => s.toolCalls)
    const tc = calls.find(c => c.id === 'tc1')
    assert.ok(tc, 'tool call reconstructed')
    // output is paired from the tool-role message; reconstruction parses JSON
    // string content into an object, but accept either form for robustness.
    const out: any = tc!.output
    const hits = typeof out === 'string' ? JSON.parse(out).hits : out.hits
    assert.equal(hits, 3)
  })

  test('name-based matching: two distinct sub-agents in same step are matched by name, not arrival order', () => {
    // Main turn: one request whose response fires two tool calls (subagent_Alpha, subagent_Beta)
    const mainReq = req({
      createdAt: '2026-06-08T00:00:00.000Z',
      contextKind: 'turn',
      response: {
        content: '',
        toolCalls: [
          { id: 'tc-alpha', name: 'subagent_Alpha', arguments: '{}' },
          { id: 'tc-beta', name: 'subagent_Beta', arguments: '{}' }
        ],
        finishReason: 'tool-calls'
      }
    })

    // Deliberately store Beta BEFORE Alpha by createdAt to prove matching is by name, not order
    const betaSub = req({
      createdAt: '2026-06-08T00:00:01.000Z',
      contextId: 'sub:Beta:0:s1',
      contextKind: 'sub',
      agent: { name: 'Beta', index: 0 },
      request: { model: 'm', body: { model: 'tools', messages: [{ role: 'user', content: 'do beta work' }], tools: [] }, messageCount: 1, toolCount: 0, bodyChars: 30 },
      response: { content: 'beta result', toolCalls: [], finishReason: 'stop' }
    })
    const alphaSub = req({
      createdAt: '2026-06-08T00:00:02.000Z',
      contextId: 'sub:Alpha:0:s1',
      contextKind: 'sub',
      agent: { name: 'Alpha', index: 0 },
      request: { model: 'm', body: { model: 'tools', messages: [{ role: 'user', content: 'do alpha work' }], tools: [] }, messageCount: 1, toolCount: 0, bodyChars: 30 },
      response: { content: 'alpha result', toolCalls: [], finishReason: 'stop' }
    })

    const trace = reconstructTrace([mainReq, betaSub, alphaSub] as any)
    const calls = trace.turns[0].steps.flatMap(s => s.toolCalls)

    const alphaCall = calls.find(c => c.id === 'tc-alpha')
    const betaCall = calls.find(c => c.id === 'tc-beta')

    assert.ok(alphaCall?.subAgent, 'Alpha tool call has a sub-agent block')
    assert.ok(betaCall?.subAgent, 'Beta tool call has a sub-agent block')

    // Name-based matching: subagent_Alpha → Alpha, subagent_Beta → Beta
    assert.equal(alphaCall!.subAgent!.name, 'Alpha', 'subagent_Alpha maps to Alpha sub-agent')
    assert.equal(betaCall!.subAgent!.name, 'Beta', 'subagent_Beta maps to Beta sub-agent')

    // Verify distinct content so we're not accidentally reading the same block
    const alphaContent = alphaCall!.subAgent!.steps[0].messages[0].content
    const betaContent = betaCall!.subAgent!.steps[0].messages[0].content
    assert.equal(alphaContent, 'alpha result')
    assert.equal(betaContent, 'beta result')
  })

  test('groups sub-agent requests under their agent name', () => {
    const reqs = [
      req({ createdAt: '2026-06-08T00:00:00.000Z', response: { content: '', toolCalls: [{ id: 'd1', name: 'delegate', arguments: '{}' }], finishReason: 'tool-calls' } }),
      req({
        createdAt: '2026-06-08T00:00:00.500Z',
        contextId: 'sub:Researcher:0:s1',
        contextKind: 'sub',
        agent: { name: 'Researcher', index: 0 },
        request: { model: 'm', body: { model: 'tools', messages: [{ role: 'user', content: 'research X' }], tools: [] }, messageCount: 1, toolCount: 0, bodyChars: 30 },
        response: { content: 'did research', toolCalls: [], finishReason: 'stop' }
      })
    ]
    const trace = reconstructTrace(reqs as any)
    const sub = trace.turns[0].steps.flatMap(s => s.toolCalls).map(c => c.subAgent).find(Boolean)
    assert.ok(sub, 'sub-agent block exists')
    assert.equal(sub!.name, 'Researcher')
    assert.ok(sub!.steps.length >= 1)
  })
})
