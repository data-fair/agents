/**
 * The AI SDK contract the live tool set rests on (api/src/conversations/model-loop.ts, `liveTools`).
 *
 * `runModelLoop` hands `streamText` ONE map and mutates it in place from `prepareStep` when the page's
 * tools change mid-turn. That works only while the SDK re-reads the map when it builds each step — to
 * advertise the step's tools and to execute its calls. AI SDK 7 builds a per-step copy after
 * `prepareStep`, which keeps the contract; this pins it, so an SDK bump that snapshots the map at the
 * start of the call fails here rather than in the live-tools e2e spec.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { streamText, tool, jsonSchema, isStepCount, type Tool } from 'ai'
import { MockLanguageModelV3, simulateReadableStream } from 'ai/test'

const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } }
const call = (id: string, toolName: string) => simulateReadableStream({
  chunks: [
    { type: 'tool-call', toolCallId: id, toolName, input: '{}' },
    { type: 'finish', finishReason: { unified: 'tool-calls', raw: undefined }, usage }
  ]
})
const say = (text: string) => simulateReadableStream({
  chunks: [
    { type: 'text-start', id: 't' },
    { type: 'text-delta', id: 't', delta: text },
    { type: 'text-end', id: 't' },
    { type: 'finish', finishReason: { unified: 'stop', raw: undefined }, usage }
  ]
})
const plain = (run: () => unknown): Tool => tool({ inputSchema: jsonSchema({ type: 'object', properties: {} }), execute: async () => run() })

test('a tool added to the live map in prepareStep is advertised and executed in that same turn', async () => {
  const advertised: string[][] = []
  const ran: string[] = []
  const model = new MockLanguageModelV3({
    doStream: async (options: any) => {
      advertised.push((options.tools ?? []).map((t: any) => t.name))
      const step = advertised.length
      return { stream: step === 1 ? call('c1', 'open_panel') : step === 2 ? call('c2', 'set_display') : say('done') } as any
    }
  })
  const liveTools: Record<string, Tool> = { open_panel: plain(() => { ran.push('open_panel'); return 'opened' }) }
  const result = streamText({
    model,
    prompt: 'go',
    tools: liveTools,
    stopWhen: isStepCount(5),
    prepareStep: ({ steps }) => {
      // What assembleTools does when the page reports a newly mounted tool: the SAME object, mutated.
      if (steps.length === 1) liveTools.set_display = plain(() => { ran.push('set_display'); return 'shown' })
      return {}
    }
  })
  assert.equal(await result.text, 'done')
  assert.deepEqual(advertised[0], ['open_panel'])
  assert.deepEqual(advertised[1].sort(), ['open_panel', 'set_display'])
  assert.deepEqual(ran, ['open_panel', 'set_display'])
})
