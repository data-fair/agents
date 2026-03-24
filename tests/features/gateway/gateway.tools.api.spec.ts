/**
 * Gateway API tool-forwarding tests - validates that the gateway can forward
 * tool definitions, return tool calls, and accept tool results
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, clean, directoryUrl, baseURL, defaultQuotas } from '../../support/axios.ts'

const user = await axiosAuth('test-standalone1')

const settingsData = {
  providers: [
    {
      id: 'mock-provider',
      type: 'mock',
      name: 'Mock Provider',
      enabled: true
    }
  ],
  models: {
    assistant: {
      model: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: {
          type: 'mock',
          name: 'Mock Provider',
          id: 'mock-provider'
        }
      }
    }
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

test.describe('Gateway API - Tool forwarding', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('send tool definitions and receive tool call back', async () => {
    const provider = await createGatewayProvider()

    // The mock model responds to "call tool <name> <args>" with a tool call
    const result = await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'call tool set_data {"data":"test"}' }],
      tools: {
        set_data: {
          type: 'function' as const,
          function: {
            name: 'set_data',
            description: 'Set the data in the textarea',
            parameters: {
              type: 'object',
              properties: { data: { type: 'string' } },
              required: ['data']
            }
          }
        }
      } as any
    })

    assert.equal(result.finishReason, 'tool-calls')
    assert.ok(result.toolCalls.length > 0)
    assert.equal(result.toolCalls[0].toolName, 'set_data')
  })

  test('send tool result and get final text response', async () => {
    // Use raw HTTP to test the gateway's OpenAI message conversion
    // (AI SDK validates messages client-side, so we bypass it for this test)
    const cookieString = await user.cookieJar.getCookieString(directoryUrl)
    const response = await fetch(`${baseURL}/api/gateway/user/test-standalone1/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieString
      },
      body: JSON.stringify({
        model: 'assistant',
        messages: [
          { role: 'user', content: 'call tool set_data {"data":"test"}' },
          {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call-1',
              type: 'function',
              function: { name: 'set_data', arguments: '{"data":"test"}' }
            }]
          },
          {
            role: 'tool',
            tool_call_id: 'call-1',
            content: JSON.stringify({ success: true })
          },
          { role: 'user', content: 'hello' }
        ]
      })
    })

    assert.equal(response.ok, true)
    const data = await response.json() as any
    assert.equal(data.choices[0].message.content, 'world')
    assert.equal(data.choices[0].finish_reason, 'stop')
  })

  test('generateText without tools still works', async () => {
    const provider = await createGatewayProvider()

    const result = await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })

    assert.equal(result.text, 'world')
    assert.equal(result.finishReason, 'stop')
  })
})
