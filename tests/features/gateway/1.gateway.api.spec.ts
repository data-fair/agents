/**
 * Gateway API tests - validates the OpenAI-compatible gateway endpoint
 * using the Vercel AI SDK with a custom provider
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText, streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { axiosAuth, clean, directoryUrl } from '../../support/axios.ts'

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
  chatModel: {
    id: 'mock-model',
    name: 'Mock Model',
    provider: {
      type: 'mock',
      name: 'Mock Provider',
      id: 'mock-provider'
    }
  }
}

async function createGatewayProvider () {
  const cookieString = await user.cookieJar.getCookieString(directoryUrl)
  return createOpenAI({
    baseURL: `http://localhost:${process.env.DEV_API_PORT}/api/gateway/v1`,
    apiKey: 'unused',
    headers: { cookie: cookieString },
    name: 'data-fair-gateway'
  })
}

test.describe('Gateway API - OpenAI-compatible proxy', () => {
  test.beforeEach(async () => {
    await clean()
    await user.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('generateText through gateway', async () => {
    const provider = await createGatewayProvider()
    const result = await generateText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })

    assert.equal(result.text, 'world')
    assert.equal(result.finishReason, 'stop')
  })

  test('streamText through gateway', async () => {
    const provider = await createGatewayProvider()
    const result = await streamText({
      model: provider.chat('assistant'),
      messages: [{ role: 'user', content: 'hello' }]
    })

    let text = ''
    for await (const chunk of result.textStream) {
      text += chunk
    }

    assert.equal(text, 'world')
  })

  test('generateText with system message', async () => {
    const provider = await createGatewayProvider()
    const result = await generateText({
      model: provider.chat('assistant'),
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'hello' }]
    })

    assert.equal(result.text, 'world')
  })

  test('rejects invalid model id', async () => {
    const provider = await createGatewayProvider()
    await assert.rejects(
      generateText({
        model: provider.chat('invalid-model'),
        messages: [{ role: 'user', content: 'hello' }]
      })
    )
  })
})
