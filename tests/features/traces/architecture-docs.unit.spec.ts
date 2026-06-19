import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildDocMap, docTopicFromPath, lookupArchitectureDoc } from '../../../ui/src/traces/architecture-docs-lookup.ts'

test.describe('architecture docs lookup (unit)', () => {
  test('derives topic keys from glob paths', () => {
    assert.equal(docTopicFromPath('../../../docs/architecture/compaction.md'), 'compaction')
    assert.equal(docTopicFromPath('../../../docs/architecture/integration-context.md'), 'integration-context')
  })

  test('builds a topic -> markdown map from glob modules', () => {
    const map = buildDocMap({
      '../../../docs/architecture/overview.md': '# Overview',
      '../../../docs/architecture/compaction.md': '# Compaction'
    })
    assert.deepEqual(Object.keys(map).sort(), ['compaction', 'overview'])
    assert.equal(map.compaction, '# Compaction')
  })

  test('returns content for a known topic', () => {
    const map = { compaction: '# Compaction' }
    assert.equal(lookupArchitectureDoc(map, 'compaction'), '# Compaction')
  })

  test('returns the available topic list for an unknown topic', () => {
    const map = { overview: 'a', compaction: 'b' }
    const res = lookupArchitectureDoc(map, 'nope')
    assert.match(res, /Unknown topic "nope"/)
    assert.match(res, /compaction, overview/)
  })
})
