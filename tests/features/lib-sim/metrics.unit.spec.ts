/**
 * Facts derived from a recorded run. They are evidence handed to the judge, not
 * a score: nothing here decides whether a run was good. The two traps they have
 * to survive are both properties of the gateway record — `toolCalls` is
 * cumulative, and a sub-agent's requests are interleaved with the lead's.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { computeMetrics } from '../../../lib-sim/metrics.ts'
import type { Transcript } from '../../../lib-sim/types.ts'
import type { GatewayExchange } from '../../../lib-sim/gateway-capture.ts'

const exchange = (over: Partial<GatewayExchange> = {}): GatewayExchange => ({
  at: 1,
  model: 'assistant',
  toolNames: ['navigate', 'list_pages'],
  messageCount: 2,
  lastUserMessage: 'hello',
  toolCalls: [],
  hostBlockChars: 0,
  toolResults: [],
  ...over
})

const transcript = (over: Partial<Transcript> = {}): Transcript => ({
  case: 'c',
  goal: 'g',
  persona: 'p',
  route: '/r',
  conversation: [],
  gateway: [],
  consoleErrors: [],
  observations: [],
  ...over
})

/** A conversation's requests, as the gateway sees them: the history grows by two. */
const stream = (count: number, over: Partial<GatewayExchange> = {}) =>
  Array.from({ length: count }, (_, i) => exchange({ ...over, messageCount: 2 + i * 2 }))

test.describe('computeMetrics — model roles', () => {
  // The gateway records which ROLE served each request. Inferring roles from
  // message counts instead got three `summarizer` compaction calls reported as
  // sub-agent dispatches, and a judge caught it: the run made no sub-agent call
  // at all. When the record says which role it was, believe the record.
  test('separates roles by what the request says it ran on', () => {
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({ model: 'assistant', messageCount: 2 }),
        exchange({ model: 'assistant', messageCount: 4 }),
        exchange({ model: 'summarizer', messageCount: 2, lastUserMessage: 'x'.repeat(31518) }),
        exchange({ model: 'tools', messageCount: 2, lastUserMessage: 'sub task' })
      ]
    }))
    assert.equal(m.leadModel, 'assistant')
    assert.equal(m.leadRequests, 2)
    assert.deepEqual(m.requestsByModel, { assistant: 2, summarizer: 1, tools: 1 })
  })

  test('reports the largest prompt handed to a non-lead role, and which role took it', () => {
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({ model: 'assistant', messageCount: 2 }),
        exchange({ model: 'summarizer', messageCount: 2, lastUserMessage: 'x'.repeat(31518) })
      ]
    }))
    assert.equal(m.largestNonLeadPromptChars, 31518)
    assert.equal(m.largestNonLeadPromptModel, 'summarizer')
  })

  test('reports no non-lead prompt when every request was the lead', () => {
    const m = computeMetrics(transcript({ gateway: stream(3) }))
    assert.equal(m.largestNonLeadPromptChars, null)
    assert.equal(m.largestNonLeadPromptModel, null)
  })

  test('falls back to the interleaving split when the record names no role', () => {
    // Older transcripts, and any host that does not echo a model id.
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({ model: '', messageCount: 2, toolNames: ['navigate'] }),
        exchange({ model: '', messageCount: 4, toolNames: ['navigate'] }),
        exchange({ model: '', messageCount: 2, toolNames: ['query'] })
      ]
    }))
    assert.equal(m.leadRequests, 2)
    assert.equal(m.requestsByModel, null)
  })
})

test.describe('computeMetrics — the loop', () => {
  test('counts model requests against the messages the person actually sent', () => {
    const m = computeMetrics(transcript({
      conversation: [
        { role: 'user', text: 'a' }, { role: 'assistant', text: 'x' },
        { role: 'user', text: 'b' }, { role: 'assistant', text: 'y' }
      ],
      gateway: stream(6)
    }))
    assert.equal(m.userMessages, 2)
    assert.equal(m.modelRequests, 6)
    assert.equal(m.leadRequests, 6)
    assert.equal(m.requestsPerUserMessage, 3)
  })

  test('reports no ratio rather than dividing by zero', () => {
    const m = computeMetrics(transcript({ gateway: stream(1) }))
    assert.equal(m.userMessages, 0)
    assert.equal(m.requestsPerUserMessage, null)
  })

  test('separates an interleaved second conversation by its own restarted history', () => {
    // The real shape, from a recorded run: the lead is three requests in, a
    // sub-agent runs a fresh two-request conversation of its own, then the lead
    // resumes where it left off. Counting them as one conversation misreports
    // both how long the lead's loop was and where the context went.
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({ model: '', messageCount: 2, toolNames: ['navigate', 'describe_dataset'] }),
        exchange({ model: '', messageCount: 4, toolNames: ['navigate', 'describe_dataset'] }),
        exchange({ model: '', messageCount: 6, toolNames: ['navigate', 'describe_dataset'] }),
        exchange({ model: '', messageCount: 2, toolNames: ['query'], lastUserMessage: 'sub task' }),
        exchange({ model: '', messageCount: 4, toolNames: ['query'], lastUserMessage: 'sub task' }),
        exchange({ model: '', messageCount: 8, toolNames: ['navigate', 'describe_dataset'] })
      ]
    }))
    assert.equal(m.leadRequests, 4)
    assert.equal(m.nonLeadRequests, 2)
  })

  test('keeps the lead as one conversation when navigation changes its tool set', () => {
    // Page tools come and go with the route: a recorded lead went 14 → 19 → 26
    // tools without ever restarting. Splitting on the tool set would have
    // reported two phantom sub-agents.
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({ messageCount: 2, toolNames: ['a'] }),
        exchange({ messageCount: 4, toolNames: ['a', 'b'] }),
        exchange({ messageCount: 6, toolNames: ['a', 'b', 'c'] })
      ]
    }))
    assert.equal(m.leadRequests, 3)
    assert.equal(m.nonLeadRequests, 0)
  })

  test('reports the largest single payload handed to another role', () => {
    const big = 'x'.repeat(32488)
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({ messageCount: 2, toolNames: ['navigate'] }),
        exchange({ model: 'tools', messageCount: 2, toolNames: ['query'], lastUserMessage: big })
      ]
    }))
    assert.equal(m.largestNonLeadPromptChars, 32488)
  })

  test('reports no non-lead payload when none ran', () => {
    const m = computeMetrics(transcript({ gateway: stream(3) }))
    assert.equal(m.largestNonLeadPromptChars, null)
  })
})

