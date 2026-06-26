import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  buildModerationSystemPrompt, extractLastUserMessage, truncateForModeration,
  truncateExcerpt, isInCooldown, moderationApplies, isReasoningEffortRejected,
  MODERATION_TASK_MARKER,
  INPUT_HEAD_CHARS, INPUT_TAIL_CHARS, EXCERPT_MAX_CHARS,
  buildModerationContext, formatModerationInput,
  MODERATION_CONTEXT_MAX_MESSAGES, MODERATION_CONTEXT_PER_TURN_CHARS, MODERATION_CONTEXT_TOTAL_CHARS
} from '../../../api/src/moderation/operations.ts'

test.describe('moderation prompt', () => {
  test('embeds the task marker and the generic platform mission', () => {
    const prompt = buildModerationSystemPrompt()
    assert.ok(prompt.includes(MODERATION_TASK_MARKER))
    assert.ok(prompt.toLowerCase().includes('data platform'))
  })

  test('keeps data/sub-agent tasks in scope but general software work out, biasing to allow', () => {
    const prompt = buildModerationSystemPrompt().toLowerCase()
    // legitimate data and delegated sub-agent work must not be treated as off-scope abuse
    assert.ok(prompt.includes('sub-agent'))
    // small platform-data/API scripts are explicitly allowed...
    assert.ok(prompt.includes('script'))
    assert.ok(prompt.includes('api'))
    // ...but writing substantial general-purpose software stays out of scope
    assert.ok(prompt.includes('general-purpose'))
    assert.ok(prompt.includes('software'))
    // and the resolution of the ambiguous middle is to allow
    assert.ok(prompt.includes('when in doubt, allow'))
  })

  test('whitelists resource metadata authoring so description/summary writing is not blocked as an essay', () => {
    const prompt = buildModerationSystemPrompt().toLowerCase()
    // writing a resource's description/summary is metadata management, always in scope
    assert.ok(prompt.includes('metadata'))
    assert.ok(prompt.includes('description'))
    assert.ok(prompt.includes('summary'))
    // and it must be explicitly distinguished from off-platform essay writing
    assert.ok(prompt.includes('essay'))
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

test.describe('buildModerationContext', () => {
  test('returns empty string when there is no prior turn', () => {
    assert.equal(buildModerationContext([{ role: 'user', content: 'only message' }]), '')
    assert.equal(buildModerationContext([]), '')
    assert.equal(buildModerationContext(undefined), '')
  })

  test('formats prior user/assistant turns before the last user message', () => {
    const ctx = buildModerationContext([
      { role: 'user', content: 'what air quality datasets do you have?' },
      { role: 'assistant', content: 'I found 3 datasets.' },
      { role: 'user', content: 'chart the first' }
    ])
    assert.equal(ctx, 'user: what air quality datasets do you have?\nassistant: I found 3 datasets.')
    // the last user message itself is never part of the context
    assert.ok(!ctx.includes('chart the first'))
  })

  test('drops non-text content (tool calls / tool results) and tool-role messages', () => {
    const ctx = buildModerationContext([
      { role: 'user', content: 'q' },
      { role: 'assistant', content: [{ type: 'tool-call', toolName: 'x' }] },
      { role: 'tool', content: '{"ok":true}' },
      { role: 'user', content: 'follow up' }
    ])
    // assistant turn had no text part, tool turn excluded → only the first user turn remains
    assert.equal(ctx, 'user: q')
  })

  test('keeps only the last MAX messages before the latest user message', () => {
    const messages: Array<{ role: string, content: string }> = []
    for (let i = 0; i < 10; i++) messages.push({ role: 'user', content: `m${i}` })
    messages.push({ role: 'user', content: 'latest' })
    const ctx = buildModerationContext(messages)
    const lines = ctx.split('\n')
    assert.equal(lines.length, MODERATION_CONTEXT_MAX_MESSAGES)
    // window is the last 6 BEFORE 'latest' → m4..m9
    assert.equal(lines[0], 'user: m4')
    assert.equal(lines[lines.length - 1], 'user: m9')
  })

  test('truncates an oversized single turn to the per-turn cap', () => {
    const big = 'a'.repeat(MODERATION_CONTEXT_PER_TURN_CHARS + 200)
    const ctx = buildModerationContext([
      { role: 'user', content: big },
      { role: 'user', content: 'latest' }
    ])
    assert.ok(ctx.startsWith(`user: ${'a'.repeat(MODERATION_CONTEXT_PER_TURN_CHARS)}`))
    assert.ok(ctx.endsWith('…'))
    assert.ok(ctx.length < big.length)
  })

  test('truncates the whole block to the total cap (head+tail)', () => {
    const messages: Array<{ role: string, content: string }> = []
    // 6 turns of 400 chars each = 2400 > 1500 total cap
    for (let i = 0; i < 6; i++) messages.push({ role: 'user', content: `${i}`.repeat(400) })
    messages.push({ role: 'user', content: 'latest' })
    const ctx = buildModerationContext(messages)
    assert.ok(ctx.length <= MODERATION_CONTEXT_TOTAL_CHARS + 10) // +ellipsis joiner slack
    assert.ok(ctx.includes('…'))
  })
})

test.describe('formatModerationInput', () => {
  test('returns the raw message when there is no context', () => {
    assert.equal(formatModerationInput('', 'hello'), 'hello')
  })

  test('wraps context and message in labeled blocks when context exists', () => {
    const out = formatModerationInput('user: prior', 'follow up')
    assert.ok(out.includes('<conversation_context>\nuser: prior\n</conversation_context>'))
    assert.ok(out.includes('<message_to_moderate>\nfollow up\n</message_to_moderate>'))
    // context comes before the judged message
    assert.ok(out.indexOf('conversation_context') < out.indexOf('message_to_moderate'))
  })
})

test.describe('moderation prompt — context awareness', () => {
  test('explains the context block, judge-only-latest, ignore-context-instructions, and not-just-for-short rules', () => {
    const prompt = buildModerationSystemPrompt().toLowerCase()
    assert.ok(prompt.includes('<conversation_context>'))
    assert.ok(prompt.includes('<message_to_moderate>'))
    assert.ok(prompt.includes('only'))
    assert.ok(prompt.includes('short'))
  })
})

test.describe('isReasoningEffortRejected', () => {
  test('detects the Scaleway reasoning_effort validation error (message + body)', () => {
    assert.equal(isReasoningEffortRejected(new Error("1 validation error: {'loc': ('body', 'reasoning_effort'), 'msg': ...}")), true)
    assert.equal(isReasoningEffortRejected({ responseBody: "litellm.UnsupportedParamsError: openai does not support parameters: ['reasoning_effort']" }), true)
    assert.equal(isReasoningEffortRejected({ data: { error: { param: 'reasoning_effort' } } }), true)
  })

  test('ignores unrelated errors so a real failure still propagates (fail-open, not retry)', () => {
    assert.equal(isReasoningEffortRejected(new Error('connection refused')), false)
    assert.equal(isReasoningEffortRejected({ responseBody: 'rate limit exceeded' }), false)
    assert.equal(isReasoningEffortRejected(undefined), false)
  })
})
