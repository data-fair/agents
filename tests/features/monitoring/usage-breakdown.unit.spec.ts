/**
 * stateless unit tests for the histogram breakdown helpers
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { breakdownDatasets, formatBreakdownValue, type UsageEntry } from '../../../ui/src/utils/usage-breakdown.ts'

test.describe('breakdownDatasets', () => {
  test('stacks one dataset per value, aligned on the entry labels', () => {
    const entries: UsageEntry[] = [
      { label: '2026-09-21', cost: 3, breakdown: { assistant: 2, summarizer: 1 } },
      { label: '2026-09-22', cost: 5, breakdown: { assistant: 5 } }
    ]
    const datasets = breakdownDatasets(entries, 'modelRole')
    assert.deepEqual(datasets.map(d => d.label), ['Assistant', 'Summarizer'])
    assert.deepEqual(datasets[0].data, [2, 5])
    assert.deepEqual(datasets[1].data, [1, 0])
  })

  test('keeps a stable, dimension-specific value order', () => {
    const entries: UsageEntry[] = [
      { label: 'day', cost: 3, breakdown: { output: 1, input: 1.5, cachedInput: 0.5 } }
    ]
    const datasets = breakdownDatasets(entries, 'tokenType')
    assert.deepEqual(datasets.map(d => d.label), ['Input', 'Cached input', 'Output'])
  })

  test('attributes records predating the breakdown to a trailing layer', () => {
    const entries: UsageEntry[] = [
      { label: 'old', cost: 4 },
      { label: 'new', cost: 3, breakdown: { assistant: 3 } }
    ]
    const datasets = breakdownDatasets(entries, 'modelRole')
    assert.deepEqual(datasets.map(d => d.label), ['Assistant', 'Unattributed'])
    assert.deepEqual(datasets[0].data, [0, 3])
    assert.deepEqual(datasets[1].data, [4, 0])
  })

  test('does not create an unattributed layer for floating point noise', () => {
    const total = 0.1 + 0.2
    const entries: UsageEntry[] = [
      { label: 'day', cost: 0.3, breakdown: { input: 0.1, output: 0.2 } }
    ]
    // the raw sum differs from the total by ~5e-17, well below the tolerance
    assert.notEqual(total, 0.3)
    assert.deepEqual(breakdownDatasets(entries, 'tokenType').map(d => d.label), ['Input', 'Output'])
  })
})

test.describe('formatBreakdownValue', () => {
  test('strips the account type from owner keys', () => {
    assert.equal(formatBreakdownValue('owner', 'organization/test1'), 'test1')
  })

  test('leaves model ids untouched', () => {
    assert.equal(formatBreakdownValue('model', 'gpt-3.5-turbo'), 'gpt-3.5-turbo')
  })

  test('humanizes roles and token classes', () => {
    assert.equal(formatBreakdownValue('modelRole', 'assistant'), 'Assistant')
    assert.equal(formatBreakdownValue('profile', 'anonymous'), 'Anonymous')
    assert.equal(formatBreakdownValue('tokenType', 'cachedInput'), 'Cached input')
  })
})
