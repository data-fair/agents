/**
 * Pins the AI SDK behaviour the live tool set rests on (see live-tools.ts).
 *
 * This is a characterization test of a third-party contract, not a red-green test of our
 * own code: it passes against `ai@6` today. Its job is to FAIL on an `ai` upgrade that
 * starts snapshotting `tools` at request time — which would silently reinstate the bug
 * (tools registered mid-turn only callable on the next user turn) with no other symptom.
 *
 * Verified against ai@6.0.116, where `prepareToolsAndToolChoice({ tools, ... })` is called
 * inside the step loop and every execution-time lookup is `tools[toolCall.toolName]`.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { streamText, stepCountIs, tool, jsonSchema, type Tool } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'

const noArgTool = (name: string, execute: () => Promise<string>) => tool({
  description: name,
  inputSchema: jsonSchema({ type: 'object', properties: {}, additionalProperties: false }),
  execute
})

/** A step that emits a single tool call, then one that just answers. */
const step = (parts: any[]) => ({
  stream: new ReadableStream({
    start (c) {
      c.enqueue({ type: 'stream-start', warnings: [] })
      for (const p of parts) c.enqueue(p)
      c.close()
    }
  })
})
const callStep = (toolName: string, toolCallId: string) => step([
  { type: 'tool-call', toolCallId, toolName, input: '{}' },
  { type: 'finish', finishReason: 'tool-calls', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } }
])
const answerStep = () => step([
  { type: 'text-start', id: 't' },
  { type: 'text-delta', id: 't', delta: 'done' },
  { type: 'text-end', id: 't' },
  { type: 'finish', finishReason: 'stop', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } }
])

test('streamText re-reads the live tools object at every step', async () => {
  // Reproduces the production scenario in miniature: the model calls `navigate`, whose
  // execution registers `set_display` (as a newly mounted page's components would), then
  // calls `set_display` in the SAME run.
  const liveTools: Record<string, Tool> = {}
  liveTools.navigate = noArgTool('navigate', async () => {
    liveTools.set_display = noArgTool('set_display', async () => 'displayed')
    return 'navigated'
  })

  const advertisedPerStep: string[][] = []
  let stepIndex = 0
  const model = new MockLanguageModelV3({
    doStream: async ({ tools }: any) => {
      advertisedPerStep.push(tools.map((t: any) => t.name).sort())
      stepIndex++
      if (stepIndex === 1) return callStep('navigate', 'c1')
      if (stepIndex === 2) return callStep('set_display', 'c2')
      return answerStep()
    }
  })

  const result = streamText({
    model,
    messages: [{ role: 'user', content: 'go' }],
    tools: liveTools,
    stopWhen: stepCountIs(10)
  })

  const executed: string[] = []
  for await (const part of result.fullStream) {
    if (part.type === 'tool-result') executed.push(part.toolName)
    assert.notEqual(part.type, 'error', `stream errored: ${JSON.stringify((part as any).error)}`)
  }

  // The tool registered during step 1 is advertised on step 2 of the same run…
  assert.deepEqual(advertisedPerStep[0], ['navigate'])
  assert.deepEqual(advertisedPerStep[1], ['navigate', 'set_display'])
  // …and is actually dispatched, so the lookup table is live too, not just the advert.
  assert.deepEqual(executed, ['navigate', 'set_display'])
})

test('a tool removed mid-run stops being advertised', async () => {
  // The mirror case: a frame unmounts and its tools must stop being offered.
  const liveTools: Record<string, Tool> = {
    navigate: noArgTool('navigate', async () => { delete liveTools.doomed; return 'navigated' }),
    doomed: noArgTool('doomed', async () => 'never')
  }

  const advertisedPerStep: string[][] = []
  let stepIndex = 0
  const model = new MockLanguageModelV3({
    doStream: async ({ tools }: any) => {
      advertisedPerStep.push(tools.map((t: any) => t.name).sort())
      stepIndex++
      return stepIndex === 1 ? callStep('navigate', 'c1') : answerStep()
    }
  })

  const result = streamText({
    model,
    messages: [{ role: 'user', content: 'go' }],
    tools: liveTools,
    stopWhen: stepCountIs(10)
  })
  for await (const part of result.fullStream) {
    assert.notEqual(part.type, 'error', `stream errored: ${JSON.stringify((part as any).error)}`)
  }

  assert.deepEqual(advertisedPerStep[0], ['doomed', 'navigate'])
  assert.deepEqual(advertisedPerStep[1], ['navigate'])
})
