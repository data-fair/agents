import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildModerationSystemPrompt, parseModerationVerdict, resolveModerationModelId } from '../../../api/src/moderation/operations.ts'

test('buildModerationSystemPrompt embeds the mission and the task marker', () => {
  const prompt = buildModerationSystemPrompt('Help users query the sales dataset.')
  assert.ok(prompt.includes('Help users query the sales dataset.'))
  assert.ok(prompt.includes('MODERATION_TASK'))
})

test('parseModerationVerdict reads a block verdict', () => {
  const v = parseModerationVerdict('{"action":"block","category":"injection","reason":"x"}')
  assert.equal(v.action, 'block')
  assert.equal(v.category, 'injection')
  assert.equal(v.reason, 'x')
})

test('parseModerationVerdict reads an allow verdict', () => {
  assert.equal(parseModerationVerdict('{"action":"allow"}').action, 'allow')
})

test('parseModerationVerdict tolerates surrounding prose', () => {
  assert.equal(parseModerationVerdict('Sure: {"action":"block"} done').action, 'block')
})

test('parseModerationVerdict fails open on garbage', () => {
  assert.equal(parseModerationVerdict('not json at all').action, 'allow')
  assert.equal(parseModerationVerdict('').action, 'allow')
})

test('resolveModerationModelId prefers moderator', () => {
  const models = { moderator: { model: { id: 'm' } }, summarizer: { model: { id: 's' } } } as any
  assert.equal(resolveModerationModelId({ models }), 'moderator')
})

test('resolveModerationModelId falls back to summarizer', () => {
  const models = { summarizer: { model: { id: 's' } } } as any
  assert.equal(resolveModerationModelId({ models }), 'summarizer')
})

test('resolveModerationModelId returns null when neither configured', () => {
  assert.equal(resolveModerationModelId({ models: {} as any }), null)
})
