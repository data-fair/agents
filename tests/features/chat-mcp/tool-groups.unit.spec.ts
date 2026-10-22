/**
 * stateless unit tests for grouping a turn's offered tools by source, as the chat's inspection dialog does
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { groupTools, lastOfferedTools, availableToolGroups } from '../../../ui/src/utils/tool-groups.ts'

test.describe('groupTools', () => {
  test('groups by kind in a fixed order, MCP servers one group each', () => {
    const groups = groupTools(
      ['wait_for_user_action', 'select_row', 'list_datasets', 'portal_echo', 'get_dataset', 'code_mode'],
      {
        wait_for_user_action: { kind: 'service', server: 'agent-self' },
        code_mode: { kind: 'service' },
        select_row: { kind: 'page' },
        list_datasets: { kind: 'catalog', server: 'data-fair' },
        get_dataset: { kind: 'catalog', server: 'data-fair' },
        portal_echo: { kind: 'external', server: 'portal.example.org' }
      })
    assert.deepEqual(groups, [
      { kind: 'catalog', server: 'data-fair', names: ['get_dataset', 'list_datasets'] },
      { kind: 'external', server: 'portal.example.org', names: ['portal_echo'] },
      { kind: 'page', names: ['select_row'] },
      // the service's groups of tools are one group for a reader: their labels are internal
      { kind: 'service', names: ['code_mode', 'wait_for_user_action'] }
    ])
  })

  test('a run recorded before sources were is one list', () => {
    assert.deepEqual(groupTools(['b', 'a']), [{ names: ['a', 'b'] }])
  })
})

test.describe('availableToolGroups', () => {
  test('the last turn\'s tools, with the page\'s replaced by those it registers now', () => {
    const known = lastOfferedTools([
      { calls: [{ toolNames: ['old_page_tool', 'list_datasets'], toolSources: { old_page_tool: { kind: 'page' }, list_datasets: { kind: 'catalog', server: 'data-fair' } } }] },
      { calls: [{ toolNames: ['select_row', 'list_datasets'], toolSources: { select_row: { kind: 'page' }, list_datasets: { kind: 'catalog', server: 'data-fair' } } }] },
      { calls: [{}] }
    ])
    assert.deepEqual(known.names, ['select_row', 'list_datasets'], 'the last run that recorded tools')
    assert.deepEqual(availableToolGroups(known, ['open_row']), [
      { kind: 'catalog', server: 'data-fair', names: ['list_datasets'] },
      { kind: 'page', names: ['open_row'] }
    ])
  })
})
