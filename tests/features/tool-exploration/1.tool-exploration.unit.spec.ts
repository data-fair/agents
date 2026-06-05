import { test, expect } from '@playwright/test'
import { selectPromotions, formatToolsAvailableMessage, newlyAvailableTools, EXPLORE_TOOL_NAME } from '../../../ui/src/composables/tool-exploration.ts'

test.describe('selectPromotions', () => {
  test('keeps only requested names that exist in the available set', () => {
    expect(selectPromotions(['set_data', 'ghost'], ['set_data', 'foo'])).toEqual(['set_data'])
  })

  test('dedupes requested names', () => {
    expect(selectPromotions(['foo', 'foo'], ['foo'])).toEqual(['foo'])
  })

  test('returns [] when nothing matches', () => {
    expect(selectPromotions(['x'], ['a', 'b'])).toEqual([])
  })

  test('tolerates a non-array input', () => {
    expect(selectPromotions(undefined as any, ['a'])).toEqual([])
  })
})

test.describe('formatToolsAvailableMessage', () => {
  test('wraps comma-joined names in a <tools-available> block referencing explore_tools', () => {
    const msg = formatToolsAvailableMessage(['set_data', 'filter_map'])
    expect(msg).toContain('<tools-available>')
    expect(msg).toContain('</tools-available>')
    expect(msg).toContain('set_data, filter_map')
    expect(msg).toContain(EXPLORE_TOOL_NAME)
  })

  test('handles a single name with no trailing comma', () => {
    const msg = formatToolsAvailableMessage(['only_tool'])
    expect(msg).toContain('<tools-available>')
    expect(msg).toContain('only_tool')
    expect(msg).not.toContain(',')
  })

  test('returns an empty string for no names', () => {
    expect(formatToolsAvailableMessage([])).toBe('')
  })
})

test.describe('newlyAvailableTools', () => {
  test('returns names not present in the announced set, order-preserving', () => {
    expect(newlyAvailableTools(['a', 'b', 'c'], new Set(['b']))).toEqual(['a', 'c'])
  })

  test('returns [] when all are already announced', () => {
    expect(newlyAvailableTools(['a', 'b'], new Set(['a', 'b']))).toEqual([])
  })

  test('returns all names when the announced set is empty (post-compaction re-announce)', () => {
    expect(newlyAvailableTools(['a', 'b'], new Set())).toEqual(['a', 'b'])
  })

  test('dedupes repeated names in the input', () => {
    expect(newlyAvailableTools(['a', 'a', 'b'], new Set())).toEqual(['a', 'b'])
  })

  test('handles a name both announced and duplicated in the input', () => {
    expect(newlyAvailableTools(['a', 'a'], new Set(['a']))).toEqual([])
  })
})