test.describe('computeMetrics — what the person saw', () => {
  test('separates textless (tool-chip) bubbles from replies with prose', () => {
    const m = computeMetrics(transcript({
      conversation: [
        { role: 'user', text: 'a' },
        { role: 'assistant', text: '' },
        { role: 'assistant', text: '   ' },
        { role: 'assistant', text: 'a real reply' }
      ]
    }))
    assert.equal(m.assistantBubbles, 3)
    assert.equal(m.textlessAssistantBubbles, 2)
    assert.equal(m.avgVisibleReplyChars, 'a real reply'.length)
  })

  test('reports no average when the assistant never said anything', () => {
    const m = computeMetrics(transcript({ conversation: [{ role: 'assistant', text: '' }] }))
    assert.equal(m.avgVisibleReplyChars, null)
  })
})

test.describe('computeMetrics — duplicate tool calls', () => {
  test('reads the cumulative list as a history, not as repetition', () => {
    // `toolCalls` on exchange N repeats every call from 1..N. Counting each
    // exchange's list independently reports the whole history as duplicated.
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({ messageCount: 2, toolCalls: [{ name: 'navigate', arguments: '{"path":"/a"}' }] }),
        exchange({ messageCount: 4, toolCalls: [{ name: 'navigate', arguments: '{"path":"/a"}' }, { name: 'list_pages', arguments: '{}' }] })
      ]
    }))
    assert.equal(m.duplicateToolCalls, 0)
  })

  test('counts a call genuinely issued twice with the same arguments', () => {
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({
          toolCalls: [
            { name: 'list_base_applications', arguments: '{}' },
            { name: 'list_base_applications', arguments: '{}' }
          ]
        })
      ]
    }))
    assert.equal(m.duplicateToolCalls, 1)
  })

  test('the same tool with different arguments is progress, not repetition', () => {
    const m = computeMetrics(transcript({
      conversation: [{ role: 'user', text: 'a' }],
      gateway: [
        exchange({
          toolCalls: [
            { name: 'navigate', arguments: '{"path":"/a"}' },
            { name: 'navigate', arguments: '{"path":"/b"}' }
          ]
        })
      ]
    }))
    assert.equal(m.duplicateToolCalls, 0)
  })

  test('counts repetitions by the lead and by a sub-agent together', () => {
    const m = computeMetrics(transcript({
      gateway: [
        exchange({ messageCount: 2, toolNames: ['navigate'], toolCalls: [{ name: 'navigate', arguments: '{}' }, { name: 'navigate', arguments: '{}' }] }),
        exchange({ messageCount: 2, toolNames: ['query'], toolCalls: [{ name: 'query', arguments: '{}' }, { name: 'query', arguments: '{}' }] })
      ]
    }))
    assert.equal(m.duplicateToolCalls, 2)
  })
})

test.describe('computeMetrics — what the application reported', () => {
  test('totals the host blocks a conversation carried, counting each request once', () => {
    // The count is cumulative like the history, so the last request of a
    // conversation holds its total.
    const m = computeMetrics(transcript({
      gateway: [
        exchange({ messageCount: 2, hostBlockChars: 400 }),
        exchange({ messageCount: 4, hostBlockChars: 1715 })
      ]
    }))
    assert.equal(m.hostBlockChars, 1715)
  })

  test('is zero for a host that publishes nothing', () => {
    const m = computeMetrics(transcript({ gateway: stream(2) }))
    assert.equal(m.hostBlockChars, 0)
  })

  test('reports nothing rather than zero for a run recorded before it was measured', () => {
    const legacy = { ...exchange(), hostBlockChars: undefined } as unknown as GatewayExchange
    const m = computeMetrics(transcript({ gateway: [legacy] }))
    assert.equal(m.hostBlockChars, null)
  })
})
