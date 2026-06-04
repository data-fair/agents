/**
 * API test: mock select_tools seam for tool exploration.
 *
 * Both tests go through the real gateway HTTP endpoint via createGatewayProvider() → generateText.
 * The gateway's non-streaming path (generateText in router.ts) returns full tool-call args as JSON,
 * so the toolNames payload is fully asserted here.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText, tool, jsonSchema } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
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

test.describe('Tool exploration - mock select_tools seam (through gateway)', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('summarizer selects every candidate tool when select_tools is forced', async () => {
    const provider = await createGatewayProvider()
    const result = await generateText({
      model: provider.chat('summarizer'),
      system: 'Select relevant tools.',
      messages: [{
        role: 'user',
        content: 'Intent: set the data\n\n<candidate-tools>\nset_data: Set the data in the textarea\nfilter_map: Filter markers\n</candidate-tools>'
      }],
      tools: {
        select_tools: tool({
          description: 'Report relevant tools.',
          inputSchema: jsonSchema({
            type: 'object',
            properties: { summary: { type: 'string' }, toolNames: { type: 'array', items: { type: 'string' } } },
            required: ['summary', 'toolNames']
          })
        })
      },
      toolChoice: { type: 'tool', toolName: 'select_tools' }
    })

    assert.equal(result.toolCalls.length, 1)
    assert.equal(result.toolCalls[0].toolName, 'select_tools')
    const input = result.toolCalls[0].input as { summary: string, toolNames: string[] }
    assert.deepEqual([...input.toolNames].sort(), ['filter_map', 'set_data'])
  })

  test('no select_tools call when it is not offered (regression)', async () => {
    const provider = await createGatewayProvider()
    const result = await generateText({
      model: provider.chat('summarizer'),
      messages: [{ role: 'user', content: 'Intent: x\n\n<candidate-tools>\nset_data: foo\n</candidate-tools>' }]
    })
    assert.equal(result.toolCalls.length, 0)
    assert.match(result.text, /Summary:/)
  })
})
