/**
 * stateless unit tests of the images a model is sent (api/src/conversations/model-images.ts), of the flag that
 * decides it (resolveImageInput), and of the chat-completions request that carries them.
 *
 * A screenshot sent as base64 TEXT, as the chat-completions adapter did by default, cost about 49k input tokens
 * and the model could not see it; re-sent at every step, a run of four previews carried about 170k tokens of base64.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { generateText, type ModelMessage } from 'ai'
import { limitModelImages, countModelImages, estimateModelFill, IMAGE_TOKEN_ESTIMATE } from '../../../api/src/conversations/model-images.ts'
import { createStepContext } from '../../../api/src/conversations/step-context.ts'
import { mediaModelOutput } from '../../../api/src/conversations/operations.ts'
import { createModel, getModelCatalog, resolveImageInput } from '../../../api/src/models/operations.ts'

const PNG = 'iVBORw0KGgo'.padEnd(4000, 'A')
const call = (id: string): ModelMessage => ({ role: 'assistant', content: [{ type: 'tool-call', toolCallId: id, toolName: 'preview', input: {} }] })
const shot = (id: string): ModelMessage => ({
  role: 'tool',
  content: [{ type: 'tool-result', toolCallId: id, toolName: 'preview', output: mediaModelOutput({ _agentsMediaResult: true, text: `report ${id}`, media: [{ data: PNG, mediaType: 'image/png' }] }) as any }]
})
const history = (n: number): ModelMessage[] => [{ role: 'user', content: 'go' }, ...Array.from({ length: n }, (_, i) => [call(`c${i}`), shot(`c${i}`)]).flat()]
const outputOf = (messages: ModelMessage[], id: string) =>
  (messages.find(m => m.role === 'tool' && (m.content as any)[0].toolCallId === id)!.content as any)[0].output

test.describe('limitModelImages', () => {
  test('a model that reads images gets the latest one; older ones become text with their report kept', () => {
    const out = limitModelImages(history(3), { imageInput: true })
    assert.equal(countModelImages(out), 1)
    assert.equal(outputOf(out, 'c2').type, 'content', 'the latest is sent as an image')
    const older = outputOf(out, 'c0')
    assert.equal(older.type, 'text', 'a result left with no image takes the shape every provider accepts')
    assert.match(older.value, /^report c0\n\n\[image image\/png ~3kB, which you saw when it came, no longer shown/)
  })

  test('a model that does not read images gets none, and is told why', () => {
    const out = limitModelImages(history(2), { imageInput: false })
    assert.equal(countModelImages(out), 0)
    assert.match(outputOf(out, 'c1').value, /not shown: this model does not read images/)
  })

  test('the prefix before the latest image is identical from one step to the next (cache)', () => {
    const before = limitModelImages(history(2), { imageInput: true })
    const after = limitModelImages(history(3), { imageInput: true })
    assert.deepEqual(after.slice(0, 3), before.slice(0, 3))
  })

  test('nothing to replace: the very same array, not a copy', () => {
    const messages = history(1)
    assert.equal(limitModelImages(messages, { imageInput: true }), messages)
  })
})

test.describe('the fill counts images at their cost', () => {
  test('an image is IMAGE_TOKEN_ESTIMATE, not its base64 length', () => {
    const one = history(1)
    const textOnly = limitModelImages(one, { imageInput: false })
    const delta = estimateModelFill(one) - estimateModelFill(textOnly)
    assert.ok(Math.abs(delta - IMAGE_TOKEN_ESTIMATE) < 60, `about one image of tokens, got ${delta}`)
  })

  test('the step context sends the latest image only', () => {
    const out = createStepContext(1_000_000, { imageInput: true })(history(4))
    assert.equal(countModelImages(out), 1)
  })
})

test.describe('resolveImageInput', () => {
  test('unset: on where the catalog is mostly vision models, off for open-model endpoints', () => {
    assert.equal(resolveImageInput('anthropic', undefined), true)
    assert.equal(resolveImageInput('openrouter', undefined), true)
    assert.equal(resolveImageInput('openai-compatible', undefined), false)
    assert.equal(resolveImageInput('scaleway', undefined), false)
  })

  test('set: followed, except where the adapter cannot carry an image in a tool result', () => {
    assert.equal(resolveImageInput('openai-compatible', true), true)
    assert.equal(resolveImageInput('anthropic', false), false)
    assert.equal(resolveImageInput('mistral', true), false)
    assert.equal(resolveImageInput('ollama', true), false)
  })

  test('resolved on both sides of the catalog', () => {
    const catalog = getModelCatalog(
      [{ id: 'greenpt', name: 'GreenPT', type: 'openai-compatible', baseURL: 'http://x/v1', enabled: true } as any],
      [
        { id: 'vision', name: 'V', provider: 'greenpt', usage: ['assistant'], imageInput: true, inputPricePerMillion: 0, outputPricePerMillion: 0 },
        { id: 'text', name: 'T', provider: 'greenpt', usage: ['assistant'], inputPricePerMillion: 0, outputPricePerMillion: 0 }
      ],
      [{ id: 'a', enabled: true }],
      [{ model: { id: 'claude', name: 'C', provider: { type: 'anthropic', name: 'A', id: 'a' } }, usage: ['assistant'] }]
    )
    assert.deepEqual(catalog.map(m => [m.id, m.imageInput]), [['vision', true], ['text', false], ['claude', true]])
  })
})

test.describe('chat-completions providers send an image as an image', () => {
  test('the tool message carries an image_url part, not base64 inside its text', async () => {
    let body: any
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (_url: any, init: any) => {
      body = JSON.parse(String(init.body))
      return new Response(JSON.stringify({
        id: 'r',
        object: 'chat.completion',
        created: 0,
        model: 'm',
        choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
      }), { headers: { 'content-type': 'application/json' } })
    }) as typeof fetch
    try {
      const model = createModel({ type: 'openai-compatible', id: 'greenpt', name: 'GreenPT', enabled: true, baseURL: 'http://compat.test/v1', compatibility: 'compatible' } as any, 'm')
      await generateText({ model, messages: history(1) })
    } finally {
      globalThis.fetch = realFetch
    }
    const tool = body.messages.find((m: any) => m.role === 'tool')
    assert.ok(Array.isArray(tool.content), 'multi-part tool content')
    assert.deepEqual(tool.content.map((p: any) => p.type), ['text', 'image_url'])
    assert.match(tool.content[1].image_url.url, /^data:image\/png;base64,iVBORw0KGgo/)
  })
})
