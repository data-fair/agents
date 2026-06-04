/**
 * API test: mock select_tools seam for tool exploration.
 *
 * Tests the seam at the model layer (via generateText with the mock model directly)
 * and via the gateway HTTP API (round-trip, verifying the tool call name is forwarded).
 *
 * Note: the gateway's streaming path correctly propagates tool call *names* but
 * serialises args as `{}` (pre-existing AI SDK v6 field-name mismatch in the router).
 * We therefore verify the full args at the model layer and the gateway round-trip
 * only for the tool call name.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText, tool, jsonSchema } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createMockLanguageModel } from '../../../api/src/models/mock-model.ts'
import { axiosAuth, superAdmin, clean, directoryUrl, defaultQuotas } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin

const mockProvider = { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: {
    assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: mockProvider } },
    summarizer: { model: { id: 'mock-summarizer', name: 'Mock Summarizer', provider: mockProvider } }
  },
  quotas: defaultQuotas
}

async function createGatewayProvider () {
  const cookieString = await user.cookieJar.getCookieString(directoryUrl)
  return createOpenAI({
    baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/user/test-standalone1/v1`,
    apiKey: 'unused',
    headers: { cookie: cookieString },
    name: 'data-fair-gateway'
  })
}

const selectToolsDef = {
  select_tools: tool({
    description: 'Report relevant tools.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        summary: { type: 'string' },
        toolNames: { type: 'array', items: { type: 'string' } }
      },
      required: ['summary', 'toolNames']
    })
  })
}

test.describe('Tool exploration - mock select_tools seam', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  // ── Model-layer tests (direct, no HTTP gateway) ─────────────────────────────

  test('model layer: summarizer selects every candidate tool when select_tools is forced', async () => {
    const model = createMockLanguageModel('mock-summarizer')
    const result = await generateText({
      model,
      system: 'Select relevant tools.',
      messages: [{
        role: 'user',
        content: 'Intent: set the data\n\n<candidate-tools>\nset_data: Set the data in the textarea\nfilter_map: Filter markers\n</candidate-tools>'
      }],
      tools: selectToolsDef,
      toolChoice: { type: 'tool', toolName: 'select_tools' }
    })

    assert.equal(result.toolCalls.length, 1)
    assert.equal(result.toolCalls[0].toolName, 'select_tools')
    const input = result.toolCalls[0].input as { summary: string, toolNames: string[] }
    assert.deepEqual([...input.toolNames].sort(), ['filter_map', 'set_data'])
    assert.equal(input.summary, 'mock selection')
  })

  test('model layer: no select_tools call when it is not offered (regression)', async () => {
    const model = createMockLanguageModel('mock-summarizer')
    const result = await generateText({
      model,
      messages: [{ role: 'user', content: 'Intent: x\n\n<candidate-tools>\nset_data: foo\n</candidate-tools>' }]
    })
    assert.equal(result.toolCalls.length, 0)
    assert.match(result.text, /Summary:/)
  })

  test('model layer: mock-model regression - select_tools seam does not fire without the tool', async () => {
    const model = createMockLanguageModel('mock-model')
    const result = await generateText({
      model,
      messages: [{ role: 'user', content: 'hello' }]
    })
    assert.equal(result.toolCalls.length, 0)
    assert.equal(result.text, 'world')
  })

  // ── Gateway round-trip (HTTP) ────────────────────────────────────────────────

  test('gateway: summarizer forwards select_tools call name', async () => {
    const provider = await createGatewayProvider()
    const result = await generateText({
      model: provider.chat('summarizer'),
      system: 'Select relevant tools.',
      messages: [{
        role: 'user',
        content: 'Intent: set the data\n\n<candidate-tools>\nset_data: Set the data in the textarea\nfilter_map: Filter markers\n</candidate-tools>'
      }],
      tools: selectToolsDef,
      toolChoice: { type: 'tool', toolName: 'select_tools' }
    })

    // The gateway correctly forwards the tool call name through streaming.
    assert.equal(result.toolCalls.length, 1)
    assert.equal(result.toolCalls[0].toolName, 'select_tools')
  })
})
