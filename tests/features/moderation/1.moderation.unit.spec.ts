import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildModerationSystemPrompt, parseModerationVerdict, DEFAULT_REFUSAL } from '../../../ui/src/composables/moderation.ts'

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

test('parseModerationVerdict reads the first object when a stray second one follows', () => {
  const v = parseModerationVerdict('{"action":"block","category":"x"} {"action":"allow"}')
  assert.equal(v.action, 'block')
  assert.equal(v.category, 'x')
})

test('parseModerationVerdict fails open on garbage', () => {
  assert.equal(parseModerationVerdict('not json at all').action, 'allow')
  assert.equal(parseModerationVerdict('').action, 'allow')
})

test('DEFAULT_REFUSAL is a non-empty string', () => {
  assert.ok(DEFAULT_REFUSAL.length > 0)
})
