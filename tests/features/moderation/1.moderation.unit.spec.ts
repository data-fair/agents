import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  buildModerationSystemPrompt, extractLastUserMessage, truncateForModeration,
  truncateExcerpt, nextStrikeState, isInCooldown,
  MODERATION_TASK_MARKER, STRIKE_THRESHOLD, STRIKE_WINDOW_MS, STRIKE_COOLDOWN_MS,
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

  test('first block starts a window with count 1 and no cooldown', () => {
    const s = nextStrikeState(null, now)
    assert.equal(s.count, 1)
    assert.equal(s.windowStartedAt.getTime(), now.getTime())
    assert.equal(s.cooldownUntil, undefined)
  })

  test('blocks inside the window increment the count', () => {
    const prev = { count: 2, windowStartedAt: new Date(now.getTime() - 1000) }
    const s = nextStrikeState(prev, now)
    assert.equal(s.count, 3)
    assert.equal(s.windowStartedAt.getTime(), prev.windowStartedAt.getTime())
  })

  test('a stale window resets the count', () => {
    const prev = { count: 4, windowStartedAt: new Date(now.getTime() - STRIKE_WINDOW_MS - 1) }
    const s = nextStrikeState(prev, now)
    assert.equal(s.count, 1)
    assert.equal(s.windowStartedAt.getTime(), now.getTime())
  })

  test('reaching the threshold arms the cooldown', () => {
    const prev = { count: STRIKE_THRESHOLD - 1, windowStartedAt: new Date(now.getTime() - 1000) }
    const s = nextStrikeState(prev, now)
    assert.equal(s.count, STRIKE_THRESHOLD)
    assert.equal(s.cooldownUntil!.getTime(), now.getTime() + STRIKE_COOLDOWN_MS)
  })

  test('isInCooldown respects cooldownUntil', () => {
    assert.equal(isInCooldown(null, now), false)
    assert.equal(isInCooldown({ count: 5, windowStartedAt: now, cooldownUntil: new Date(now.getTime() + 1000) }, now), true)
    assert.equal(isInCooldown({ count: 5, windowStartedAt: now, cooldownUntil: new Date(now.getTime() - 1000) }, now), false)
  })
})
