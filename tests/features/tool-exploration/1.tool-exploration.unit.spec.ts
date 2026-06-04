import { test, expect } from '@playwright/test'
import { buildToolCatalog } from '../../../ui/src/composables/tool-exploration.ts'

test.describe('buildToolCatalog', () => {
  test('lists each tool as "- name: first description line"', () => {
    const tools = {
      set_data: { description: 'Set the data in the textarea' },
      filter_map: { description: 'Filter markers\nsecond line ignored' }
    } as any
    const catalog = buildToolCatalog(tools)
    expect(catalog).toContain('- set_data: Set the data in the textarea')
    expect(catalog).toContain('- filter_map: Filter markers')
    expect(catalog).not.toContain('second line ignored')
  })

  test('handles a tool with no description', () => {
    const catalog = buildToolCatalog({ foo: {} } as any)
    expect(catalog).toContain('- foo:')
  })

  test('returns empty string for no tools', () => {
    expect(buildToolCatalog({} as any)).toBe('')
  })
})
