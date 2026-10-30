/**
 * stateless unit tests for the starting examples of autonomous agents
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { DEFAULT_APPROVAL_LEVEL } from '../../../shared/approval-policy.ts'
import { AUTONOMOUS_AGENT_EXAMPLE_KEYS, exampleFields } from '../../../ui/src/utils/autonomous-agent-examples.ts'

const locales = ['fr', 'en'] as const

test.describe('autonomous agent starting examples', () => {
  test('keys are ordered publication, quality, blank', () => {
    assert.deepEqual(AUTONOMOUS_AGENT_EXAMPLE_KEYS, ['publication', 'quality', 'blank'])
  })

  test('every key and locale gives a non-empty persona', () => {
    for (const key of AUTONOMOUS_AGENT_EXAMPLE_KEYS) {
      for (const locale of locales) {
        assert.ok(exampleFields(key, locale, 'Title').persona.length > 0, `${key} ${locale}`)
      }
    }
  })

  test('approval levels follow the mapping', () => {
    for (const locale of locales) {
      assert.equal(exampleFields('publication', locale, 'T').approvalLevel, 'destructive')
      assert.equal(exampleFields('quality', locale, 'T').approvalLevel, 'write')
      assert.equal(exampleFields('blank', locale, 'T').approvalLevel, DEFAULT_APPROVAL_LEVEL)
    }
  })

  test('only blank interpolates the title, and has no instructions', () => {
    for (const locale of locales) {
      const blank = exampleFields('blank', locale, 'My title')
      assert.ok(blank.persona.includes('My title'))
      assert.equal(blank.instructions, '')
      assert.ok(!exampleFields('publication', locale, 'My title').persona.includes('My title'))
      assert.ok(!exampleFields('quality', locale, 'My title').persona.includes('My title'))
    }
  })
})
