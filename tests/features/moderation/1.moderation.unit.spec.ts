import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  buildModerationSystemPrompt, extractLastUserMessage, truncateForModeration,
  truncateExcerpt, isInCooldown, moderationApplies,
  MODERATION_TASK_MARKER,
  INPUT_HEAD_CHARS, INPUT_TAIL_CHARS, EXCERPT_MAX_CHARS
} from '../../../api/src/moderation/operations.ts'

test.describe('moderation prompt', () => {
  test('embeds the task marker and the generic platform mission', () => {
    const prompt = buildModerationSystemPrompt()
    assert.ok(prompt.includes(MODERATION_TASK_MARKER))
    assert.ok(prompt.toLowerCase().includes('data platform'))
  })
})

test.describe('extractLastUserMessage', () => {
  test('returns the last user message with string content', () => {
    const messages = [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply' },
      { role: 'user', content: 'second' }
    ]
    assert.equal(extractLastUserMessage(messages), 'second')
  })

  test('finds the last user message even when followed by tool messages', () => {
    const messages = [
      { role: 'user', content: 'the question' },
      { role: 'assistant', content: '' },
      { role: 'tool', content: '{"ok":true}' }
    ]
    assert.equal(extractLastUserMessage(messages), 'the question')
  })

  test('joins text parts of array content', () => {
    const messages = [{ role: 'user', content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] }]
    assert.equal(extractLastUserMessage(messages), 'a\nb')
  })

  test('returns null when there is no user message', () => {
    assert.equal(extractLastUserMessage([{ role: 'system', content: 's' }]), null)
    assert.equal(extractLastUserMessage([]), null)
    assert.equal(extractLastUserMessage(undefined), null)
  })
})

test.describe('truncation', () => {
  test('short messages pass through unchanged', () => {
    assert.equal(truncateForModeration('hello'), 'hello')
  })

  test('long messages keep head and tail', () => {
    const msg = 'a'.repeat(INPUT_HEAD_CHARS) + 'MIDDLE' + 'b'.repeat(INPUT_TAIL_CHARS)
    const out = truncateForModeration(msg)
    assert.ok(out.startsWith('a'.repeat(100)))
    assert.ok(out.endsWith('b'.repeat(100)))
    assert.ok(!out.includes('MIDDLE'))
    assert.ok(out.length < msg.length)
  })

  test('excerpts cap at EXCERPT_MAX_CHARS', () => {
    assert.equal(truncateExcerpt('x'.repeat(EXCERPT_MAX_CHARS + 50)).length, EXCERPT_MAX_CHARS)
    assert.equal(truncateExcerpt('short'), 'short')
  })
})

test.describe('strikes', () => {
  const now = new Date('2026-06-10T12:00:00Z')

  test('isInCooldown respects cooldownUntil', () => {
    assert.equal(isInCooldown(null, now), false)
    assert.equal(isInCooldown({ count: 5, windowStartedAt: now, cooldownUntil: new Date(now.getTime() + 1000) }, now), true)
    assert.equal(isInCooldown({ count: 5, windowStartedAt: now, cooldownUntil: new Date(now.getTime() - 1000) }, now), false)
  })
})

test.describe('moderationApplies', () => {
  const base = { providers: [], owner: { type: 'user', id: 'x' } } as any

  test('false when moderation is absent or disabled', () => {
    assert.equal(moderationApplies({ ...base }, 'anonymous'), false)
    assert.equal(moderationApplies({ ...base, moderation: { enabled: false, categories: ['anonymous'] } }, 'anonymous'), false)
  })

  test('true only for roles listed in categories when enabled', () => {
    const settings = { ...base, moderation: { enabled: true, categories: ['anonymous', 'external'] } }
    assert.equal(moderationApplies(settings, 'anonymous'), true)
    assert.equal(moderationApplies(settings, 'external'), true)
    assert.equal(moderationApplies(settings, 'user'), false)
    assert.equal(moderationApplies(settings, 'admin'), false)
  })

  test('honours a custom category set', () => {
    const settings = { ...base, moderation: { enabled: true, categories: ['user', 'admin'] } }
    assert.equal(moderationApplies(settings, 'user'), true)
    assert.equal(moderationApplies(settings, 'anonymous'), false)
  })
})
